/**
 * Replace NCAAF + NCAAB block in loungeSportsVenues.ts from seed files.
 *
 *   node scripts/sync-college-venues-to-ts.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { NCAAF_VENUES } from './lib/college-sports-venues-seed.mjs'
import { NCAAB_VENUES } from './lib/ncaab-venues-seed.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const venuesPath = path.join(__dirname, '../supabase/functions/_shared/loungeSportsVenues.ts')

function esc(value) {
  return String(value).replace(/'/g, "\\'")
}

function formatRow(v) {
  const ids = `[${v.sportIds.join(', ')}]`
  const keys = v.keys.map((k) => `'${esc(k)}'`).join(', ')
  return `  { sportIds: ${ids}, keys: [${keys}], venueName: '${esc(v.venueName)}', city: '${esc(v.city)}', lat: ${v.lat.toFixed(3)}, lng: ${v.lng.toFixed(3)}, tz: '${v.tz}' },`
}

const collegeBlock = [
  '  // NCAAF (FBS)',
  ...NCAAF_VENUES.map(formatRow),
  '  // NCAAB (power + high-volume conferences)',
  ...NCAAB_VENUES.map(formatRow),
].join('\n')

let ts = fs.readFileSync(venuesPath, 'utf8')
const start = ts.indexOf('  // NCAAF (FBS)')
const end = ts.indexOf('\n]', start)
if (start < 0 || end < 0) {
  console.error('Could not find college block in loungeSportsVenues.ts')
  process.exit(1)
}

ts = `${ts.slice(0, start)}${collegeBlock}${ts.slice(end)}`
fs.writeFileSync(venuesPath, ts, 'utf8')
console.log(`Synced ${NCAAF_VENUES.length} NCAAF + ${NCAAB_VENUES.length} NCAAB rows into loungeSportsVenues.ts`)
