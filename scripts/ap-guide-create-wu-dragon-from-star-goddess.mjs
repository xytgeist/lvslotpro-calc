/**
 * Split Wu Dragon into its own sister card (same AP copy as Star Goddess).
 * Renames combined slug → star-goddess, creates wu-dragon, cross-links Skins.
 *
 * Usage: npm run ap-guide:backup  (recommended first)
 *        node scripts/ap-guide-create-wu-dragon-from-star-goddess.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { buildGuideMarkdown, parseGuideMarkdown } from '../src/slot-guide-form/formUtils.js'
import { runSlotGuideIngest } from './lib/runSlotGuideIngest.mjs'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

const COMBINED_SLUG = 'star-goddess-wu-dragon'
const STAR_SLUG = 'star-goddess'
const DRAGON_SLUG = 'wu-dragon'

const STAR_TITLE = 'Star Goddess'
const DRAGON_TITLE = 'Wu Dragon'

loadSupabaseEnv('test')
const { url, key } = readSupabaseCredentials()
const sb = createClient(url, key, { auth: { persistSession: false } })

const { data: dragonExisting } = await sb.from('guides').select('slug').eq('slug', DRAGON_SLUG).maybeSingle()
if (dragonExisting) {
  console.error(`${DRAGON_SLUG} already exists — aborting`)
  process.exit(1)
}

const { data: source, error: srcErr } = await sb
  .from('guides')
  .select('title, card_ev_threshold, content_markdown, published, thumbnail_url, machines(*)')
  .eq('slug', COMBINED_SLUG)
  .maybeSingle()
if (srcErr) throw new Error(srcErr.message)
if (!source) {
  const { data: starOnly } = await sb.from('guides').select('slug').eq('slug', STAR_SLUG).maybeSingle()
  if (starOnly) {
    console.error(`${COMBINED_SLUG} not found but ${STAR_SLUG} exists — run wu-dragon create manually?`)
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
  const { error: machineErr } = await sb
    .from('machines')
    .update({ slug, updated_at: new Date().toISOString() })
    .eq('slug', oldSlug)
  if (machineErr) throw new Error(`machines rename: ${machineErr.message}`)

  const { error: guideErr } = await sb
    .from('guides')
    .update({ slug, updated_at: new Date().toISOString() })
    .eq('slug', oldSlug)
  if (guideErr) throw new Error(`guides rename: ${guideErr.message}`)

  const { data: relatedRows } = await sb
    .from('guides')
    .select('id, related_machine_slugs')
    .contains('related_machine_slugs', [oldSlug])
  for (const row of relatedRows ?? []) {
    const next = (row.related_machine_slugs ?? []).map((s) => (s === oldSlug ? slug : s))
    await sb
      .from('guides')
      .update({ related_machine_slugs: next, updated_at: new Date().toISOString() })
      .eq('id', row.id)
  }

  const { data: gates } = await sb.from('content_access_gates').select('id, content_slug').eq('content_slug', oldSlug)
  for (const gate of gates ?? []) {
    await sb.from('content_access_gates').update({ content_slug: slug }).eq('id', gate.id)
  }

  console.log(`Renamed ${oldSlug} → ${slug}`)
}

const { data: starTaken } = await sb.from('guides').select('slug').eq('slug', STAR_SLUG).maybeSingle()
if (!starTaken) {
  await renameSlug(STAR_SLUG, COMBINED_SLUG)
} else {
  console.log(`– ${STAR_SLUG} already exists; leaving slug as ${COMBINED_SLUG}`)
}

const starSlug = starTaken ? COMBINED_SLUG : STAR_SLUG

const whenToStopStar = sections.when_to_stop.replace(/meteor \/ fireball/i, 'meteor')
const whenToStopDragon = sections.when_to_stop.replace(/meteor \/ fireball/i, 'fireball')

const dragonPayload = {
  machine: {
    slug: DRAGON_SLUG,
    name: DRAGON_TITLE,
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
    title: DRAGON_TITLE,
    published: source.published !== false,
    card_ev_threshold: source.card_ev_threshold,
    when_to_play: sections.when_to_play,
    when_to_stop: whenToStopDragon,
    how_to_check: sections.how_to_check,
    risk_bankroll: sections.risk_bankroll,
    risk_summary: sections.risk_summary,
    risk_bullets: sections.risk_bullets ? sections.risk_bullets.split('\n').filter(Boolean) : [],
    where_to_find: sections.where_to_find || '',
    skins_markdown: `[${STAR_TITLE}](guide:${starSlug})`,
    gameplay_mechanics: `**Wu Dragon** (IGT) uses **Portal Lock** on the enhanced bet: premium hits leave **persistent frames** until a **fireball** strikes. A hit on a frame turns that spot and neighbors wild and can convert **all frames** wild for one spin.`,
  },
}

const out = await runSlotGuideIngest({
  payload: dragonPayload,
  target: 'test',
  writeRepo: false,
  syncSupabase: true,
})
if (!out.ok) {
  console.error('Ingest failed:', out.errors)
  process.exit(1)
}

const starMarkdown = buildGuideMarkdown({
  machine: { slug: starSlug, name: STAR_TITLE, ...sourceMachine },
  guide: {
    title: STAR_TITLE,
    published: source.published !== false,
    card_ev_threshold: source.card_ev_threshold,
    when_to_play: sections.when_to_play,
    when_to_stop: whenToStopStar,
    how_to_check: sections.how_to_check,
    risk_bankroll: sections.risk_bankroll,
    risk_summary: sections.risk_summary,
    risk_bullets: sections.risk_bullets ? sections.risk_bullets.split('\n').filter(Boolean) : [],
    where_to_find: sections.where_to_find || '',
    skins_markdown: `[${DRAGON_TITLE}](guide:${DRAGON_SLUG})`,
    gameplay_mechanics: `**Star Goddess** (IGT) uses **Portal Lock** on the enhanced bet: premium hits leave **persistent frames** until a **meteor** strikes. A hit on a frame turns that spot and neighbors wild and can convert **all frames** wild for one spin.`,
  },
})

const { error: guidePatchErr } = await sb
  .from('guides')
  .update({
    title: STAR_TITLE,
    content_markdown: starMarkdown,
    updated_at: new Date().toISOString(),
  })
  .eq('slug', starSlug)
if (guidePatchErr) throw new Error(guidePatchErr.message)

const { error: machinePatchErr } = await sb
  .from('machines')
  .update({ name: STAR_TITLE, updated_at: new Date().toISOString() })
  .eq('slug', starSlug)
if (machinePatchErr) throw new Error(machinePatchErr.message)

console.log(`✓ Created ${DRAGON_SLUG}`)
console.log(`✓ Patched ${starSlug} → ${STAR_TITLE} + skins link`)
console.log(JSON.stringify(out.result, null, 2))
