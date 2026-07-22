#!/usr/bin/env node
/**
 * Reliable Supabase SQL runner for test + production.
 *
 * Avoids parallel `supabase db query --linked` (pooler cli_login_postgres cache / circuit breaker).
 * When SUPABASE_DB_PASSWORD is in .env.supabase.{test,production}, uses --db-url with postgres role.
 *
 * Usage:
 *   node scripts/supabase-db-query.mjs --target=test "select 1"
 *   node scripts/supabase-db-query.mjs --target=production -f supabase/foo.sql
 *   npm run db:query:test -- "select 1"
 *   npm run db:query:production -- -f supabase/foo.sql
 */
import { runSupabaseDbQuery } from "./lib/supabaseDbCli.mjs";

function parseArgs(argv) {
  let target = "test";
  let file;
  let output = "json";
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--target" || arg === "-t") {
      target = argv[++i];
      continue;
    }
    if (arg.startsWith("--target=")) {
      target = arg.slice("--target=".length);
      continue;
    }
    if (arg === "--file" || arg === "-f") {
      file = argv[++i];
      continue;
    }
    if (arg === "--output" || arg === "-o") {
      output = argv[++i];
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      console.log(`Usage:
  node scripts/supabase-db-query.mjs [--target=test|production] [sql]
  node scripts/supabase-db-query.mjs --target=production -f path/to.sql

Default target is test. Set SUPABASE_DB_PASSWORD in .env.supabase.{test,production} for stable pooler auth.`);
      process.exit(0);
    }
    positional.push(arg);
  }

  if (!file && positional.length === 0) {
    console.error("Provide SQL string or --file path.");
    process.exit(1);
  }

  if (target !== "test" && target !== "production") {
    console.error('--target must be "test" or "production".');
    process.exit(1);
  }

  const sql = file ? undefined : positional.join(" ").trim();
  if (!file && !sql) {
    console.error("SQL string is empty.");
    process.exit(1);
  }

  return { target, sql, file, output };
}

const opts = parseArgs(process.argv.slice(2));

try {
  const { stdout, stderr } = await runSupabaseDbQuery(opts);
  if (stdout) process.stdout.write(stdout.endsWith("\n") ? stdout : `${stdout}\n`);
  if (stderr) process.stderr.write(stderr.endsWith("\n") ? stderr : `${stderr}\n`);
} catch (err) {
  if (err.stdout) process.stdout.write(err.stdout);
  if (err.stderr) process.stderr.write(err.stderr);
  process.stderr.write(`${err.message}\n`);
  process.exit(err.exitCode ?? 1);
}
