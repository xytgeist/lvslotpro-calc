/** Batch 20 synth payloads — Ryan voice rules (omit where_to_find). */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const BATCH20_PAYLOADS = [
  {
    machine: {
      slug: 'quick-spin-mai-tai-money',
      name: 'Quick Spin Mai Tai Money',
      manufacturer: 'Ainsworth',
      type: 'Persistent Drink-Glass Multipliers',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: '4 glass multipliers sum 15+.',
      release_year: 2023,
    },
    guide: {
      title: 'Quick Spin Mai Tai Money',
      published: true,
      card_ev_threshold: 'Drink-glass multipliers sum 15+',
      when_to_play: `**Primary play:**

- **Sum of all four drink-glass multipliers is 15+** above the reels.`,
      when_to_stop: `Stop after the **Quick Spin / growing wheel feature** you triggered pays.`,
      how_to_check: `Multiplier values on the four glasses are above the reels. Cycle through all bets/denoms.`,
      risk_bankroll: `**30 units**`,
      risk_summary: `Glasses look random from a distance ... add all **four** values before you sit.`,
      risk_bullets: [],
      skins_markdown: `**Quick Spin Mai Tai Money**.`,
      gameplay_mechanics: `**Quick Spin Mai Tai Money** (Ainsworth) tracks **persistent multiplier glasses** above the reels. **Bar symbols** feed the glasses and can trigger the **Quick Spin growing wheel** bonus.`,
    },
  },
  {
    machine: {
      slug: 'raise-the-sails-san-xing-riches',
      name: 'Raise the Sails / San Xing Riches',
      manufacturer: 'IGT',
      type: 'Progressive Free-Games Meters',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Bronze 25+ · Silver 30+ · Gold 110+.',
      release_year: 2023,
    },
    guide: {
      title: 'Raise the Sails / San Xing Riches',
      published: true,
      card_ev_threshold: 'Bronze 25+ · Silver 30+ · Gold 110+',
      when_to_play: `**Primary play:**

- **Bronze / Shou (blue) meter at 25+** (some APs play **20+**)
- **Silver / Fu meter at 25-30+**
- **Gold / Lu meter at 110+**
- **Combo:** **Bronze + Silver at 50+** combined

Trigger needs a **collect on R5** plus the matching color ... not a must-hit-by.`,
      when_to_stop: `Stop after the **progressive free-games bonus** you chased hits.`,
      how_to_check: `Bronze, silver, and gold spin counts are on the bet pad. Cycle through all bets/denoms.`,
      risk_bankroll: `**150 units**`,
      risk_summary: `Meters can climb forever without a hit ... you are betting the average trigger cost, not a forced window.`,
      risk_bullets: [],
      skins_markdown: `**Raise the Sails** (Bronze / Silver / Gold), **San Xing Riches** (Shou / Fu / Lu).`,
      gameplay_mechanics: `**Raise the Sails / San Xing Riches** (IGT) fills **three uncapped free-games meters**. Color symbols add spins; **collect on reel 5** plus a color symbol awards that meter's bonus with expanding ways.`,
    },
  },
  {
    machine: {
      slug: 'really-wicked-winnings',
      name: 'Really Wicked Winnings',
      manufacturer: 'Aristocrat',
      type: 'Dual Must-Hit-By Progressives',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '$2000 major · $250 minor MHB.',
      release_year: null,
    },
    guide: {
      title: 'Really Wicked Winnings',
      published: true,
      card_ev_threshold: '$2000 major $1800+ · $250 minor $235+',
      when_to_play: `**Primary play:**

- **$2,000 major must-hit-by at $1,800+** (breakeven varies with floor RTP)
- **$250 minor must-hit-by at $235+**

Chase the **major** first ... it moves faster and plays farther from cap. Spin **minimum qualifying bet**.`,
      when_to_stop: `Stop after the **progressive you played for hits**.`,
      how_to_check: `MHB values are in **small text above the jackpots** ... easy to miss. Cycle through all bets/denoms.`,
      risk_bankroll: `**500 units**`,
      risk_summary: `MHB text is tiny on the glass ... most walk past this cabinet thinking it is not AP.`,
      risk_bullets: [],
      skins_markdown: `**Really Wicked Winnings**.`,
      gameplay_mechanics: `**Really Wicked Winnings** (Aristocrat) runs **$2,000 major** (resets $1,000) and **$250 minor** (resets $88) must-hit-by progressives on one **Wicked Winnings** cabinet.`,
    },
  },
  {
    machine: {
      slug: 'red-empress-the-white-wizard',
      name: 'The Red Empress / The White Wizard',
      manufacturer: 'Aristocrat',
      type: 'Flower Meter Mystery Pick',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Flower meter 1900+.',
      release_year: null,
    },
    guide: {
      title: 'The Red Empress / The White Wizard',
      published: true,
      card_ev_threshold: 'Flower meter 1900+',
      when_to_play: `**Primary play:**

- **Flower meter at 1,900+** (must-hit-by **2,000**)

Thin logged data ... treat as preliminary. Each bet level has its own meter.`,
      when_to_stop: `Stop after the **mystery pick / free spins** feature you chased pays or the meter resets.`,
      how_to_check: `Flower meter is in the **game menu** (bottom-left on many installs). Cycle through all bets/denoms.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `Failed mystery picks reset the meter to **1,560** ... a bad pick erases a long climb.`,
      risk_bullets: [],
      skins_markdown: `**The Red Empress**, **The White Wizard**.`,
      gameplay_mechanics: `**The Red Empress / The White Wizard** (Aristocrat) banks **flowers** toward **2,000**. Spins with **fewer than eight flowers** add to the meter. At cap, a **mystery pick** can award **free spins** or reset the count.`,
    },
  },
  {
    machine: {
      slug: 'red-silk-aztec-chief',
      name: 'Red Silk / Aztec Chief',
      manufacturer: 'AGS',
      type: 'Coin Holder Wild Reels',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Active wilds R1-3 · 2 coins R1-3.',
      release_year: null,
    },
    guide: {
      title: 'Red Silk / Aztec Chief',
      published: true,
      card_ev_threshold: 'Active wilds R1-3 · 2+ coins R1-3',
      when_to_play: `**Primary play:**

- **Active wilds on R1-3** (gold border + **1 or 2** coins in the holder = spins left)
- **Two or more coins on R1-3** without active wilds yet
- **R4 active wild** only with **2 spins left** and **2+ coins on R1-3** (one probe spin max)

**Never** play **one coin in each of R1-3** or **two coins everywhere** alone ... those are Golden Egypt tourist plays.`,
      when_to_stop: `Stop after the **2-spin wild reel** sequence you triggered finishes.`,
      how_to_check: `Coin holders and gold borders are on the grid. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `More payout lives in **progressives and jackpot pick** than line hits ... thin boards feel worse than Golden Egypt.`,
      risk_bullets: [],
      skins_markdown: `**Red Silk**, **Aztec Chief**.`,
      gameplay_mechanics: `**Red Silk / Aztec Chief** (AGS) fills **coin holders above every reel**. **Two coins** makes that reel **wild for two spins**.`,
    },
  },
  {
    machine: {
      slug: 'reel-climb-celestial-mountain-prosperity',
      name: 'Reel Climb: Celestial Mountain / Prosperity',
      manufacturer: 'Aristocrat',
      type: 'Firecracker Reel Climb',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'R2-3 sets 3 or fewer · active wild reel.',
      release_year: 2020,
    },
    guide: {
      title: 'Reel Climb: Celestial Mountain / Prosperity',
      published: true,
      card_ev_threshold: 'R2-3 firecrackers 3 or fewer · active wild reel',
      when_to_play: `**Primary play:**

- **R2 + R3 firecracker sets total 3 or fewer** (arrow on reel counts as **one less set** next spin)
- **Active wild reel** (glowing outline, **1 or 2** spins left, tall column)
- **One set left + arrow** on that reel (activates next spin)
- **MAX arrow** (activates reel regardless of sets left)
- **Two columns with 4 or fewer dynamite sets combined** (AP shortcut)`,
      when_to_stop: `Stop after the **3-spin wild reel climb** you triggered finishes.`,
      how_to_check: `Firecracker stacks, arrow symbols, and wild countdowns are on the grid. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `An **arrow** removes a set on the **next spin only** ... count it when you add stacks on R2-3.`,
      risk_bullets: [],
      skins_markdown: `**Celestial Mountain**, **Prosperity**.`,
      gameplay_mechanics: `**Reel Climb** (Aristocrat) stacks **four firecracker sets** above **R2-4**. **Arrow** symbols blow one set and grow reel height. After **four explosions**, the reel goes **wild for three spins**.`,
    },
  },
  {
    machine: {
      slug: 'regal-link-lion-raven',
      name: 'Regal Link: Lion / Raven',
      manufacturer: 'IGT',
      type: 'Metered Wild Free Games',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Silver 9+ · Amber 47+ · Sapphire 58+.',
      release_year: null,
    },
    guide: {
      title: 'Regal Link: Lion / Raven',
      published: true,
      card_ev_threshold: 'Silver 9+ · Amber 47+ · Sapphire 58+',
      when_to_play: `**Primary play:**

- **Silver (base) wilds at 9+**
- **Amber at 47+** (hits by 50)
- **Sapphire at 58+** (hits by 60)
- **Amethyst at 73+** (hits by 75)
- **Emerald at 98+** (hits by 100)
- **Diamond at 199+** (hits by 200)

Combo hunts: jump **one count early** when two meters are close (e.g. **46 amber + 57 sapphire**).`,
      when_to_stop: `Stop after the **wild free-games meter** you chased awards.`,
      how_to_check: `All six wild meters are on the glass. Cycle through all bets/denoms ... meters climb slowly (good for card building).`,
      risk_bankroll: `**200 units**`,
      risk_summary: `**Diamond at 197+** can still take hours ... long chases burn time even when the math is there.`,
      risk_bullets: [],
      skins_markdown: `**Lion**, **Raven**.`,
      gameplay_mechanics: `**Regal Link** (IGT) banks **silver base-game wilds** plus **five color meters** that must hit before their caps (**50 / 60 / 75 / 100 / 200**). **Diamond symbols** in the feature feed progressives.`,
    },
  },
  {
    machine: {
      slug: 'regal-riches-prosperity-pearl',
      name: 'Regal Riches / Prosperity Pearl',
      manufacturer: 'IGT',
      type: 'MHB Progressive Wild Counters',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Blue 8+ · Purple 61+ · Green 84+ · Yellow 112+.',
      release_year: null,
    },
    guide: {
      title: 'Regal Riches / Prosperity Pearl',
      published: true,
      card_ev_threshold: 'Blue 8+ · Purple 61+ · Green 84+ · Yellow 112+',
      when_to_play: `**Primary play:**

- **Blue (base) wild counter at 8+** (must-hit-by **50**)
- **Purple (minor) at 61+**
- **Green (major) at 84+**
- **Yellow (mega) at 112+**
- **OR purple + green + yellow totals 200+** combined

Wait above breakeven when you can ... purple climbs fastest.`,
      when_to_stop: `Stop after the **wild counter** you played for hits and pays.`,
      how_to_check: `Blue counter is above **R3**; purple, green, and yellow are on the side panel. Cycle through all bets/denoms.`,
      risk_bankroll: `**150 units**`,
      risk_summary: `Competition loves **blue 7-8** ... early sits happen to spoil your count as much as to play it.`,
      risk_bullets: [],
      skins_markdown: `[Prosperity Pearl](guide:prosperity-pearl).`,
      gameplay_mechanics: `**Regal Riches / Prosperity Pearl** (IGT) runs **must-hit-by wild counters** (blue resets **5**, cap **50**). Wilds can stack **multipliers up to 5x** on the same row when the counter hits.`,
    },
  },
  {
    machine: {
      slug: 'rich-little-hens',
      name: 'Rich Little Hens',
      manufacturer: 'Light & Wonder',
      type: 'Hen Nest Persistent Bonuses',
      difficulty: 'Advanced',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Red Hen FG 18+ · Mini+Minor 30x+.',
      release_year: null,
    },
    guide: {
      title: 'Rich Little Hens',
      published: true,
      card_ev_threshold: 'Red Hen FG 18+ · Mini+Minor 30x+ bet',
      when_to_play: `**Primary play:**

- **Red Hen free-games meter at 18+** (**17+** on strong-RTP floors; **19+** on weak-RTP / cruise ships)
- **Mini + Minor jackpots combined at 30x+ bet**

Goal is **Red + White hens together** ... Red supplies spins, White hunts jackpots.`,
      when_to_stop: `Stop after the **hen bonus** you triggered (especially **Red Hen**) finishes.`,
      how_to_check: `Red Hen spin counter and jackpot values are on the nest display. Cycle through all bets/denoms ... multi-denom cabinet.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `Current data does not support **15-17** Red Hen even with fat White/Blue nests ... do not borrow Piggies numbers.`,
      risk_bullets: [],
      skins_markdown: `**Rich Little Hens**.`,
      gameplay_mechanics: `**Rich Little Hens** (Light & Wonder) mirrors **Rich Little Piggies**: **Red Hen** builds **free spins**, **White Hen** runs **jackpot picks**, **Blue/Purple Hen** adds side features. **? coins** feed the nests.`,
    },
  },
  {
    machine: {
      slug: 'rich-little-hens-world-class',
      name: 'Rich Little Hens World Class',
      manufacturer: 'Light & Wonder',
      type: 'Hen Nest / Wheel Jackpots',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Red Hen 16+ · mega white hen.',
      release_year: null,
    },
    guide: {
      title: 'Rich Little Hens World Class',
      published: true,
      card_ev_threshold: 'Red Hen 16+ · mega white hen showing',
      when_to_play: `**Primary play:**

- **Red Hen free-games meter at 16+** when the **large white hen shows the Mega jackpot** on screen

Limited field data ... treat as preliminary until more installs are logged.`,
      when_to_stop: `Stop after the **hen / wheel bonus** you triggered finishes.`,
      how_to_check: `Red Hen counter and white-hen jackpot display are on the main screen. Cycle through all bets/denoms.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `World Class adds **wheel segments and six jackpots** ... do not assume base **Rich Little Hens** thresholds transfer.`,
      risk_bullets: [],
      skins_markdown: `**Rich Little Hens World Class**.`,
      gameplay_mechanics: `**Rich Little Hens World Class** (Light & Wonder) expands the **Piggies/Hens nest** format with a **prize wheel**, **respins**, and **six jackpot tiers** up to **Mega**.`,
    },
  },
]
