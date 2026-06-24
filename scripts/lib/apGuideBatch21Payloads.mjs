/** Batch 21 synth payloads. `samurai-destiny` + `scarab` omitted (see _batch-progress.json skipped). */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const BATCH21_PAYLOADS = [
  {
    machine: {
      slug: 'rich-little-piggies-hog-wild-meal-ticket',
      name: 'Rich Little Piggies: Hog Wild / Meal Ticket',
      manufacturer: 'Light & Wonder',
      type: 'Pig Nest Persistent Bonuses',
      difficulty: 'Advanced',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Blue pig FG 16+ · Mini+Minor 30x+.',
      release_year: 2023,
    },
    guide: {
      title: 'Rich Little Piggies: Hog Wild / Meal Ticket',
      published: true,
      card_ev_threshold: 'Blue pig FG 16+ · Mini+Minor 30x+ bet',
      when_to_play: `**Primary play:**

- **Blue pig free-games meter at 16-18+** (**17+** on Strip / cruise ships; **15+** only on strong-RTP floors)
- **Mini + Minor jackpots combined at 30x+ bet**
- **Blue pig at 24+** regardless of other pigs
- **Blue pig at 22+** with a **fat yellow pig**
- **Blue pig at 20+** when **all three pigs are max fat** (squished together)

Profit usually needs **two or three pigs together** ... yellow-only or red-only defaults to **7 free spins**.`,
      when_to_stop: `Stop after the **pig bonus** you triggered (especially **blue pig**) finishes.`,
      how_to_check: `Blue pig spin counter and jackpot values are on the nest display. Cycle through all bets/denoms ... multi-denom cabinet.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `Fat pigs are **not** more likely to hit ... uncapped meters can run deep without a trigger.`,
      risk_bullets: [],
      skins_markdown: `**Hog Wild**, **Meal Ticket**.`,
      gameplay_mechanics: `**Rich Little Piggies** (Light & Wonder) feeds **blue / yellow / red coins** into three pigs. **Blue** builds **free spins**, **yellow** runs **jackpot picks**, **red** adds **Hog Wild wilds** or **Meal Ticket symbol removal**.`,
    },
  },
  {
    machine: {
      slug: 'rich-little-piggies-world-class-advantage-play',
      name: 'Rich Little Piggies World Class',
      manufacturer: 'Light & Wonder',
      type: 'Pig Nest / Wheel Jackpots',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Blue pig 12-14+ · mega white pig.',
      release_year: null,
    },
    guide: {
      title: 'Rich Little Piggies World Class',
      published: true,
      card_ev_threshold: 'Blue pig 12-14+ · mega white pig showing',
      when_to_play: `**Primary play:**

- **Blue pig free-games meter at 12-14+** when the **large white pig shows the Mega jackpot** on screen

Limited field data ... treat as preliminary.`,
      when_to_stop: `Stop after the **pig / wheel bonus** you triggered finishes.`,
      how_to_check: `Blue pig counter and white-pig jackpot display are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `World Class adds **wheel segments and six jackpots** ... do not assume base **Rich Little Piggies** thresholds transfer.`,
      risk_bullets: [],
      skins_markdown: `**Rich Little Piggies World Class**.`,
      gameplay_mechanics: `**Rich Little Piggies World Class** (Light & Wonder) expands the nest format with a **prize wheel**, **respins**, and **six jackpot tiers** up to **Mega**.`,
    },
  },
  {
    machine: {
      slug: 'rich-little-sheep-on-the-lamb-wool-street-riches',
      name: 'Rich Little Sheep: On the Lamb / Wool Street Riches',
      manufacturer: 'Light & Wonder',
      type: 'Sheep Hold & Spin Upgrade',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Right sheep rows 5+ · 4+ card build.',
      release_year: null,
    },
    guide: {
      title: 'Rich Little Sheep: On the Lamb / Wool Street Riches',
      published: true,
      card_ev_threshold: 'Right sheep extra rows 5+ · 4+ card build',
      when_to_play: `**Primary play:**

- **Right sheep (extra rows) at 5+**
- **Right sheep at 4+** for card building / strong-RTP floors only`,
      when_to_stop: `Stop after the **hold-and-spin feature** you triggered pays.`,
      how_to_check: `Three sheep upgrade meters are above the reels. Cycle through all bets/denoms.`,
      risk_bankroll: `**75 units**`,
      risk_summary: `**Left sheep** adds head-start spins and **middle sheep** fattens jackpots ... the **right sheep row count** is the main hunt.`,
      risk_bullets: [],
      skins_markdown: `**On the Lamb**, **Wool Street Riches**.`,
      gameplay_mechanics: `**Rich Little Sheep** (Light & Wonder) upgrades a **hold-and-spin grid**: **left sheep** adds **head-start spins**, **middle sheep** raises **jackpot values**, **right sheep** adds **extra rows**.`,
    },
  },
  {
    machine: {
      slug: 'rising-diamonds',
      name: 'Rising Diamonds',
      manufacturer: 'Konami',
      type: 'Expanding Ways Diamond Hunt',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '16807 ways · 7776+ w/ 1 spin left.',
      release_year: null,
    },
    guide: {
      title: 'Rising Diamonds',
      published: true,
      card_ev_threshold: '16807 ways · 7776+ ways 1 spin left',
      when_to_play: `**Primary play:**

- **16,807 ways**
- **7,776+ ways** with **at least one spin remaining** on the counter

**Diamond on R2-4** lets you play **7,776 / 3,125 ways** even at **0 spins left** (reels expand next spin). **Two diamonds** = **1,024 ways** · **three diamonds** = **243 ways**.`,
      when_to_stop: `Stop after the **top-height bonus** or the **diamond expansion window** you chased pays.`,
      how_to_check: `Ways count and spin counter are below the reels. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `Reels **drop one level** if no diamond lands within **three spins** ... the counter can expire fast.`,
      risk_bullets: [],
      skins_markdown: `**Rising Diamonds**.`,
      gameplay_mechanics: `**Rising Diamonds** (Konami) expands reel height when **diamonds land on R2-4**, adding **three respins** per diamond. Ways climb as reels grow toward the top bonus.`,
    },
  },
  {
    machine: {
      slug: 'rising-phoenix',
      name: 'Rising Phoenix',
      manufacturer: 'IGT',
      type: 'Wheel Multiplier / Wild Reels',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Flame meter · 24x-60x wheel total.',
      release_year: null,
    },
    guide: {
      title: 'Rising Phoenix',
      published: true,
      card_ev_threshold: '3 flames 24x+ · 2 flames 36x+ · 1 flame 48x+',
      when_to_play: `**Primary play:**

- **Three flames:** **24x+ total wheel multipliers** (or **any two wedges on fire**)
- **Two flames:** **36x+ total multipliers**
- **One flame:** **48x+ total multipliers**
- **Zero flames:** **60x+ total multipliers**

**Five or more wheel multipliers on fire** is premium when you see it.`,
      when_to_stop: `Stop after the **wheel applies to a line hit** or the **flame meter clears** on that cycle.`,
      how_to_check: `Flame count and wedge values are on the bet pad and wheel above the reels. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `The wheel only pays when a **line hit lands the same spin** the fourth flame fills ... dead fills just bump random wedges **+1x**.`,
      risk_bullets: [],
      skins_markdown: `**Rising Phoenix**.`,
      gameplay_mechanics: `**Rising Phoenix** (IGT) turns **phoenix wild reels** and fills a **four-spot flame meter** inside the overhead **multiplier wheel**. A line hit on the fill spin spins the wheel onto that pay.`,
    },
  },
  {
    machine: {
      slug: 'rocket-rumble',
      name: 'Rocket Rumble',
      manufacturer: 'IGT',
      type: 'Must-Hit-By Free-Games Meters',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Blue 14+ · Green 18+ · Purple 33+.',
      release_year: null,
    },
    guide: {
      title: 'Rocket Rumble',
      published: true,
      card_ev_threshold: 'Blue 14+ · Green 18+ · Purple 33+ · Red 99+',
      when_to_play: `**Primary play:**

- **Blue MHB at 14+** (cap **15**, resets **8**) — **13+** on strong-RTP / card-build floors
- **Green MHB at 18+** (cap **20**) — **17+** aggressive
- **Purple MHB at 33+** (cap **35**) — **31+** aggressive
- **Red MHB at 99+** (cap **100**) — card-build only for most APs
- **Combo:** **Blue + green at 30+** combined · **Blue + green + purple at 58+**`,
      when_to_stop: `Stop after the **must-hit free-games meter** you chased awards.`,
      how_to_check: `Four color meters are on the glass. Cycle through all bets/denoms.`,
      risk_bankroll: `**400 units**`,
      risk_summary: `**Red** can sit on one number for **hours** ... know the time sink before you chase purple or red.`,
      risk_bullets: [],
      skins_markdown: `**Rocket Rumble**.`,
      gameplay_mechanics: `**Rocket Rumble** (IGT) runs **four must-hit-by free-games meters** (blue **15**, green **20**, purple **35**, red **100**). Bonuses pay more the deeper into the feature you are; **multiplier wilds** on **R2-4** stack multiplicatively.`,
    },
  },
  {
    machine: {
      slug: 'rubies-instant-hit',
      name: 'Rubies Instant Hit',
      manufacturer: 'Aristocrat',
      type: 'Persistent Wheel Bonus Column',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: '2+ wheel bonus on R4.',
      release_year: 2022,
    },
    guide: {
      title: 'Rubies Instant Hit',
      published: true,
      card_ev_threshold: '2+ wheel bonus symbols on R4',
      when_to_play: `**Primary play:**

- **Two or more wheel bonus symbols in column 4**`,
      when_to_stop: `Stop after the **wheel bonus** you triggered pays.`,
      how_to_check: `Wheel bonus count on **reel 4** is on the grid. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `Thin logged data ... confirm **column 4** wheel count before you coin in.`,
      risk_bullets: [],
      skins_markdown: `**Rubies Instant Hit**.`,
      gameplay_mechanics: `**Rubies Instant Hit** (Aristocrat) banks **wheel bonus symbols** on **reel 4** for an **instant-hit wheel** feature.`,
    },
  },
  {
    machine: {
      slug: 'samurai-dynasty',
      name: 'Samurai Dynasty',
      manufacturer: 'Aristocrat',
      type: 'Persistent Bonus Symbol Grid',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: '1 bonus top row · 2 bonus mid row.',
      release_year: null,
    },
    guide: {
      title: 'Samurai Dynasty',
      published: true,
      card_ev_threshold: '1 bonus top row · 2 bonus mid row',
      when_to_play: `**Primary play:**

- **One bonus symbol in the top row**
- **Two bonus symbols in the middle row**

**Never play three bonus symbols** ... that means the bonus just fired and they clear next spin.`,
      when_to_stop: `Stop after the **free-games bonus** you triggered finishes.`,
      how_to_check: `Bonus symbol positions are on the grid. Cycle through all bets/denoms.`,
      risk_bankroll: `**30 units**`,
      risk_summary: `**Three visible bonus symbols** mean you are one spin too late ... the board resets.`,
      risk_bullets: [],
      skins_markdown: `**Samurai Dynasty**.`,
      gameplay_mechanics: `**Samurai Dynasty** (Aristocrat) keeps **bonus symbols** on a grid that **drops one row per spin**. **Three bonus symbols** anywhere trigger **free games**.`,
    },
  },
]
