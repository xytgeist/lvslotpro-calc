/** Batch 19 synth payloads — Ryan voice rules (omit where_to_find). */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const BATCH19_PAYLOADS = [
  {
    machine: {
      slug: 'pirates-treasure',
      name: "Pirate's Treasure",
      manufacturer: 'Light & Wonder',
      type: 'Expanding Reels / Chest Push',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Black bg · chest 1 from key · 400+ ways.',
      release_year: null,
    },
    guide: {
      title: "Pirate's Treasure",
      published: true,
      card_ev_threshold: 'Black bg · chest 1 from key · 400+ ways',
      when_to_play: `**Primary play:**

- **Black background** behind the reels (state carries one spin).
- **Plus any one:** wild/pirate on **R1-3** · wild/pirate on **both R4 and R5** · **400+ ways** · any chest **one step from its key**.`,
      when_to_stop: `Stop after the **chest prize hits** or the board **resets** on a blue background.`,
      how_to_check: `Background color, ways count, chest positions, and persistent wilds are on the grid. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `**Blue background** means the board resets next spin ... only **black** keeps the hunt alive.`,
      risk_bullets: [],
      skins_markdown: `**Pirate's Treasure**, **Panda's Treasure**.`,
      gameplay_mechanics: `**Pirate's Treasure** (Light & Wonder) stacks **credit chests** above each reel. **Cannon** hits expand reel height and push chests toward the **key**. **Pirate symbols** leave **persistent wilds** while the background stays black.`,
    },
  },
  {
    machine: {
      slug: 'plants-vs-zombies-3d',
      name: 'Plants vs Zombies 3D',
      manufacturer: 'IGT',
      type: 'Brain Meter Bonus Hunt',
      difficulty: 'Advanced',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Brain meter 200+ · field floor ~150.',
      release_year: null,
    },
    guide: {
      title: 'Plants vs Zombies 3D',
      published: true,
      card_ev_threshold: 'Brain meter 200+ points',
      when_to_play: `**Primary play:**

- **Brain meter at 200+ points.**

Heavy competition floors sometimes play **150+** ... know your local bar.`,
      when_to_stop: `Stop after the **Camel Zombie bonus** (or other meter-driven feature) you chased pays.`,
      how_to_check: `Brain meter is the bar above the reels. Cycle through all bets/denoms ... each bet level has its own meter.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `Missed spins **dock 12 points** ... the meter can bleed below your floor before the bonus lands.`,
      risk_bullets: [],
      skins_markdown: `**Plants vs Zombies 3D**.`,
      gameplay_mechanics: `**Plants vs Zombies 3D** (IGT) fills a **brain meter** from **brain symbols on R1, R3, and R5** (+54 each). Empty spins cost **12 points**. The meter drives the **zombie bonus** ladder.`,
    },
  },
  {
    machine: {
      slug: 'potion-pays',
      name: 'Potion Pays',
      manufacturer: 'AGS',
      type: 'Persistent Bubble Pop',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Bubble total 5x+ bet · skip top row.',
      release_year: null,
    },
    guide: {
      title: 'Potion Pays',
      published: true,
      card_ev_threshold: 'Bubbles 5x+ bet · skip top row',
      when_to_play: `**Primary play:**

- **Total bubble value 5x+ bet** (rows 2 and below only).
- **Any giant bubble** (wider than one reel), any value.

Do not count **top-row bubbles** ... they move off next spin.`,
      when_to_stop: `Stop after the **bubble pop** that clears your target values pays.`,
      how_to_check: `Bubble values and positions are on the grid. Cycle through all bets/denoms.`,
      risk_bankroll: `**40 units**`,
      risk_summary: `Upcoming bubbles below the visible grid can hide their value until they rise ... eyeball the full column stack.`,
      risk_bullets: [],
      skins_markdown: `**Potion Pays** ([Bubble Mania](guide:bubble-mania) engine).`,
      gameplay_mechanics: `**Potion Pays** (AGS) uses the **Bubble Mania** engine: credit bubbles **rise one row per spin** and pay when they land on a **special symbol**.`,
    },
  },
  {
    machine: {
      slug: 'pots-o-luck',
      name: "Pots O' Luck",
      manufacturer: 'AGS',
      type: 'Coin Holder Wild Reels',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Active wilds · 2-2-2 coins · R2-3 mult 10x+.',
      release_year: null,
    },
    guide: {
      title: "Pots O' Luck",
      published: true,
      card_ev_threshold: 'Active wild reels · 2 coins R2-4 · R2-3 mult 10x+',
      when_to_play: `**Primary play:**

- **Active wild reels** on **R2-4** (coin background **orange**, not green).
- **Two coins each** on **R2, R3, and R4**.
- **Reels 2+3 multiplier sum 10x+** (plain coin = 1x).

**Never** trust a **gold border alone** ... green background behind the coins means wilds are **not** active.`,
      when_to_stop: `Stop after the **3-spin wild reel** sequence you triggered finishes.`,
      how_to_check: `Coin holders, mult coins, and wild countdown are on the grid. Tap the bet pad to scout without coin-in on many installs. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `The **2-2-2 coin look** is everywhere and usually fake ... **orange** coin background is the real tell.`,
      risk_bullets: [],
      skins_markdown: `**Pots O' Luck**.`,
      gameplay_mechanics: `**Pots O' Luck** (AGS) fills **coin holders above R2-4**. **Three coins** turns that reel **wild for three spins**. **Multiplier coins** stack on **R2 and R3**.`,
    },
  },
  {
    machine: {
      slug: 'power-push-jin-gou-long-de-xiyue',
      name: 'Power Push: Jin Gou / Long De Xiyue',
      manufacturer: 'AGS',
      type: 'Tray Push / Must-Hit Stacks',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '100+ tray equity · push by 300 coins.',
      release_year: null,
    },
    guide: {
      title: 'Power Push: Jin Gou / Long De Xiyue',
      published: true,
      card_ev_threshold: '100+ tray equity · push guaranteed at 300 coins',
      when_to_play: `**Primary play:**

- **100+ units total tray equity** (full coin stacks count **10 units** each toward equity).
- **66+ units** when prizes sit **forward on the tray** or **+2 push** tokens are present.

High-value **prizes alone** on an empty tray can play ... stacks are not the only angle.`,
      when_to_stop: `Stop after the **push bonus** awards the tray prizes you chased.`,
      how_to_check: `Tray prizes, coin stacks, and push counters are above the reels. Cycle through all bets/denoms.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `Casuals chase **fat stacks** ... the best finds are often **big prizes with few stacks behind them**.`,
      risk_bullets: [],
      skins_markdown: `**Jin Gou**, **Long De Xiyue**.`,
      gameplay_mechanics: `**Power Push** (AGS) banks **coins and prizes** on an overhead tray. Coin hits build **25-coin stacks**; the **push bonus** is guaranteed by **300 coins** (12 full stacks) and can trigger early.`,
    },
  },
  {
    machine: {
      slug: 'power-push-shiseijuu-fortunes',
      name: 'Power Push: Shiseijuu Fortunes',
      manufacturer: 'AGS',
      type: '8-Spin Wild Cycle',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Spin 7/8 · 3+ coins R1-3.',
      release_year: null,
    },
    guide: {
      title: 'Power Push: Shiseijuu Fortunes',
      published: true,
      card_ev_threshold: 'Spin 7 of 8 · 3+ coins R1-3',
      when_to_play: `**Primary play:**

- **Spin 7 of 8** with **3+ collected coins on R1, R2, and R3**.
- **Late in the 8-spin cycle** with heavy coin load on **R1-3** (up to **4 coins per reel**).

Spin 8 drops **wilds equal to each reel's coin count** (stacks to **3x wild**).`,
      when_to_stop: `Stop after the **Wild Spin** (and any extra Wild Spins) on that cycle finishes.`,
      how_to_check: `Spin counter and per-reel coin meters are on the grid. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `This is the **8-spin cycle** game ... not the tray-style **Power Push** cabinet.`,
      risk_bullets: [],
      skins_markdown: `**Shiseijuu Fortunes**.`,
      gameplay_mechanics: `**Power Push: Shiseijuu Fortunes** (AGS) runs a fixed **8-spin cycle**. Spins **1-7** collect **coin sub-symbols** per reel; spin **8** is the **Wild Spin**. **BONUS** letters during Wild Spins can trigger a separate push round.`,
    },
  },
  {
    machine: {
      slug: 'prize-pool-cactus-cash-fierce-dragon',
      name: 'Prize Pool: Cactus Cash / Fierce Dragon',
      manufacturer: 'Everi',
      type: 'Block Grid Scatter Pay',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Color block total 27+.',
      release_year: null,
    },
    guide: {
      title: 'Prize Pool: Cactus Cash / Fierce Dragon',
      published: true,
      card_ev_threshold: 'Color block score 27+',
      when_to_play: `**Primary play:**

- **Color block total 27+** using these weights:
  - **Green:** 1
  - **Yellow at 333x bet:** 2
  - **Purple:** 2
  - **Red:** 5
  - **Built-up yellow (under 333x):** 7 down to 2 as blocks max out

**Four or more Prize Pool scatters** award the matching blocks above the reels.`,
      when_to_stop: `Stop after the **scatter award** from the block grid you chased pays.`,
      how_to_check: `Colored block values sit above each reel position. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `**Maxed yellow blocks** (333x bet) are rigged tight ... value them lower as they approach the cap.`,
      risk_bullets: [],
      skins_markdown: `**Cactus Cash**, **Fierce Dragon**.`,
      gameplay_mechanics: `**Prize Pool** (Everi) tracks **credit blocks** above the grid. **Prize Pool scatters** pay the blocks that line up with their reel positions.`,
    },
  },
  {
    machine: {
      slug: 'progressive-free-games',
      name: 'Progressive Free Games',
      manufacturer: 'IGT',
      type: 'Metered Free-Game Progressives',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Red 12+ · Green 13+ · Blue 14+.',
      release_year: null,
    },
    guide: {
      title: 'Progressive Free Games',
      published: true,
      card_ev_threshold: 'Red 12+ · Green 13+ · Blue 14+',
      when_to_play: `**Primary play:**

- **Red meter at 12+** (2x tier, must-hit-by **15**)
- **Green meter at 13+** (5x tier, must-hit-by **15**)
- **Blue meter at 14+** (10x tier, must-hit-by **15**)

Meters advance on a **fixed spin cycle** per install ... a hit resets that color's count.`,
      when_to_stop: `Stop after the **progressive free-game window** you played for hits.`,
      how_to_check: `Red, green, and blue meter counts are on the glass. Cycle through all bets/denoms.`,
      risk_bankroll: `**75 units**`,
      risk_summary: `Cycle lengths vary by property ... note the **spin cadence** once so you are not guessing mid-hunt.`,
      risk_bullets: [],
      skins_markdown: `**Triple Double Diamond**, **Legend of the 3x4x5x Phoenix**, and other IGT 3-reel skins.`,
      gameplay_mechanics: `**Progressive Free Games** (IGT) adds **red / green / blue counters** on classic **3-reel** titles. Each color climbs toward a **15-game must-hit-by** window at **2x, 5x, and 10x** pay.`,
    },
  },
  {
    machine: {
      slug: 'pub-series-anastasia-s-tavern-isabella-s-tequileria-kaleigh-s-pub-sofia-s-cellar',
      name: "Pub Series: Anastasia's Tavern / Isabella's Tequileria / Kaleigh's Pub / Sofia's Cellar",
      manufacturer: 'Light & Wonder',
      type: 'Sticky Wild / On-the-House Meter',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Full wilds R2-4 · on-the-house half-fill.',
      release_year: null,
    },
    guide: {
      title: "Pub Series: Anastasia's Tavern / Isabella's Tequileria / Kaleigh's Pub / Sofia's Cellar",
      published: true,
      card_ev_threshold: 'Full wilds R2-4 · on-the-house meter half-fill',
      when_to_play: `**Primary play:**

- **Full sticky wilds** (full or half-full glass) on **R2 or R3**.
- **Three active wilds on R4**.
- **On-the-house meter** on the bet pad **halfway into the last segment** (red showing).

Skip wilds with an **empty glass** or a **tiny splash at the bottom** ... they expire next spin.`,
      when_to_stop: `Stop after **sticky wilds expire** or the **on-the-house bonus** you triggered finishes.`,
      how_to_check: `Wild glass fill and on-the-house meter are on the grid and bet pad. Cycle through all bets/denoms.`,
      risk_bankroll: `**30 units**`,
      risk_summary: `A **barely filled glass** looks active but vanishes on the next spin ... full or half-full only.`,
      risk_bullets: [],
      skins_markdown: `**Anastasia's Tavern**, **Isabella's Tequileria**, **Kaleigh's Pub**, **Sofia's Cellar**.`,
      gameplay_mechanics: `**Pub Series** (Light & Wonder) keeps **sticky drink wilds** for **two spins** and fills an **on-the-house meter** on the bet pad that awards **bonus games** when full.`,
    },
  },
  {
    machine: {
      slug: 'quick-hit-ultra-pays',
      name: 'Quick Hit Ultra Pays',
      manufacturer: 'Light & Wonder',
      type: 'Quick Hit Progressive Ladder',
      difficulty: 'Advanced',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '5-hit 50x · 6-hit 150x bet.',
      release_year: null,
    },
    guide: {
      title: 'Quick Hit Ultra Pays',
      published: true,
      card_ev_threshold: '5-hit 50x bet · 6-hit 150x bet',
      when_to_play: `**Primary play:**

- **5 Quick Hit meter at 50x+ bet**
- **6 Quick Hit meter at 150x+ bet**
- **Combo:** 5-hit **40x+** and 6-hit **120x+** on the same bet

**7-hit+** meters are not primary hunts ... hit too rarely.`,
      when_to_stop: `Stop after the **Quick Hit progressive** you chased hits.`,
      how_to_check: `Jackpot ladder values are on the glass. Cycle through all bets/denoms.`,
      risk_bankroll: `**200 units**`,
      risk_summary: `**5-hit and 6-hit** are the workable ladder ... do not overcommit chasing **7-hit+** alone.`,
      risk_bullets: [],
      skins_markdown: `**Quick Hit Ultra Pays**.`,
      gameplay_mechanics: `**Quick Hit Ultra Pays** (Light & Wonder) runs a **Quick Hit jackpot ladder** plus an expanding **curtain / rising wheel** that opens extra ways during play.`,
    },
  },
]
