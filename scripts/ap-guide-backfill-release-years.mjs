/**
 * Backfill machines.release_year for published guides missing a year (test-first).
 * SAFE: only updates rows where release_year IS NULL (never overwrites).
 *
 * Usage:
 *   node scripts/ap-guide-backfill-release-years.mjs --target=test
 *   node scripts/ap-guide-backfill-release-years.mjs --target=test --dry-run
 *   node scripts/ap-guide-backfill-release-years.mjs --target=test --slug=volcanic-sevens
 */
import { createClient } from '@supabase/supabase-js'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

/** Web-researched floor / launch years (2026-06-08). Sources: manufacturer press, G2E/ICE, Undumped, trade coverage. */
export const RESEARCHED_RELEASE_YEAR_BY_SLUG = {
  'barnyard-poker': 2015,
  'cai-fu-long': 2024,
  'cash-cano-roman-riches-tiki': 2021,
  'double-jackpot-blazing-7s-with-quick-hit-feature-high-limit-edition': 2025,
  'dragon-unleashed-prosperity-packets-red-fleet-three-legends-treasured-happin': 2023,
  'fairy-hollow': 2019,
  'fortune-owl': 2022,
  'fortune-x-poker': 2022,
  'golden-jungle': 2016,
  'grand-buddha-link-grand-cat-link': 2025,
  'inferno-wheel-aztec-awards-polynesian-pays': 2019,
  'lucky-haul-march-of-the-zombies': 2022,
  'master-da-dang-jia-fine-fortunes-vivid-diamonds': 2024,
  'mighty-cash-spins': 2021,
  'money-hits': 2021,
  'money-island': 2023,
  'moon-spirit': 2021,
  'moving-multipliers-poker': 2018,
  'multi-streak-poker': 2015,
  'multipliers-rising-poker': 2025,
  'nights-dream-wheel': 2021,
  'ocean-magic-4d-ocean-magic-ultra': 2020,
  'ocean-magic-bubble-boost': 2016,
  'ocean-magic-grand': 2017,
  'ocean-song': 2019,
  'palace-of-wonders': 2021,
  'pick-a-multiplier-poker': 2025,
  'piggy-bankin': 2018,
  'power-push-shiseijuu-fortunes': 2021,
  'quick-hit-platinum': 2013,
  'quick-hit-ultra-pays': 2018,
  'red-empress-the-white-wizard': 2014,
  'regal-link-lion-raven': 2024,
  'scarab-grand': 2020,
  'screaming-mansion': 2024,
  'sea-story-fluffy-treasure': 2021,
  'silver-dollar-shootout': 2009,
  'sumo-kitty-lucha-kitty': 2014,
  'super-bowl-jackpots': 2023,
  'super-hot-roll-poker': 2020,
  'super-lit-vegas-fortune-spin': 2019,
  'super-winning-streak-lion-eyes-wolf-eyes': 2024,
  'top-up-fortunes-flame-ocean': 2023,
  'ultimate-x-bonus-streak-poker': 2016,
  'volcanic-sevens': 2021,
  'wheel-of-fortune-4d-collectors-edition': 2019,
  'wheel-of-fortune-4d-more-money': 2020,
  'wheel-of-fortune-high-roller': 2020,
  'wheel-of-fortune-wild-boost-silver-gold': 2021,
  'wheel-of-fortune-wild-spin-live': 2021,
  'wheel-of-fortune-wild-spin-vacation-night-life': 2021,
  'wizard-of-oz-follow-the-yellow-brick-road': 2014,
  'wizard-of-oz-over-the-rainbow': 2014,
  'ying-cai-shen': 2019,
  'zhao-cai-zhu-gettin-piggy-with-it-yo-ho-hog': 2025,
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const targetArg = args.find((a) => a.startsWith('--target='))
const slugArg = args.find((a) => a.startsWith('--slug='))
const target = targetArg?.split('=')[1] || 'test'
const slugFilter = slugArg?.split('=')[1]?.trim() || null

loadSupabaseEnv(target)
const { url, key } = readSupabaseCredentials()
if (!url || !key) {
  console.error('Missing Supabase credentials.')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

async function main() {
  console.log(
    `\nap-guide-backfill-release-years  target=${target}${dryRun ? '  DRY-RUN' : ''}${slugFilter ? `  slug=${slugFilter}` : ''}\n`,
  )

  let guideQuery = supabase
    .from('guides')
    .select('slug, machines(id, slug, release_year)')
    .eq('published', true)
    .order('slug')

  if (slugFilter) guideQuery = guideQuery.eq('slug', slugFilter)

  const { data: guides, error } = await guideQuery
  if (error) {
    console.error(error.message)
    process.exit(1)
  }

  /** @type {Array<{ slug: string, machineId: string, year: number }>} */
  const updates = []

  for (const g of guides ?? []) {
    const m = Array.isArray(g.machines) ? g.machines[0] : g.machines
    if (!m?.id || m.release_year != null) continue
    const year = RESEARCHED_RELEASE_YEAR_BY_SLUG[g.slug]
    if (year == null) continue
    updates.push({ slug: g.slug, machineId: m.id, year })
  }

  const missingResearch = (guides ?? [])
    .filter((g) => {
      const m = Array.isArray(g.machines) ? g.machines[0] : g.machines
      return m?.release_year == null && RESEARCHED_RELEASE_YEAR_BY_SLUG[g.slug] == null
    })
    .map((g) => g.slug)

  console.log(`Candidates with researched year: ${updates.length}`)
  if (missingResearch.length) {
    console.log(`Still null (no researched year in map): ${missingResearch.length}`)
    for (const slug of missingResearch) console.log(`  - ${slug}`)
  }

  if (!updates.length) {
    console.log('\nNothing to update.')
    return
  }

  for (const row of updates) {
    console.log(`${dryRun ? '[dry-run] ' : ''}${row.slug} → ${row.year}`)
    if (dryRun) continue
    const { error: upErr } = await supabase
      .from('machines')
      .update({ release_year: row.year })
      .eq('id', row.machineId)
      .is('release_year', null)
    if (upErr) {
      console.error(`  FAILED ${row.slug}: ${upErr.message}`)
      process.exit(1)
    }
  }

  console.log(`\n${dryRun ? 'Would update' : 'Updated'} ${updates.length} machine row(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
