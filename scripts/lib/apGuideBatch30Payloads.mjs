/** Batch 30 synth payloads - final planned ingest batch. */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const BATCH30_PAYLOADS = [
  {
    machine: {
      slug: 'zodiac-lion-zodiac-dragon',
      name: 'Zodiac Lion / Zodiac Dragon',
      manufacturer: 'Konami',
      type: 'Gold Frame Wild Connect',
      difficulty: 'Advanced',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '4 horizontal gold frames · 3+ from R1-2 w/ 8+ clump',
      release_year: null,
    },
    guide: {
      title: 'Zodiac Lion / Zodiac Dragon',
      published: true,
      card_ev_threshold: '4 horizontal gold frames · 3+ from R1-2 w/ 8+ clump',
      when_to_play: `**Primary play:**

- **≥4 horizontally connected gold frames** spanning **R1–R4** or **R2–R5**
- **≥3 horizontal frames starting R1 or R2** when the clump has **≥8 connected** total

**Never play** R3–R5-only clumps with **no tie to R1–R2**. Need **4–5OAK** wild lines, not vertical stacks.

**Post Lion Spin Bonus:** leftover heads become frames next spin ... often worth a look.`,
      when_to_stop: `Stop after connected frames **wild out** and clear, or layout falls below scout tier.`,
      how_to_check: `Gold **frame map** and **cycle position** on the main screen. Cycle through all bets/denoms (top-row bets pay more but land heads less often).`,
      risk_bankroll: `**100 units**`,
      risk_summary: `High **frame count** without **left-side horizontal** coverage is the classic hustle mistake ... **3OAK** pays peanuts.`,
      risk_bullets: [],
      skins_markdown: `**Zodiac Lion**, **Zodiac Dragon**. [Zodiac Dragon Cash on Reels](guide:zodiac-dragon-zodiak-dragon-cash-on-reels) (cash-spread variant ... different AP).`,
      gameplay_mechanics: `**Zodiac Lion / Zodiac Dragon** (Konami) locks **gold frames**; a second **lion/dragon head** inside the clump wilds all connected frames for one spin.`,
    },
  },
  {
    machine: {
      slug: 'zorro-power-of-z',
      name: 'Zorro Power of Z',
      manufacturer: 'Light & Wonder',
      type: '10-Spin Golden Z Bell Cycle',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Bell rung · spin 9-10 tiers · 7+ golden Z',
      release_year: null,
    },
    guide: {
      title: 'Zorro Power of Z',
      published: true,
      card_ev_threshold: 'Bell rung · spin 9-10 tiers · 7+ golden Z',
      when_to_play: `**Goal:** ring **≥1 bell** while paying for as little of the **10-spin cycle** as possible.

**Primary play:**

- **Bell rung** (**5 golden Z** above a middle reel, bell swinging)
- **7+ golden Z** anywhere
- **4 golden Z** on one middle reel (not **center reel on spin 9/10**)
- **Spin 9/10:** **3+ Z** in first two middle reels (almost always play, even with no bell)
- **Spin 8/10:** **5+ Z** in first two middle reels

**Spin 10** awards **ruby credits** and **diamond jackpots/extra spins** on **activated** reels only.`,
      when_to_stop: `Stop after **spin 10** (and any re-spins) finish.`,
      how_to_check: `Golden **Z counts** above middle reels, **cycle spin #**, and **bell animation**. Cycle through all bets/denoms.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `Early-cycle bell hunts cost a **full 10-spin** investment ... **spin 9 abandoned** boards are the cheap +EV scouts.`,
      risk_bullets: [],
      skins_markdown: `**Daybreak Duel**, **Rose of Zorro**.`,
      gameplay_mechanics: `**Zorro Power of Z** (Light & Wonder) banks **golden Z** over **10 spins**; **5 Z** rings the bell and **activates** that middle reel on spin **10** for ruby/diamond awards.`,
    },
  },
  {
    machine: {
      slug: 'zorros-wild-ride',
      name: "Zorro's Wild Ride",
      manufacturer: 'Aristocrat',
      type: 'Wild Ride Expanded Reels',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Wild Ride Bonus active · flames + larger reels',
      release_year: null,
    },
    guide: {
      title: "Zorro's Wild Ride",
      published: true,
      card_ev_threshold: 'Wild Ride Bonus active · flames + larger reels',
      when_to_play: `**Primary play:**

- **Wild Ride Bonus active** ... **larger reel set** with **flame animation** behind the reels

**Zorro wilds / multipliers in R2–R4 persist** while the bonus runs. Play until the grid shrinks and flames disappear.`,
      when_to_stop: `Stop when reels **shrink back** and **flame animation** ends (no new wild/multiplier landed).`,
      how_to_check: `Expanded grid, **flame background**, and persistent **Zorro framed wilds** on middle reels. Cycle through all bets/denoms.`,
      risk_bankroll: `**30 units**`,
      risk_summary: `One whiff spin ends the bonus instantly ... but each scout is usually only **a few spins** of cost.`,
      risk_bullets: [],
      skins_markdown: `[Miss Kitty Wild Ride](guide:miss-kitty-wild-ride) (companion skin ... same Wild Ride AP).`,
      gameplay_mechanics: `**Zorro's Wild Ride** (Aristocrat) shares the **Wild Ride Bonus** with **Miss Kitty Wild Ride** ... persistent **R2–R4** wilds/multipliers while the expanded **flame** layout is live.`,
    },
  },
]
