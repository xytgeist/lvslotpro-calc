/**
 * Patch phoenix-link Where to find on test DB (form-first — no repo guide.md).
 * Prefer: node scripts/patch-all-where-to-find-format.mjs
 * Usage: node scripts/patch-phoenix-where-to-find.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

const SLUG = 'phoenix-link'

const WHERE_BODY = `### Where to Find Phoenix Link

**In Las Vegas / Physical Casinos:**
- Phoenix Link is currently one of the most popular and widely placed must-hit-by games in Las Vegas.
- You can find it at nearly every major casino on the Strip and in locals casinos, including:
  - Bellagio
  - Aria
  - MGM Grand
  - Caesars Palace
  - Wynn / Encore
  - Venetian / Palazzo
  - Red Rock Casino
  - Many other properties

It is one of the most hunted games by advantage players right now, and has usurped Buffalo Ascension as the most common AP game.

**Online / Free Play:**
- Demo versions are available on several slot review sites, though functionality is limited compared to the real machine.

---

### Top cities / regions (outside Las Vegas)

1. Atlantic City, NJ - Very High - Extremely common at Borgata, Resorts, and Golden Nugget
2. Pennsylvania - Very High - Heavy placement at Parx, Rivers, and Wind Creek
3. Florida - High - Strong at Seminole Hard Rock Tampa and Hollywood casinos
4. Oklahoma - High - Very popular at Cherokee Nation casinos
5. Mississippi Gulf Coast - High - Common at Biloxi and Gulfport properties
6. Indiana / Chicago area - Medium-High - Growing at Horseshoe and Ameristar
7. New York / Connecticut - Medium-High - Available at Resorts World and Mohegan Sun

**Summary:**
- Phoenix Link is currently one of the most widely distributed must-hit-by games in the country.
- East Coast markets (Atlantic City and Pennsylvania) and Florida have the strongest placement outside of Las Vegas.
- Availability is excellent and it is actively being installed in new casinos.`

const SKINS_MARKER = '## 🎭 Skins'
const WHERE_SECTION = `## 📍 Where to find\n\n${WHERE_BODY}\n\n`

loadSupabaseEnv('test')
const { url, key } = readSupabaseCredentials()
const sb = createClient(url, key, { auth: { persistSession: false } })

const { data, error } = await sb
  .from('guides')
  .select('id, slug, content_markdown')
  .eq('slug', SLUG)
  .maybeSingle()

if (error) throw new Error(error.message)
if (!data) throw new Error(`${SLUG} not found on test`)

let md = data.content_markdown || ''

const whereRe = /## 📍 Where to find[\s\S]*?(?=\n## 🎭 Skins|\n---\n\n## 🎰 Gameplay|\n## 🎰 Gameplay|$)/
if (/## 📍 Where to find/i.test(md)) {
  md = md.replace(whereRe, WHERE_SECTION.trimEnd() + '\n\n')
} else if (!md.includes(SKINS_MARKER)) {
  throw new Error('Expected Skins section marker not found — aborting')
} else {
  md = md.replace(SKINS_MARKER, WHERE_SECTION + SKINS_MARKER)
}

const nowIso = new Date().toISOString()
const { error: upErr } = await sb
  .from('guides')
  .update({ content_markdown: md, updated_at: nowIso })
  .eq('id', data.id)

if (upErr) throw new Error(upErr.message)

console.log(`OK ${SLUG} Where to find patched on test`)
console.log('updated_at:', nowIso)
