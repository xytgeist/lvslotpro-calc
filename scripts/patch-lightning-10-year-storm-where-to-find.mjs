/**
 * Patch lightning-10-year-storm Where to find on test DB (form-first — no repo guide.md).
 * Usage: node scripts/patch-lightning-10-year-storm-where-to-find.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

const SLUG = 'lightning-10-year-storm'

const WHERE_BODY = `### In Las Vegas / physical casinos

Lightning 10 Year Storm is currently one of the hottest Lightning Link games on the floor.

It has seen very strong placement across both Strip and locals casinos.

You can find it at:

- Bellagio
- Aria
- MGM Grand
- Caesars Palace
- Wynn / Encore
- Venetian
- Red Rock Casino
- Many other major properties

It is highly sought after by advantage players due to its high volatility and big jackpot potential.

### Online / free play

Demo versions are available on several slot review sites.

### Top cities / regions (outside Las Vegas)

| Rank | City / region | Popularity level | Notes |
| --- | --- | --- | --- |
| 1 | Atlantic City, NJ | Very High | Extremely common at Borgata, Resorts, and Golden Nugget |
| 2 | Pennsylvania | Very High | Heavy placement at Parx, Rivers, and Wind Creek |
| 3 | Florida | High | Strong at Seminole Hard Rock Tampa and Hollywood casinos |
| 4 | Oklahoma | High | Very popular at Cherokee Nation casinos |
| 5 | Mississippi Gulf Coast | High | Common at Biloxi and Gulfport properties |
| 6 | Indiana / Chicago area | Medium-High | Growing at Horseshoe and Ameristar |
| 7 | New York / Connecticut | Medium-High | Available at Resorts World and Mohegan Sun |

**Summary:** Lightning 10 Year Storm is one of the top performing Lightning Link games right now. East Coast markets (Atlantic City and Pennsylvania) and Florida have the strongest placement outside of Las Vegas. It is actively being rolled out and remains highly desirable for advantage players.`

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
console.log('Has section:', /## 📍 Where to find/i.test(md))
