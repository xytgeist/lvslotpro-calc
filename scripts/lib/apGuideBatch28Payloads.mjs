/** Batch 28 synth payloads - skips in _batch-progress.json (wolf-peak, wish-mistress, wo-shu-sky-spin). */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const BATCH28_PAYLOADS = [
  {
    machine: {
      slug: 'wild-pile-up-cutie-kitty-tiger-lee',
      name: 'Wild Pile-Up: Cutie Kitty / Tiger Lee',
      manufacturer: 'IGT',
      type: 'Diamond Collection Wild Slide',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '4 diamonds R1-4 · major 1-away scout',
      release_year: null,
    },
    guide: {
      title: 'Wild Pile-Up: Cutie Kitty / Tiger Lee',
      published: true,
      card_ev_threshold: '4 diamonds above R1-4 · major 1-away · mini+ prize combos',
      when_to_play: `**Primary play:**

- **First four reels** each have **4 diamonds** collected above
- **First three reels** at **4 diamonds** if **R1 or R2** shows a **large credit prize** (≥ mini jackpot)
- **Any four reels** at **4 diamonds** if any shows **large credit prize**
- **Any three reels** at **4 diamonds** if **two** show **large credit prizes**
- **Major jackpot one diamond away** (earlier with strong diamond spread elsewhere)

**Not** Hexbreak3r middle-reel math ... **R3 alone is never worth a direct chase**.`,
      when_to_stop: `Stop after the **reel prize / major** you chased awards or diamonds drop below scout tier.`,
      how_to_check: `Diamond counts above each reel and credit prizes on the glass. Cycle through all bets/denoms.`,
      risk_bankroll: `**200 units**`,
      risk_summary: `Chasing **R5 / middle reel** like **[Hexbreak3r](guide:hexbreak3r)** is a common mistake ... value lives **R1–R3** wild slides.`,
      risk_bullets: [],
      skins_markdown: `**Cutie Kitty**, **Tiger Lee** (cups/firecrackers reskin ... same AP).`,
      gameplay_mechanics: `**Wild Pile-Up** (IGT Hexbreak family) banks **5 diamonds** per reel for prizes; **bomb** symbols slide collected diamonds down as **wilds** without clearing the stack.`,
    },
  },
  {
    machine: {
      slug: 'wild-pirates-guardians-of-egypt',
      name: 'Wild Pirates / Guardians of Egypt',
      manufacturer: 'Unknown',
      type: 'Connected Bomb Detonators',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '3 bombs L-R R1-4 · 6 connected R1-3',
      release_year: null,
    },
    guide: {
      title: 'Wild Pirates / Guardians of Egypt',
      published: true,
      card_ev_threshold: '3 bombs L-R R1-4 · 6 connected R1-3 incl diagonal',
      when_to_play: `**Primary play:**

- **Three bombs connected left-to-right** in **R1–R4**
- **Six bombs connected** (including **diagonal**) anywhere in **R1–R3**

Scout for **4–5 reel line hits** when detonators sync. Unconnected bombs with timers landing same spin can still chain.`,
      when_to_stop: `Stop after the **bomb wild blast** you chased pays or the chain falls apart.`,
      how_to_check: `Bomb positions, **detonator countdowns** (2–4 spins), and connected clusters on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `**Three-line hits** from bombs stuck in **R1–R2 only** rarely pay enough ... you need **4–5 reel** coverage.`,
      risk_bullets: [],
      skins_markdown: `**Wild Pirates**, **Guardians of Egypt** (blue orbs ... identical AP).`,
      gameplay_mechanics: `**Wild Pirates / Guardians of Egypt** locks **bomb sub-symbols**; **detonators** explode connected bombs **H/V/diagonal** into wilds for line hits.`,
    },
  },
  {
    machine: {
      slug: 'winning-wings-butterflies-fairies',
      name: 'Winning Wings: Butterflies / Fairies',
      manufacturer: 'Gaming Arts',
      type: 'Descending Wing Credit Prizes',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: '3 wing prizes · 2 top row · 20x+ single',
      release_year: null,
    },
    guide: {
      title: 'Winning Wings: Butterflies / Fairies',
      published: true,
      card_ev_threshold: '3 wing prizes · 2 top row · 20x+ top row · minor/major wings',
      when_to_play: `**Never play** with **5+ wing prizes** on screen (bonus just fired ... all clear next spin). **Ignore bottom-row wings** (fall off next spin).

**Primary play:**

- **Three wing credit prizes** (not counting bottom row)
- **Two wing prizes on the top row**
- **Any two wings totaling ≥10× bet**
- **One top-row wing ≥20× bet**
- **Any wing showing minor or major jackpot**`,
      when_to_stop: `Stop after the **wing bonus** you triggered pays or prizes drop below tier.`,
      how_to_check: `Winged credit prizes shift **down one row per spin**. Use bet-menu arrows to scout without ticket. Cycle through all bets/denoms.`,
      risk_bankroll: `**30 units**`,
      risk_summary: `Most scouts lose a few spins ... edge is hitting the **5-prize bonus**, not base-game lines.`,
      risk_bullets: [],
      skins_markdown: `**Butterflies**, **Fairies**.`,
      gameplay_mechanics: `**Winning Wings** (Gaming Arts) drops **wing credit prizes** one row per spin; **5+** on grid triggers a traditional **hold-and-spin style** bonus (mini/minor/major/mega possible).`,
    },
  },
  {
    machine: {
      slug: 'wizard-of-oz-follow-the-yellow-brick-road',
      name: 'Wizard of Oz: Follow the Yellow Brick Road',
      manufacturer: 'WMS',
      type: 'Uncapped Progressive Free Games Meters',
      difficulty: 'Advanced',
      popularity: 'Common',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Very High',
      popularity_summary: 'Silver 22+ · Gold 35+ · Emerald never',
      release_year: null,
    },
    guide: {
      title: 'Wizard of Oz: Follow the Yellow Brick Road',
      published: true,
      card_ev_threshold: 'Silver 22+ · Gold 35+ · Emerald never',
      when_to_play: `**Primary play (uncapped meters ... not must-hit-by):**

- **Silver meter 22+**
- **Gold meter 35+**
- **Emerald: never**

**Red shoes** on **R5** bumps a random meter. Meters cap at **50** but can hit anytime below cap.`,
      when_to_stop: `Stop after the **silver/gold progressive** you chased awards or set a hard loss budget and walk.`,
      how_to_check: `Silver / gold / emerald **free-games meters** on the bet pad. Cycle through all bets/denoms.`,
      risk_bankroll: `**500 units**`,
      risk_summary: `Uncapped meters **feel** closer every spin you feed them ... that is variance, not a forced hit.`,
      risk_bullets: [],
      skins_markdown: `**Wizard of Oz: Follow the Yellow Brick Road**.`,
      gameplay_mechanics: `**Wizard of Oz: Follow the Yellow Brick Road** (WMS) runs three **uncapped progressive free-games meters** fed by **red shoes** on **R5**. Extremely volatile.`,
    },
  },
  {
    machine: {
      slug: 'wizard-of-oz-over-the-rainbow',
      name: 'Wizard of Oz: Over the Rainbow',
      manufacturer: 'WMS',
      type: 'Balloon Line-Hit Must-Hit-By',
      difficulty: 'Intermediate',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: '1c $78+ · 2c/5c $156+ · 10c $312+',
      release_year: null,
    },
    guide: {
      title: 'Wizard of Oz: Over the Rainbow',
      published: true,
      card_ev_threshold: '1c $78+ · 2c/5c $156+ · 10c $312+ MHB',
      when_to_play: `**Primary play (per denom MHB on balloon):**

- **1¢ denom (MHB $100): $78+**
- **2¢ denom (MHB $200): $156+**
- **5¢ denom (MHB $200): $156+**
- **10¢ denom (MHB $400): $312+**

MHB climbs only on **balloon line hits**, not every spin. Play **lowest bet** on your denom.`,
      when_to_stop: `Stop after the **MHB tier** you chased hits.`,
      how_to_check: `MHB value on the **balloon** and bet pad per denomination. Cycle through all bets/denoms.`,
      risk_bankroll: `**200 units**`,
      risk_summary: `**Max bet** on a **$100 MHB** band is a variance trap ... min bet smooths the climb.`,
      risk_bullets: [],
      skins_markdown: `**Wizard of Oz: Over the Rainbow**.`,
      gameplay_mechanics: `**Wizard of Oz: Over the Rainbow** (WMS) runs separate **must-hit-by** balloon progressives per denom (**$25–$100**, **$50–$200**, **$100–$400** bands). Fair random hit between reset and cap.`,
    },
  },
  {
    machine: {
      slug: 'wizard-riches',
      name: 'Wizard Riches',
      manufacturer: 'WMS',
      type: 'Multi-Mode Bookcase / Delayed Wilds',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Delayed wilds · countdown jackpots · bookcase multipliers',
      release_year: null,
    },
    guide: {
      title: 'Wizard Riches',
      published: true,
      card_ev_threshold: 'Delayed wilds · 2+ countdown jackpots · bookcase 6x+ · future 4x+',
      when_to_play: `**Delayed wilds** (purple border, wild next spin, not R1):

- **2 connected L-R** anywhere **R1–R4**
- **3 anywhere R1–R3**
- **4 anywhere R1–R4**

**Countdown jackpots** (top icons with yellow timer ticks):

- **Any two** jackpot icons on **adjacent reels** or **one reel gap**

**Past mystery multipliers** (left bookcase):

- Any last-five win **≥6× bet** (top shelf **≥4×**; bottom shelves need **≥8×**)

**Future mystery multipliers** (right bookcase):

- **≥4×** multiplier with **≥1 empty shelf** inside purple border
- **Never** if **Next Win** already has a purple-highlighted shelf`,
      when_to_stop: `Stop after the **delayed wild / jackpot / multiplier** chase you took resolves.`,
      how_to_check: `Purple delayed-wild borders, top **jackpot countdown icons**, and **left/right bookcases**. Tap left bookcase to illuminate last wins. Cycle through all bets/denoms.`,
      risk_bankroll: `**150 units**`,
      risk_summary: `Right-side **Next Win** multipliers vanish when purple shelves fill ... scout the empty shelf count, not just the multiplier number.`,
      risk_bullets: [],
      skins_markdown: `**Wizard Riches**.`,
      gameplay_mechanics: `**Wizard Riches** (WMS) stacks four parallel AP modes: **one-spin delayed wilds**, **countdown jackpot icons**, and **past/future bookcase mystery multipliers** (**2×–10×**). No separate bonus round.`,
    },
  },
  {
    machine: {
      slug: 'wizard-strike',
      name: 'Wizard Strike',
      manufacturer: 'Konami',
      type: 'Dual Fair Must-Hit-By',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Major 670+ · Minor 175+ @ 85% RTP',
      release_year: null,
    },
    guide: {
      title: 'Wizard Strike',
      published: true,
      card_ev_threshold: 'Major 670+ · Minor 175+ · combo Major 662+ if Minor 150+',
      when_to_play: `**Primary play (@ ~85% RTP breakeven):**

- **Major MHB ($300–$700 band): $669.57+** (round **$670+**)
- **Minor MHB ($50–$200 band): $175+**
- **Major at $661.95+** when **Minor already $150+** (minor likely hits during major chase)

Fair **uniform** hit between reset and cap ... use **minimum bet** on your time budget.`,
      when_to_stop: `Stop after the **MHB tier** you chased hits.`,
      how_to_check: `Major and minor **MHB values** on the glass. Cycle through all bets/denoms.`,
      risk_bankroll: `**500 units**`,
      risk_summary: `Hits after the **midpoint** of the band usually lose money ... fair MHB still hurts on a bad run.`,
      risk_bullets: [],
      skins_markdown: `**Wizard Strike**.`,
      gameplay_mechanics: `**Wizard Strike** (Konami) runs fair **major** (**$300–$700**) and **minor** (**$50–$200**) must-hit-by SAP tiers on one cabinet.`,
    },
  },
]
