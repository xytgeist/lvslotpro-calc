/**
 * Patch ags-must-hit-by Gameplay Mechanics on test DB (form-first).
 * Usage: node scripts/patch-ags-mhb-gameplay-mechanics.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

const SLUG = 'ags-must-hit-by'

const GAMEPLAY_BODY = `Most AGS must-hit-by skins on the Orion family are the **same game in different costumes**... Fire Wolf, River Dragons, Forest Dragons, and the rest share the same reel engine, progressive package, and AP dynamics. Line pays and bonus frequency can look a little different skin to skin, but over a **long run** the **overall RTP** is what you are actually buying. Those small gaps in base hits and feature rate tend to **level out** once you are grinding meter edge instead of chasing a one-off bonus.

**Base game layout**

Typical setup is a **5-reel** video slot with a **variable-height middle** (often **3-4-4-4-3**, which gives you **576 ways** before any expansion). AGS uses **PowerXStream**, so qualifying wins can pay **left-to-right and right-to-left**... more hit frequency than a plain one-way game. Denoms and max bet vary by property; a lot of the Asian-themed banks lean into **8**-based bet ladders (prosperity thing on the glass), but always read what **your** machine allows.

### Special features

**Reel expansion (Reel Surge style):** Land bonus symbols on the middle reels and the center columns **stretch taller** (up to **8 high** on many titles). Ways jump hard... **576 to 4,608** is the reference most APs quote on River Dragons class math. Expanded reels stay up for a **random number of spins**, then drop back.

**Free spins:** Usually triggered when bonus symbols cover the **middle three reels**. Spin count scales with how many bonus symbols landed on each reel (think **8 free spins × per-reel multiplier**, capped around **128** on the big dragon skins). During free spins, reel expansion is often **always on**... that is where a lot of the volatility lives.

**Dual must-hit-by progressives:** Two linked mystery meters, each with its own **reset** and **must-hit-by ceiling**. Example bands on River Dragons class installs: lower **$500 reset / $800 cap**, higher **$1,000 reset / $2,000 cap** (verify every time... caps and rise move by casino). Either jackpot can award randomly on a qualifying base-game spin. That random trigger is the whole AP hook... and why you do **not** treat AGS like a flat uniform meter unless you have floor-specific data.`

const GAMEPLAY_SECTION = `## 🎰 Gameplay Mechanics\n\n${GAMEPLAY_BODY}\n`

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

const gameplayRe = /## 🎰 Gameplay Mechanics[\s\S]*$/
if (/## 🎰 Gameplay Mechanics/i.test(md)) {
  md = md.replace(gameplayRe, GAMEPLAY_SECTION.trimEnd() + '\n')
} else {
  throw new Error('Gameplay Mechanics section not found — aborting')
}

const nowIso = new Date().toISOString()
const { error: upErr } = await sb
  .from('guides')
  .update({ content_markdown: md, updated_at: nowIso })
  .eq('id', data.id)

if (upErr) throw new Error(upErr.message)

console.log(`OK ${SLUG} Gameplay Mechanics patched on test`)
console.log('updated_at:', nowIso)
console.log('chars:', GAMEPLAY_BODY.length)
