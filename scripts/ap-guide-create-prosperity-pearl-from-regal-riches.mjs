/**
 * Split Prosperity Pearl into its own sister card (same AP copy as Regal Riches).
 * Renames combined slug → regal-riches, creates prosperity-pearl, cross-links Skins.
 *
 * Usage: npm run ap-guide:backup  (recommended first)
 *        node scripts/ap-guide-create-prosperity-pearl-from-regal-riches.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { buildGuideMarkdown, parseGuideMarkdown } from '../src/slot-guide-form/formUtils.js'
import { runSlotGuideIngest } from './lib/runSlotGuideIngest.mjs'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

const COMBINED_SLUG = 'regal-riches-prosperity-pearl'
const REGAL_SLUG = 'regal-riches'
const PEARL_SLUG = 'prosperity-pearl'

const REGAL_TITLE = 'Regal Riches'
const PEARL_TITLE = 'Prosperity Pearl'

const SHARED_GAMEPLAY =
  '**must-hit-by wild counters** (blue resets **5**, cap **50**). Wilds can stack **multipliers up to 5x** on the same row when a counter hits.'

loadSupabaseEnv('test')
const { url, key } = readSupabaseCredentials()
const sb = createClient(url, key, { auth: { persistSession: false } })

const { data: pearlExisting } = await sb.from('guides').select('slug').eq('slug', PEARL_SLUG).maybeSingle()
if (pearlExisting) {
  console.error(`${PEARL_SLUG} already exists — aborting`)
  process.exit(1)
}

const { data: source, error: srcErr } = await sb
  .from('guides')
  .select('title, card_ev_threshold, content_markdown, published, thumbnail_url, machines(*)')
  .eq('slug', COMBINED_SLUG)
  .maybeSingle()
if (srcErr) throw new Error(srcErr.message)
if (!source) {
  const { data: regalOnly } = await sb
    .from('guides')
    .select('slug')
    .eq('slug', REGAL_SLUG)
    .maybeSingle()
  if (regalOnly) {
    console.error(`${COMBINED_SLUG} not found but ${REGAL_SLUG} exists — run prosperity-pearl create manually?`)
  } else {
    console.error(`${COMBINED_SLUG} not found on test`)
  }
  process.exit(1)
}

const sourceMachine = Array.isArray(source.machines) ? source.machines[0] : source.machines
if (!sourceMachine) throw new Error(`${COMBINED_SLUG} machine row missing`)

const sections = parseGuideMarkdown(source.content_markdown)

/** @param {string} slug @param {string} oldSlug */
async function renameSlug(slug, oldSlug) {
  const { error: machineErr } = await sb.from('machines').update({ slug, updated_at: new Date().toISOString() }).eq('slug', oldSlug)
  if (machineErr) throw new Error(`machines rename: ${machineErr.message}`)

  const { error: guideErr } = await sb.from('guides').update({ slug, updated_at: new Date().toISOString() }).eq('slug', oldSlug)
  if (guideErr) throw new Error(`guides rename: ${guideErr.message}`)

  const { data: relatedRows } = await sb.from('guides').select('id, related_machine_slugs').contains('related_machine_slugs', [oldSlug])
  for (const row of relatedRows ?? []) {
    const next = (row.related_machine_slugs ?? []).map((s) => (s === oldSlug ? slug : s))
    await sb.from('guides').update({ related_machine_slugs: next, updated_at: new Date().toISOString() }).eq('id', row.id)
  }

  const { data: gates } = await sb.from('content_access_gates').select('id, content_slug').eq('content_slug', oldSlug)
  for (const gate of gates ?? []) {
    await sb.from('content_access_gates').update({ content_slug: slug }).eq('id', gate.id)
  }

  console.log(`Renamed ${oldSlug} → ${slug}`)
}

const { data: regalTaken } = await sb.from('guides').select('slug').eq('slug', REGAL_SLUG).maybeSingle()
if (!regalTaken) {
  await renameSlug(REGAL_SLUG, COMBINED_SLUG)
} else {
  console.log(`– ${REGAL_SLUG} already exists; leaving slug as ${COMBINED_SLUG}`)
}

const regalSlug = regalTaken ? COMBINED_SLUG : REGAL_SLUG

const pearlPayload = {
  machine: {
    slug: PEARL_SLUG,
    name: PEARL_TITLE,
    manufacturer: sourceMachine.manufacturer ?? 'IGT',
    type: sourceMachine.type,
    difficulty: sourceMachine.difficulty,
    popularity: sourceMachine.popularity,
    nerf_risk: sourceMachine.nerf_risk,
    has_calculator: sourceMachine.has_calculator ?? false,
    calculator_slug: sourceMachine.calculator_slug ?? null,
    volatility_index: sourceMachine.volatility_index,
    popularity_summary: sourceMachine.popularity_summary,
    release_year: sourceMachine.release_year ?? null,
  },
  guide: {
    title: PEARL_TITLE,
    published: source.published !== false,
    card_ev_threshold: source.card_ev_threshold,
    when_to_play: sections.when_to_play,
    when_to_stop: sections.when_to_stop,
    how_to_check: sections.how_to_check,
    risk_bankroll: sections.risk_bankroll,
    risk_summary: sections.risk_summary,
    risk_bullets: sections.risk_bullets ? sections.risk_bullets.split('\n').filter(Boolean) : [],
    where_to_find: sections.where_to_find || '',
    skins_markdown: `[${REGAL_TITLE}](guide:${regalSlug})`,
    gameplay_mechanics: `**Prosperity Pearl** (IGT) runs ${SHARED_GAMEPLAY}`,
  },
}

const out = await runSlotGuideIngest({
  payload: pearlPayload,
  target: 'test',
  writeRepo: false,
  syncSupabase: true,
})
if (!out.ok) {
  console.error('Ingest failed:', out.errors)
  process.exit(1)
}

const regalMarkdown = buildGuideMarkdown({
  machine: { slug: regalSlug, name: REGAL_TITLE, ...sourceMachine },
  guide: {
    title: REGAL_TITLE,
    published: source.published !== false,
    card_ev_threshold: source.card_ev_threshold,
    when_to_play: sections.when_to_play,
    when_to_stop: sections.when_to_stop,
    how_to_check: sections.how_to_check,
    risk_bankroll: sections.risk_bankroll,
    risk_summary: sections.risk_summary,
    risk_bullets: sections.risk_bullets ? sections.risk_bullets.split('\n').filter(Boolean) : [],
    where_to_find: sections.where_to_find || '',
    skins_markdown: `[${PEARL_TITLE}](guide:${PEARL_SLUG})`,
    gameplay_mechanics: `**Regal Riches** (IGT) runs ${SHARED_GAMEPLAY}`,
  },
})

const { error: guidePatchErr } = await sb
  .from('guides')
  .update({
    title: REGAL_TITLE,
    content_markdown: regalMarkdown,
    updated_at: new Date().toISOString(),
  })
  .eq('slug', regalSlug)
if (guidePatchErr) throw new Error(guidePatchErr.message)

const { error: machinePatchErr } = await sb
  .from('machines')
  .update({ name: REGAL_TITLE, updated_at: new Date().toISOString() })
  .eq('slug', regalSlug)
if (machinePatchErr) throw new Error(machinePatchErr.message)

console.log(`✓ Created ${PEARL_SLUG}`)
console.log(`✓ Patched ${regalSlug} → ${REGAL_TITLE} + skins link`)
console.log(JSON.stringify(out.result, null, 2))
