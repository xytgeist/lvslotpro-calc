/**
 * Patch ags-must-hit-by AP sections (When to play / stop / check / Risk).
 * Merges with existing section copy — does not replace non-empty bodies.
 * Usage: node scripts/patch-ags-mhb-ap-sections.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

const SLUG = 'ags-must-hit-by'

const WHEN_TO_PLAY = `**Use the Must Hit By calculator** on this card (**AGS** preset, **midpoint off**). AGS meters are weighted **near the cap**... not the flat random draw you get on Ainsworth. Uniform math will lie to you.

**Rough +EV entry (86% RTP baseline):**
- **$500 MHB:** around **$483** (calculator)
- **$5,000 MHB:** around **$4,912** (calculator)

Bump take points if RTP is lower on your bank, or if taxes eat a chunk of the **$5,000** hit.

**Real-world floor behavior:**
- Competitive APs often jump around **$480** / **$4,900** ... sometimes earlier just to block the play or farm card points, not because the math is clean.
- A **realistic** hit window usually starts near **$490** / **$4,990**. Can it pop early? Sure. **Plan like it won't.**

Only play when **estimated jackpot value > cost to finish the grind** (coin-in to reach the likely hit band + base-game **bleed**). Rule of thumb: budget about **20% of total bets** as bleed while you are pumping coin-in.

**Bet discipline:** spin the **lowest qualifying bet** that fits your time budget. Min bet smooths variance and keeps you out of handpay hell.`

const WHEN_TO_STOP = `**Assume both meters run to the top.** APs call these **must-go-to** for a reason. Do not start a session betting on an early miracle.

**Stop or skip the play when:**
- Your bankroll cannot survive a **full run to cap** (see Risk).
- You took the play **early** hoping to get lucky ... that is gambling, not AP.
- **$5,000 chase:** taxes mean your net is lower ... wait for a higher meter before you commit.
- The machine is drawing **ploppy heat** near the cap and you are losing timing or control.

**After a hit:** re-read both meters and the glass ... reset values change what the next chase looks like.`

const HOW_TO_CHECK = `1. **Confirm you have MHB progressives.** Some skins ship **Xtreme Jackpots** variants (**Wolf Queen**, **Winter of the Dragons**, etc.) with **no** must-hit-by meters.
2. **Read both tiers** on the glass: typically **$500** and **$5,000** on the dragon/wolf family.
3. **Note the resets:** **$500** band often resets around **$200**; **$5,000** band resets **$2,000** or **$4,000** depending on install.
4. **Meter rise test:** a few spins at your intended bet ... most **$500** class AGS meters move **$0.01 per ~$2.50 coin-in** (verify on **your** machine).
5. **RTP / PAR:** River Dragons class can run **~86% to ~95%** ... enter what you can confirm into the calculator.
6. **Open Must Hit By → AGS** with current meter, cap, rise, reset, RTP ... **midpoint disabled.**`

const RISK = `**Bankroll (conservative):** plan for **~5× the jackpot** you are chasing (**~$2,500** on the **$500**, **~$25,000** on the **$5,000**). Sounds insane until you whiff a bad run and brick without ever seeing the hit. Tighter bankroll may work if you are **only** playing at true take points with **min bet** ... but extra cash beats going broke on the floor.

**The AGS weighting trap:** these are **not** Ainsworth. **Do not** use the **midpoint** flag. Hits cluster at the **top** of the band. Regular players sitting at **$470** or **$4,850** thinking they found a deal ... those sessions end ugly.

**Variance & bet size:** max betting a **$500 MHB** can drop **thousands** on a bad stretch. Higher bet = more gambling, more **handpays**, more **W-2Gs**, more waiting on attendants. **Min bet** unless time forces your hand.

**Time sink (if it runs to cap, very rough):**
- **$500** from ~**$486** at **$0.88/spin:** ~**2 hours**
- **$5,000** from ~**$4,920** at **$0.88/spin:** ~**16 hours**

Scale down with higher bets ... still a long sit.

**Unconfirmed rumor:** some APs say **Forest Dragons** may **not** be as top-heavy as the rest. I would **not** play off that until you have floor data ... stick to standard AGS take points.

**Use your player's card** on long **$5,000** chases ... you are putting massive coin-in in.

**Open the calculator** from this card before you commit real money.`

/** @type {{ header: string, body: string, nextHeader: string }[]} */
const SECTION_PATCHES = [
  {
    header: '## 🟢 When to play',
    body: WHEN_TO_PLAY,
    nextHeader: '## 🛑 When to stop',
  },
  {
    header: '## 🛑 When to stop',
    body: WHEN_TO_STOP,
    nextHeader: '## 🔍 How to check',
  },
  {
    header: '## 🔍 How to check (quick/easy)',
    body: HOW_TO_CHECK,
    nextHeader: '## ⚠️ Risk & Warnings',
  },
  {
    header: '## ⚠️ Risk & Warnings',
    body: RISK,
    nextHeader: '## 📍 Where to find',
  },
]

function mergeSection(md, header, nextHeader, body) {
  const start = md.indexOf(header)
  if (start < 0) throw new Error(`Missing section: ${header}`)

  const contentStart = start + header.length
  const nextIdx = md.indexOf(nextHeader, contentStart)
  if (nextIdx < 0) throw new Error(`Missing next section after: ${header}`)

  const existing = md.slice(contentStart, nextIdx).trim()
  const merged = existing ? `${existing}\n\n${body}` : `\n\n${body}\n\n`

  return md.slice(0, contentStart) + merged + md.slice(nextIdx)
}

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
for (const patch of SECTION_PATCHES) {
  md = mergeSection(md, patch.header, patch.nextHeader, patch.body)
}

const nowIso = new Date().toISOString()
const { error: upErr } = await sb
  .from('guides')
  .update({ content_markdown: md, updated_at: nowIso })
  .eq('id', data.id)

if (upErr) throw new Error(upErr.message)

console.log(`OK ${SLUG} AP sections patched on test (merge mode)`)
console.log('updated_at:', nowIso)
for (const patch of SECTION_PATCHES) {
  const i = md.indexOf(patch.header)
  const j = md.indexOf(patch.nextHeader, i)
  const len = md.slice(i, j).trim().length
  console.log(`${patch.header}: ${len} chars`)
}
