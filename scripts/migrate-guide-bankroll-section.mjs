/**
 * Recompile all guides so risk_bankroll becomes ## 💰 Bankroll on hand (own section).
 * Usage: node scripts/migrate-guide-bankroll-section.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'
import { parseGuideMarkdown, buildGuideMarkdown } from '../src/slot-guide-form/formUtils.js'

loadSupabaseEnv('test')
const { url, key } = readSupabaseCredentials()
const sb = createClient(url, key, { auth: { persistSession: false } })

const { data: guides, error } = await sb
  .from('guides')
  .select('id, slug, content_markdown, machines ( slug )')
  .order('slug')

if (error) throw new Error(error.message)

const nowIso = new Date().toISOString()
const results = []

for (const row of guides) {
  const machine = Array.isArray(row.machines) ? row.machines[0] : row.machines
  const slug = row.slug || machine?.slug
  if (!slug) {
    results.push({ slug: row.slug, status: 'SKIP', reason: 'no slug' })
    continue
  }

  const parsed = parseGuideMarkdown(row.content_markdown || '')
  const hasLegacyInline =
    /\*\*Bankroll on hand:/i.test(row.content_markdown || '') &&
    !/## 💰 Bankroll on hand/i.test(row.content_markdown || '')

  if (!parsed.risk_bankroll && !hasLegacyInline) {
    results.push({ slug, status: 'SKIP', reason: 'no bankroll content' })
    continue
  }

  const nextMd = buildGuideMarkdown({
    machine: { slug, name: slug },
    guide: parsed,
    diagrams: [],
  })

  if (nextMd === (row.content_markdown || '').trimEnd() + '\n' || nextMd === row.content_markdown) {
    results.push({ slug, status: 'SKIP', reason: 'already migrated' })
    continue
  }

  const { error: upErr } = await sb
    .from('guides')
    .update({ content_markdown: nextMd, updated_at: nowIso })
    .eq('id', row.id)

  if (upErr) {
    results.push({ slug, status: 'FAIL', reason: upErr.message })
    continue
  }

  results.push({ slug, status: 'OK', bankrollLen: parsed.risk_bankroll.length })
}

console.log('Bankroll section migration → test')
console.log('updated_at:', nowIso)
for (const r of results) console.log(r)
