/**
 * Reformat all AP guide "Where to find" sections to numbered regional lists
 * (Lightning 10 Year Storm template). Skips guides already in target format.
 *
 * Usage: node scripts/patch-all-where-to-find-format.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

/** @type {Record<string, string>} */
const WHERE_BODIES = {
  'phoenix-link': `### Where to Find Phoenix Link

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
- Availability is excellent and it is actively being installed in new casinos.`,

  'buffalo-ascension': `### Where to Find Buffalo Ascension

**In Las Vegas / Physical Casinos:**
- Buffalo Ascension was one of the most popular Aristocrat games on the floor.
- It is widely placed across both Strip and locals casinos.
- You can find it at:
  - Bellagio
  - Aria
  - MGM Grand
  - Caesars Palace
  - Wynn / Encore
  - Venetian / Palazzo
  - Red Rock Casino
  - Many other properties

It is actively hunted by advantage players due to its strong combo potential and expanding reel mechanics.

**Online / Free Play:**
- Demo versions are available on several slot review sites.

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
- Buffalo Ascension was one of the most widely distributed Aristocrat games in the country but it is being replaced slowly in major markets.
- East Coast markets (Atlantic City and Pennsylvania) and Florida have the strongest placement outside of Las Vegas.`,

  'coin-kingdom-aztec': `### Where to Find Coin Kingdom Aztec

**In Las Vegas / Physical Casinos:**
- Coin Kingdom Aztec is a newer Ainsworth title that has been gaining traction since its release.
- You can find it at various casinos, though it is not as widespread as the main Coin Kingdom or bigger Aristocrat games.
- Current placements include:
  - Palms Casino
  - Aliante Casino
  - South Point
  - Several locals casinos and smaller Strip properties
- It is still being rolled out, so availability can vary by week.

**Online / Free Play:**
- Demo versions are available on some slot review sites, though they may not fully represent the real machine.

---

### Top cities / regions (outside Las Vegas)

1. Atlantic City, NJ - High - Strong presence at Borgata and Resorts
2. Pennsylvania - High - Popular at Parx and Rivers casinos
3. Florida - Medium-High - Found at Seminole Hard Rock and other tribal casinos
4. Oklahoma - Medium-High - Doing well at Cherokee Nation properties
5. Mississippi Gulf Coast - Medium - Available at several Biloxi casinos
6. Indiana - Medium - Growing placement at Horseshoe and Ameristar
7. New York metro - Medium - Limited but present at Resorts World

**Summary:**
- Coin Kingdom Aztec is performing well on the East Coast and in Florida tribal casinos.
- It has not reached the same level of distribution as Phoenix Link or Buffalo Link, but it is steadily expanding.
- Availability can vary significantly by casino and week.`,

  'ags-must-hit-by': `### Where to Find AGS Must Hit By

**In Las Vegas / Physical Casinos:**
- AGS must-hit-by titles (including Fire Wolf and River Dragons) can be found at:
  - MGM Grand
  - New York-New York
  - Luxor
  - Excalibur
  - Several locals casinos
- Fire Wolf is not as widespread as River Dragons.

---

### Top cities / regions (outside Las Vegas)

1. Atlantic City, NJ - High - Strong presence at Borgata, Resorts, and Golden Nugget
2. Pennsylvania - High - Heavy at Parx, Rivers, and Wind Creek
3. Florida - High - Very common at Seminole Hard Rock and Hollywood
4. Oklahoma - Medium-High - Popular at Cherokee Nation casinos
5. Mississippi Gulf Coast - Medium-High - Common at Biloxi casinos
6. Indiana - Medium - Growing at Horseshoe and Ameristar
7. New York metro - Medium - Available at Resorts World

**Summary:**
- River Dragons currently has stronger and wider distribution than Fire Wolf.
- Both games perform well on the East Coast (especially Atlantic City and Pennsylvania) and in Florida tribal casinos.
- AGS must-hit-by games like these are steadily expanding but still lag behind the top Ainsworth titles in overall availability.`,

  'lightning-10-year-storm': `### Where to Find Lightning 10 Year Storm

**In Las Vegas / Physical Casinos:**
- Lightning 10 Year Storm is currently one of the hottest Lightning Link games on the floor.
- It has seen very strong placement across both Strip and locals casinos.
- You can find it at:
  - Bellagio
  - Aria
  - MGM Grand
  - Caesars Palace
  - Wynn / Encore
  - Venetian
  - Red Rock Casino
  - Many other major properties

It is highly sought after by advantage players due to its high volatility and big jackpot potential.

**Online / Free Play:**
- Demo versions are available on several slot review sites.

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
- Lightning 10 Year Storm is one of the top performing Lightning Link games right now.
- East Coast markets (Atlantic City and Pennsylvania) and Florida have the strongest placement outside of Las Vegas.
- It is actively being rolled out and remains highly desirable for advantage players.`,
}

const SKINS_MARKER = '## 🎭 Skins'
const WHERE_RE =
  /## 📍 Where to find[\s\S]*?(?=\n## 🎭 Skins|\n---\n\n## 🎰 Gameplay|\n## 🎰 Gameplay|$)/

function patchWhereSection(md, whereBody) {
  const whereSection = `## 📍 Where to find\n\n${whereBody}\n\n`
  if (/## 📍 Where to find/i.test(md)) {
    return md.replace(WHERE_RE, whereSection.trimEnd() + '\n\n')
  }
  if (!md.includes(SKINS_MARKER)) {
    throw new Error('Expected Skins section marker not found — aborting')
  }
  return md.replace(SKINS_MARKER, whereSection + SKINS_MARKER)
}

loadSupabaseEnv('test')
const { url, key } = readSupabaseCredentials()
const sb = createClient(url, key, { auth: { persistSession: false } })

const slugs = Object.keys(WHERE_BODIES)
const { data: guides, error } = await sb
  .from('guides')
  .select('id, slug, content_markdown')
  .in('slug', slugs)

if (error) throw new Error(error.message)

const bySlug = new Map(guides.map((g) => [g.slug, g]))
const nowIso = new Date().toISOString()
const results = []

for (const slug of slugs) {
  const row = bySlug.get(slug)
  if (!row) {
    results.push({ slug, status: 'SKIP', reason: 'not found on test' })
    continue
  }
  if (!/## 📍 Where to find/i.test(row.content_markdown || '')) {
    results.push({ slug, status: 'SKIP', reason: 'no Where to find section' })
    continue
  }

  const md = patchWhereSection(row.content_markdown || '', WHERE_BODIES[slug])
  const { error: upErr } = await sb
    .from('guides')
    .update({ content_markdown: md, updated_at: nowIso })
    .eq('id', row.id)

  if (upErr) {
    results.push({ slug, status: 'FAIL', reason: upErr.message })
    continue
  }

  const hasNumbered = /\n1\. .+ - .+ - .+\n/.test(md)
  const hasTable = /\| Rank \| City \/ region \|/.test(
    (md.match(WHERE_RE) || [''])[0],
  )
  results.push({
    slug,
    status: 'OK',
    numbered: hasNumbered,
    tableRemoved: !hasTable,
  })
}

console.log('Where to find bulk format patch → test')
console.log('updated_at:', nowIso)
for (const r of results) console.log(r)
