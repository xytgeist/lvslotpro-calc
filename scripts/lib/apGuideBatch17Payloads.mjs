/** Batch 17 synth payloads. `ocean-magic` omitted — live on test. `ocean-magic-ultra` omitted — skin on 4D card. */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const BATCH17_PAYLOADS = [
  {
    machine: {
      slug: 'ocean-magic-4d-ocean-magic-ultra',
      name: 'Ocean Magic 4D / Ocean Magic Ultra',
      manufacturer: 'IGT',
      type: 'Persistent Wild Bubbles',
      difficulty: 'Intermediate',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'R1-3 bubbles · R4 bottom rows · sunrise.',
      release_year: null,
    },
    guide: {
      title: 'Ocean Magic 4D / Ocean Magic Ultra',
      published: true,
      card_ev_threshold: 'Wild bubbles R1-3 · R4 bottom rows · sunrise below grid',
      when_to_play: `**Primary play:** **persistent wild bubbles** in **reels 1-3** (anywhere **below top row**), **reel 4 bottom two rows**, plus **sunrise bubbles** queued **below the bottom row**.

Same bubble map as **Ocean Magic** ... **regular and Bubble Boost mode** on the pad.

**R2-R3** bubbles expand best; **sunrise** queues are the most overlooked walk-by gold.

**Ocean Magic Ultra** is identical.`,
      when_to_stop: `Stop after bubbles **leave the playable window** (top row / off-screen) without a paying expand, or after your expansion sequence finishes.`,
      how_to_check: `Count **true wild bubbles** vs one-spin expanded wilds ... **switch bet level away and back** to reveal sticky bubbles only. Check **below the reel window** for sunrise queues. Cycle through all bets/denoms.`,
      risk_bankroll: `**15-30 units**`,
      risk_summary: `Treasure-chest scatters can **hide** bubble positions ... look for glow behind symbols before you commit.`,
      risk_bullets: [],
      skins_markdown: `**Ocean Magic**\n[Ocean Magic](guide:ocean-magic)`,
      gameplay_mechanics: `**Ocean Magic 4D / Ultra** (IGT) adds a **prize wheel** and **whale extra bubbles** vs classic OM. Bets run about **20% higher** than legacy OM. Bubbles step **up one row** per spin and **expand adjacent symbols** when they cover an Ocean Magic icon.`,
    },
  },
  {
    machine: {
      slug: 'ocean-magic-bubble-boost',
      name: 'Ocean Magic Bubble Boost',
      manufacturer: 'IGT',
      type: 'Bubble MHB + Pop Wilds',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Very High',
      popularity_summary: 'Lagoon/Ocean/Reef MHB · 5-7 bubbles away.',
      release_year: null,
    },
    guide: {
      title: 'Ocean Magic Bubble Boost',
      published: true,
      card_ev_threshold: 'MHB 5/10/15 away (conservative) · 6+ bubbles R1-3',
      when_to_play: `**MHB meter chase (conservative floor — tight PAR installs):**

- **Any one bonus 5 bubbles away** (e.g. **55-20-25** on **60 / 50 / 60** caps).
- **Any two bonuses 10 away combined** (e.g. **50-40-25**).
- **All three bonuses 15 away** (e.g. **45-35-45**).

**Medium PAR:** **6 / 12 / 18** away. **High PAR / comps:** **7 / 14 / 21** away.

Count **top-row bubbles** about to feed meters next spin. **Multiplier bubbles** count at face value (**3x = 3**).

**Left-behind bubbles:** **6+ bubbles** in reels **1-3** ... **jackpot bubbles** (major/minor) always play.`,
      when_to_stop: `Stop after the **MHB bonus(es)** you hunted fire.`,
      how_to_check: `Meters clearly visible on screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**200 units**`,
      risk_summary: `Bonuses are often garbage ... with the occasional banger.`,
      risk_bullets: [],
      skins_markdown: `**Ocean Magic Bubble Boost**.`,
      gameplay_mechanics: `**Ocean Magic Bubble Boost** (IGT, **six reels**) pops bubbles into adjacent wilds OR sends unpopped top-row bubbles into **three MHB meters** (**60 / 50 / 60**). Bubble Boost mode doubles bubble drops; non-boost mode pays **double line hits** with slower meter fill.`,
    },
  },
  {
    machine: {
      slug: 'ocean-magic-grand',
      name: 'Ocean Magic Grand',
      manufacturer: 'IGT',
      type: 'Persistent Wild Bubbles (Tall Reels)',
      difficulty: 'Intermediate',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'R2-R3 bubbles · sunrise · tighter than OM.',
      release_year: null,
    },
    guide: {
      title: 'Ocean Magic Grand',
      published: true,
      card_ev_threshold: 'R2-R3 bubbles · stop 2nd row from top',
      when_to_play: `**Primary play:**

- **Wild bubbles on reels 2 or 3**, including **sunrise below the grid**. Stop when the bubble hits the **second row from the top**.
- **Reel 1** only with a **reel 4 bubble within 1-2 rows**. Stop when either hits second row from top.
- **Sunrise on reels 1 or 4:** one spin for foghorn / another bubble (Bubble Boost).

Tighter than classic **Ocean Magic** ... **single R1 bubbles alone are weak**.`,
      when_to_stop: `Stop when bubbles reach the **second row from top** or leave without a paying expand.`,
      how_to_check: `Bubble row and **sunrise** queues are visible on the grid. Switch bet level away and back to drop fake expanded wilds. Cycle through all bets/denoms.`,
      risk_bankroll: `**20 units**`,
      risk_summary: `Treasure-chest scatters can hide bubble positions behind symbols.`,
      risk_bullets: [],
      skins_markdown: `**Ocean Magic Grand**.`,
      gameplay_mechanics: `**Ocean Magic Grand** (IGT) uses **taller reels** than classic OM. Wild bubbles step up one row per spin and expand adjacent symbols when they cover an Ocean Magic icon.`,
    },
  },
  {
    machine: {
      slug: 'ocean-magic-reels',
      name: 'Ocean Magic Reels',
      manufacturer: 'IGT',
      type: 'Persistent Wild Bubbles',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Bubbles R1-3 below top · 3 adjacent.',
      release_year: 2024,
    },
    guide: {
      title: 'Ocean Magic Reels',
      published: true,
      card_ev_threshold: 'Bubbles R1-3 below top · or 3 adjacent',
      when_to_play: `**Primary play:**

- **Any bubble on reels 1-3** not on the **top row**.
- **OR three adjacent bubbles** with none on the top row.`,
      when_to_stop: `Stop after bubbles clear without a paying expand.`,
      how_to_check: `Bubble positions on reels 1-3 are visible on the grid. Cycle through all bets/denoms.`,
      risk_bankroll: `**15-30 units**`,
      risk_summary: `Expanded wilds from the last spin are not persistent ... switch bet level to see true bubbles only.`,
      risk_bullets: [],
      skins_markdown: `**Ocean Magic Reels**.`,
      gameplay_mechanics: `**Ocean Magic Reels** (IGT) uses the standard **wild bubble** engine on the Reels cabinet. Bubbles step up one row per spin and expand when they cover an Ocean Magic symbol.`,
    },
  },
  {
    machine: {
      slug: 'ocean-song',
      name: 'Ocean Song',
      manufacturer: 'Aristocrat',
      type: 'Persistent Pearl Wild Reels',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: '2 pearls on 2 middle reels · wild reels active.',
      release_year: null,
    },
    guide: {
      title: 'Ocean Song',
      published: true,
      card_ev_threshold: '2 pearls on 2 middle reels · or wild reels active',
      when_to_play: `**Primary play:**

- **Wild reels already active** on the middle reels (best if **1 wild spin** left).
- **Two pearls on each of two middle reels** ... triggers on the next spin. Priority: **R2+R3**.`,
      when_to_stop: `Stop after the **two wild spins** finish.`,
      how_to_check: `Pearl counts on reels 2-4 and wild-reel state are on the grid. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `One full reel plus a single pearl elsewhere does not trigger.`,
      risk_bullets: [],
      skins_markdown: `**Ocean Song**.`,
      gameplay_mechanics: `**Ocean Song** (Gimmie Games / Aristocrat, **1024-way**) collects **persistent pearls** on reels **2-4**. Two pearls on two reels turns those reels **fully wild for two spins**.`,
    },
  },
  {
    machine: {
      slug: 'olympus-awakening-ra-s-awakening',
      name: "Olympus Awakening / Ra's Awakening",
      manufacturer: 'Unknown',
      type: 'Expanding Reels Hold & Spin',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Max 6-high reels · 6-scatter H&S.',
      release_year: null,
    },
    guide: {
      title: "Olympus Awakening / Ra's Awakening",
      published: true,
      card_ev_threshold: 'All reels six symbols tall',
      when_to_play: `**Primary play:**

- **All reels at max height (six symbols tall).**

Many installs play **break-even at best** ... best for comps unless you know the bank is soft.`,
      when_to_stop: `Stop after **hold and spin** finishes.`,
      how_to_check: `Reel height / ways count is on the glass. Cycle through all bets/denoms.`,
      risk_bankroll: `**200 units**`,
      risk_summary: `Six scatters can take a long grind before hold and spin lands.`,
      risk_bullets: [],
      skins_markdown: `**Olympus Awakening**, **Ra's Awakening**.`,
      gameplay_mechanics: `**Olympus Awakening** / **Ra's Awakening** expand all reels when a **pyramid lands on reel 3** (max **six-high**). **Six scatters** trigger **hold and spin** on up to **30 spaces**. Reels reset to three-high after the feature.`,
    },
  },
  {
    machine: {
      slug: 'orb-lock-dragon',
      name: 'Orb Lock Dragon',
      manufacturer: 'Everi',
      type: 'Persistent Rings + Multipliers',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '4 rings same row · 8 rings R1-3.',
      release_year: 2021,
    },
    guide: {
      title: 'Orb Lock Dragon',
      published: true,
      card_ev_threshold: '4 rings same row · 3 rings + multiplier · 8 rings R1-3',
      when_to_play: `**Primary play:**

- **Four rings on the same row.**
- **Three rings on the same row** in reels **1-4** if one has a **multiplier**.
- **Eight rings in reels 1-3** ... **3x multiplier counts as 3 rings**.`,
      when_to_stop: `Stop after **dragon head on reel 5** pays the ring wilds.`,
      how_to_check: `Ring total shows on the bet pad. Cycle through all bets/denoms.`,
      risk_bankroll: `**75 units**`,
      risk_summary: `Multipliers do not show on the bet pad ... a **3x** ring still reads as **1**.`,
      risk_bullets: [],
      skins_markdown: `**Orb Lock Dragon**.`,
      gameplay_mechanics: `**Orb Lock Dragon** (Everi) locks **glowing rings** until a **dragon head on reel 5** converts them wild. **Multiplier rings** stack on the same spot instead of wasting overlap.`,
    },
  },
  {
    machine: {
      slug: 'palace-of-wonders',
      name: 'Palace of Wonders',
      manufacturer: 'IGT',
      type: 'Dual Progressive Meters',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Mini 25-30+ · Mini and Maxi 20+.',
      release_year: null,
    },
    guide: {
      title: 'Palace of Wonders',
      published: true,
      card_ev_threshold: 'Mini 25-30+ · Mini and Maxi 20+',
      when_to_play: `**Primary play:**

- **Mini meter 25-30+**
- **Mini and Maxi both 20+**`,
      when_to_stop: `Stop after the progressive feature finishes.`,
      how_to_check: `Mini and Maxi meters are on the glass. Cycle through all bets/denoms.`,
      risk_bankroll: `**150 units**`,
      risk_summary: `Mini entry depends on the cap on that bank ... read the glass before you sit.`,
      risk_bullets: [],
      skins_markdown: `**Palace of Wonders**.`,
      gameplay_mechanics: `**Palace of Wonders** (IGT) runs **Mini / Maxi** progressive meters in an Arabian Nights theme.`,
    },
  },
]
