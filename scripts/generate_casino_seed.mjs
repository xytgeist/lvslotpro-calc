// Regenerates supabase/casino_seed.sql from all regional CSV files.
// CSV columns: Casino Name, City, [State,] Country
// Handles both 3-column (no state) and 4-column (with state) formats.

import { readFileSync, writeFileSync } from 'fs'

function esc(s) {
  return (s || '').trim().replace(/'/g, "''")
}

function parseCSV(path, hasState) {
  const lines = readFileSync(path, 'utf8').split('\n').slice(1).filter(l => l.trim())
  const entries = []
  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim())
    if (hasState) {
      entries.push({ name: parts[0], city: parts[1], state: parts[2], country: parts[3] || '' })
    } else {
      entries.push({ name: parts[0], city: parts[1], state: '', country: parts[2] || '' })
    }
  }
  return entries
}

function dedupe(entries) {
  const seen = new Set()
  return entries.filter(e => {
    const key = e.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function toSQL(entries, label) {
  const values = entries.map(e => {
    const name    = esc(e.name)
    const city    = esc(e.city)
    const state   = esc(e.state)
    const country = esc(e.country)
    return `  ('${name}', 'seed', '${city}', '${state}', '${country}')`
  }).join(',\n')

  return `-- ${label}
insert into public.casinos (name, source, city, state, country)
values
${values}
on conflict (lower(name)) do nothing;`
}

const us  = dedupe(parseCSV('C:/Users/Ryan Franklin/Downloads/us_casinos.csv',   true))
const eu  = dedupe(parseCSV('C:/Users/Ryan Franklin/Downloads/eu_casinos.csv',   false))
const au  = dedupe(parseCSV('C:/Users/Ryan Franklin/Downloads/au_casinos.csv',   true))
const asia = dedupe(parseCSV('C:/Users/Ryan Franklin/Downloads/asia_casinos.csv', false))

const sql = `-- Casino seed data: US, European, Australian, Asian casinos
-- Delete old pre-existing entries (city_id was required before our schema change)
-- then insert curated seed list. Safe to re-run.
delete from public.casinos where city_id is not null;

${toSQL(us,   'US casinos')}

${toSQL(eu,   'European casinos')}

${toSQL(au,   'Australian casinos')}

${toSQL(asia, 'Asian casinos')}
`

writeFileSync('supabase/casino_seed.sql', sql)
console.log(`US: ${us.length} | EU: ${eu.length} | AU: ${au.length} | Asia: ${asia.length} | Total: ${us.length + eu.length + au.length + asia.length}`)
