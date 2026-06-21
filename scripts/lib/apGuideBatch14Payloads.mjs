/** Batch 14 synth payloads. `lightning-and-the-thunder` omitted — AP stub only (storm mode, no numeric thresholds). */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const BATCH14_PAYLOADS = [
  {
    machine: {
      slug: 'lets-spin-lets-spin-vegas',
      name: "Let's Spin / Let's Spin Vegas",
      manufacturer: 'Gaming Arts',
      type: 'Persistent Let\'s / Spin Wheel',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Let\'s/Spin symbols off bottom row.',
      release_year: null,
    },
    guide: {
      title: "Let's Spin / Let's Spin Vegas",
      published: true,
      card_ev_threshold: 'Let\'s R1 not bottom · Spin R2 not bottom · Spin R3+R4 not bottom',
      when_to_play: `**Primary play:**

- **Let's symbol on reel 1** not on the **bottom row**.
- **Spin symbol on reel 2** not on the **bottom row**.
- **Spin symbols on reels 3 and 4** not on the **bottom row**.

Symbols persist **3 spins**, stepping **down one row** each spin after landing.`,
      when_to_stop: `Stop after the **concentric multiplier wheel** completes and persistent symbols clear.`,
      how_to_check: `Scan each reel row for **Let's** (R1 only) and **Spin** symbols. Cycle through all **bets/denoms** via the menu bet arrows (no ticket required on many installs).`,
      risk_bankroll: `**25 units**`,
      risk_summary: `Bottom-row symbols may be on their **last spin** ... treat bottom row as **no play** unless you are fine gambling one spin.`,
      risk_bullets: [],
      skins_markdown: `**Let's Spin**, **Let's Spin Vegas**.`,
      gameplay_mechanics: `**Let's Spin** (Gaming Arts, **243-way**) links reel symbols to **four concentric multiplier rings** (multiply together, up to **1,600×**). **Let's** on R1 plus **Spin** on R2 triggers the wheel; extra **Spin** symbols on R3–R5 add ring multipliers.`,
    },
  },
  {
    machine: {
      slug: 'life-of-luxury-hot-diamonds-far-east-fortunes-great-eagle-jungle-cats-mermaid-s-gold',
      name: 'Life of Luxury Hot Diamonds: Far East Fortunes / Great Eagle / Jungle Cats / Mermaid\'s Gold',
      manufacturer: 'Light & Wonder',
      type: 'Uncapped Car / Boat / Plane FG Meters',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Very High',
      popularity_summary: 'Car 40+ · boat 50+ · plane 65+ FG meters.',
      release_year: null,
    },
    guide: {
      title: 'Life of Luxury Hot Diamonds: Far East Fortunes / Great Eagle / Jungle Cats / Mermaid\'s Gold',
      published: true,
      card_ev_threshold: 'Car FG 40+ · boat 50+ · plane 65+',
      when_to_play: `**Primary play (uncapped progressive FG meters):**

- **Car free-games meter ≥ 40**.
- **Boat free-games meter ≥ 50**.
- **Plane free-games meter ≥ 65**.

Each meter is independent ... not must-hit-by.`,
      when_to_stop: `Stop after the **wheel picks car/boat/plane free games** and the triggered meter resets.`,
      how_to_check: `Read **car, boat, and plane FG counts** on the bet pad for each bet level. Cycle through all **bets/denoms**.`,
      risk_bankroll: `**200 units**`,
      risk_summary: `Uncapped meters can run **far past** breakeven before they hit ... chasing without a plan drains bankrolls fast.`,
      risk_bullets: [],
      skins_markdown: `**Far East Fortunes**, **Great Eagle**, **Jungle Cats**, **Mermaid's Gold**.`,
      gameplay_mechanics: `**Life of Luxury Hot Diamonds** (Light & Wonder) fills three **random-hit** FG progressives (car / boat / plane). Bonus wheel picks which FG runs; **Luxury Zone** on the middle row pays credit prizes and gems during the feature.`,
    },
  },
  {
    machine: {
      slug: 'lil-red',
      name: 'Lil Red',
      manufacturer: 'Light & Wonder',
      type: 'Colossal Reels Nudging Wilds',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Red wilds in first 3 columns.',
      release_year: null,
    },
    guide: {
      title: 'Lil Red',
      published: true,
      card_ev_threshold: 'Red wild symbols in columns 1–3',
      when_to_play: `**Primary play:**

- **Red wild symbols showing in the first three columns** (standard + colossal reel set).`,
      when_to_stop: `Stop after **nudging / bursting wilds** resolve and the board no longer shows red wilds in columns **1–3**.`,
      how_to_check: `Scan **columns 1–3** on both reel sets for **red wild** symbols. Cycle through all **bets/denoms**.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `Colossal-reel wilds can **tease and vanish** in one nudge ... do not chase after the red wilds are gone.`,
      risk_bullets: [],
      skins_markdown: `**Lil Red** (colossal-reels fairy-tale theme).`,
      gameplay_mechanics: `**Lil Red** (Light & Wonder / WMS colossal reels) pairs a **5×12 colossal reel** with standard reels. **Red wilds** nudge and burst across the colossal set; free spins add expanding wild behavior.`,
    },
  },
  {
    machine: {
      slug: 'lucky-buddha-lucky-wealth-cat',
      name: 'Lucky Buddha / Lucky Wealth Cat',
      manufacturer: 'IGT',
      type: '7-Spin Symbol Multipliers',
      difficulty: 'Beginner',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Two left-side multipliers with spins left.',
      release_year: 2020,
    },
    guide: {
      title: 'Lucky Buddha / Lucky Wealth Cat',
      published: true,
      card_ev_threshold: 'Two active left-side multipliers (not 0 games left)',
      when_to_play: `**Primary play:**

- **Two active multipliers on the left side** of the gold bowl (**5× / 6× / 7×** tiers) with **games remaining** (not **0**).

Right-side **3×** multipliers are optional ... left side drives the edge.`,
      when_to_stop: `Stop when **fewer than two left-side multipliers** remain active or all show **0 games remaining**.`,
      how_to_check: `Read **multiplier symbols above the bowl** and the **games-remaining count** on each. Cycle through all **bets/denoms**.`,
      risk_bankroll: `**30 units**`,
      risk_summary: `High-volatility line hits are **rare** ... most sessions lose until one **5×/6×/7×** line hit lands.`,
      risk_bullets: [],
      skins_markdown: `**Lucky Buddha**, **Lucky Wealth Cat**.`,
      gameplay_mechanics: `**Lucky Buddha** family (IGT, **30-line**) awards **7-spin multipliers** after line hits. Left-side tiers run **5×–7×**; right side is **3×**. Wheel bonus can add free spins or extra activated symbols.`,
    },
  },
  {
    machine: {
      slug: 'lucky-coin-link-asian-dreaming-atlantica',
      name: 'Lucky Coin Link: Asian Dreaming / Atlantica',
      manufacturer: 'IGT',
      type: 'Coin Holders / Re-Spin Feature',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '4 coins on low bets; bet-specific resets.',
      release_year: 2022,
    },
    guide: {
      title: 'Lucky Coin Link: Asian Dreaming / Atlantica',
      published: true,
      card_ev_threshold: 'Low bet 4/5 coins · 2nd-low 4/5 · never on top two bets',
      when_to_play: `**Primary play (bet-level specific):**

- **Lowest credit bet** (starts **0** coins): **4 coins** collected.
- **Second-lowest bet** (starts **1** coin): **4 coins** collected.

**Never play** the **top two bet levels** at four coins ... those resets start with **2–3** coins pre-filled and pay worse per coin.`,
      when_to_stop: `Stop after the **re-spin feature** completes (five holders filled) and coin counts reset for that bet level.`,
      how_to_check: `Read **coin count under each of five reels** on the bet pad. Cycle through all **bets/denoms** without touching the main screen on many installs.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `Playing **4 coins on every bet level** ignores different reset math ... top bets are **not** the same edge as the lowest tier.`,
      risk_bullets: [],
      skins_markdown: `**Asian Dreaming**, **Atlantica**.`,
      gameplay_mechanics: `**Lucky Coin Link** (IGT) fills **five coin holders** to trigger a **re-spin** with credits, wilds, free games, or progressives. Each bet level uses **different reels** and **different starting coin counts** after reset.`,
    },
  },
  {
    machine: {
      slug: 'lucky-empress-inca-empress',
      name: 'Lucky Empress / Inca Empress',
      manufacturer: 'IGT',
      type: 'Persistent Row Multipliers',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Very High',
      popularity_summary: 'Active 10×/12× or combined ≥10×.',
      release_year: null,
    },
    guide: {
      title: 'Lucky Empress / Inca Empress',
      published: true,
      card_ev_threshold: 'Active 10× or 12× · combined ≥10× · queue chase 10×/12×',
      when_to_play: `**Primary play:**

- **Active 10× or 12×** multiplier on a row (**NEXT PAY** showing).
- **OR combined active multipliers ≥ 10×** (e.g. **5× + 5×**, **8× + 3×**).
- **OR 10×/12× waiting in the queue** behind an active **5×/8×** you can burn through.

Do **not** play unrevealed **?** tiles.`,
      when_to_stop: `Stop after the **active multiplier fires** on a line hit and no qualifying **10×+** setup remains.`,
      how_to_check: `Read **revealed multipliers** and **NEXT PAY** labels beside each row. Cycle through all **bets/denoms**.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `Most spins pay **pennies even at 10×** ... you need the rare fat line hit to cover the grind.`,
      risk_bullets: [],
      skins_markdown: `**Lucky Empress**, **Inca Empress**.`,
      gameplay_mechanics: `**Lucky Empress** family (IGT) collects **three tiles per row** to reveal **2×–12×** multipliers that queue left-to-right. A line hit starting on that row consumes the active multiplier; new tiles refill the queue.`,
    },
  },
  {
    machine: {
      slug: 'lucky-haul-march-of-the-zombies',
      name: 'Lucky Haul / March of the Zombies',
      manufacturer: 'Light & Wonder',
      type: 'Persistent Shifting Wild Reels',
      difficulty: 'Beginner',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Low',
      popularity_summary: 'Wild reel on R2–R5 (shifts left).',
      release_year: null,
    },
    guide: {
      title: 'Lucky Haul / March of the Zombies',
      published: true,
      card_ev_threshold: 'Full wild reel on R2–R5',
      when_to_play: `**Primary play:**

- **Any full wild reel on reels 2–5** (persistent wild shifts **one reel left** each spin).

**Reel 1** wild reels fall off next spin ... not a play.`,
      when_to_stop: `Stop when **no wild reels remain on reels 2–5**.`,
      how_to_check: `Glance at the **bet pad** for **red full-reel wilds**. Cycle through all **bets/denoms**.`,
      risk_bankroll: `**15 units**`,
      risk_summary: `**2× wild reels** revert to normal wilds after **one spin** ... do not overstay once they downgrade.`,
      risk_bullets: [],
      skins_markdown: `**Lucky Haul**, **March of the Zombies**.`,
      gameplay_mechanics: `**Lucky Haul** family (Light & Wonder) turns a **full-reel wild** into a **persistent wild reel** that steps left each spin. Landing on upgrade/CB symbols can briefly make a **2× wild reel**.`,
    },
  },
  {
    machine: {
      slug: 'lucky-larrys-lobstermania-4-link-super-sallys-shrimpmania-4-link',
      name: "Lucky Larry's Lobstermania 4 Link / Super Sally's Shrimpmania 4 Link",
      manufacturer: 'IGT',
      type: 'Loot Awards / Coin Collection',
      difficulty: 'Intermediate',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Bonus/Jackpot loot · 1 coin ×3 · active loot.',
      release_year: 2019,
    },
    guide: {
      title: "Lucky Larry's Lobstermania 4 Link / Super Sally's Shrimpmania 4 Link",
      published: true,
      card_ev_threshold: 'Bonus or Jackpot loot · 1 coin on R2–R4 · active loot (1–2 spins left)',
      when_to_play: `**Primary play:**

- **Bonus or Jackpot Loot Award** showing above **any** of reels **2–4** (coins optional on Jackpot ... **1 coin** lowers variance).
- **One coin collected on each** of reels **2, 3, and 4**.
- **Active Loot Award** with **1–2 spins left** above a reel.

**One spin only:** completed loot (**0 spins left**) when hunting a replacement **Bonus/Jackpot** (see notes in form if you tighten this).`,
      when_to_stop: `Stop after you **trigger one Loot Award** (two coins collected on that reel).`,
      how_to_check: `Read **Loot Award type**, **spins remaining**, and **coin sub-symbols** above reels **2–4**. Cycle through all **bets/denoms**.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `**0-coin Jackpot** hunts bleed on tight floors ... collect **one coin on the Jackpot reel** unless you accept the variance.`,
      risk_bullets: [],
      skins_markdown: `**Lucky Larry's Lobstermania 4 Link**, **Super Sally's Shrimpmania 4 Link**.`,
      gameplay_mechanics: `**Lobstermania 4 Link** (IGT) displays **Loot Awards** above reels **2–4**. **Two coin sub-symbols** on a reel activate that award for the listed spin count. Awards swap when completed; **Bonus** and **Jackpot** are the premium targets.`,
    },
  },
  {
    machine: {
      slug: 'lucky-lemmings-stampede',
      name: 'Lucky Lemmings Stampede',
      manufacturer: 'Light & Wonder',
      type: 'Persistent Shifting Lemmings',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Stampede+ lemmings · 2 regular (not both R4).',
      release_year: 2025,
    },
    guide: {
      title: 'Lucky Lemmings Stampede',
      published: true,
      card_ev_threshold: 'Stampede / super stampede / jackpot lemming · 2 regular (not both R4)',
      when_to_play: `**Primary play:**

- **Any stampede, super stampede, or jackpot lemming** on reels **2–4** (not bottom row).
- **OR two regular lemmings** on reels **2–4** as long as **both are not on reel 4**.

Ignore **bottom-row** lemmings and **partial lemmings hanging above** the grid ... they will not shift down next spin.`,
      when_to_stop: `Stop after a **fox on reel 1 or 5** triggers lemming pays and the qualifying lemmings clear or shift off.`,
      how_to_check: `Scan **reels 2–4** for lemming types and row position. Cycle through all **bets/denoms**.`,
      risk_bankroll: `**25 units**`,
      risk_summary: `Lemmings **above the visible grid** look like incoming plays but **never drop** ... only count lemmings on the active board.`,
      risk_bullets: [],
      skins_markdown: `**Lucky Lemmings Stampede**.`,
      gameplay_mechanics: `**Lucky Lemmings Stampede** (Light & Wonder, **2025**) shifts lemming symbols **down one row** each spin on reels **2–4**. A **fox** on **R1 or R5** pays all lemming features; types include regular, stampede, super stampede, and jackpot lemmings.`,
    },
  },
]
