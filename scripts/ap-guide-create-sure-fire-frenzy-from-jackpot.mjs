/**
 * Create Sure Fire Frenzy Link sister card (same AP copy as Sure Fire Jackpot Link).
 * Cross-links Skins on both cards.
 *
 * Usage: node scripts/ap-guide-backup-test-guides.mjs sure-fire-jackpot-link  (recommended first)
 *        node scripts/ap-guide-create-sure-fire-frenzy-from-jackpot.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { buildGuideMarkdown, parseGuideMarkdown } from '../src/slot-guide-form/formUtils.js'
import { runSlotGuideIngest } from './lib/runSlotGuideIngest.mjs'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

const JACKPOT_SLUG = 'sure-fire-jackpot-link'
const FRENZY_SLUG = 'sure-fire-frenzy-link'

const JACKPOT_TITLE = 'Sure Fire Jackpot Link'
const FRENZY_TITLE = 'Sure Fire Frenzy Link'

loadSupabaseEnv('test')
const { url, key } = readSupabaseCredentials()
const sb = createClient(url, key, { auth: { persistSession: false } })

const { data: frenzyExisting } = await sb.from('guides').select('slug').eq('slug', FRENZY_SLUG).maybeSingle()
if (frenzyExisting) {
  console.error(`${FRENZY_SLUG} already exists - aborting`)
  process.exit(1)
}

const { data: source, error: srcErr } = await sb
  .from('guides')
  .select('title, card_ev_threshold, content_markdown, published, thumbnail_url, machines(*)')
  .eq('slug', JACKPOT_SLUG)
  .maybeSingle()
if (srcErr) throw new Error(srcErr.message)
if (!source) {
  console.error(`${JACKPOT_SLUG} not found on test`)
  process.exit(1)
}

const sourceMachine = Array.isArray(source.machines) ? source.machines[0] : source.machines
if (!sourceMachine) throw new Error(`${JACKPOT_SLUG} machine row missing`)

const sections = parseGuideMarkdown(source.content_markdown)

const sharedGameplayBody = sections.gameplay_mechanics.replace(
  /\*\*Sure Fire Jackpot Link\*\*/i,
  `**${FRENZY_TITLE}**`,
)

const frenzyPayload = {
  machine: {
    slug: FRENZY_SLUG,
    name: FRENZY_TITLE,
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
    title: FRENZY_TITLE,
    published: source.published !== false,
    card_ev_threshold: source.card_ev_threshold,
    when_to_play: sections.when_to_play,
    when_to_stop: sections.when_to_stop,
    how_to_check: sections.how_to_check,
    risk_bankroll: sections.risk_bankroll,
    risk_summary: sections.risk_summary,
    risk_bullets: sections.risk_bullets ? sections.risk_bullets.split('\n').filter(Boolean) : [],
    where_to_find: sections.where_to_find || '',
    skins_markdown: `[${JACKPOT_TITLE}](guide:${JACKPOT_SLUG})`,
    gameplay_mechanics: sharedGameplayBody.replace(/\*\*Sure Fire Jackpot Link\*\*/i, `**${FRENZY_TITLE}**`),
  },
}

const out = await runSlotGuideIngest({
  payload: frenzyPayload,
  target: 'test',
  writeRepo: false,
  syncSupabase: true,
})
if (!out.ok) {
  console.error('Ingest failed:', out.errors)
  process.exit(1)
}

const jackpotGameplay = sections.gameplay_mechanics.replace(
  /\*\*Sure Fire Jackpot Link\*\*/i,
  `**${JACKPOT_TITLE}**`,
)

const jackpotMarkdown = buildGuideMarkdown({
  machine: { slug: JACKPOT_SLUG, name: JACKPOT_TITLE, ...sourceMachine },
  guide: {
    title: JACKPOT_TITLE,
    published: source.published !== false,
    card_ev_threshold: source.card_ev_threshold,
    when_to_play: sections.when_to_play,
    when_to_stop: sections.when_to_stop,
    how_to_check: sections.how_to_check,
    risk_bankroll: sections.risk_bankroll,
    risk_summary: sections.risk_summary,
    risk_bullets: sections.risk_bullets ? sections.risk_bullets.split('\n').filter(Boolean) : [],
    where_to_find: sections.where_to_find || '',
    skins_markdown: `[${FRENZY_TITLE}](guide:${FRENZY_SLUG})`,
    gameplay_mechanics: jackpotGameplay,
  },
})

const { error: guidePatchErr } = await sb
  .from('guides')
  .update({
    content_markdown: jackpotMarkdown,
    updated_at: new Date().toISOString(),
  })
  .eq('slug', JACKPOT_SLUG)
if (guidePatchErr) throw new Error(guidePatchErr.message)

console.log(`✓ Created ${FRENZY_SLUG}`)
console.log(`✓ Patched ${JACKPOT_SLUG} Skins → ${FRENZY_SLUG}`)
console.log(JSON.stringify(out.result, null, 2))
