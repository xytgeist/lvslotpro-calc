/**
 * Ingest Ultimate X Poker (batch 25 skip reversed — VP treated as AP slot).
 * Usage: node scripts/ap-guide-ingest-ultimate-x-poker.mjs
 *
 * Backup first: npm run ap-guide:backup
 */
import { ULTIMATE_X_POKER_PAYLOAD } from './lib/apGuideUltimateXPokerPayload.mjs'
import { runSlotGuideIngest } from './lib/runSlotGuideIngest.mjs'
import { buildGuideMarkdown } from './lib/slotGuideIngestCore.mjs'
import {
  findAiTells,
  findForbiddenSourceRefs,
  findGameplayApCopy,
  findTravelLanguage,
  findWhenToStopBrokeTalk,
  findRiskWalkAway,
  findWeakBankrollLead,
  findWtfScoutFiller,
  findMarkdownInEvThreshold,
  findBankrollExtraProse,
  findHowToCheckSuperfluity,
  findRiskSuperfluity,
  bankrollStartsWithUnits,
} from './lib/apGuideVoiceRules.mjs'
import {
  readBatchProgress,
  writeBatchProgress,
  moveWorkspaceFolderToDone,
} from './lib/apGuideWorkspaceBatch.mjs'

const payload = ULTIMATE_X_POKER_PAYLOAD
const slug = String(payload.machine.slug)
const md = buildGuideMarkdown({ ...payload, diagrams: [] })
const bad = [
  ...findBankrollExtraProse(String(payload.guide?.risk_bankroll ?? '')),
  ...findForbiddenSourceRefs(md),
  ...findTravelLanguage(md),
  ...findWtfScoutFiller(md),
  ...findGameplayApCopy(md),
  ...findAiTells(md),
  ...findWhenToStopBrokeTalk(md),
  ...findRiskWalkAway(md),
  ...findWeakBankrollLead(md),
  ...findMarkdownInEvThreshold(String(payload.guide?.card_ev_threshold ?? '')),
  ...findHowToCheckSuperfluity(String(payload.guide?.how_to_check ?? '')),
  ...findRiskSuperfluity(String(payload.guide?.risk_summary ?? '')),
]
if (!bankrollStartsWithUnits(String(payload.guide?.risk_bankroll ?? ''))) {
  console.error(`${slug}: bankroll must lead with **N units**`)
  process.exit(1)
}
if (bad.length) {
  console.error(`${slug}: voice check (${bad.join(', ')})`)
  process.exit(1)
}

const out = await runSlotGuideIngest({
  payload,
  target: 'test',
  writeRepo: false,
  syncSupabase: true,
})
if (!out.ok) {
  console.error(out.errors)
  process.exit(1)
}

console.log(`✓ ${slug}`)
console.log(JSON.stringify(out.result, null, 2))

const archived = await moveWorkspaceFolderToDone(slug)
if (archived.moved) console.log(`Archived workspace → ___DONE/${slug}`)

const doc = await readBatchProgress()
const batch25 = doc.batches.find((b) => b.batch === 25)
if (batch25) {
  batch25.skipped = (batch25.skipped ?? []).filter((s) => s.slug !== slug)
  if (!batch25.completed.some((c) => c.slug === slug)) {
    batch25.completed.push({ slug, at: new Date().toISOString() })
  }
  doc.updatedAt = new Date().toISOString()
  await writeBatchProgress(doc)
}
