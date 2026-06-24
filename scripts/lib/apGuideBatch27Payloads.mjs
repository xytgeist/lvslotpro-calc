/** Batch 27 synth payloads - 3 skips (see _batch-progress.json batch 27 skipped). */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const BATCH27_PAYLOADS = [
  {
    machine: {
      slug: 'wheel-of-fortune-4d-more-money',
      name: 'Wheel of Fortune 4D More Money',
      manufacturer: 'IGT',
      type: 'Sliding Reel Multipliers',
      difficulty: 'Intermediate',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Yellow multipliers ≥24× total · or yellow up next',
      release_year: null,
    },
    guide: {
      title: 'Wheel of Fortune 4D More Money',
      published: true,
      card_ev_threshold: 'Yellow multipliers ≥24× total · or yellow up next',
      when_to_play: `**Primary play:**

- **Three yellow multipliers (≥6× each) totaling ≥24×** (e.g. three **8×**, or two **6×** + **12×**) ... **stop after one trigger**
- **Any yellow multiplier up next** (active border directly left of a yellow column)

**Not** the same hunt as **[Wheel of Fortune 4D](guide:wheel-of-fortune-4d)** wild dollars or **[Collector's Edition](guide:wheel-of-fortune-4d-collectors-edition)** column prizes.`,
      when_to_stop: `Stop after the **multiplier line hit** you chased, or when totals fall below threshold.`,
      how_to_check: `Multiplier values and sliding **active border** are above the reels. If the last spin was a win, the highlighted multiplier may still be live. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `Highlighted multiplier resets after the **next spin**, not on the paying line ... a win can look dead while the border is still hot.`,
      risk_bullets: [],
      skins_markdown: `[Wheel of Fortune 4D](guide:wheel-of-fortune-4d), [Wheel of Fortune 4D Collector's Edition](guide:wheel-of-fortune-4d-collectors-edition) (same WoF 4D brand ... different AP).`,
      gameplay_mechanics: `**Wheel of Fortune 4D More Money** (IGT) adds **+1×** per wild above each reel. The **bordered active multiplier** applies to all line wins, then slides **R1→R5** and wraps. Yellow tiers start around **6×+**.`,
    },
  },
  {
    machine: {
      slug: 'wheel-of-fortune-high-roller',
      name: 'Wheel of Fortune High Roller',
      manufacturer: 'IGT',
      type: 'Expanding Reel Premium Wheels',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Premium wheels 1-away on 8-high reels',
      release_year: null,
    },
    guide: {
      title: 'Wheel of Fortune High Roller',
      published: true,
      card_ev_threshold: 'Premium wheels 1-away · ways adjust ±1 tier',
      when_to_play: `**Ways adjust:** **>8000 ways** = play **one tier looser** · **<2500 ways** = **one tier tighter**

**Primary play (reels expand 3→8 high; HR on 8-high spins wheel above):**

- **? / 5× / 5-pointer wheels one away** (**8-high**) on **R1, R3, or R5**
- **Two** of the above **two away** (**7-high**)
- **One two away** on R1/3/5 **plus two three away** (**6-high**)
- **3×–4× / 3–4-pointer wheels one away** on **R2 or R4**
- **Two** R2/R4 premium wheels **two away**
- **4× or 4-pointer one away** on R1/3/5 **+ 2× or 2-pointer one away** on R2/R4

Skip reels about to **reset height** after an HR lands.`,
      when_to_stop: `Stop after the **wheel spin** you triggered pays or reel heights collapse below scout tier.`,
      how_to_check: `Reel heights and wheel types (**?**, multipliers, pointer counts) show above each column. Read **ways count** on the glass. Cycle through all bets/denoms.`,
      risk_bankroll: `**200 units**`,
      risk_summary: `**? wheels** look best long-run but often reveal weak **2× / 2-pointer** segments ... do not overpay for hype alone.`,
      risk_bullets: [],
      skins_markdown: `**Wheel of Fortune High Roller**.`,
      gameplay_mechanics: `**Wheel of Fortune High Roller** (IGT) grows reels with **High Roller** symbols to **8-high**, then spins **multi-pointer**, **multiplier**, or **?** wheels above the triggering column.`,
    },
  },
  {
    machine: {
      slug: 'wheel-of-fortune-wild-boost-silver-gold',
      name: 'Wheel of Fortune Wild Boost: Silver / Gold',
      manufacturer: 'IGT',
      type: 'Dual Wild Boost Pots',
      difficulty: 'Intermediate',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Single pot 14+ · both pots 20+ combined',
      release_year: null,
    },
    guide: {
      title: 'Wheel of Fortune Wild Boost: Silver / Gold',
      published: true,
      card_ev_threshold: 'Single pot 14+ · both pots 20+ · aggressive 12+/18+',
      when_to_play: `**Primary play:**

- **Any single pot ≥14 wilds** OR **both pots combined ≥20**

**Aggressive (higher RTP / card building):** **≥12** in one pot OR **≥18** combined

Green gem wilds collect from **center reel only**; shots land on **R2–R5**.`,
      when_to_stop: `Stop after the **Wild Boost pot** you chased fires its wild shower.`,
      how_to_check: `Wild counts in **left and right boost pots** (R1 / R5). Cycle through all bets/denoms.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `Big wheel wedges **look** generous ... small credit slices hit far more often than the art suggests.`,
      risk_bullets: [],
      skins_markdown: `**Silver**, **Gold**.`,
      gameplay_mechanics: `**Wheel of Fortune Wild Boost** (IGT) banks green gems into **two pots**; a trigger sprays collected wilds onto **R2–R5** with stacked **additive multipliers** up to **6×**. Pots cap at **35**, reset to **3** after a trigger.`,
    },
  },
  {
    machine: {
      slug: 'wheel-of-fortune-wild-spin-live',
      name: 'Wheel of Fortune Wild Spin Live',
      manufacturer: 'IGT',
      type: 'Coin Holder Wild Reels',
      difficulty: 'Intermediate',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Active wild reels cols 1-3 · R4 one-spin probe',
      release_year: null,
    },
    guide: {
      title: 'Wheel of Fortune Wild Spin Live',
      published: true,
      card_ev_threshold: 'Active wild reels cols 1-3 · R4 one-spin probe only',
      when_to_play: `**Primary play:**

- **Active wild reels in columns 1–3** (pink border + **1–2** coins in holder = spins left)

**Reel 4 probe only:** **2 spins remaining** on R4 wild **and** **2+ coins** in cols **1–3** ... **one spin** to try for a second wild, then stop.

**Never play** partial coins without active wilds ... same trap family as **[Golden Egypt](guide:golden-egypt)** but **not** +EV here.`,
      when_to_stop: `Stop after **wild spins expire** or the **R4 probe** fails to fill a second wild.`,
      how_to_check: `Pink active borders and coin-holder counts are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `**Single coins / partial holders** look like Golden Egypt setups but are **never** +EV on this WoF skin.`,
      risk_bullets: [],
      skins_markdown: `[Wheel of Fortune Wild Spin: Vacation / Night Life](guide:wheel-of-fortune-wild-spin-vacation-night-life) (frame-cycle sister ... different AP).`,
      gameplay_mechanics: `**Wheel of Fortune Wild Spin Live** (IGT) fills **coin holders** ... **2 coins = 2 wild spins** on that reel, plus WoF **wheel bonus** and jackpot layers.`,
    },
  },
  {
    machine: {
      slug: 'wheel-of-fortune-wild-spin-vacation-night-life',
      name: 'Wheel of Fortune Wild Spin: Vacation / Night Life',
      manufacturer: 'IGT',
      type: '10-Game Locked Frame Cycle',
      difficulty: 'Advanced',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: '10-spin frame cycle · game 9+ scout tiers',
      release_year: null,
    },
    guide: {
      title: 'Wheel of Fortune Wild Spin: Vacation / Night Life',
      published: true,
      card_ev_threshold: '10-game cycle frame tiers · simplified left-connected frames',
      when_to_play: `**Simplified scout:** lots of **left-side locked frames**, preferably **connected horizontally** for **4–5OAK** ... deeper in the **10-game cycle** = better.

**Detailed cycle tiers:**

- **Game 10/10:** **never**
- **Game 9/10:** **1 frame** in cols **1–3**
- **Game 8–7/10:** **2 frames** in cols **1–3**, **same row**
- **Game 6–5/10:** **3 frames** in cols **1–4**, **same row**
- **Game 4–3/10:** **5 frames** in cols **1–3** OR **4 same-row**
- **Game 2–1/10:** **6 frames** in cols **1–3** OR **4 same-row**

Mid-cycle walk-ups (already game **5–9**) are often the best value.`,
      when_to_stop: `Stop after **spin 10** wild-frame payout or frames clear below tier.`,
      how_to_check: `Locked **gold frame** count and **cycle position** (games remaining) are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `**Wheel scatters** can block line hits ... you need **4–5OAK** alignment, not just frame count.`,
      risk_bullets: [],
      skins_markdown: `**Vacation**, **Night Life**. [Wheel of Fortune Wild Spin Live](guide:wheel-of-fortune-wild-spin-live) (coin-holder sister).`,
      gameplay_mechanics: `**Wheel of Fortune Wild Spin** (IGT) runs a **10-game cycle**; all locked **gold frames** go wild on **spin 10**. Same AP on **Vacation** and **Night Life** themes.`,
    },
  },
  {
    machine: {
      slug: 'wild-explosion-get-cha-gold-get-cha-money-get-cha-reward-get-cha-treasure',
      name: "Wild Explosion: Get'Cha Gold / Get'Cha Money / Get'Cha Reward / Get'Cha Treasure",
      manufacturer: 'Konami',
      type: 'Persistent Red Wild Timers',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Very High',
      popularity_summary: 'Red wild timers R2-3 · R4 if timer 2-3',
      release_year: null,
    },
    guide: {
      title: "Wild Explosion: Get'Cha Gold / Get'Cha Money / Get'Cha Reward / Get'Cha Treasure",
      published: true,
      card_ev_threshold: 'Red wild timers R2-3 · R4 probe if timer 2-3',
      when_to_play: `**Primary play (Wild Explosion bet levels only):**

- **Red wild countdown timers on R2 or R3** (**3**, **2**, or **1** showing)
- **R4 red wild** only if timer is **2 or 3** ... **one spin** to try landing another red on **R2–R3**, then stop

Blue wilds (no timer) are **not** persistent.`,
      when_to_stop: `Stop after the **chain explosion** you chased pays or timers clear.`,
      how_to_check: `Red wild timer numbers on **R2–R4**. Confirm **Wild Explosion** bet level on the pad. Cycle through all bets/denoms.`,
      risk_bankroll: `**30 units**`,
      risk_summary: `Red wilds sometimes **fizzle at zero** with no blast ... a hot board can still whiff completely.`,
      risk_bullets: [],
      skins_markdown: `**Get'Cha Gold**, **Get'Cha Money**, **Get'Cha Reward**, **Get'Cha Treasure**.`,
      gameplay_mechanics: `**Wild Explosion** (Konami Get'Cha series) keeps **red wilds** for **3 spins**; at **0** one wild may explode up to **9** adjacent wilds and chain through **all** red wilds on the grid.`,
    },
  },
  {
    machine: {
      slug: 'wild-force-bison-sunrise',
      name: 'Wild Force: Bison Sunrise / Midnight Wolf',
      manufacturer: 'Konami',
      type: 'Locked Frame Wild Spark',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '5 horizontal locked · or 13 total locked',
      release_year: null,
    },
    guide: {
      title: 'Wild Force: Bison Sunrise / Midnight Wolf',
      published: true,
      card_ev_threshold: '5 horizontal locked frames · or 13 total locked',
      when_to_play: `**Primary play:**

- **5 locked frames connected horizontally**
- **OR 13 locked frames** anywhere (ignore frames labeled **"Wild"** ... they vanish next spin)

Favor boards starting from **R1**. Right-side-only clusters are weak. You need a **5-wild payline** shape for real pay.`,
      when_to_stop: `Stop after **Wild Spark** connects your frames or the board resets below threshold.`,
      how_to_check: `Count **locked frames** (not **Wild** labels) and **glowing connected borders**. Cycle through all bets/denoms.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `**"Wild" labeled frames look free** but disappear next spin ... do not count them toward **13**.`,
      risk_bullets: [],
      skins_markdown: `**Bison Sunrise**, **Midnight Wolf**.`,
      gameplay_mechanics: `**Wild Force** (Konami) locks frames until **Spin** on **R3** hits the selector wheel; **Wild Spark** wilds all frames connected **H/V** from the struck cell. **REELS CHANGED** every **3 spins** boosts Spark odds.`,
    },
  },
]
