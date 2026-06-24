/** Batch 25 synth payloads. Skips: `triple-treasure-pot` (not AP). `triple-double-diamond` → sister card from `progressive-free-games`. `ultimate-x-poker` → `apGuideUltimateXPokerPayload.mjs`. */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const BATCH25_PAYLOADS = [
  {
    machine: {
      slug: 'treasure-blast-balloon-fleet',
      name: 'Treasure Blast: Balloon / Fleet',
      manufacturer: 'IGT',
      type: 'Outer Rim Cannon Collector',
      difficulty: 'Beginner',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Low',
      popularity_summary: 'Drum or envelope on rim above bottom row',
      release_year: null,
    },
    guide: {
      title: 'Treasure Blast: Balloon / Fleet',
      published: true,
      card_ev_threshold: 'Drum or envelope on rim (not bottom row)',
      when_to_play: `**Primary play:**

- **Drum** (Balloon) or **red envelope** (Fleet) anywhere on the rim **except the bottom row**
- **3 wilds** on one track (Balloon = **W** bags, Fleet = rockets)
- **5× multiplier** on a track
- **Any 4** combined: wilds, **2×/3×** multipliers, **7.5×** credit prizes

**Ignore bottom-row rim prizes** ... they drop off next spin. Cannons on **R1/R5** blast the opposite track.`,
      when_to_stop: `Stop after a **cannon hit** on your target rim prize or the prize falls off the bottom row.`,
      how_to_check: `Left/right prize tracks shift down every spin. Special music often plays when a drum/envelope is live. Cycle through all bets/denoms.`,
      risk_bankroll: `**10 units**`,
      risk_summary: `Rim **jackpot symbols** are fake progress ... not part of the AP hunt.`,
      risk_bullets: [],
      skins_markdown: `**Treasure Blast Balloon**, **Treasure Blast Fleet**.`,
      gameplay_mechanics: `**Treasure Blast** (IGT) runs dual outer **prize tracks** with **cannon** symbols on reels **1 and 5**. A drum/envelope awards wilds, credits (**1×–7.5×**), multipliers, and possible jackpots. Cannons stack up to **4** high.`,
    },
  },
  {
    machine: {
      slug: 'treasure-box-kingdom-dynasty',
      name: 'Treasure Box: Kingdom / Dynasty',
      manufacturer: 'IGT',
      type: 'Key Meter Respin Bonus',
      difficulty: 'Beginner',
      popularity: 'Common',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Low-Medium',
      popularity_summary: 'Bet panel 3 or fewer coins to trigger',
      release_year: null,
    },
    guide: {
      title: 'Treasure Box: Kingdom / Dynasty',
      published: true,
      card_ev_threshold: '3 or fewer coins to trigger respin on bet panel',
      when_to_play: `**Primary play:**

- **3 or fewer coins** needed to trigger the **respin bonus** (shown on the **bet panel** and above the reels)
- **1 coin needed** is the premium spot (**key on R3** auto-triggers)

Default trigger is **6 coins**. Each **key on reel 3** permanently lowers the count by **1** for that bet level. Some APs still play **4** ... tighter installs favor **3 or less**.`,
      when_to_stop: `Stop after the **respin bonus** you chased completes.`,
      how_to_check: `Coin-to-trigger count is on the **bet panel** per bet level. Cycle through all bets/denoms.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `High-denom installs can burn **hundreds of units** waiting on a **1-coin** trigger that never lands.`,
      risk_bullets: [],
      skins_markdown: `**Treasure Box Kingdom**, **Treasure Box Dynasty**.`,
      gameplay_mechanics: `**Treasure Box** (IGT) uses a persistent **key meter**: landing **6 coins** (or fewer after keys) triggers a **respin hold-and-spin** with credit coins, multipliers, and jackpot jewels. Coins pay credit value even when the full bonus does not trigger.`,
    },
  },
  {
    machine: {
      slug: 'treasure-hunter',
      name: 'Treasure Hunter',
      manufacturer: 'Bluberi',
      type: 'Pearl Jackpot Accumulator',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: '2 pearls each under mini, minor, maxi',
      release_year: 2021,
    },
    guide: {
      title: 'Treasure Hunter',
      published: true,
      card_ev_threshold: '2 pearls each under mini, minor, and maxi',
      when_to_play: `**Primary play:**

- **2 pearls each** under **mini**, **minor**, and **maxi**
- Stop after you trigger **any one** of those three jackpots

**Major** pearls add equity but treat **major** as gravy ... it rarely fires.`,
      when_to_stop: `Stop after the **first mini, minor, or maxi jackpot** you played for awards.`,
      how_to_check: `Pearl counts under each jackpot are on the bet pad. Cycle through all bets/denoms.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `**Mini-first** hits often lose overall ... **maxi-first** is the long-term edge lane when you can find it.`,
      risk_bullets: [],
      skins_markdown: `**Treasure Hunter**.`,
      gameplay_mechanics: `**Treasure Hunter** (Bluberi, **2021**) collects **pearls** under **major / maxi / minor / mini**. **Three pearls** awards that jackpot. Pearls land on **reels 2–4** only, max **one of each type** per spin.`,
    },
  },
  {
    machine: {
      slug: 'treasure-shot-pirate-ship-robin-hood',
      name: 'Treasure Shot: Pirate Ship / Robin Hood',
      manufacturer: 'Light & Wonder',
      type: 'Wild Bag / Chest MHB Accumulators',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium-High',
      popularity_summary: 'Blue/red bag 6+ · blue chest 88+',
      release_year: null,
    },
    guide: {
      title: 'Treasure Shot: Pirate Ship / Robin Hood',
      published: true,
      card_ev_threshold: 'Blue or red bag 6+ · blue chest 88+ · green+purple 112+ combo',
      when_to_play: `**Primary play:**

**Chest MHB (must-hit free games):**
- **Blue chest 88+** (MHB **100**)
- **Green chest 64+** (MHB **75**)
- **Purple chest 62+** (MHB **75**)
- **Green + purple combined 112+**

**Bag wilds:**
- **Blue bag 6+** or **red bag 6+**
- **Blue + red bag combo 9+**

Bags trigger at **10** wilds guaranteed next spin. Chest symbols on **R5** feed MHB meters.`,
      when_to_stop: `Stop after your **bag wild burst** or **chest free games** from MHB fires.`,
      how_to_check: `Wild counts on bags and chests are on the bet pad per bet level. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `Pull the slot card when any chest is **one away** if the display shows a **loss** ... do not trust the glass count blind.`,
      risk_bullets: [],
      skins_markdown: `**Treasure Shot Pirate Ship**, **Treasure Shot Robin Hood**.`,
      gameplay_mechanics: `**Treasure Shot** (Light & Wonder) stacks wilds in **bags** (random/base at **10**) and **chests** (**10** free games, MHB guaranteed). **Red/purple** carry **2×/3×/5×** multipliers (additive). **Blue/green** can carry credit prizes.`,
    },
  },
  {
    machine: {
      slug: 'trials-of-atlantis',
      name: "Bubble Blast: Spells 'N Whistles / Trials of Atlantis",
      manufacturer: 'IGT',
      type: 'Persistent Rising Bubbles',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Bubble board total 5x+ bet · ignore top row',
      release_year: null,
    },
    guide: {
      title: "Bubble Blast: Spells 'N Whistles / Trials of Atlantis",
      published: true,
      card_ev_threshold: 'Bubble total 5x+ bet · ignore top row',
      when_to_play: `**Primary play:**

- **Total bubble credit value ≥5× bet** (all in-play bubbles added together)
- **Do not count the top row** ... those bubbles expire next spin
- Scout bubbles **below the visible grid** when values are hidden

Bubbles **persist after a collect** and can pay again.`,
      when_to_stop: `Stop after a **catcher collect** on your bubble setup or values fall below **5×**.`,
      how_to_check: `Sum bubble credit values excluding the top row. Cycle through all bets/denoms.`,
      risk_bankroll: `**30 units**`,
      risk_summary: `Bubbles arrive in **spurts** then go cold ... do not chase a lonely small bubble after a dry stretch.`,
      risk_bullets: [],
      skins_markdown: `[Bubble Blast](guide:bubble-blast), **Spells 'N Whistles**, **Trials of Atlantis**.`,
      gameplay_mechanics: `**Bubble Blast** family (IGT) keeps **rising bubbles** with credit values. Landing on a **blue portal catcher** awards the bubble. **Mini/maxi** can hide inside bubbles.`,
    },
  },
  {
    machine: {
      slug: 'ultimate-fire-link-cash-falls-china-street-olvera-street',
      name: 'Ultimate Fire Link Cash Falls: China Street / Olvera Street',
      manufacturer: 'Light & Wonder',
      type: 'Sticky Fireball Timers + Fire Link',
      difficulty: 'Advanced',
      popularity: 'Common',
      nerf_risk: 'Medium',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium-High',
      popularity_summary: 'One-away 6x+ · two-away 25x+ · Fire Link ball 35x',
      release_year: 2023,
    },
    guide: {
      title: 'Ultimate Fire Link Cash Falls: China Street / Olvera Street',
      published: true,
      card_ev_threshold: 'One-away reels 6x+ total · two-away 25x+ · Fire Link ball 35x',
      when_to_play: `**Primary play:**

Count **Fire Link Feature** fireballs as **35× bet** when summing.

- **One-away reels** (blue glow outline): combined credits **≥6× bet**
- **Two-away reels**: combined credits **≥25× bet**

**Do not chase 3+ fireballs away** even with a fat Fire Link ball. **R1–R2** Fire Link equity is the upgrade over original **Cash Falls**.`,
      when_to_stop: `Stop when your **target reel fills** or a different reel fills instead of the one you chased.`,
      how_to_check: `No bet-pad blue glow on this install ... manually sum each bet/denom. One-away reels show a **blue outline**. Cycle through all bets/denoms.`,
      risk_bankroll: `**500 units**`,
      risk_summary: `You can chase **R2 one-away** and accidentally fill **R4** instead ... wrong-reel fills are common.`,
      risk_bullets: [],
      skins_markdown: `[Cash Falls](guide:cash-falls-huo-zhu-pirate-s-trove-island-bounty-outback-bounty), **China Street**, **Olvera Street**.`,
      gameplay_mechanics: `**Ultimate Fire Link Cash Falls** (Light & Wonder, **2023**) uses **sticky fireballs** with **3-spin reel timers**. Fill a reel to collect all credits; a **Fire Link Feature** ball triggers the linked bonus. Lowest fireball is **⅓× bet** vs **½×** on original Cash Falls.`,
    },
  },
  {
    machine: {
      slug: 'ultimate-screaming-links',
      name: 'Ultimate Screaming Links',
      manufacturer: 'Lightning Gaming',
      type: 'Locking Coin Hold-and-Spin',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: '13+ balls after bonus-ball adjustments',
      release_year: 2021,
    },
    guide: {
      title: 'Ultimate Screaming Links',
      published: true,
      card_ev_threshold: '13+ balls after bonus-ball adjustments',
      when_to_play: `**Primary play:**

- **13+ total balls** on the board
- Adjust: **−1** per **mini bonus ball**, **−2** per **medium**, **−3** per **large**

**Not** the same cabinet as **Screaming Mansion** (L&W candles) ... different engine.`,
      when_to_stop: `Stop after the **locking-coin bonus** completes or the board falls below your adjusted threshold.`,
      how_to_check: `Count balls on the board and apply bonus-ball adjustments. Cycle through all bets/denoms.`,
      risk_bankroll: `**50 units**`,
      risk_summary: `**Center reel** dragon doubles a coin but **progressive coins cannot land center** ... do not count a blocked center prog as live equity.`,
      risk_bullets: [],
      skins_markdown: `**Golden Egg**, **Golden Geigi**, **Great Balls of Fire**, and other **Ultimate Screaming Links** skins.`,
      gameplay_mechanics: `**Ultimate Screaming Links** (Lightning Gaming, **2021**) locks **5+ coins** for **3 spins**; fill **15** positions for the top progressive. **Dragon on center** doubles a coin value.`,
    },
  },
]
