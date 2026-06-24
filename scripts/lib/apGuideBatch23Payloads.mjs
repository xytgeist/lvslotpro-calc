/** Batch 23 synth payloads. `sun-of-ra` omitted (see _batch-progress.json skipped). */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const BATCH23_PAYLOADS = [
  {
    machine: {
      slug: 'sphinx-4d',
      name: 'Sphinx 4D',
      manufacturer: 'IGT',
      type: '4D Wild Sphere Expand',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Wild spheres R2-R3 · top rows R1/R4',
      release_year: null,
    },
    guide: {
      title: 'Sphinx 4D',
      published: true,
      card_ev_threshold: 'Wild spheres R2-R3 · top rows R1/R4',
      when_to_play: `**Primary play:**

- **Wild spheres on R2 or R3** that are **not on the bottom row** (most expand room when they hit the **lion / lioness** symbol)
- **Wild spheres on R1 or R4** in the **top two rows**

Spheres **move down** each spin ... unlike **Ocean Magic** bubbles that rise.`,
      when_to_stop: `Stop when **R1/R4 spheres** reach the **second row from the bottom** (not enough room to expand profitably).`,
      how_to_check: `Wild sphere positions and day/night mode are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**15 units**`,
      risk_summary: `**Day mode** expands on the **yellow lion** ... **night mode** on the **blue lioness**. Scout the mode before you count spheres.`,
      risk_bullets: [],
      skins_markdown: `**Sphinx 4D**.`,
      gameplay_mechanics: `**Sphinx 4D** (IGT) drops **wild spheres** that move **down one row per spin**. Landing on the premium lion symbol expands wilds to surrounding positions. **4D gestures** (circle for day/night, butterfly bonus tease) are novelty only.`,
    },
  },
  {
    machine: {
      slug: 'spy-vs-spy',
      name: 'Spy vs Spy',
      manufacturer: 'WMS',
      type: 'Versus Meter Chase',
      difficulty: 'Intermediate',
      popularity: 'Rare',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Low',
      popularity_summary: 'Top-screen meters 1000+ credits',
      release_year: null,
    },
    guide: {
      title: 'Spy vs Spy',
      published: true,
      card_ev_threshold: 'Top-screen meters 1000+ credits',
      when_to_play: `**Primary play:**

- **Combined spy meters on the top screen at 1000+ credits** (readable from a distance ... no bet-pad tap needed)

**Versus mode:** whichever spy is **in control** builds that color's meter when its character lands **center column**. **Black spy** pays heavier (black **7** scales higher than white **7**).

Some APs play lower totals ... **1000 credits** is the conservative floor.`,
      when_to_stop: `Stop after the **versus payout streak** you triggered finishes or the controlling spy **loses control**.`,
      how_to_check: `Top-screen black/white meter totals are visible from the aisle. Cycle through all bets/denoms if you coin in.`,
      risk_bankroll: `**20 units**`,
      risk_summary: `**Min-bet** grinds vs **max-bet** streak hunting trade marginal edge for jackpot eligibility ... pick one style and stay consistent.`,
      risk_bullets: [],
      skins_markdown: `**Spy vs Spy**.`,
      gameplay_mechanics: `**Spy vs Spy** (WMS) runs **versus mode** with **white vs black spy meters** on the top screen. Center-column character hits while a spy is in control raise that meter and can pay stored values. A **wild** can bump every meter at once.`,
    },
  },
  {
    machine: {
      slug: 'star-goddess',
      name: 'Star Goddess',
      manufacturer: 'IGT',
      type: 'Portal Lock Persistent Frames',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '5+ portals rows 1-2 · Portal Lock on',
      release_year: null,
    },
    guide: {
      title: 'Star Goddess',
      published: true,
      card_ev_threshold: '5+ portals rows 1-2 · Portal Lock on',
      when_to_play: `**Primary play (Portal Lock bet active):**

- **5+ portal frames** in the **first two rows**
- **3+ frames** in **R1–R3**
- **5+ frames** in **R1–R4**
- **7+ frames** anywhere **not all stacked on R4–R5**

**Portals locked** must show at the bottom of the screen.`,
      when_to_stop: `Stop after the **meteor / fireball bonus** clears all frames or your frame chase pays.`,
      how_to_check: `Portal Lock indicator and frame grid are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**200 units**`,
      risk_summary: `Base bet can flash frames that **do not persist** ... if **Portals locked** is not lit, walk past it.`,
      risk_bullets: [],
      skins_markdown: `[Wu Dragon](guide:wu-dragon)`,
      gameplay_mechanics: `**Star Goddess** (IGT) uses **Portal Lock** on the enhanced bet: premium hits leave **persistent frames** until a **meteor** strikes. A hit on a frame turns that spot and neighbors wild and can convert **all frames** wild for one spin.`,
    },
  },
  {
    machine: {
      slug: 'sumo-kitty-lucha-kitty',
      name: 'Sumo Kitty / Lucha Kitty',
      manufacturer: 'Konami',
      type: 'Connected Gold Frame Coins',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '6+ connected gold frames',
      release_year: null,
    },
    guide: {
      title: 'Sumo Kitty / Lucha Kitty',
      published: true,
      card_ev_threshold: '6+ connected gold frames',
      when_to_play: `**Primary play:**

- **Six or more connected gold frames** with **no credit values already sitting in them**

Thin **gold outlines** from last spin's coins become solid frames next spin ... near-miss clumps can connect on one coin-in.`,
      when_to_stop: `Stop after the **coin transfer** you triggered pays (frames clear next spin).`,
      how_to_check: `Gold frame grid is on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**75 units**`,
      risk_summary: `Credit hits are **random** (tiny fraction of bet up to **mini/minor**) ... most frames whiff before the occasional monster coin.`,
      risk_bullets: [],
      skins_markdown: `**Sumo Kitty**, **Lucha Kitty**.`,
      gameplay_mechanics: `**Sumo Kitty / Lucha Kitty** (Konami) locks **connected gold frames**. A **coin symbol** in the clump copies its value across every connected frame, then the frames disappear next spin.`,
    },
  },
  {
    machine: {
      slug: 'super-bowl-jackpots',
      name: 'Super Bowl Jackpots',
      manufacturer: 'Light & Wonder',
      type: '2-Minute Drill Bank Hunt',
      difficulty: 'Advanced',
      popularity: 'Common',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: '2-Min Drill active · 1+ box filled',
      release_year: null,
    },
    guide: {
      title: 'Super Bowl Jackpots',
      published: true,
      card_ev_threshold: '2-Min Drill active · 1+ box filled',
      when_to_play: `**Primary play:**

- **2-Minute Drill timer active** with **at least one collected prize** in the **four boxes above the reels**

Collected prizes **persist per bet level** after the drill ends ... that leftover equity is the hunt.

**Tighter variance:** skip plays where total collected equity is **below one bet**.`,
      when_to_stop: `Stop after you **award the four-box ladder** or the drill clears your collected prizes on a blank spin.`,
      how_to_check: `Drill timer, four-box ladder, and per-bet collected values require a **checker ticket** to scout every bet/denom. Tap a **different bet key** than last played to bypass team pick when rushing the bank.`,
      risk_bankroll: `**25 units**`,
      risk_summary: `The **drill itself** is not +EV ... do not fast-spin the full two minutes hoping for magic. You are buying **partially filled ladders** only.`,
      risk_bullets: [],
      skins_markdown: `**Super Bowl Jackpots** (2-Minute Drill skin).`,
      gameplay_mechanics: `**Super Bowl Jackpots** (Light & Wonder) runs a bank-wide **2-Minute Drill** every **22–26 minutes**. Credit prizes stack into **four boxes** ... fill all four on consecutive hits to collect. **Jackpots** can land in the ladder too.`,
    },
  },
  {
    machine: {
      slug: 'super-colossal-reels-spartacus-lil-red-the-red-riders-mysteries-of-ra',
      name: 'Super Colossal Reels',
      manufacturer: 'Light & Wonder',
      type: 'Colossal Reels Golden Wild Hunt',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Golden wilds R1-R3 · full-reel gold',
      release_year: null,
    },
    guide: {
      title: 'Super Colossal Reels',
      published: true,
      card_ev_threshold: 'Golden wilds R1-R3 · full-reel gold',
      when_to_play: `**Primary play:**

- **Golden wilds in R1–R3** on the **bottom 5×4 reelset**
- **Full-reel (four tall) golden wilds** on the bottom set (they **transfer to the colossal panel**)

Only scout bet levels that show **Golden Wilds** on the bet pad (**~10 per machine**). **Blue-background theme wilds** (non-gold) are **not** persistent.`,
      when_to_stop: `Stop after the **colossal transfer spin** you chased resolves.`,
      how_to_check: `Golden wild positions on the lower reelset and **Golden Wilds** bet-pad flags. Cycle through all bets/denoms.`,
      risk_bankroll: `**20 units**`,
      risk_summary: `Bill acceptors on these cabinets are notoriously **janky** ... some APs skip the whole family rather than fight ticket jams.`,
      risk_bullets: [],
      skins_markdown: `**Spartacus**, **Li'l Red**, **Red Riders**, **Mysteries of Ra** · see also [Spartacus](guide:spartacus).`,
      gameplay_mechanics: `**Super Colossal Reels** (Light & Wonder / WMS) pairs a **5×4 main set** with a **colossal panel**. **Golden wilds** persist one spin on eligible bets; **full-column gold** copies up to the colossal reels for oversized line potential.`,
    },
  },
  {
    machine: {
      slug: 'super-lit-vegas-fortune-spin',
      name: 'Super Lit Vegas / Fortune Spin',
      manufacturer: 'Ainsworth',
      type: '7-Spin Orb Wild Cycle',
      difficulty: 'Intermediate',
      popularity: 'Rare',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Spin 7 · 8+ orbs · R1-R3 cluster',
      release_year: null,
    },
    guide: {
      title: 'Super Lit Vegas / Fortune Spin',
      published: true,
      card_ev_threshold: 'Spin 7 · 8+ orbs · R1-R3 cluster',
      when_to_play: `**Primary play:**

- Approaching **spin 7 of 7** with **8+ lit orb spots** (wheel spin threshold) anywhere on the grid
- **Spin 7** with **clustered orbs in R1–R3** even if you miss the wheel count (line-pay shot)

Wheel multipliers at **10 / 12 / 14 / 16+ orbs** pay **2x / 3x / 5x / 10x** respectively.`,
      when_to_stop: `Stop after **spin 7** resolves (orbs clear and counter resets).`,
      how_to_check: `Orb positions and spin counter are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**10 units**`,
      risk_summary: `**10x wheel** exists but is rare ... most wins are small line hits plus modest wheel spins.`,
      risk_bullets: [],
      skins_markdown: `**Super Lit Vegas**, **Fortune Spin**.`,
      gameplay_mechanics: `**Super Lit Vegas** (Ainsworth) collects **electric orbs** across a **7-spin cycle**. Lit positions turn **wild on spin 7**. **8+ orbs** awards a **multiplier wheel** spin before wilds resolve.`,
    },
  },
  {
    machine: {
      slug: 'super-winning-streak-lion-eyes-wolf-eyes',
      name: 'Super Winning Streak: Lion Eyes / Wolf Eyes',
      manufacturer: 'Light & Wonder',
      type: 'Persistent Wild Streak Hunt',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Streak active · wilds R1-R4',
      release_year: null,
    },
    guide: {
      title: 'Super Winning Streak: Lion Eyes / Wolf Eyes',
      published: true,
      card_ev_threshold: 'Streak active · wilds R1-R4',
      when_to_play: `**Primary play:**

**Active winning streak** (meter below reels):
- **Lion/wolf head tab + first Any Win tab** both purple-bordered, **or**
- **Lion/wolf head tab alone** with persistent wilds in **R1–R4**

**Persistent wilds only** (down-arrow circle icon):
- Any persistent wilds in **R1–R4**
- **R5** only if **10x+ bet** credit/jackpot wilds or **special wilds** (Wild Blast, Lion/Wolf Blast, Double Spins, Unicow)

Wilds **without the down arrow** vanish next spin. Bottom-row wilds **fall off** next spin ... do not count them.`,
      when_to_stop: `Stop after the **7 free spins** (plus streak extensions) you triggered finish.`,
      how_to_check: `Streak meter tabs and wild head icons (down arrow = persistent) are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**25 units**`,
      risk_summary: `**R5 special wilds** can pay huge but you are often buying **one spin** with no streak safety net.`,
      risk_bullets: [],
      skins_markdown: `**Lion Eyes**, **Wolf Eyes**.`,
      gameplay_mechanics: `**Super Winning Streak** (Light & Wonder) moves **persistent lion/wolf wilds** down one row per spin. A line hit involving a head starts a **streak meter** ... **three consecutive line hits** trigger **7 free spins**, with streak length boosting the entry count.`,
    },
  },
  {
    machine: {
      slug: 'sure-fire-jackpot-link',
      name: 'Sure Fire Jackpot Link',
      manufacturer: 'Ainsworth',
      type: 'Linked Must-Hit-By Progressive',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'MHB 95%+ · Hot $45+',
      release_year: null,
    },
    guide: {
      title: 'Sure Fire Jackpot Link',
      published: true,
      card_ev_threshold: 'MHB 95%+ · Hot $45+',
      when_to_play: `**Primary play:**

- **Must-hit-by meter at 95%+** on your target tier

**Tier labels (typical dollar anchors):** **Hot $45+**, **Sizzling $90+**, **Red Hot $180+** ... confirm on glass at your casino.

Linked banks (**~4 machines**) share the progressive ... scout the seat you can defend.`,
      when_to_stop: `Stop after the **must-hit progressive** you chased awards.`,
      how_to_check: `MHB meter and tier name are on the main screen / top box. Cycle through all bets/denoms on the linked bank.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `On a **link bank**, another player can **steal the must-hit** while you are cycling bets ... do not wander mid-chase.`,
      risk_bullets: [],
      skins_markdown: `**Sure Fire Jackpot Link**.`,
      gameplay_mechanics: `**Sure Fire Jackpot Link** (Ainsworth) runs **linked must-hit-by** progressives with **Hot / Sizzling / Red Hot** style tiers. Meters climb until the configured **must-hit ceiling** forces an award.`,
    },
  },
]
