#!/usr/bin/env node
/**
 * Upload hero.webp (and optional inline /guides/ assets) from public/guides/
 * to Cloudflare R2, then set guides + machines thumbnail_url on Supabase.
 *
 * Targets guides whose thumbnail_url is null and rely on GuidesScreen code fallback.
 *
 * Usage:
 *   node scripts/backfill-public-guide-heroes-to-r2.mjs [--target test|production] [--dry-run]
 *   node scripts/backfill-public-guide-heroes-to-r2.mjs --target test --inline   # also rewrite /guides/ in content_markdown
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

const CF_R2_CACHE_CONTROL = 'public, max-age=31536000, immutable'

const args = process.argv.slice(2)
const target = args.includes('--target')
  ? args[args.indexOf('--target') + 1] === 'production' ? 'production' : 'test'
  : 'test'
const dryRun = args.includes('--dry-run')
const migrateInline = args.includes('--inline')

/** Guide slug → public/guides folder when different (legacy duplicates). */
const HERO_SOURCE_FOLDER = {
  'must-hit-by-aig': 'ainsworth-must-hit-by',
  'must-hit-by-igt': 'igt-must-hit-by',
}

function contentTypeFromFilename(filename) {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'webp') return 'image/webp'
  if (ext === 'png') return 'image/png'
  if (ext === 'gif') return 'image/gif'
  return 'image/jpeg'
}

function publicGuidesRoot() {
  return path.join(process.cwd(), 'public', 'guides')
}

function heroSourcePath(guideSlug) {
  const folder = HERO_SOURCE_FOLDER[guideSlug] || guideSlug
  return path.join(publicGuidesRoot(), folder, 'hero.webp')
}

async function mintR2PresignedUrl(edgeFnUrl, serviceRoleKey, slug, filename, contentType) {
  const res = await fetch(edgeFnUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ slug, filename, contentType }),
  })
  if (res.status === 503) return null
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(`guide-cf-r2-upload (${res.status}): ${body.error || res.statusText}`)
  }
  return res.json()
}

async function uploadFileToR2({ edgeFnUrl, serviceRoleKey, guideSlug, filePath, filename }) {
  const contentType = contentTypeFromFilename(filename)
  const mint = await mintR2PresignedUrl(edgeFnUrl, serviceRoleKey, guideSlug, filename, contentType)
  if (!mint?.uploadURL) throw new Error('R2 not configured (503 from guide-cf-r2-upload)')

  const buffer = fs.readFileSync(filePath)
  const putRes = await fetch(mint.uploadURL, {
    method: 'PUT',
    headers: { 'Content-Type': contentType, 'Cache-Control': CF_R2_CACHE_CONTROL },
    body: buffer,
  })
  if (!putRes.ok) throw new Error(`R2 PUT failed (${putRes.status})`)
  return mint.publicUrl
}

async function updateThumbnailBySlug(supabase, slug, publicUrl) {
  const { error: gErr } = await supabase.from('guides').update({ thumbnail_url: publicUrl }).eq('slug', slug)
  if (gErr) throw new Error(`guides ${slug}: ${gErr.message}`)
  const { error: mErr } = await supabase.from('machines').update({ thumbnail_url: publicUrl }).eq('slug', slug)
  if (mErr) throw new Error(`machines ${slug}: ${mErr.message}`)
}

/** @param {string} urlPath e.g. /guides/aladdins-fortune/foo.webp */
function resolvePublicFile(urlPath) {
  if (!urlPath.startsWith('/guides/')) return null
  const rel = urlPath.replace(/^\/guides\//, '')
  const abs = path.join(publicGuidesRoot(), ...rel.split('/'))
  return fs.existsSync(abs) ? abs : null
}

async function main() {
  console.log(`\nbackfill-public-guide-heroes-to-r2  [target=${target}${dryRun ? '  DRY-RUN' : ''}${migrateInline ? '  +inline' : ''}]\n`)

  loadSupabaseEnv(target)
  const { url: supabaseUrl, key: serviceRoleKey } = readSupabaseCredentials()
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  const edgeFnUrl = `${supabaseUrl}/functions/v1/guide-cf-r2-upload`

  const probe = await mintR2PresignedUrl(edgeFnUrl, serviceRoleKey, 'probe-test', 'probe.webp', 'image/webp').catch(() => null)
  if (!probe && !dryRun) {
    console.error('R2 not configured or guide-cf-r2-upload not deployed.')
    process.exit(1)
  }

  const { data: guides, error } = await supabase
    .from('guides')
    .select('id, slug, thumbnail_url, content_markdown, machines(slug, thumbnail_url)')
    .order('slug')

  if (error) {
    console.error(error.message)
    process.exit(1)
  }

  const heroCandidates = (guides || []).filter((g) => {
    const m = Array.isArray(g.machines) ? g.machines[0] : g.machines
    const thumb = g.thumbnail_url || m?.thumbnail_url
    return !thumb || (typeof thumb === 'string' && thumb.startsWith('/guides/'))
  })

  const results = { heroes: 0, inlineFiles: 0, markdownUpdated: 0, skipped: 0, failed: 0 }

  for (const g of heroCandidates) {
    const slug = g.slug
    const src = heroSourcePath(slug)
    if (!fs.existsSync(src)) {
      console.log(`  skip ${slug} — no ${src}`)
      results.skipped++
      continue
    }

    process.stdout.write(`  hero ${slug} ← ${path.relative(process.cwd(), src)} … `)
    if (dryRun) {
      console.log('[dry-run]')
      results.heroes++
      continue
    }

    try {
      const publicUrl = await uploadFileToR2({
        edgeFnUrl,
        serviceRoleKey,
        guideSlug: slug,
        filePath: src,
        filename: 'hero.webp',
      })
      await updateThumbnailBySlug(supabase, slug, publicUrl)
      console.log(`✓  ${publicUrl}`)
      results.heroes++
    } catch (err) {
      console.log(`✗  ${err.message}`)
      results.failed++
    }
  }

  if (migrateInline) {
    const inlineRe = /!\[([^\]]*)\]\((\/guides\/[^)]+)\)/g
    for (const g of guides || []) {
      const md = g.content_markdown || ''
      const matches = [...md.matchAll(inlineRe)]
      if (!matches.length) continue

      let nextMd = md
      let changed = false

      for (const match of matches) {
        const alt = match[1]
        const urlPath = match[2]
        const abs = resolvePublicFile(urlPath)
        if (!abs) {
          console.log(`  skip inline ${g.slug} — missing ${urlPath}`)
          continue
        }
        const filename = path.basename(abs)
        process.stdout.write(`  inline ${g.slug} ${filename} … `)

        if (dryRun) {
          console.log('[dry-run]')
          results.inlineFiles++
          continue
        }

        try {
          const publicUrl = await uploadFileToR2({
            edgeFnUrl,
            serviceRoleKey,
            guideSlug: g.slug,
            filePath: abs,
            filename,
          })
          nextMd = nextMd.replace(match[0], `![${alt}](${publicUrl})`)
          changed = true
          console.log(`✓  ${publicUrl}`)
          results.inlineFiles++
        } catch (err) {
          console.log(`✗  ${err.message}`)
          results.failed++
        }
      }

      if (changed && !dryRun) {
        const { error: upErr } = await supabase
          .from('guides')
          .update({ content_markdown: nextMd, updated_at: new Date().toISOString() })
          .eq('id', g.id)
        if (upErr) throw new Error(`guides markdown ${g.slug}: ${upErr.message}`)
        results.markdownUpdated++
      }
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Heroes uploaded   : ${results.heroes}
  Inline files      : ${results.inlineFiles}
  Markdown updated  : ${results.markdownUpdated}
  Skipped           : ${results.skipped}
  Failed            : ${results.failed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)

  if (results.failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
