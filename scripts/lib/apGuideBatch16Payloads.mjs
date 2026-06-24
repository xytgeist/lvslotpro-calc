/** Batch 16 synth payloads. `mine-blast` omitted — shipped as **`captain-riches-tiki-fortune`** (batch 2). `new-years-parade` omitted — AP source flags not an AP slot. */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const BATCH16_PAYLOADS = [
  {
    machine: {
      slug: 'mighty-cash-spins',
      name: 'Mighty Cash Spins',
      manufacturer: 'Aristocrat',
      type: 'Persistent Spin Counters',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Very High',
      popularity_summary: 'Red 2× counter at bet-specific floor.',
      release_year: null,
    },
    guide: {
      title: 'Mighty Cash Spins',
      published: true,
      card_ev_threshold: 'Red 2× counter at/above bet floor (see body)',
      when_to_play: `**Primary play — Red 2× counter at or above:**

- **$0.75 bet:** **18+**
- **$1.60 bet:** **23+**
- **$2.50 bet:** **28+**
- **$3.40 bet:** **31+**
- **$8.80 bet:** **36+**

Match the threshold to the **exact bet** on the pad ... counters are per denom.`,
      when_to_stop: `Stop after the **Mighty Cash feature** you triggered completes and counters reset.`,
      how_to_check: `Read the **Red 2× counter** on the bet pad for each denom. Cycle through all **bets/denoms**.`,
      risk_bankroll: `**300 units**`,
      risk_summary: `Very volatile ... counters can sit near threshold forever before the feature pops. Size bankroll to the bet tier you are playing.`,
      risk_bullets: [],
      skins_markdown: `**Mighty Cash Spins**.`,
      gameplay_mechanics: `**Mighty Cash Spins** (Aristocrat Mighty Cash family) banks **persistent spin counters** (including a **Red 2×** tier) that feed hold-and-spin style bonuses. Thresholds scale with **bet size**.`,
    },
  },
  {
    machine: {
      slug: 'mining-mayhem-gold',
      name: 'Mining Mayhem Gold',
      manufacturer: 'AGS',
      type: 'Persistent Chest / Character Dig',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Characters one dig from chest · value by reel.',
      release_year: null,
    },
    guide: {
      title: 'Mining Mayhem Gold',
      published: true,
      card_ev_threshold: 'One-away dig + chest value by reel (10x–200x bet)',
      when_to_play: `**Primary play:** one or more characters **one dig away** from their chest **when chest value clears the reel-specific floor:**

- **Reels 1 & 5:** **≥10× bet**
- **Reels 2 & 4:** **≥50× bet**
- **Reel 3:** **≥200× bet**

**Combo hunts:** multiple one-away characters with strong combined value beat a single marginal reel-3 chase.

**Open-chest state:** chest just mined but character still one-away ... position persists into the **reset value** (not like Pillars of Cash full wipe).`,
      when_to_stop: `Stop after the **chest award** you were hunting pays and characters reset or climb away from one-away.`,
      how_to_check: `Read **character depth**, **chest credit values**, and **mouse-hand penalty icons** above each reel. Cycle all **bets/denoms**.`,
      risk_bankroll: `**250 units**`,
      risk_summary: `**Four spins without a nugget** on a reel starts the **mouse-hand climb** ... character moves **up** and can full-reset. Do not chase one-away if penalty timers are already hot.`,
      risk_bullets: [],
      skins_markdown: `**Mining Mayhem Gold**.`,
      gameplay_mechanics: `**Mining Mayhem Gold** (AGS) pairs **five persistent chests** with digging characters. **Gold nuggets** add credits and may dig down. Missed nuggets trigger a **reverse dig** timer (mouse-hand visuals) that erases progress.`,
    },
  },
  {
    machine: {
      slug: 'miss-kitty-wild-ride',
      name: 'Miss Kitty Wild Ride',
      manufacturer: 'Aristocrat',
      type: 'Expanding Grid Locked Wilds',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Locked framed wilds · expanded field.',
      release_year: null,
    },
    guide: {
      title: 'Miss Kitty Wild Ride',
      published: true,
      card_ev_threshold: 'Locked framed wilds · expanded field + edge diamonds',
      when_to_play: `**Primary play:**

- **Locked wilds in the middle reels** (**framed cat wilds**).
- **Expanded reel field** with **diamond markers at the edges** still showing ... means the enhanced layout is active.`,
      when_to_stop: `Stop when the **field shrinks back** to standard size and the **edge diamonds disappear** (feature window closed).`,
      how_to_check: `Look for **framed cat wilds** on the middle reels and whether the **grid is expanded** with **diamond edge indicators**. Cycle all **bets/denoms**.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `Thin AP writeup in sources ... treat as **scout-and-confirm** on the glass before committing size.`,
      risk_bullets: [],
      skins_markdown: `**Miss Kitty Wild Ride**.`,
      gameplay_mechanics: `**Miss Kitty Wild Ride** (Aristocrat) expands the standard Miss Kitty grid during hot states. **Framed cat wilds** lock in the middle reels while the **Wild Ride** layout (extra rows / diamond edges) is live.`,
    },
  },
  {
    machine: {
      slug: 'money-hits',
      name: 'Money Hits',
      manufacturer: 'Unknown',
      type: 'Must-Hit-By Progressives',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: '$50 / $150 / $1000 MHB bands.',
      release_year: null,
    },
    guide: {
      title: 'Money Hits',
      published: true,
      card_ev_threshold: '$50 @ $44+ · $150 @ $143+ · $1000 @ $970+',
      when_to_play: `**Primary play (must-hit-by meters):**

- **$50 progressive:** **$44.00+**
- **$150 progressive:** **$143–144+**
- **$1,000 progressive:** **$970–975+**

Play the **lowest bet** that qualifies for the meter you are hunting.`,
      when_to_stop: `Stop after the **progressive you played for hits** (or walk if the meter resets far below threshold).`,
      how_to_check: `Read all **three MHB values** on the glass. Cycle **bets/denoms** ... each tier may map to different reset bands.`,
      risk_bankroll: `**200 units**`,
      risk_summary: `Assume any meter can **run to cap** ... do not start unless bankroll survives a full climb on your tier.`,
      risk_bullets: [],
      skins_markdown: `**Money Hits**.`,
      gameplay_mechanics: `**Money Hits** runs **three linked must-hit-by progressives** ($50 / $150 / $1,000). Advantage is **entry vs cap** on the displayed meters, not base-game line hunts.`,
    },
  },
  {
    machine: {
      slug: 'money-in-the-bank',
      name: 'Money in the Bank',
      manufacturer: 'Konami',
      type: 'Persistent Bank Hold & Spin',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Bank 150x–200x bet on pad.',
      release_year: null,
    },
    guide: {
      title: 'Money in the Bank',
      published: true,
      card_ev_threshold: 'Bank 150x+ bet (200x cleaner)',
      when_to_play: `**Primary play:**

- **Bank value ≥150×** your bet on the pad (**200×+** is the cleaner floor).
- Trigger via **mystery** or **6+ gold coins** on the main reels.

**Shake the Bank** pays up to **75%** of the displayed bank; **Break the Bank** pays **100%** and resets the counter.`,
      when_to_stop: `Stop after **Hold & Spin** resolves (shake or break) and the bank resets to a lower seed value.`,
      how_to_check: `Read the **bank total on the bet pad** for each denom ... values differ per bet level. Cycle all **bets/denoms**.`,
      risk_bankroll: `**500 units**`,
      risk_summary: `Opportunity play, not a locked grind ... even at **200×** you may **not** break the bank on your attempt. Pig modifiers during H&S add variance.`,
      risk_bullets: [],
      skins_markdown: `**Money in the Bank**.`,
      gameplay_mechanics: `**Money in the Bank** (Konami) grows a **persistent bank** displayed on the bet pad. **Hold & Spin** (coin trigger or mystery) lets you **shake** (partial) or **break** (full) the bank. After extraction the bank reseeds and climbs again.`,
    },
  },
  {
    machine: {
      slug: 'money-island',
      name: 'Money Island',
      manufacturer: 'Unknown',
      type: 'Sticky Wilds + Uncapped FG Meters',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Very High',
      popularity_summary: 'Winner\'s Wave sticky wilds · Mini 24+.',
      release_year: null,
    },
    guide: {
      title: 'Money Island',
      published: true,
      card_ev_threshold: 'Winner\'s Wave sticky wilds · Mini 24+ · Minor 32+ · never Maxi',
      when_to_play: `**Primary play (sticky wilds — quick/low cost):**

- **Winner's Wave** showing above the **three middle reels** with **spins remaining** (active sticky wild window).

**Uncapped progressive free games (large bankroll only):**

- **Mini (orange) meter ≥ 24**
- **Minor (blue) meter ≥ 32**
- **Never chase Maxi (purple)**`,
      when_to_stop: `For sticky wilds: stop when **Winner's Wave hits 0** and wilds clear. For FG meters: stop after the **triggered free games** finish.`,
      how_to_check: `Read **Winner's Wave spins remaining** above reels **2–4** and **mini/minor/maxi FG counts** on the pad. Cycle all **bets/denoms**.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `Uncapped FG meters can **feel** closer as you feed coin-in but are **not** must-hit ... newer APs get wrecked chasing maxi. Sticky-wild spots are the safer lane.`,
      risk_bullets: [],
      skins_markdown: `**Money Island**.`,
      gameplay_mechanics: `**Money Island** pairs **three-spin sticky wild coins** on the middle reels (**Winner's Wave**) with **uncapped mini/minor/maxi free-games meters** fed from **reel-5** symbols. Skull wild coins can expand full reels for three spins; FG adds more sticky real estate.`,
    },
  },
  {
    machine: {
      slug: 'moon-spirit',
      name: 'Moon Spirit',
      manufacturer: 'IGT',
      type: '10-Spin Locked Frame Cycle',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Frames R2–R3 weighted · spin N/10 rules.',
      release_year: null,
    },
    guide: {
      title: 'Moon Spirit',
      published: true,
      card_ev_threshold: 'Left-side frames vs spin N/10 (see body)',
      when_to_play: `**10-spin cycle** ... locked frames go wild on spin **10**. **Never play 10/10**.

**By spin (frames on same row where noted):**
- **9/10:** **1 frame** reels **1–3**
- **8/10 · 7/10:** **2 frames** reels **1–3**, same row
- **6/10 · 5/10:** **3 frames** reels **1–3** OR **2 frames** reels **2–3** OR **3 connected** starting R1–2
- **4/10 · 3/10:** **4 frames** reels **1–3** OR **3 frames** reels **2–3** OR **3 connected** starting R1–2
- **2/10 · 1/10:** **5 frames** reels **1–3** OR **4 frames** reels **2–3** OR **3 connected** starting R1–2

**R2–R3 frames matter more** here than Scarab ... tenth-spin **lady-in-frame** can wild the left/right symbols for guaranteed **4 OAK**.`,
      when_to_stop: `Stop after **spin-10 wild burst** completes and the cycle resets.`,
      how_to_check: `Read **N/10 counter** (bottom-right on many installs) plus frame layout. Cycle all **bets/denoms**.`,
      risk_bankroll: `**40 units**`,
      risk_summary: `Final spin is **spikier** than Scarab/Diamond Mania thanks to **horizontal expanding wilds** ... mid-cycle abandoned **9/10** boards are often cheap +EV.`,
      risk_bullets: [],
      skins_markdown: `**Moon Spirit**.`,
      gameplay_mechanics: `**Moon Spirit** (IGT Scarab-family) locks **frames** over symbols for a **10-spin cycle**, then turns them wild on spin 10. **Lady/moon symbols** inside frames on the last spin can **spread wilds horizontally** to adjacent symbols.`,
    },
  },
  {
    machine: {
      slug: 'nights-dream-wheel',
      name: "NiGHTS Dream Wheel",
      manufacturer: 'Sega Sammy Creation',
      type: 'Persistent Wheel Fill',
      difficulty: 'Beginner',
      popularity: 'Rare',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Wheel ~75% full.',
      release_year: null,
    },
    guide: {
      title: "NiGHTS Dream Wheel",
      published: true,
      card_ev_threshold: 'Dream wheel ~75% full',
      when_to_play: `**Primary play:**

- **Dream wheel ≥ ~75% full** (visual fill on the wheel meter).`,
      when_to_stop: `Stop after the **wheel bonus** completes and the meter resets.`,
      how_to_check: `Estimate **wheel fill level** on the top meter. Cycle all **bets/denoms** if fill is per bet.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `Limited field data ... treat **75%** as a starting scout line, not a proven hard floor.`,
      risk_bullets: [],
      skins_markdown: `**NiGHTS Dream Wheel**.`,
      gameplay_mechanics: `**NiGHTS Dream Wheel** (Sega Sammy Creation) fills a **persistent bonus wheel** across spins until the feature triggers. Licensed **NiGHTS into Dreams** theme on a standard **5×3** layout.`,
    },
  },
]
