/**
 * Print loungeSportsVenues.ts rows from scripts/lib/college-sports-venues-seed.mjs
 *
 *   node scripts/emit-college-venues-ts.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { COLLEGE_SPORTS_VENUES } from './lib/college-sports-venues-seed.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function esc(value) {
  return String(value).replace(/'/g, "\\'")
}

const lines = COLLEGE_SPORTS_VENUES.map((v) => {
  const ids = `[${v.sportIds.join(', ')}]`
  const keys = v.keys.map((k) => `'${esc(k)}'`).join(', ')
  return `  { sportIds: ${ids}, keys: [${keys}], venueName: '${esc(v.venueName)}', city: '${esc(v.city)}', lat: ${v.lat.toFixed(3)}, lng: ${v.lng.toFixed(3)}, tz: '${v.tz}' },`
})

const out = [
  '  // NCAAF (FBS)',
  ...lines.filter((_, i) => COLLEGE_SPORTS_VENUES[i].sportIds.includes(1)),
  '  // NCAAB (power + high-volume conferences)',
  ...lines.filter((_, i) => COLLEGE_SPORTS_VENUES[i].sportIds.includes(5)),
].join('\n')

console.log(out)
fs.writeFileSync(path.join(__dirname, 'college-sports-venues-ts.txt'), `${out}\n`, 'utf8')
console.error(`Wrote ${COLLEGE_SPORTS_VENUES.length} rows to scripts/college-sports-venues-ts.txt`)
