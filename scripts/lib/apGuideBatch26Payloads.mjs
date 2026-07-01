/** Batch 26 synth payloads - no skips (WoF 4D base vs Collector's Edition stay separate cards). */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const BATCH26_PAYLOADS = [
  {
    machine: {
      slug: 'ultra-rush-gold-african-adventure-midnight-ice-mythical-phoenix-tiger-run',
      name: 'Ultra Rush Gold: African Adventure / Midnight Ice / Mythical Phoenix / Tiger Run',
      manufacturer: 'Incredible Technologies',
      type: 'Gold Lock Scatter Bonus',
      difficulty: 'Beginner',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: '2 gold scatters on bet pad · 1 gold if wheel or 20x+ credit',
      release_year: 2020,
    },
    guide: {
      title: 'Ultra Rush Gold: African Adventure / Midnight Ice / Mythical Phoenix / Tiger Run',
      published: true,
      card_ev_threshold: '2 gold scatters on bet pad · 1 gold if wheel or 20x+ credit',
      when_to_play: `**Primary play:**

- **2 gold scatters** on the **bet pad** (per denom)
- **1 gold scatter** if it is the **wheel** symbol **or** credit value **≥20× bet**

Bonus triggers at **6 total scatters** (gold, credit bubbles, or wheel). Gold scatters **lock 3 spins** and persist.`,
      when_to_stop: `Stop after the **hold-and-spin bonus** you chased completes or gold scatters clear from the pad.`,
      how_to_check: `Gold scatter count shows on the **bet pad**. Tap bet keys to cycle denoms. Cycle through all bets/denoms.`,
      risk_bankroll: `**30 units**`,
      risk_summary: `Mascot can grant **+3 lock spins** when the counter hits zero ... do not assume a dead board is finished.`,
      risk_bullets: [],
      skins_markdown: `**African Adventure**, **Midnight Ice**, **Mythical Phoenix**, **Tiger Run**.`,
      gameplay_mechanics: `**Ultra Rush Gold** (Incredible Technologies) locks **gold scatters** for **3 spins** while any **6 scatters** trigger the bonus. **Wheel scatters** beat plain credit gold on value.`,
    },
  },
  {
    machine: {
      slug: 'ultra-rush-gold-x-bingwen-wei-yi',
      name: 'Ultra Rush Gold X: Bingwen / Wei Yi',
      manufacturer: 'Incredible Technologies',
      type: 'Gold Lock Scatter Bonus (5-scatter)',
      difficulty: 'Beginner',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: '1 gold scatter on bet pad',
      release_year: null,
    },
    guide: {
      title: 'Ultra Rush Gold X: Bingwen / Wei Yi',
      published: true,
      card_ev_threshold: '1 gold scatter on bet pad',
      when_to_play: `**Primary play:**

- **1 gold scatter** collected on the **bet pad** (per denom)

**Ultra Rush Gold X** bonus triggers at **5 scatters** (not **6** like classic **Ultra Rush Gold**). Same **3-spin gold lock** mechanic.`,
      when_to_stop: `Stop after the **bonus** completes or gold scatters leave the pad.`,
      how_to_check: `Gold scatter icons on the **bet pad**. Cycle through all bets/denoms.`,
      risk_bankroll: `**20 units**`,
      risk_summary: `Do not scout this like classic **Ultra Rush Gold** ... **5-scatter** math needs only **1 locked gold**, not **2**.`,
      risk_bullets: [],
      skins_markdown: `**Bingwen**, **Wei Yi**.`,
      gameplay_mechanics: `**Ultra Rush Gold X** (Incredible Technologies) uses the **gold lock** family with a **5-scatter** bonus trigger and **four denom** bet pad.`,
    },
  },
  {
    machine: {
      slug: 'upshot-prosperity-rising-brilliant-7s',
      name: 'UpShot Prosperity Rising / Brilliant 7s',
      manufacturer: 'Incredible Technologies',
      type: 'Locked Wild UpSHOT Timer',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'UpSHOT wild col 2/4 + spin counter opposite col',
      release_year: 2021,
    },
    guide: {
      title: 'UpShot Prosperity Rising / Brilliant 7s',
      published: true,
      card_ev_threshold: 'UpSHOT wild col 2/4 + spin counter above opposite column',
      when_to_play: `**Primary play:**

- **Locked UpSHOT wild** in **column 2 or 4**
- **Spin counter showing above the opposite column** (e.g. wild in **col 4**, **"1 of 3 Spins"** above **col 2**)

Wild with **no counter above the opposite column** dies next spin ... not a play.`,
      when_to_stop: `Stop after the **1–3 spin wild window** expires.`,
      how_to_check: `Locked wild column and opposite-column spin counter are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**20 units**`,
      risk_summary: `Whole advantage lasts **1–3 paid spins** ... scout fast before another AP grabs it.`,
      risk_bullets: [],
      skins_markdown: `**UpShot Prosperity Rising**, **UpShot Brilliant 7's**.`,
      gameplay_mechanics: `**UpShot** (Incredible Technologies, **2021**) is a **5×25** locked-wild platform. The **UpSHOT** symbol in **col 2/4** with a live timer above the opposite column is the entire hunt.`,
    },
  },
  {
    machine: {
      slug: 'volcanic-sevens',
      name: 'Volcanic Sevens',
      manufacturer: 'IGT',
      type: 'Sure Fire SAP Must-Hit-By',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: '$50 @ $44+ · $150 @ $143+ · $1K @ $970+',
      release_year: null,
    },
    guide: {
      title: 'Volcanic Sevens',
      published: true,
      card_ev_threshold: '$50 @ $44+ · $150 @ $143+ · $1000 @ $970+',
      when_to_play: `**Primary play (must-hit-by SAP tiers):**

- **$50 progressive at $44–45+**
- **$150 progressive at $143–144+**
- **$1,000 progressive at $970–975+**

**27-way** **3×3** stepper. Same SAP ladder family as **[Money Hits](guide:money-hits)**.`,
      when_to_stop: `Stop after the **SAP tier** you chased hits.`,
      how_to_check: `Read all **three progressive values** on the glass. Cycle through all bets/denoms.`,
      risk_bankroll: `**200 units**`,
      risk_summary: `Any tier can **run to cap** before paying ... size bankroll for a full climb on your band.`,
      risk_bullets: [],
      skins_markdown: `[Money Hits](guide:money-hits) (same SAP ladder family).`,
      gameplay_mechanics: `**Volcanic Sevens** (IGT) runs **Sure Fire** linked **must-hit-by** SAP jackpots on a **3×3** **7s** stepper with **blackout** potential.`,
    },
  },
  {
    machine: {
      slug: 'voodoo-jackpots-jack-s-gol',
      name: "Voodoo Jackpots: Jack's Gold",
      manufacturer: 'Light & Wonder',
      type: 'Dual Progressive Free Games Meters',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Green+purple combined 32+ · single color 17+',
      release_year: 2024,
    },
    guide: {
      title: "Voodoo Jackpots: Jack's Gold",
      published: true,
      card_ev_threshold: 'Green+purple combined 32+ · single color 17+',
      when_to_play: `**Primary play:**

- **Green + purple combined 32+** (simple scout)
- **Green + purple combined 25–28+** (dual-meter AP tier)
- **Single color 17+** when only one meter is hot

Meters start at **6**, cap at **20** ... **not must-hit-by**. **Voodoo doll** in **center (R3 row 2)** collects prizes and can bump meters.`,
      when_to_stop: `Stop after the **free games / wheel feature** you chased pays.`,
      how_to_check: `Green and purple **free-games meters** are on the top screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**700 units**`,
      risk_summary: `Meters can sit at **20/20** for a long grind before the doll triggers ... do not confuse high counts with a forced hit.`,
      risk_bullets: [],
      skins_markdown: `**Voodoo Jackpots: Jack's Gold** (launch skin).`,
      gameplay_mechanics: `**Voodoo Jackpots** (Light & Wonder, **2024**) runs uncapped **green / purple free-games meters** with a center **voodoo doll** wild and **wheel** bonus layer over a coin engine.`,
    },
  },
  {
    machine: {
      slug: 'whales-of-cash-ultimate-jackpots',
      name: 'Whales of Cash Ultimate Jackpots',
      manufacturer: 'Aristocrat',
      type: 'Wild Collection SAP Meters',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Mini 70+ · Minor 140+',
      release_year: 2019,
    },
    guide: {
      title: 'Whales of Cash Ultimate Jackpots',
      published: true,
      card_ev_threshold: 'Mini 70+ · Minor 140+',
      when_to_play: `**Primary play:**

- **Mini meter at 70+**
- **Minor meter at 140+**

Wild-symbol collection feeds **SAP progressive free games** and **Mega Free Games** (up to **500** spins). **Wheel Bonus** can hit **Grand**.`,
      when_to_stop: `Stop after the **SAP free-games tier** you chased awards.`,
      how_to_check: `Mini and minor **wild-collection meters** are on the glass. Cycle through all bets/denoms.`,
      risk_bankroll: `**200 units**`,
      risk_summary: `High meters can sit near cap for a long grind ... SAP tiers are **not** must-hit-by.`,
      risk_bullets: [],
      skins_markdown: `**Whales of Cash Ultimate Jackpots**.`,
      gameplay_mechanics: `**Whales of Cash Ultimate Jackpots** (Aristocrat, **2019**) tracks wild hits into **Mini / Minor SAP** meters that award stacked free-game packages.`,
    },
  },
  {
    machine: {
      slug: 'what-the-duck-dusty-snowy',
      name: 'What the Duck: Dusty / Snowy',
      manufacturer: 'Konami',
      type: 'Explode / Bounty Meter Hold-and-Spin',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Explode 5 + Bounty 5 · Snowy stronger theme',
      release_year: 2025,
    },
    guide: {
      title: 'What the Duck: Dusty / Snowy',
      published: true,
      card_ev_threshold: 'Explode 5 + Bounty 5 · aggressive: Explode 5 + Bounty 3+',
      when_to_play: `**Primary play:**

- **Explode and Bounty both at 5**

**Aggressive (higher RTP / card building):** **Explode 5** with **Bounty 3+**

**Honest take:** author is **skeptical** this is +EV on low RTP ... many APs still hunt it. **Snowy** (girl duck) may play more aggressively thanks to **+3 meter boost** in free games.`,
      when_to_stop: `Stop after the **hold-and-spin / wheel** chase you took pays or meters reset below threshold.`,
      how_to_check: `Explode and Bounty meter counts are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**250 units**`,
      risk_summary: `Meters **reset after feature** even when **Explode/Bounty never land** ... a capped board can still whiff.`,
      risk_bullets: [],
      skins_markdown: `**Dusty** (boy duck), **Snowy** (girl duck).`,
      gameplay_mechanics: `**What the Duck** (Konami, **2025**) caps **Explode / Bounty** meters at **5**. Hold-and-spin from **cans/hats** in **R1–R3** reveals prizes; **Explode** upgrades symbols, **Bounty** lassos instant awards, **wheel** can **2×–10×** all prizes at feature end.`,
    },
  },
  {
    machine: {
      slug: 'wheel-frenzy-frights-n-delights-genie-unleashed',
      name: "Wheel Frenzy: Frights N' Delights / Genie Unleashed",
      manufacturer: 'Unknown',
      type: 'Dual Coin Wheel Meters',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Either meter 5 coins · or 6 combined',
      release_year: null,
    },
    guide: {
      title: "Wheel Frenzy: Frights N' Delights / Genie Unleashed",
      published: true,
      card_ev_threshold: 'Either meter 5 coins · or 6 combined',
      when_to_play: `**Primary play:**

- **Either left or right meter at 5 coins**
- **OR 6 coins combined** across both meters

Coins count only on **active reels** for that bet level (shown on bet pad). Collection rate is **gaffed even** across bet sizes ... same thresholds all levels.`,
      when_to_stop: `Stop after the **wheel spin** you triggered completes.`,
      how_to_check: `Dual coin meters sit below the center wheel. Check **active reel** map on the bet pad. Cycle through all bets/denoms.`,
      risk_bankroll: `**30 units**`,
      risk_summary: `Big yellow wheel wedges **look** fat ... small credit slices hit far more often than the art suggests.`,
      risk_bullets: [],
      skins_markdown: `**Frights N' Delights**, **Genie Unleashed**.`,
      gameplay_mechanics: `**Wheel Frenzy** collects colored coins into **left/right meters**; **6 coins** in one meter spins the prize wheel (**Major/Grand**, credits, stacked **2×** multipliers up to **4×**).`,
    },
  },
  {
    machine: {
      slug: 'wheel-of-fortune-4d',
      name: 'Wheel of Fortune 4D',
      manufacturer: 'IGT',
      type: 'Dollar Holder Wild Reels',
      difficulty: 'Intermediate',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Active wild reels cols 1-3 · not Golden Egypt partial dollars',
      release_year: null,
    },
    guide: {
      title: 'Wheel of Fortune 4D',
      published: true,
      card_ev_threshold: 'Active wild reels cols 1-3 · R4 one-spin probe only',
      when_to_play: `**Primary play:**

- **Active wild reels in columns 1–3** (glowing border + **1–2** dollar icons = spins left)

**Reel 4 probe only:** **2 spins remaining** on R4 wild **and** **2+ dollars** in cols **1–3** ... **one spin** to try for a second wild, then stop.

**Never play** partial dollars without active wilds ... **not** Golden Egypt math. Wheel + WAP eat most of the RTP.`,
      when_to_stop: `Stop after **wild spins expire** or the **R4 probe** fails to fill a second wild.`,
      how_to_check: `Active wild borders and dollar-holder counts are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `**Two dollars in cols 1–3 without active wilds** is the classic trap ... looks like Golden Egypt but is not +EV here.`,
      risk_bullets: [],
      skins_markdown: `[Golden Egypt](guide:golden-egypt) (similar holders ... different payout mix).`,
      gameplay_mechanics: `**Wheel of Fortune 4D** (IGT) fills **dollar holders** with **2 coins = 2 wild spins** on that reel, plus frequent **Wheel Bonus** and **WAP** layers.`,
    },
  },
  {
    machine: {
      slug: 'wheel-of-fortune-4d-collectors-edition',
      name: "Wheel of Fortune 4D Collector's Edition",
      manufacturer: 'IGT',
      type: 'Column Credit Prize Collect',
      difficulty: 'Advanced',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: true,
      calculator_slug: 'wof-collectors-edition',
      volatility_index: 'High',
      popularity_summary: 'Weighted prizes 45x+ · simple total 70x+ spread',
      release_year: null,
    },
    guide: {
      title: "Wheel of Fortune 4D Collector's Edition",
      published: true,
      card_ev_threshold: 'Weighted column sum 45x+ · simple total 70x+ spread',
      when_to_play: `**Primary play (weighted method):**

- Adjusted sum **≥45× bet** (**R1×0.7**, **R2×0.9**, **R3×0.5**, **R4×1.0**, **R5×0.33**)

**Simple scout:** total prizes **≥70× bet**, spread across reels (favor **R2/R4**, not all equity on **R5**)

**AP tiers:** **3+ columns at 20×+ each**, **2+ at 30×+**, or **1 column at 70×+**

**Not** the same hunt as base **[Wheel of Fortune 4D](guide:wheel-of-fortune-4d)** wild-reel dollars.`,
      when_to_stop: `Stop after a **Collect** awards your targeted columns or prizes fall below threshold.`,
      how_to_check: `Credit prizes above each reel update as coins land. Divide column totals by bet for multiples. Cycle through all bets/denoms.`,
      risk_bankroll: `**200 units**`,
      risk_summary: `**Free games** lock column prizes and spam **Collect** ... most big wins need the bonus, so base-game collects can feel thin.`,
      risk_bullets: [],
      skins_markdown: `[Wheel of Fortune 4D](guide:wheel-of-fortune-4d) (wild-reel sister ... different AP).`,
      gameplay_mechanics: `**Wheel of Fortune 4D Collector's Edition** (IGT) builds **persistent credit prizes** above each reel; **Collect** symbols pay that column. **720 ways**. Prizes persist through **free games**.`,
    },
  },
]
