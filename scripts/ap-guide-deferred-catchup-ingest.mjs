/**
 * Ingest deferred batch 27/28 slugs (wish-mistress, wo-shu-sky-spin, wild-mermaid).
 * Usage: node scripts/ap-guide-deferred-catchup-ingest.mjs
 *
 * Backup first: npm run ap-guide:backup
 */
import { DEFERRED_CATCHUP_PAYLOADS } from './lib/apGuideDeferredCatchupPayloads.mjs'
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

/** @param {number} batchNum @param {string} slug */
function markBatchCompleted(doc, batchNum, slug) {
  const batch = doc.batches.find((b) => b.batch === batchNum)
  if (!batch) return
  batch.skipped = (batch.skipped ?? []).filter((s) => s.slug !== slug)
  if (!batch.completed.some((c) => c.slug === slug)) {
    batch.completed.push({ slug, at: new Date().toISOString() })
  }
}

const BATCH_BY_SLUG = {
  'wild-mermaid': 27,
  'wish-mistress': 28,
  'wo-shu-sky-spin': 28,
}

const failures = []
const completed = []

for (const payload of DEFERRED_CATCHUP_PAYLOADS) {
  const slug = String(payload.machine.slug)
  const md = buildGuideMarkdown({ ...payload, diagrams: payload.diagrams ?? [] })
  const badBankrollOnly = findBankrollExtraProse(String(payload.guide?.risk_bankroll ?? ''))
  const badEvThreshold = findMarkdownInEvThreshold(String(payload.guide?.card_ev_threshold ?? ''))
  const badHtc = findHowToCheckSuperfluity(String(payload.guide?.how_to_check ?? ''))
  const badRisk = findRiskSuperfluity(String(payload.guide?.risk_summary ?? ''))
  const bad = [
    ...findForbiddenSourceRefs(md),
    ...findTravelLanguage(md),
    ...findWtfScoutFiller(md),
    ...findGameplayApCopy(md),
    ...findAiTells(md),
    ...findWhenToStopBrokeTalk(md),
    ...findRiskWalkAway(md),
    ...findWeakBankrollLead(md),
    ...badEvThreshold,
    ...badHtc,
    ...badRisk,
  ]
  if (badBankrollOnly.length) {
    failures.push(`${slug}: bankroll must be unit count only (${badBankrollOnly.join(', ')})`)
    continue
  }
  if (!bankrollStartsWithUnits(String(payload.guide?.risk_bankroll ?? ''))) {
    failures.push(`${slug}: bankroll must lead with **N units**`)
    continue
  }
  if (/\*\*Summary:\*\*/i.test(md)) {
    failures.push(`${slug}: contains WtF Summary line`)
    continue
  }
  if (bad.length) {
    failures.push(`${slug}: voice check (${bad.join(', ')})`)
    continue
  }

  try {
    const out = await runSlotGuideIngest({
      payload,
      target: 'test',
      writeRepo: false,
      syncSupabase: true,
    })
    if (!out.ok) throw new Error(out.errors?.join('; ') || 'ingest failed')
    completed.push(slug)
    await moveWorkspaceFolderToDone(slug)
    console.log(`✓ ${slug}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    failures.push(`${slug}: ${msg}`)
    console.error(`✗ ${slug}: ${msg}`)
  }
}

const doc = await readBatchProgress()
for (const slug of completed) {
  const batchNum = BATCH_BY_SLUG[slug]
  if (batchNum) markBatchCompleted(doc, batchNum, slug)
}
doc.updatedAt = new Date().toISOString()
await writeBatchProgress(doc)

console.log(`\nDeferred catch-up: ${completed.length} ingested, ${failures.length} failed`)
if (failures.length) {
  for (const f of failures) console.log(`  - ${f}`)
  process.exit(1)
}
