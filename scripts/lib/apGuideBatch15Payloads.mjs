/** Batch 15 synth payloads. `lunar-disc` omitted — already live on test (fortune-disc sister). */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const BATCH15_PAYLOADS = [
  {
    machine: {
      slug: 'lucky-pick-bumble-bee-leprechaun',
      name: 'Lucky Pick: Bumble Bee / Cash Tree / Leprechaun',
      manufacturer: 'Gaming Arts',
      type: 'Persistent Punch Board + FG',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '21-pick board · must finish FG bonus.',
      release_year: 2024,
    },
    guide: {
      title: 'Lucky Pick: Bumble Bee / Cash Tree / Leprechaun',
      published: true,
      card_ev_threshold: '3 wilds · 2 wilds + FG/mult · ≤7 picks left · all 21 revealed',
      when_to_play: `**Primary play (basic):**

- **Three wilds** revealed on the punch board.
- **Two wilds** plus **one multiplier and any other upgrade**, **4+ free games** revealed, or **five credit picks** revealed.
- **One wild** with **≤10 picks** still covered.
- **≤7 picks** remaining regardless of what is showing.

**Golden play:** **all 21 picks revealed** ... finish the free-games bonus before you leave.

**Aggressive (comps / competitive floors only):** two wilds · one wild with **≤11 picks** · **≤8 picks** left.`,
      when_to_stop: `Stop only after the **free-games bonus completes** and the board resets. Do not bail mid-build ... equity lives in the FG payout.`,
      how_to_check: `Count **revealed wilds, multipliers, free-game totals, and picks remaining** on the 21-spot board above the reels. Cycle through all **bets/denoms** via the menu bet arrows (no ticket required on many installs).`,
      risk_bankroll: `**600 units**`,
      risk_summary: `You must **play through to FG** ... average trigger is ~6 minutes but 30+ minutes happens. Deep boards with all picks open are where the edge pays.`,
      risk_bullets: [],
      skins_markdown: `**Lucky Pick Bumble Bee**, **Cash Tree**, **Leprechaun**.`,
      gameplay_mechanics: `**Lucky Pick** (Gaming Arts, **243-way**) hides **21 picks** above the reels. **Lucky Pick** symbols reveal credits or FG upgrades. **Three scatters** trigger free games where stacked wilds and multipliers spend the buildup; the board resets after FG with three non-credit picks auto-revealed.`,
    },
  },
  {
    machine: {
      slug: 'madonna-mighty-cash',
      name: 'Madonna: Mighty Cash',
      manufacturer: 'Aristocrat',
      type: 'Persistent Reel Multipliers + Mighty Cash',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Very High',
      popularity_summary: 'Combined multipliers 21x+ into Lucky Star.',
      release_year: 2019,
    },
    guide: {
      title: 'Madonna: Mighty Cash',
      published: true,
      card_ev_threshold: 'Combined reel multipliers 21x+',
      when_to_play: `**Primary play:**

- **Combined multiplier total ≥ 21×** across the five reels (**boost symbols** add **+1×** per reel up to **8×** each, max **40×** total).

**On the floor:** teens builds are common; **21×+** is where the Lucky Star bonus math gets interesting. Anything **20×+** gets snatched fast on competitive floors.`,
      when_to_stop: `Stop after the **Lucky Star (Mighty Cash) bonus** completes and multipliers reset.`,
      how_to_check: `Add the **multiplier values displayed above each reel**. Cycle through all **bets/denoms** ... state is per bet level.`,
      risk_bankroll: `**300 units**`,
      risk_summary: `Dry spells are real ... **$500–$1000+** coin-in before Lucky Star happens on higher bets. Base game pays are weak; you are paying for the Mighty Cash screen fill and Vogue wheel.`,
      risk_bullets: [],
      skins_markdown: `**Madonna: Mighty Cash**.`,
      gameplay_mechanics: `**Madonna** (Aristocrat / Gimmie Games, EDGE X) banks **per-reel multipliers** that carry into the **Lucky Star Mighty Cash** hold-and-spin. Fill the grid for a **Vogue wheel** spin with **2×/3×** boosts or progressives. Like a Virgin bonus is secondary for AP.`,
    },
  },
  {
    machine: {
      slug: 'magic-of-the-nile',
      name: 'Magic of the Nile',
      manufacturer: 'IGT',
      type: 'Obelisk Segment Persistent',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Two obelisks at 2/3 segments.',
      release_year: 2019,
    },
    guide: {
      title: 'Magic of the Nile',
      published: true,
      card_ev_threshold: 'Two obelisks with 2/3 segments filled',
      when_to_play: `**Primary play:**

- **Two of the three obelisks** each have **two of three segments** filled (**2-0-2** pattern).

**Not a play:** **2-1-1** (only one obelisk near trigger). Four total segments spread unevenly is weaker than **two obelisks one step away**.`,
      when_to_stop: `Stop after the **scarab-triggered feature** you were hunting resolves and segment counts drop below threshold.`,
      how_to_check: `Read **segment fill level on each obelisk** directly on the bet pad. No ticket required on most installs ... cycle all **bets/denoms**.`,
      risk_bankroll: `**75 units**`,
      risk_summary: `Scarab lands roughly **1 in 11 spins** ... you can grind deep chasing the fill. Individual features can pay small; free games are the big swing when they land.`,
      risk_bullets: [],
      skins_markdown: `**Magic of the Nile**.`,
      gameplay_mechanics: `**Magic of the Nile** (IGT) tracks **three obelisks** with **three segments** each. **Scarab symbols** fill segments; a full obelisk fires **random wilds**, **multiplier wilds**, **expanded reels**, or **free games**. Multiple scarabs on one spin can stack features.`,
    },
  },
  {
    machine: {
      slug: 'magic-rockets',
      name: 'Magic Rockets',
      manufacturer: 'IGT',
      type: 'Dual Money Ball Pots',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Very High',
      popularity_summary: 'Green 20+ · Gold 40+ (preliminary).',
      release_year: 2025,
    },
    guide: {
      title: 'Magic Rockets',
      published: true,
      card_ev_threshold: 'Green pot 20+ · Gold pot 40+',
      when_to_play: `**Primary play (preliminary thresholds ... new release):**

- **Green (Spin Boost) pot ≥ 20**.
- **Gold (Big Bang) pot ≥ 40**.

Combo plays with **both pots elevated** can beat either solo ... treat early field numbers as **starting points**, not gospel.`,
      when_to_stop: `Stop after **Big Bang** and/or **Spin Boost** completes and the pots reset.`,
      how_to_check: `Read **Green and Gold pot values** at the top of the screen. Cycle through all **bets/denoms**.`,
      risk_bankroll: `**500 units**`,
      risk_summary: `**2025 title** with limited logged data ... thresholds may move as more sessions land. High volatility; cascading pot triggers can spike or disappoint.`,
      risk_bullets: [],
      skins_markdown: `**Magic Rockets**.`,
      gameplay_mechanics: `**Magic Rockets** (IGT) evolves **Magic Treasures** with **two persistent Money Ball pots** (Green / Gold) instead of classic FG/jackpot layers. Bonuses are **Spin Boost** (reel enhancements) and **Big Bang** (credit explosions). Values persist per bet until triggered.`,
    },
  },
  {
    machine: {
      slug: 'magic-treasures-dragon-tiger',
      name: 'Magic Treasures: Dragon / Tiger',
      manufacturer: 'IGT',
      type: 'Money Balls Accumulator',
      difficulty: 'Advanced',
      popularity: 'Common',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '15+ Money Balls in bowl.',
      release_year: null,
    },
    guide: {
      title: 'Magic Treasures: Dragon / Tiger',
      published: true,
      card_ev_threshold: '15+ Money Balls collected',
      when_to_play: `**Primary play:**

- **≥15 Money Balls** in the green bowl counter (resets to **5** after the feature).

**Borderline:** **11–14** balls ... some APs camp here for comps; **15+** is the cleaner +EV floor.`,
      when_to_stop: `Stop after the **Money Balls bonus** finishes and the counter resets.`,
      how_to_check: `Read the **Money Ball count** in the bowl above the reels. Cycle through all **bets/denoms** ... popular machine, watch for vultures.`,
      risk_bankroll: `**500 units**`,
      risk_summary: `Feature triggers randomly on any collect spin (avg ~**11** balls collected when it pops). Cap **47** balls ... tight PAR installs make the line harder to hold.`,
      risk_bullets: [],
      skins_markdown: `**Dragon**, **Tiger**.`,
      gameplay_mechanics: `**Magic Treasures** (IGT) collects **Money Ball** symbols into a bowl. The bonus can fire on any spin with a collect; each ball becomes a board prize with random **2×/3×/5×** multipliers. Mini / major / maxi jackpots possible on the board.`,
    },
  },
  {
    machine: {
      slug: 'magic-treasures-gold-emperor-empress',
      name: 'Magic Treasures Gold: Emperor / Empress',
      manufacturer: 'IGT',
      type: 'Triple Money Ball Pots',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Very High',
      popularity_summary: 'Green 15+ · Blue 32+ · combo plays.',
      release_year: 2024,
    },
    guide: {
      title: 'Magic Treasures Gold: Emperor / Empress',
      published: true,
      card_ev_threshold: 'Green 15+ · Blue 32+ · Gold 45+ · Green+Blue 43+',
      when_to_play: `**Primary play (solo pots):**

- **Green treasure ≥ 15** Money Balls.
- **Blue (Purple) treasure ≥ 32** Money Balls.

**Combo plays:** **Green + Blue combined ≥ 43** ... cascading triggers can chain Green → Blue → Gold.

**Never chase Gold alone** at moderate counts ... highest tier, lowest hit rate.`,
      when_to_stop: `Stop after the triggered **pot bonus(es)** finish and meters reset (**5 / 10 / 15** baselines).`,
      how_to_check: `Read all **three pot counters** on the glass. Cycle through all **bets/denoms**.`,
      risk_bankroll: `**500 units**`,
      risk_summary: `Much swingier than original **Magic Treasures** ... purple-tier hunts can need **1000+ units** in practice. Cascades are feast-or-famine.`,
      risk_bullets: [],
      skins_markdown: `**Emperor**, **Empress**.`,
      gameplay_mechanics: `**Magic Treasures Gold** (IGT, **2024**) splits Money Balls into **Green / Blue / Gold** pots. Lower-tier hits can **cascade** into higher tiers in one event. **Empress** pays cash-spin style bonuses; **Emperor** leans free-games ... AP math is the same meter chase.`,
    },
  },
  {
    machine: {
      slug: 'magic-wishes',
      name: 'Magic Wishes',
      manufacturer: 'IGT',
      type: '10-Spin Locked Frame Cycle',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Frames left-side · deeper in 10-spin cycle.',
      release_year: 2021,
    },
    guide: {
      title: 'Magic Wishes',
      published: true,
      card_ev_threshold: 'Left-side frames vs spin N/10 (see card body)',
      when_to_play: `**10-spin cycle** ... all locked frames turn **wild on spin 10**. **Never play 10/10** (cycle just reset).

**By spin number (same row where noted):**
- **9/10:** **1 frame** in reels **1–3**
- **8/10 · 7/10:** **2 frames** in reels **1–3**, **same row**
- **6/10 · 5/10:** **3 frames** in reels **1–4**, **same row**
- **4/10 · 3/10:** **5 frames** in reels **1–3** OR **4 frames same row**
- **2/10 · 1/10:** **6 frames** in reels **1–3** OR **4 frames same row**

**Simplified scout:** lots of **left-side frames**, preferably **horizontal** for **4–5 OAK** ... deeper in the cycle needs fewer frames.`,
      when_to_stop: `Stop after **spin 10** wild burst completes and the cycle resets to **1/10**.`,
      how_to_check: `Read **N/10 cycle counter** plus **locked frame positions**. Cycle through all **bets/denoms**.`,
      risk_bankroll: `**40 units**`,
      risk_summary: `More volatile than **Scarab** ... the lamp can dump extra frames randomly. **3 OAK** pays weak ... hunt **4–5 OAK** line hits when frames go wild.`,
      risk_bullets: [],
      skins_markdown: `**Magic Wishes**.`,
      gameplay_mechanics: `**Magic Wishes** (IGT) runs a **10-spin persistent frame** cycle in the **Scarab family**. Frames lock on symbols and **all turn wild on spin 10**. Free games offer **15 FG with 5 random wilds** or **10 FG with 7–10 wilds** per spin.`,
    },
  },
  {
    machine: {
      slug: 'mammoth-legend',
      name: 'Mammoth Legend',
      manufacturer: 'Unknown',
      type: 'Coin Pick → Guaranteed Volcano',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Very High',
      popularity_summary: '1 coin left above R5.',
      release_year: null,
    },
    guide: {
      title: 'Mammoth Legend',
      published: true,
      card_ev_threshold: '1 coin remaining above reel 5',
      when_to_play: `**Primary play:**

- **One coin remaining** above **reel 5** (**"Next Bonus = Guaranteed Jackpot!"** on glass).

**Bonus symbol fully on reel 5** starts the pick ... each credit pick removes a coin until only Volcano remains.`,
      when_to_stop: `Stop after the **Volcano Bonus** (or Mammoth hold-and-spin if you triggered it) resolves.`,
      how_to_check: `Count **coins remaining** in the pick display above **reel 5**. Cycle **bets/denoms** if pick state is bet-specific.`,
      risk_bankroll: `**200 units**`,
      risk_summary: `**High-variance / possible AP trap.** Mini Volcano jackpot can **lose money** on the play. Logged sessions include long dry spells before the pick ... treat as **experienced bankroll only**.`,
      risk_bullets: [],
      skins_markdown: `**Mammoth Legend**.`,
      gameplay_mechanics: `**Mammoth Legend** uses a **five-coin pick** above **reel 5**. Credit picks remove coins; the last coin is always **Volcano**. Separate **Mammoth hold-and-spin** can hit on its own. Volcano guarantees a jackpot tier but **mini** may not cover coin-in.`,
    },
  },
  {
    machine: {
      slug: 'master-da-dang-jia-fine-fortunes-vivid-diamonds',
      name: 'Master Da Dang Jia: Fine Fortunes / Vivid Diamonds',
      manufacturer: 'Light & Wonder',
      type: 'Center Reel Multiplier + Coin Collect',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Center multiplier 5x+.',
      release_year: null,
    },
    guide: {
      title: 'Master Da Dang Jia: Fine Fortunes / Vivid Diamonds',
      published: true,
      card_ev_threshold: 'Center reel multiplier 5x+',
      when_to_play: `**Primary play:**

- **Center-reel multiplier ≥ 5×** on the bet pad.

**Master on reel 3** awards all **coin credit values × active multiplier**. Empty Master spins increment multiplier **+1×** (cap **18×**).`,
      when_to_stop: `Stop after **Master awards coins** or the multiplier resets post-feature.`,
      how_to_check: `Read the **multiplier above the middle reel** on the bet pad. Cycle through all **bets/denoms** without touching the main screen on many installs.`,
      risk_bankroll: `**300 units**`,
      risk_summary: `Can run the multiplier to **10×+** and whiff on **one or two small coins** ... free games and wheel mini/minor hits help over a long sample but single sessions swing hard.`,
      risk_bullets: [],
      skins_markdown: `**Fine Fortunes**, **Vivid Diamonds**.`,
      gameplay_mechanics: `**Master Da Dang Jia** (Light & Wonder) persists a **center-reel multiplier** (starts **1×**, max **18×**). **Master** nudges full reel wild, collects coins (including jackpots below **6×** mult), or bumps the multiplier when no coins land. Multiplier carries into **free games** and wheel spins.`,
    },
  },
]
