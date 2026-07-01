/** Batch 29 synth payloads - skips in _batch-progress.json (wolf-run-eclipse + stubs/merged). */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const BATCH29_PAYLOADS = [
  {
    machine: {
      slug: 'wolf-ridge',
      name: 'Wolf Ridge',
      manufacturer: 'IGT',
      type: 'Prize Disk Wolf Collect',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Prize disk R2/R4 · blue or 50x+ green',
      release_year: null,
    },
    guide: {
      title: 'Wolf Ridge',
      published: true,
      card_ev_threshold: 'Prize disk R2/R4 · blue or 50x+ green · 1-2 spin scout',
      when_to_play: `**Primary play (Prize Disk shifts left each spin; wolf on R1/R3/R5 awards prize above):**

- **Free games, blue credits, or green credits >50× bet** in **R2 or R4** ... **one spin**
- Same prizes in **both R3 and R5** ... up to **two spins**
- **Green credit in R4** (one spin) or **blue credit in R5** (two spins until Alpha)

**Alpha (R3) prizes pay 3×.** Ignore prizes above **R1** (shift off next spin).`,
      when_to_stop: `Stop after your **1–2 spin** scout window or when the prize disk no longer qualifies.`,
      how_to_check: `Read the **Prize Disk** positions above R2–R5. Cycle through all bets/denoms.`,
      risk_bankroll: `**30 units**`,
      risk_summary: `The **wolf collect symbol** misses most of the time ... expect many **1–2 spin** losses between hits.`,
      risk_bullets: [],
      skins_markdown: `**Wolf Ridge**.`,
      gameplay_mechanics: `**Wolf Ridge** (IGT) rotates a **Prize Disk** of credits and bonuses; **wolf symbols** on bordered reels **R1/R3/R5** collect the prize above, with **3×** on the center **Alpha** reel.`,
    },
  },
  {
    machine: {
      slug: 'wonder-4-collection',
      name: 'Wonder 4 Collection',
      manufacturer: 'Aristocrat',
      type: 'Quad-Window Progressive Free Games Meters',
      difficulty: 'Advanced',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Very High',
      popularity_summary: 'Blue/red meters by game · run same title x4',
      release_year: null,
    },
    guide: {
      title: 'Wonder 4 Collection',
      published: true,
      card_ev_threshold: 'Blue/red meters at game-specific floors (see body)',
      when_to_play: `**Run the same game in all four windows** (pick the best meter pair).

**Wild Panther / Pompeii:** **Blue 50+** · **Red 40+**
**Buffalo:** **Blue 48+** · **Red 38+**
**Fire Light:** **Blue 45+** · **Red 35+**

**Blue Super Free Games** = four windows at once ... long chase. **Red** hits faster but often whiffs.`,
      when_to_stop: `Stop after the **blue or red progressive** you chased awards.`,
      how_to_check: `Blue and red **free-games meters** on the bet pad (ticket in to cycle bets). Cycle through all bets/denoms.`,
      risk_bankroll: `**1000 units**`,
      risk_summary: `**Blue meter** hunts can run **hours** ... do not start without time and bankroll for a full grind.`,
      risk_bullets: [],
      skins_markdown: `**Buffalo**, **Wild Panther**, **Pompeii**, **Fire Light** (quad-window collection).`,
      gameplay_mechanics: `**Wonder 4 Collection** (Aristocrat) runs **four simultaneous** games; **R5 jewel** symbols feed **blue (Super)** or **red** uncapped **free-games meters** (cap **99**).`,
    },
  },
  {
    machine: {
      slug: 'wu-jin-pen-fuyu-phoenix-panda',
      name: 'Wu Jin Pen: Fuyu Phoenix / Panda / Parade',
      manufacturer: 'Light & Wonder',
      type: 'Bowl Spin Counter Hold-and-Spin',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Very High',
      popularity_summary: 'Bowl spin counter 12+ · RTP-tier breakeven',
      release_year: null,
    },
    guide: {
      title: 'Wu Jin Pen: Fuyu Phoenix / Panda / Parade',
      published: true,
      card_ev_threshold: 'Bowl spin counter 12+ · 10+ @ 95%+ RTP',
      when_to_play: `**Primary play (top bowl spin counter):**

- **12+** spins (**85–88% RTP** breakeven **11** ... play **+1**)
- **11+** at **89–94% RTP** breakeven **10**
- **10+** at **95–96% RTP** breakeven **9**

**Non-linear value:** **5→10** spins matters more than **15→20**. Fresh installs may show **8–10** on all bets ... risky unless card building.`,
      when_to_stop: `Stop after the **hold-and-spin bonus** you chased completes.`,
      how_to_check: `Spin counter on the **top bowl**. Cycle through all bets/denoms.`,
      risk_bankroll: `**400 units**`,
      risk_summary: `Bonus with **only the top bowl** unlocked almost always loses ... real pay needs **all five bowls** (especially **Double Reels**).`,
      risk_bullets: [],
      skins_markdown: `**Fuyu Phoenix**, **Panda**, **Parade**.`,
      gameplay_mechanics: `**Wu Jin Pen** (Light & Wonder) banks spins in a **top bowl**; random **hold-and-spin** uses that count while unlocking up to **five bowl layers** (credits, multiplier, jackpots, double reels).`,
    },
  },
  {
    machine: {
      slug: 'wu-wang-zhe',
      name: 'Wu Wang Zhe',
      manufacturer: 'Unknown',
      type: 'Character Coin Scatter Pays',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Active scatter spins · 7+ coins · weighted 16+',
      release_year: null,
    },
    guide: {
      title: 'Wu Wang Zhe',
      published: true,
      card_ev_threshold: 'Active scatter spins · 7+ coins · weighted sum 16+',
      when_to_play: `**Primary play:**

- **Any active scatter spins** (**1–3 Scatter Spins** glow on a character)
- **7+ total coins** collected across characters
- **6+ coins** if **two are red**
- **Weighted sum ≥16** (**Red 5**, **Blue 4**, **Green 3**, **Purple 2**, **Yellow 1**)

Examples: **2 red + 2 blue**, **1 red + 2 blue + 1 green**, **2 blue + 2 green + 1 purple**.`,
      when_to_stop: `Stop after **scatter-spin windows** expire or coins reset below scout tier.`,
      how_to_check: `Character **coin counts** and **Scatter Spins** labels on the left panel. Cycle through all bets/denoms.`,
      risk_bankroll: `**200 units**`,
      risk_summary: `**Yellow coins** inflate the count but pay **1×** ... position and color beat raw coin totals.`,
      risk_bullets: [],
      skins_markdown: `**Wu Wang Zhe**.`,
      gameplay_mechanics: `**Wu Wang Zhe** banks colored **coins** per character; **3 coins** activates **3-spin scatter pays** ( **Red 5×** down to **Yellow 1×** bet per hit).`,
    },
  },
  {
    machine: {
      slug: 'ying-cai-shen',
      name: 'Ying Cai Shen',
      manufacturer: 'Konami',
      type: 'Coin Holder Wild Reels R3-5',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Active wild R3 · R4+R5 · R4 probe',
      release_year: null,
    },
    guide: {
      title: 'Ying Cai Shen',
      published: true,
      card_ev_threshold: 'Active wild R3 · R4+R5 both active · R4 probe',
      when_to_play: `**Primary play:**

- **Active wild in R3** (**2 coins** below or **1 coin + red banner**)
- **Active wilds in both R4 and R5**

**R4 probe only:** **2 spins left** on R4 wild **and** **1 coin** below **R3** ... **one spin** for second R3 coin, then stop.

**Not +EV:** single coins in **R3 and R4** without full active wilds.`,
      when_to_stop: `Stop after **wild spins expire** or the **R4 probe** fails.`,
      how_to_check: `Coin holders below **R3–R5** and active wild banners. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `Only **R3–R5** holders ... narrower than **[Golden Egypt](guide:golden-egypt)** and easy to overpay on partial coins.`,
      risk_bullets: [],
      skins_markdown: `**Ying Cai Shen**.`,
      gameplay_mechanics: `**Ying Cai Shen** (Konami) fills **coin holders under R3–R5**; **2 coins = 2 wild spins** on that reel.`,
    },
  },
  {
    machine: {
      slug: 'zhao-cai-zhu-gettin-piggy-with-it-yo-ho-hog',
      name: "Zhao Cai Zhu: Gettin' Piggy With It / Yo Ho Hog",
      manufacturer: 'Light & Wonder',
      type: 'Triple Pig Meter Must-Hit-By Free Games',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Red 72+ · Green 44+ · Blue 28+ @ 88% RTP',
      release_year: null,
    },
    guide: {
      title: "Zhao Cai Zhu: Gettin' Piggy With It / Yo Ho Hog",
      published: true,
      card_ev_threshold: 'Red 72+ · Green 44+ · Blue 28+ @ 88% RTP',
      when_to_play: `**Primary play (~88% RTP solo tiers ... ~2% edge):**

- **Red meter 72+** (MHB **100**, reset **25**)
- **Green meter 44+** (MHB **60**, reset **15**)
- **Blue meter 28+** (MHB **40**, reset **10**)

All three meters contribute equity ... early hits before MHB are common. Factor **combined** meter value when multiple are hot.`,
      when_to_stop: `Stop after the **pig free-games package** you chased pays.`,
      how_to_check: `Red / green / blue **pig meters** on the bet pad. Cycle through all bets/denoms.`,
      risk_bankroll: `**300 units**`,
      risk_summary: `**Early Collect symbols** before frames upgrade to **platinum** ... chasing **red** near breakeven can crater on one bad bonus.`,
      risk_bullets: [],
      skins_markdown: `**Gettin' Piggy With It**, **Yo Ho Hog**. [Regal Riches](guide:regal-riches) / [Prosperity Pearl](guide:prosperity-pearl) (similar pig-meter family).`,
      gameplay_mechanics: `**Zhao Cai Zhu** (Light & Wonder) banks **lantern pigs** into **red/green/blue MHB meters**; **10-spin** bonuses drop pigs into **frames** that upgrade to **platinum** before **Collect** pays (guaranteed collect spin **10**).`,
    },
  },
  {
    machine: {
      slug: 'zodiac-dragon-zodiak-dragon-cash-on-reels',
      name: 'Zodiac Dragon / Zodiak Dragon Cash on Reels',
      manufacturer: 'Konami',
      type: 'Locked Position Cash Spread',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '5-6 connected locked positions (preliminary)',
      release_year: null,
    },
    guide: {
      title: 'Zodiac Dragon / Zodiak Dragon Cash on Reels',
      published: true,
      card_ev_threshold: '5-6 connected locked positions (preliminary AP tier)',
      when_to_play: `**Primary play (preliminary tier ... thin logged data):**

- **5–6 connected locked positions**

Cash values **jump to adjacent locks** (like **Lucha Kitty**) ... locks do **not** turn wild like **[Zodiac Lion / Zodiac Dragon](guide:zodiac-lion-zodiac-dragon)** gold frames. Horizontal alignment still helps line pays.`,
      when_to_stop: `Stop after the **cash-spread feature** you chased pays or locks clear below tier.`,
      how_to_check: `Count **connected locked positions** on the grid. Cycle through all bets/denoms.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `Do not scout this like **Zodiac Lion** gold-frame wilds ... cash-on-reels spread math is a **different hunt** on a similar cabinet.`,
      risk_bullets: [],
      skins_markdown: `**Zodiac Dragon Cash on Reels**, **Zodiac Lion Cash on Reels**. [Zodiac Lion / Zodiac Dragon](guide:zodiac-lion-zodiac-dragon) (gold-frame sister ... different AP).`,
      gameplay_mechanics: `**Zodiac Dragon Cash on Reels** (Konami) locks grid positions; landing **cash values** spreads to adjacent locks instead of flipping frames wild.`,
    },
  },
]
