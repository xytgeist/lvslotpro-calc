/**
 * Create or refresh money-hits from live volcanic-sevens (same SAP ladder family).
 *
 * Usage: npm run ap-guide:backup  (recommended first)
 *        node scripts/ap-guide-create-money-hits-from-volcanic-sevens.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { parseGuideMarkdown } from '../src/slot-guide-form/formUtils.js'
import { runSlotGuideIngest } from './lib/runSlotGuideIngest.mjs'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

const SOURCE_SLUG = 'volcanic-sevens'
const TARGET_SLUG = 'money-hits'

const SOURCE_TITLE = 'Volcanic Sevens'
const TARGET_TITLE = 'Money Hits'

/** @param {string} text */
function stripSourceImages(text) {
  return String(text ?? '')
    .replace(/!\[[^\]]*\]\([^)]*volcanic-sevens[^)]*\)\s*/gi, '')
    .trim()
}

/** @param {string} text */
function adaptWhenToPlay(text) {
  return String(text ?? '')
    .replace(/\[Money Hits\]\(guide:money-hits\)/gi, `[${SOURCE_TITLE}](guide:${SOURCE_SLUG})`)
    .trim()
}

/** @param {string} text */
function adaptGameplay(text) {
  return String(text ?? '')
    .replace(/\*\*Volcanic Sevens\*\*/g, `**${TARGET_TITLE}**`)
    .trim()
}

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

const payload = {
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
    popularity_summary: sourceMachine.popularity_summary ?? '$50 @ $44+ · $150 @ $143+ · $1K @ $970+',
    release_year: sourceMachine.release_year ?? null,
  },
  guide: {
    title: TARGET_TITLE,
    published: source.published !== false,
    card_ev_threshold: source.card_ev_threshold,
    when_to_play: adaptWhenToPlay(sections.when_to_play),
    when_to_stop: sections.when_to_stop,
    how_to_check: stripSourceImages(sections.how_to_check),
    risk_bankroll: sections.risk_bankroll,
    risk_summary: sections.risk_summary,
    risk_bullets: sections.risk_bullets
      ? sections.risk_bullets.split('\n').filter(Boolean)
      : [],
    where_to_find: sections.where_to_find || '',
    skins_markdown: `[${SOURCE_TITLE}](guide:${SOURCE_SLUG}) (same SAP ladder family).`,
    gameplay_mechanics: adaptGameplay(sections.gameplay_mechanics),
  },
}

const out = await runSlotGuideIngest({
  payload,
  target: 'test',
  writeRepo: false,
  syncSupabase: true,
})

if (!out.ok) {
  console.error('Ingest failed:', out.errors)
  process.exit(1)
}

const sourceSkins = `[${TARGET_TITLE}](guide:${TARGET_SLUG}) (same SAP ladder family).`
const patchedSourceMd = source.content_markdown.replace(
  /## 🎭 Skins[^\n]*\n[\s\S]*?(?=\n## |\n---|\s*$)/i,
  `## 🎭 Skins (same game different theme/art)\n\n${sourceSkins}\n\n`,
)

const { error: patchErr } = await sb
  .from('guides')
  .update({
    content_markdown: patchedSourceMd,
    updated_at: new Date().toISOString(),
  })
  .eq('slug', SOURCE_SLUG)
if (patchErr) console.warn(`${SOURCE_SLUG} skins link patch skipped: ${patchErr.message}`)
else console.log(`Patched ${SOURCE_SLUG} skins → [${TARGET_TITLE}](guide:${TARGET_SLUG})`)

const verb = existingTarget ? 'Updated' : 'Created'
console.log(`${verb} ${TARGET_SLUG} from ${SOURCE_SLUG}`)
console.log(JSON.stringify(out.result, null, 2))
