/**
 * One-time geocode helper for loungeSportsVenues.ts seed rows.
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=your_key node scripts/geocode-sports-venues.mjs
 *
 * Sources:
 *   - scripts/lib/college-sports-venues-seed.mjs (NCAAF)
 *   - scripts/lib/ncaab-venues-seed.mjs (NCAAB)
 *
 * Rows with lat/lng already set are printed as-is; missing coords are geocoded.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { COLLEGE_SPORTS_VENUES } from './lib/college-sports-venues-seed.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_KEY = process.env.GOOGLE_MAPS_API_KEY

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

function esc(value) {
  return String(value).replace(/'/g, "\\'")
}

function formatRow(v, lat, lng, tz) {
  const sportIds = `[${v.sportIds.join(', ')}]`
  const keys = v.keys.map((k) => `'${esc(k)}'`).join(', ')
  return `  { sportIds: ${sportIds}, keys: [${keys}], venueName: '${esc(v.venueName)}', city: '${esc(v.city)}', lat: ${lat.toFixed(3)}, lng: ${lng.toFixed(3)}, tz: '${tz}' },`
}

async function geocode(query) {
  if (!API_KEY) throw new Error('GOOGLE_MAPS_API_KEY required for geocode refresh')
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

async function resolveCoords(v) {
  if (Number.isFinite(v.lat) && Number.isFinite(v.lng)) {
    return { lat: v.lat, lng: v.lng, tz: v.tz || inferTz(v.lng) }
  }
  const query = v.query || `${v.venueName}, ${v.city}`
  const { lat, lng } = await geocode(query)
  return { lat, lng, tz: v.tz || inferTz(lng) }
}

async function main() {
  const venues = [...COLLEGE_SPORTS_VENUES]
  const lines = []

  for (const v of venues) {
    const { lat, lng, tz } = await resolveCoords(v)
    lines.push(formatRow(v, lat, lng, tz))
    if (!Number.isFinite(v.lat)) await new Promise((r) => setTimeout(r, 200))
  }

  const out = lines.join('\n')
  console.log('\n// Paste into loungeSportsVenues.ts SPORTS_VENUES:\n')
  console.log(out)
  fs.writeFileSync(path.join(__dirname, 'geocode-sports-venues-result.txt'), `${out}\n`, 'utf8')
  console.log(`\nWrote ${lines.length} rows to scripts/geocode-sports-venues-result.txt`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
