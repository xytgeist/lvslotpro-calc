/**
 * Create or refresh wheel-of-fortune-high-roller-respin from live wheel-of-fortune-high-roller.
 * Cross-links Skins on both cards.
 *
 * Usage: npm run ap-guide:backup  (recommended first)
 *        node scripts/ap-guide-create-wof-high-roller-respin-from-high-roller.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { buildGuideMarkdown, parseGuideMarkdown } from '../src/slot-guide-form/formUtils.js'
import { runSlotGuideIngest } from './lib/runSlotGuideIngest.mjs'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

const SOURCE_SLUG = 'wheel-of-fortune-high-roller'
const TARGET_SLUG = 'wheel-of-fortune-high-roller-respin'

const SOURCE_TITLE = 'Wheel of Fortune High Roller'
const TARGET_TITLE = 'Wheel of Fortune High Roller Respin'

loadSupabaseEnv('test')
const { url, key } = readSupabaseCredentials()
const sb = createClient(url, key, { auth: { persistSession: false } })

const { data: existingTarget } = await sb.from('guides').select('slug').eq('slug', TARGET_SLUG).maybeSingle()

const { data: source, error: srcErr } = await sb
  .from('guides')
  .select('title, card_ev_threshold, content_markdown, published, machines(*)')
  .eq('slug', SOURCE_SLUG)
  .maybeSingle()
if (srcErr) throw new Error(srcErr.message)
if (!source) throw new Error(`${SOURCE_SLUG} not found on test`)

const sourceMachine = Array.isArray(source.machines) ? source.machines[0] : source.machines
if (!sourceMachine) throw new Error(`${SOURCE_SLUG} machine row missing`)

const sections = parseGuideMarkdown(source.content_markdown)

const targetPayload = {
  machine: {
    slug: TARGET_SLUG,
    name: TARGET_TITLE,
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
    title: TARGET_TITLE,
    published: source.published !== false,
    card_ev_threshold: source.card_ev_threshold,
    when_to_play: sections.when_to_play,
    when_to_stop: sections.when_to_stop,
    how_to_check: sections.how_to_check,
    risk_bankroll: sections.risk_bankroll,
    risk_summary: sections.risk_summary,
    risk_bullets: sections.risk_bullets ? sections.risk_bullets.split('\n').filter(Boolean) : [],
    where_to_find: sections.where_to_find || '',
    skins_markdown: `[${SOURCE_TITLE}](guide:${SOURCE_SLUG}) (same AP).`,
    gameplay_mechanics: sections.gameplay_mechanics.replace(
      /\*\*Wheel of Fortune High Roller\*\*/g,
      `**${TARGET_TITLE}**`,
    ),
  },
}

const out = await runSlotGuideIngest({
  payload: targetPayload,
  target: 'test',
  writeRepo: false,
  syncSupabase: true,
})

if (!out.ok) {
  console.error('Ingest failed:', out.errors)
  process.exit(1)
}

const sourceMarkdown = buildGuideMarkdown({
  machine: { slug: SOURCE_SLUG, name: SOURCE_TITLE, ...sourceMachine },
  guide: {
    title: SOURCE_TITLE,
    published: source.published !== false,
    card_ev_threshold: source.card_ev_threshold,
    when_to_play: sections.when_to_play,
    when_to_stop: sections.when_to_stop,
    how_to_check: sections.how_to_check,
    risk_bankroll: sections.risk_bankroll,
    risk_summary: sections.risk_summary,
    risk_bullets: sections.risk_bullets ? sections.risk_bullets.split('\n').filter(Boolean) : [],
    where_to_find: sections.where_to_find || '',
    skins_markdown: `[${TARGET_TITLE}](guide:${TARGET_SLUG}) (same AP).`,
    gameplay_mechanics: sections.gameplay_mechanics.replace(
      /\*\*Wheel of Fortune High Roller\*\*/g,
      `**${SOURCE_TITLE}**`,
    ),
  },
})

const { error: patchErr } = await sb
  .from('guides')
  .update({
    content_markdown: sourceMarkdown,
    updated_at: new Date().toISOString(),
  })
  .eq('slug', SOURCE_SLUG)
if (patchErr) throw new Error(patchErr.message)

const verb = existingTarget ? 'Updated' : 'Created'
console.log(`${verb} ${TARGET_SLUG} from ${SOURCE_SLUG}`)
console.log(`Patched ${SOURCE_SLUG} Skins → [${TARGET_TITLE}](guide:${TARGET_SLUG})`)
console.log(JSON.stringify(out.result, null, 2))
