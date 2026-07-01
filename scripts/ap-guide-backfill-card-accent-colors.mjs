/**
 * Backfill guides.card_accent_color from existing hero thumbnails.
 * SAFE: only updates rows where card_accent_color IS NULL (never overwrites).
 *
 * Usage:
 *   node scripts/ap-guide-backfill-card-accent-colors.mjs --target=test
 *   node scripts/ap-guide-backfill-card-accent-colors.mjs --target=test --dry-run
 *   node scripts/ap-guide-backfill-card-accent-colors.mjs --target=test --slug=phoenix-link
 *   node scripts/ap-guide-backfill-card-accent-colors.mjs --target=test --refresh
 *     Re-sample heroes and overwrite existing card_accent_color (palette-snapped vivid accents).
 *
 * Requires migration 20260610240000_guides_card_accent_color.sql applied first.
 */
import { createClient } from '@supabase/supabase-js'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'
import { extractAccentFromImageBuffer } from './lib/extractGuideAccentFromImage.mjs'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const targetArg = args.find((a) => a.startsWith('--target='))
const slugArg = args.find((a) => a.startsWith('--slug='))
const target = targetArg?.split('=')[1] || 'test'
const slugFilter = slugArg?.split('=')[1]?.trim() || null
const includeLegacyPilots = args.includes('--include-legacy-pilots')
const refresh = args.includes('--refresh')

/** Hand-tuned slug accents in UI — skip backfill unless --include-legacy-pilots */
const LEGACY_PILOT_SLUGS = new Set([
  'phoenix-link',
  'legend-of-the-phoenix',
  'stack-up-pays',
  'lightning-buffalo-link',
  'ainsworth-must-hit-by',
  'must-hit-by-aig',
  'ags-must-hit-by',
  'must-hit-by-ags',
  'igt-must-hit-by',
  'must-hit-by-igt',
  'aladdins-fortune',
  'aztec-banner',
  'pegasus-banner',
])

loadSupabaseEnv(target)
const { url, key } = readSupabaseCredentials()
if (!url || !key) {
  console.error('Missing Supabase credentials.')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

/** @param {string} thumbUrl */
async function fetchHeroBuffer(thumbUrl) {
  const res = await fetch(thumbUrl, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  console.log(`\nap-guide-backfill-card-accent-colors  target=${target}${dryRun ? '  DRY-RUN' : ''}${refresh ? '  REFRESH' : ''}${slugFilter ? `  slug=${slugFilter}` : ''}\n`)

  let query = supabase
    .from('guides')
    .select('id, slug, thumbnail_url, card_accent_color, machines(thumbnail_url)')
    .order('slug')

  if (!refresh) query = query.is('card_accent_color', null)

  if (slugFilter) query = query.eq('slug', slugFilter)

  const { data: guides, error } = await query
  if (error) {
    if (error.message?.includes('card_accent_color')) {
      console.error('Column guides.card_accent_color missing. Apply supabase/migrations/20260610240000_guides_card_accent_color.sql first.')
    } else {
      console.error(error.message)
    }
    process.exit(1)
  }

  const candidates = (guides || []).filter((g) => {
    if (!includeLegacyPilots && LEGACY_PILOT_SLUGS.has(g.slug)) return false
    const m = Array.isArray(g.machines) ? g.machines[0] : g.machines
    const thumb = g.thumbnail_url || m?.thumbnail_url
    return typeof thumb === 'string' && thumb.trim().length > 0
  })

  console.log(`Found ${candidates.length} guides with hero${refresh ? '' : ' + null accent'} (of ${guides?.length ?? 0} rows)\n`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const g of candidates) {
    const m = Array.isArray(g.machines) ? g.machines[0] : g.machines
    const thumb = String(g.thumbnail_url || m?.thumbnail_url).trim()
    process.stdout.write(`  ${g.slug} … `)

    try {
      const buf = await fetchHeroBuffer(thumb)
      const hex = await extractAccentFromImageBuffer(buf)
      if (!hex) {
        console.log('skip (no saturated sample)')
        skipped++
        continue
      }
      if (dryRun) {
        console.log(`[dry-run] ${hex}`)
        updated++
        continue
      }
      let updateQuery = supabase.from('guides').update({ card_accent_color: hex }).eq('id', g.id)
      if (!refresh) updateQuery = updateQuery.is('card_accent_color', null)
      const { error: uErr } = await updateQuery
      if (uErr) throw new Error(uErr.message)
      console.log(hex)
      updated++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`✗ ${msg}`)
      failed++
    }
  }

  console.log(`\nDone: ${updated} ${dryRun ? 'would update' : 'updated'}, ${skipped} skipped, ${failed} failed`)
  if (failed) process.exit(1)
}

main()
