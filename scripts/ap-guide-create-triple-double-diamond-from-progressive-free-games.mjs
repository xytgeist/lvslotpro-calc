/**
 * Create triple-double-diamond from progressive-free-games (live test or batch 19 payload).
 * Ensures parent card exists, then cross-links Skins on both.
 *
 * Usage: npm run ap-guide:backup  (recommended first)
 *        node scripts/ap-guide-create-triple-double-diamond-from-progressive-free-games.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { buildGuideMarkdown, parseGuideMarkdown } from '../src/slot-guide-form/formUtils.js'
import { BATCH19_PAYLOADS } from './lib/apGuideBatch19Payloads.mjs'
import { runSlotGuideIngest } from './lib/runSlotGuideIngest.mjs'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'
import {
  readBatchProgress,
  writeBatchProgress,
  moveWorkspaceFolderToDone,
} from './lib/apGuideWorkspaceBatch.mjs'

const SOURCE_SLUG = 'progressive-free-games'
const TARGET_SLUG = 'triple-double-diamond'

const SOURCE_TITLE = 'Progressive Free Games'
const TARGET_TITLE = 'Triple Double Diamond'

const OTHER_SKINS = '**Legend of the 3x4x5x Phoenix**, and other IGT 3-reel skins on this meter family.'

const batchPayload = BATCH19_PAYLOADS.find((p) => p.machine.slug === SOURCE_SLUG)
if (!batchPayload) throw new Error(`No batch 19 payload for ${SOURCE_SLUG}`)

loadSupabaseEnv('test')
const { url, key } = readSupabaseCredentials()
const sb = createClient(url, key, { auth: { persistSession: false } })

const { data: existingTarget } = await sb.from('guides').select('slug').eq('slug', TARGET_SLUG).maybeSingle()

const { data: liveSource } = await sb
  .from('guides')
  .select('title, card_ev_threshold, content_markdown, published, machines(*)')
  .eq('slug', SOURCE_SLUG)
  .maybeSingle()

/** @type {Record<string, string>} */
let sections
/** @type {Record<string, unknown>} */
let sourceMachine
let published = true
let cardEvThreshold = String(batchPayload.guide.card_ev_threshold ?? '')

if (liveSource) {
  sourceMachine = Array.isArray(liveSource.machines) ? liveSource.machines[0] : liveSource.machines
  if (!sourceMachine) throw new Error(`${SOURCE_SLUG} machine row missing`)
  sections = parseGuideMarkdown(liveSource.content_markdown)
  published = liveSource.published !== false
  cardEvThreshold = liveSource.card_ev_threshold ?? cardEvThreshold
} else {
  console.log(`${SOURCE_SLUG} not on test — seeding from batch 19 payload`)
  sourceMachine = batchPayload.machine
  sections = {
    when_to_play: String(batchPayload.guide.when_to_play ?? ''),
    when_to_stop: String(batchPayload.guide.when_to_stop ?? ''),
    how_to_check: String(batchPayload.guide.how_to_check ?? ''),
    risk_bankroll: String(batchPayload.guide.risk_bankroll ?? ''),
    risk_summary: String(batchPayload.guide.risk_summary ?? ''),
    risk_bullets: (batchPayload.guide.risk_bullets ?? []).join('\n'),
    where_to_find: String(batchPayload.guide.where_to_find ?? ''),
    skins_markdown: String(batchPayload.guide.skins_markdown ?? ''),
    gameplay_mechanics: String(batchPayload.guide.gameplay_mechanics ?? ''),
  }
  published = batchPayload.guide.published !== false
}

const adaptGameplayForTarget = (text) =>
  String(text ?? '')
    .replace(/\*\*Progressive Free Games\*\*/g, `**${TARGET_TITLE}**`)
    .replace(/\*\*Triple Double Diamond\*\*, /g, '')

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
    published,
    card_ev_threshold: cardEvThreshold,
    when_to_play: sections.when_to_play,
    when_to_stop: sections.when_to_stop,
    how_to_check: sections.how_to_check,
    risk_bankroll: sections.risk_bankroll,
    risk_summary: sections.risk_summary,
    risk_bullets: sections.risk_bullets ? sections.risk_bullets.split('\n').filter(Boolean) : [],
    where_to_find: sections.where_to_find || '',
    skins_markdown: `[${SOURCE_TITLE}](guide:${SOURCE_SLUG}) (same AP). ${OTHER_SKINS}`,
    gameplay_mechanics: adaptGameplayForTarget(sections.gameplay_mechanics),
  },
}

const sourceGuidePayload = {
  title: SOURCE_TITLE,
  published,
  card_ev_threshold: cardEvThreshold,
  when_to_play: sections.when_to_play,
  when_to_stop: sections.when_to_stop,
  how_to_check: sections.how_to_check,
  risk_bankroll: sections.risk_bankroll,
  risk_summary: sections.risk_summary,
  risk_bullets: sections.risk_bullets ? sections.risk_bullets.split('\n').filter(Boolean) : [],
  where_to_find: sections.where_to_find || '',
  skins_markdown: `[${TARGET_TITLE}](guide:${TARGET_SLUG}) (same AP). ${OTHER_SKINS}`,
  gameplay_mechanics: sections.gameplay_mechanics,
}

const sourcePayload = {
  machine: {
    slug: SOURCE_SLUG,
    name: SOURCE_TITLE,
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
  guide: sourceGuidePayload,
}

if (!liveSource) {
  const parentOut = await runSlotGuideIngest({
    payload: sourcePayload,
    target: 'test',
    writeRepo: false,
    syncSupabase: true,
  })
  if (!parentOut.ok) {
    console.error('Parent ingest failed:', parentOut.errors)
    process.exit(1)
  }
  console.log(`✓ restored ${SOURCE_SLUG}`)
} else {
  const sourceMarkdown = buildGuideMarkdown({
    machine: { slug: SOURCE_SLUG, name: SOURCE_TITLE, ...sourceMachine },
    guide: sourceGuidePayload,
  })
  const { error: patchErr } = await sb
    .from('guides')
    .update({
      content_markdown: sourceMarkdown,
      updated_at: new Date().toISOString(),
    })
    .eq('slug', SOURCE_SLUG)
  if (patchErr) throw new Error(patchErr.message)
  console.log(`Patched ${SOURCE_SLUG} Skins → [${TARGET_TITLE}](guide:${TARGET_SLUG})`)
}

const out = await runSlotGuideIngest({
  payload: targetPayload,
  target: 'test',
  writeRepo: false,
  syncSupabase: true,
})

if (!out.ok) {
  console.error('Target ingest failed:', out.errors)
  process.exit(1)
}

const archived = await moveWorkspaceFolderToDone(TARGET_SLUG)
if (archived.moved) console.log(`Archived workspace → ___DONE/${TARGET_SLUG}`)

const doc = await readBatchProgress()
const batch25 = doc.batches.find((b) => b.batch === 25)
if (batch25) {
  batch25.skipped = (batch25.skipped ?? []).filter((s) => s.slug !== TARGET_SLUG)
  if (!batch25.completed.some((c) => c.slug === TARGET_SLUG)) {
    batch25.completed.push({ slug: TARGET_SLUG, at: new Date().toISOString() })
  }
  doc.updatedAt = new Date().toISOString()
  await writeBatchProgress(doc)
}

const verb = existingTarget ? 'Updated' : 'Created'
console.log(`${verb} ${TARGET_SLUG} from ${SOURCE_SLUG}`)
console.log(JSON.stringify(out.result, null, 2))
