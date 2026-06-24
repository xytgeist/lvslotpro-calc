/**
 * Ingest 10 Desolator PDF v1.14 gap guides → test Supabase.
 * Usage: node scripts/ap-guide-ingest-desolator-gaps.mjs
 *
 * Backup first: npm run ap-guide:backup
 */
import { DESOLATOR_GAP_PAYLOADS } from './lib/apGuideDesolatorGapPayloads.mjs'
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
import { moveWorkspaceFolderToDone } from './lib/apGuideWorkspaceBatch.mjs'

const failures = []
const completed = []

for (const payload of DESOLATOR_GAP_PAYLOADS) {
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

console.log(`\nDesolator gaps: ${completed.length} ingested, ${failures.length} failed`)
if (failures.length) {
  for (const f of failures) console.log(`  - ${f}`)
  process.exit(1)
}
