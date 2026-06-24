/**
 * Replace Unicode em dashes (U+2014) with ASCII hyphen in test guide rows.
 * Does not re-ingest from payloads — patches live DB copy in place.
 *
 * Usage:
 *   node scripts/ap-guide-replace-em-dashes.mjs [--dry-run] [--target=test|production]
 */
import { createClient } from '@supabase/supabase-js'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

const EM_DASH = '\u2014'
const REPLACEMENT = '-'

const dryRun = process.argv.includes('--dry-run')
const targetArg = process.argv.find((a) => a.startsWith('--target='))
const target = /** @type {'test' | 'production'} */ (
  targetArg?.split('=')[1] === 'production' ? 'production' : 'test'
)

/** @param {string | null | undefined} text */
function scrubEmDash(text) {
  if (!text || !text.includes(EM_DASH)) return text ?? ''
  return text.replaceAll(EM_DASH, REPLACEMENT)
}

loadSupabaseEnv(target)
const { url, key } = readSupabaseCredentials()
const sb = createClient(url, key, { auth: { persistSession: false } })

const { data: guides, error } = await sb
  .from('guides')
  .select('id, slug, title, card_ev_threshold, content_markdown')
if (error) throw new Error(error.message)

/** @type {string[]} */
const patched = []
let totalReplacements = 0

for (const row of guides ?? []) {
  const next = {
    title: scrubEmDash(row.title),
    card_ev_threshold: scrubEmDash(row.card_ev_threshold),
    content_markdown: scrubEmDash(row.content_markdown),
  }

  const changed =
    next.title !== (row.title ?? '') ||
    next.card_ev_threshold !== (row.card_ev_threshold ?? '') ||
    next.content_markdown !== (row.content_markdown ?? '')

  if (!changed) continue

  const beforeCount =
    (row.title?.match(/\u2014/g) ?? []).length +
    (row.card_ev_threshold?.match(/\u2014/g) ?? []).length +
    (row.content_markdown?.match(/\u2014/g) ?? []).length
  totalReplacements += beforeCount
  patched.push(row.slug)

  if (dryRun) {
    console.log(`[dry-run] ${row.slug} (${beforeCount} em dash${beforeCount === 1 ? '' : 'es'})`)
    continue
  }

  const { error: upErr } = await sb
    .from('guides')
    .update({ ...next, updated_at: new Date().toISOString() })
    .eq('id', row.id)
  if (upErr) throw new Error(`${row.slug}: ${upErr.message}`)
  console.log(`Patched ${row.slug} (${beforeCount})`)
}

console.log(
  `\n${dryRun ? 'Would patch' : 'Patched'} ${patched.length} guide(s); ${totalReplacements} em dash(es) → hyphen on ${target}`,
)
