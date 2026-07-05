/**
 * One-time geocode helper for loungeSportsVenues.ts seed rows.
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=your_key node scripts/geocode-sports-venues.mjs
 *
 * Edit VENUES_TO_GEOCODE below, run once, paste printed rows into
 * supabase/functions/_shared/loungeSportsVenues.ts
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_KEY = process.env.GOOGLE_MAPS_API_KEY
if (!API_KEY) {
  console.error('ERROR: Set GOOGLE_MAPS_API_KEY')
  process.exit(1)
}

/** sportIds: NBA=4, MLB=3, NFL=2, WNBA=8, NHL=6, NCAAF=1, NCAAB=5 */
const VENUES_TO_GEOCODE = [
  // Example — add rows you need, then run:
  // { sportIds: [1], keys: ['alabama crimson tide', 'alabama'], venueName: 'Bryant-Denny Stadium', query: 'Bryant-Denny Stadium, Tuscaloosa, AL', city: 'Tuscaloosa', tz: 'CT' },
]

const TZ_LNG_RANGES = [
  { tz: 'PT', min: -125, max: -115 },
  { tz: 'MT', min: -115, max: -104 },
  { tz: 'CT', min: -104, max: -85 },
  { tz: 'ET', min: -85, max: -66 },
]

function inferTz(lng, fallback = 'ET') {
  for (const row of TZ_LNG_RANGES) {
    if (lng >= row.min && lng < row.max) return row.tz
  }
  return fallback
}

async function geocode(query) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', query)
  url.searchParams.set('key', API_KEY)
  const res = await fetch(url)
  const data = await res.json()
  if (data.status !== 'OK' || !data.results?.[0]) {
    throw new Error(`${query}: ${data.status}`)
  }
  const { lat, lng } = data.results[0].geometry.location
  return { lat, lng }
}

function formatRow(v, lat, lng, tz) {
  const sportIds = `[${v.sportIds.join(', ')}]`
  const keys = v.keys.map((k) => `'${k.replace(/'/g, "\\'")}'`).join(', ')
  return `  { sportIds: ${sportIds}, keys: [${keys}], venueName: '${v.venueName.replace(/'/g, "\\'")}', city: '${v.city}', lat: ${lat.toFixed(3)}, lng: ${lng.toFixed(3)}, tz: '${tz}' },`
}

async function main() {
  if (!VENUES_TO_GEOCODE.length) {
    console.log('VENUES_TO_GEOCODE is empty — add entries in scripts/geocode-sports-venues.mjs')
    process.exit(0)
  }

  const lines = []
  for (const v of VENUES_TO_GEOCODE) {
    const { lat, lng } = await geocode(v.query)
    const tz = v.tz || inferTz(lng)
    lines.push(formatRow(v, lat, lng, tz))
    await new Promise((r) => setTimeout(r, 200))
  }

  const out = lines.join('\n')
  console.log('\n// Paste into loungeSportsVenues.ts SPORTS_VENUES:\n')
  console.log(out)
  fs.writeFileSync(path.join(__dirname, 'geocode-sports-venues-result.txt'), `${out}\n`, 'utf8')
  console.log('\nWrote scripts/geocode-sports-venues-result.txt')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
