import { readFileSync, writeFileSync } from 'fs'

const csv = readFileSync('C:/Users/Ryan Franklin/Downloads/us_casinos.csv', 'utf8')
const lines = csv.split('\n').slice(1).filter(l => l.trim())

const values = lines.map(line => {
  const name = line.split(',')[0].trim().replace(/'/g, "''")
  return `  ('${name}', 'seed')`
}).join(',\n')

const sql = `-- Seed US casino names from curated list
-- Safe to re-run (ON CONFLICT DO NOTHING)

insert into public.casinos (name, source)
values
${values}
on conflict (lower(name)) do nothing;
`

writeFileSync('C:/Users/Ryan Franklin/OneDrive/Documents/LVSlotPro/supabase/casino_seed.sql', sql)
console.log(`Generated ${lines.length} casino entries → supabase/casino_seed.sql`)
