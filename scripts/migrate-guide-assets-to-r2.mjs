#!/usr/bin/env node
/**
 * Migrate AP Guide images from Supabase Storage (guide-assets bucket) → Cloudflare R2.
 *
 * For each object in the guide-assets bucket:
 *   1. Downloads the file via its public Supabase Storage URL.
 *   2. Calls guide-cf-r2-upload Edge function (service-role auth) to get a presigned PUT URL.
 *   3. PUTs the file to R2 at guides/{slug}/{filename}.
 *   4. Updates thumbnail_url in guides + machines tables if it currently points to Supabase Storage.
 *
 * Usage:
 *   node scripts/migrate-guide-assets-to-r2.mjs [--target test|production] [--dry-run]
 *
 * Prerequisites:
 *   - guide-cf-r2-upload Edge function deployed on the target Supabase project.
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the appropriate .env.supabase.{target} file.
 */

import { createClient } from "@supabase/supabase-js";
import { loadSupabaseEnv, readSupabaseCredentials } from "./lib/supabaseEnv.mjs";

const args        = process.argv.slice(2);
const targetArg   = args[args.indexOf("--target") + 1] || "test";
const dryRun      = args.includes("--dry-run");
const target      = targetArg === "production" ? "production" : "test";

const CF_R2_CACHE_CONTROL   = "public, max-age=31536000, immutable";
const SUPABASE_STORAGE_HOST = ".supabase.co";

console.log(`\n🚀  migrate-guide-assets-to-r2  [target=${target}${dryRun ? "  DRY-RUN" : ""}]\n`);

loadSupabaseEnv(target);
const { url: supabaseUrl, key: serviceRoleKey } = readSupabaseCredentials();
if (!supabaseUrl || !serviceRoleKey) {
  console.error("✗ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Aborting.");
  process.exit(1);
}

const supabase    = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const edgeFnUrl   = `${supabaseUrl}/functions/v1/guide-cf-r2-upload`;

// ── List all objects in the guide-assets bucket ─────────────────────────────

async function listAllBucketObjects() {
  const objects = [];
  let offset    = 0;
  const limit   = 100;
  while (true) {
    const { data, error } = await supabase.storage
      .from("guide-assets")
      .list("", { limit, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list bucket: ${error.message}`);
    if (!data?.length) break;
    // Recursively list folders
    for (const item of data) {
      if (item.id === null) {
        // It's a folder — list its contents
        const { data: sub, error: subErr } = await supabase.storage
          .from("guide-assets")
          .list(item.name, { limit: 200, sortBy: { column: "name", order: "asc" } });
        if (subErr) throw new Error(`list ${item.name}: ${subErr.message}`);
        for (const f of (sub || [])) {
          if (f.id !== null) objects.push(`${item.name}/${f.name}`);
        }
      } else {
        objects.push(item.name);
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return objects;
}

// ── Get presigned PUT URL from the Edge function ─────────────────────────────

async function mintR2PresignedUrl(slug, filename, contentType) {
  const res = await fetch(edgeFnUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceRoleKey}` },
    body: JSON.stringify({ slug, filename, contentType }),
  });
  if (res.status === 503) return null;  // R2 not configured
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`guide-cf-r2-upload (${res.status}): ${body.error || res.statusText}`);
  }
  return res.json();
}

// ── Download from Supabase Storage ───────────────────────────────────────────

async function downloadFromStorage(objectPath) {
  const { data, error } = await supabase.storage.from("guide-assets").download(objectPath);
  if (error) throw new Error(`download ${objectPath}: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

// ── Detect content-type from filename ────────────────────────────────────────

function contentTypeFromFilename(filename) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "webp") return "image/webp";
  if (ext === "png")  return "image/png";
  if (ext === "gif")  return "image/gif";
  return "image/jpeg";
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Check R2 is reachable first
  const probe = await mintR2PresignedUrl("probe-test", "probe.webp", "image/webp").catch(() => null);
  if (!probe) {
    console.error("✗ R2 not configured or guide-cf-r2-upload not deployed. Deploy the Edge function first.");
    process.exit(1);
  }

  console.log("📋  Listing guide-assets bucket objects…");
  const objects = await listAllBucketObjects();
  console.log(`   Found ${objects.length} objects.\n`);

  if (!objects.length) {
    console.log("Nothing to migrate.");
    return;
  }

  const results = { migrated: 0, skipped: 0, failed: 0, dbUpdated: 0 };

  for (const objectPath of objects) {
    // objectPath format: "buffalo-link/hero.webp" or "hero.webp" (top-level)
    const parts    = objectPath.split("/");
    const filename = parts.pop();
    const slug     = parts[0] || "unknown";

    if (!filename) { results.skipped++; continue; }

    const contentType = contentTypeFromFilename(filename);
    const r2Key       = `guides/${objectPath}`;

    process.stdout.write(`  ${objectPath} → ${r2Key} … `);

    if (dryRun) {
      console.log("[dry-run]");
      results.migrated++;
      continue;
    }

    try {
      // Get presigned URL
      const mint = await mintR2PresignedUrl(slug, filename, contentType);
      if (!mint) { console.log("skip (R2 not configured)"); results.skipped++; continue; }

      // Download from Supabase Storage
      const buffer = await downloadFromStorage(objectPath);

      // PUT to R2
      const putRes = await fetch(mint.uploadURL, {
        method: "PUT",
        headers: { "Content-Type": contentType, "Cache-Control": CF_R2_CACHE_CONTROL },
        body: buffer,
      });
      if (!putRes.ok) throw new Error(`PUT ${putRes.status}`);

      console.log(`✓  →  ${mint.publicUrl}`);
      results.migrated++;

      // Update DB if this is a hero image (filename === hero.webp / hero.jpg etc.)
      if (filename.startsWith("hero.")) {
        const { data: sbPublicUrlData } = supabase.storage.from("guide-assets").getPublicUrl(objectPath);
        const oldUrl = sbPublicUrlData?.publicUrl;

        // Update guides.thumbnail_url
        const { count: gCount } = await supabase
          .from("guides")
          .update({ thumbnail_url: mint.publicUrl })
          .eq("thumbnail_url", oldUrl)
          .select("id", { count: "exact", head: true });
        if (gCount) results.dbUpdated += gCount;

        // Update machines.thumbnail_url
        const { count: mCount } = await supabase
          .from("machines")
          .update({ thumbnail_url: mint.publicUrl })
          .eq("thumbnail_url", oldUrl)
          .select("id", { count: "exact", head: true });
        if (mCount) results.dbUpdated += mCount;
      }
    } catch (err) {
      console.log(`✗  ${err.message}`);
      results.failed++;
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Migrated : ${results.migrated}
  Skipped  : ${results.skipped}
  Failed   : ${results.failed}
  DB rows  : ${results.dbUpdated} thumbnail_url updated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  if (results.failed > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
