/** Batch 22 synth payloads. Skipped: sea-story, spells-n-whistles, show-me-the-piggy (see _batch-progress.json). */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const BATCH22_PAYLOADS = [
  {
    machine: {
      slug: 'scarab-grand',
      name: 'Scarab Grand',
      manufacturer: 'IGT',
      type: 'Wild Stays 10-Spin Cycle',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '7+ frames · never spin 10',
      release_year: null,
    },
    guide: {
      title: 'Scarab Grand',
      published: true,
      card_ev_threshold: '7+ frames · never spin 10',
      when_to_play: `**Primary play:** left-heavy **gold frames** ... horizontal rows beat vertical stacks (**4- and 5-of-a-kind** pay, **3 of a kind** does not)

Memorize the rule-set below, or use the **7+ frames with any spins left** shortcut on busy floors.

| Spin # | Play when |
| --- | --- |
| **9** | **2+** frames in **R1–R3** |
| **7–8** | **3+** frames in **R1–R3**, **same row** |
| **5–6** | **5+** in **R1–R3** **or** **3+** same row in **R1–R4** |
| **3–4** | **6+** in **R1–R3** **or** **4+** same row |
| **1–2** | **7+** in **R1–R3** **or** **4+** same row |
| **10** | **Never** |

**Spin 9 abandoned** with **1+ frame** is often worth one coin-in.`,
      when_to_stop: `Stop after **spin 10** resolves (frames clear and counter resets to **1**).`,
      how_to_check: `Spin counter and gold frames are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**10 units**`,
      risk_summary: `Taller **7-row** reel set than base **Scarab** ... same cycle logic, but you need more frames early and stronger horizontal alignment late.`,
      risk_bullets: [],
      skins_markdown: `[Scarab](guide:scarab)`,
      gameplay_mechanics: `**Scarab Grand** (IGT) uses the **Wild Stays, Charges, Then Pays** **10-spin** cycle on a taller grid. **Scarab symbols** lock **gold frames** through spins **1–9**; spin **10** turns all framed spots **wild**, then the board clears. Full-board frames pay **1000x** bet.`,
    },
  },
  {
    machine: {
      slug: 'scarab-link',
      name: 'Scarab Link',
      manufacturer: 'IGT',
      type: 'Wild Stays + Link Progressive',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '5+ R1-R3 · 7+ R1-R4 · connected frames',
      release_year: 2021,
    },
    guide: {
      title: 'Scarab Link',
      published: true,
      card_ev_threshold: '5+ R1-R3 · 7+ R1-R4 · 3+ connected frames',
      when_to_play: `**Primary play:** **10-spin** gold-frame cycle plus **Link** jackpots ... hunt **connected** frames for line pays, not scattered stacks.

| Cycle band | Play when |
| --- | --- |
| **Early (1–3)** | **5+** framed spots in **R1–R3** |
| **Mid (4–6)** | **7+** framed spots in **R1–R4** |
| **Late (7–9)** | **3+** frames **connected left to right**, starting **R1 or R2** |
| **10** | **Never** |

**Never spin 10** ... same dead-end rule as **[Scarab](guide:scarab)**.`,
      when_to_stop: `Stop after **spin 10** resolves or the **Link hold-and-respin** you triggered finishes.`,
      how_to_check: `Frame counter and spin number are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**15 units**`,
      risk_summary: `Link progressive boards get **vultured** ... a half-built frame cycle can disappear while you walk the row.`,
      risk_bullets: [],
      skins_markdown: `[Scarab](guide:scarab), [Scarab Grand](guide:scarab-grand)`,
      gameplay_mechanics: `**Scarab Link** (IGT, **2021**) pairs the **10-spin** gold-frame cycle with **Link** hold-and-respin jackpots (**Mini–Grand**) and optional **free-games picks** (more spins vs more random wilds).`,
    },
  },
  {
    machine: {
      slug: 'scared-deer',
      name: 'Sacred Deer / Epic Lion',
      manufacturer: 'Konami',
      type: 'Expanding Reel Ways Hunt',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '10k+ ways · R1-R3 full height + gold chevron',
      release_year: null,
    },
    guide: {
      title: 'Sacred Deer / Epic Lion',
      published: true,
      card_ev_threshold: '10k+ ways · R1-R3 full height + gold chevron',
      when_to_play: `**Primary play:**

- **10,000+ ways** on the counter (read the chevron caveat below first)
- **R1–R3 full height (8 tall)** with the **gold chevron filled** above that reel
- **R1–R3 all seven symbols tall**

**Chevron rule:** a **full-height reel** without a **filled gold chevron** shrinks to **four tall** next spin ... count it as **four tall**, not eight. The **ways number** on glass can lie.`,
      when_to_stop: `Stop after the **free-games bonus** you triggered finishes (reels snap back to pre-bonus heights).`,
      how_to_check: `Reel heights, chevrons, and ways count are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**30 units**`,
      risk_summary: `The **ways readout** can show **10,000+** while a **full-height reel** is about to collapse because the **chevron is empty**.`,
      risk_bullets: [],
      skins_markdown: `**Epic Lion**, **Sacred Deer**.`,
      gameplay_mechanics: `**Epic Lion / Sacred Deer** (Konami) grows reel height with **ways arrows**. **Eight-tall** reels can stick for one spin and swap to a **premium-heavy reel strip** when the **chevron is gold**. **Two premium symbols** (lion or deer) pay a line.`,
    },
  },
  {
    machine: {
      slug: 'screaming-mansion',
      name: 'Screaming Mansion',
      manufacturer: 'Light & Wonder',
      type: 'Persistent Candle / Balloon Hunt',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: '3x2 candles · 7+ total lit',
      release_year: null,
    },
    guide: {
      title: 'Screaming Mansion',
      published: true,
      card_ev_threshold: '3 reels × 2 candles · 7+ total lit',
      when_to_play: `**Primary play:**

- **Three reels** with **two lit candles** each (**six** on those reels, not counting three-candle reels)
- **Seven total lit candles** anywhere on the board

**Card-build / higher-RTP floors:** **six total lit candles** anywhere.

**Do not count** reels already at **three lit candles** ... they **reset to zero** next spin. Balloons and bats above the reels refresh every spin (only the **candles** persist).`,
      when_to_stop: `Stop after the **Screaming Jackpot wheel** or balloon payout you triggered finishes.`,
      how_to_check: `Lit candles per reel are above the reel strips. Cycle through all bets/denoms.`,
      risk_bankroll: `**25 units**`,
      risk_summary: `Reels at **three lit candles** look loaded but **zero out** next spin ... they are not part of your candle count.`,
      risk_bullets: [],
      skins_markdown: `**Screaming Mansion**.`,
      gameplay_mechanics: `**Screaming Mansion** (Light & Wonder) lights **candles** above each reel. **Three candles** award **credit balloons** or a **bat** that can trigger the **Screaming Jackpot** staircase wheel (**5x–60x** bet, **Grand** at the top).`,
    },
  },
  {
    machine: {
      slug: 'sea-story-fluffy-treasure',
      name: 'Sea Story: Fluffy Treasure',
      manufacturer: 'Sega Sammy',
      type: 'Persistent Bubble Grid',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '20x+ bubble value · queue chases',
      release_year: null,
    },
    guide: {
      title: 'Sea Story: Fluffy Treasure',
      published: true,
      card_ev_threshold: '20x+ bubble value · queue chases',
      when_to_play: `**Primary play:**

- **20x+ bet** in live bubble credit value (multiply **large bubble** spaces ... a **2×2** at **15x** counts as **60x**). **Top-row bubbles** leave next spin ... do not count them toward the **20x** floor.
- **Stock-area chases** when the board is thin: **LARGE** tag, **red credit** bubbles (**30x–500x**), **free games**, **minor jackpot** bubble (**30x+ bet** at your denom), or **clump** groups (**2–5** blank bubbles queued together).
- **One-spin chase:** **large (2×2+)** or **red** bubble on the **top row** about to move off-screen (oyster-shell bubble bonus shot).

**Special Gyoguun Time** bank countdown ... do not change how you hunt. Treat it as theater until field proof says otherwise.`,
      when_to_stop: `Stop after the **bubble prize**, **bubble bonus**, or **free games** you triggered pays.`,
      how_to_check: `Bubble grid, credit values, and the five-bubble stock queue are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**75 units**`,
      risk_summary: `**Mini and minor jackpot bubbles** pay **fixed dollars** ... they must read **30x+ your bet** at the denom you are on.`,
      risk_bullets: [],
      skins_markdown: `**Sea Story: Fluffy Treasure**.`,
      gameplay_mechanics: `**Sea Story: Fluffy Treasure** (Sega Sammy) moves **persistent bubbles** up one row per spin. A bubble pays when it lands on a **pearl**. Triggered bubbles **duplicate** (except **free games**). An **oyster shell** above the reels can close when bubbles exit and award the **bubble bonus**.`,
    },
  },
  {
    machine: {
      slug: 'silver-dollar-shootout',
      name: 'Silver Dollar Shootout',
      manufacturer: 'Ainsworth',
      type: 'Dual-Side Meter Shootout',
      difficulty: 'Advanced',
      popularity: 'Rare',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '4 vs 5 counters · both sides 5',
      release_year: null,
    },
    guide: {
      title: 'Silver Dollar Shootout',
      published: true,
      card_ev_threshold: '4 vs 5 counters · both sides 5',
      when_to_play: `**Primary play (preliminary):**

- **One side at 4, the other at 5** on lower-RTP installs
- **Both sides at 5** on other programs

Field certainty is still soft ... treat thresholds as **RTP-dependent** until your floor confirms the meter behavior.`,
      when_to_stop: `Stop after the **shootout feature** you triggered finishes.`,
      how_to_check: `Left and right side counters are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**40 units**`,
      risk_summary: `Not every **Ainsworth shootout** title is a confirmed AP slot ... verify the meter actually persists before you size up.`,
      risk_bullets: [],
      skins_markdown: `**Silver Dollar Shootout**.`,
      gameplay_mechanics: `**Silver Dollar Shootout** (Ainsworth) tracks **two side meters** that build toward a **shootout bonus**. Meter targets and RTP settings change when each side is allowed to trigger.`,
    },
  },
  {
    machine: {
      slug: 'spartacus',
      name: 'Spartacus',
      manufacturer: 'Light & Wonder',
      type: 'Colossal Reels Wild Hunt',
      difficulty: 'Intermediate',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Golden wilds all R1-R3',
      release_year: 2012,
    },
    guide: {
      title: 'Spartacus',
      published: true,
      card_ev_threshold: 'Golden wilds all R1-R3',
      when_to_play: `**Primary play:**

- **Golden wild symbols in all three main-reel columns** (standard **5×4** set plus the **Colossal Reels** panel)

This is a simple board read ... if every main column shows gold wilds, sit.`,
      when_to_stop: `Stop after the **free-games or colossal feature** you triggered finishes.`,
      how_to_check: `Main-reel wild state is on the primary screen (colossal panel is secondary). Cycle through all bets/denoms.`,
      risk_bankroll: `**20 units**`,
      risk_summary: `Most APs only care about the **main 5×4 wild stack** ... do not chase colossal-only gold unless your floor's write-up says otherwise.`,
      risk_bullets: [],
      skins_markdown: `**Spartacus** (base colossal-reels title).`,
      gameplay_mechanics: `**Spartacus** (Light & Wonder / WMS lineage, **2012**) pairs a **5×4** main set with **Colossal Reels** for oversized symbols and **free games**.`,
    },
  },
]
