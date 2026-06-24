/** Deferred catch-up — wrongly skipped batch 27/28 slugs with workspace HTML (2026-06-08). */
/** @type {Array<{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }>} */
export const DEFERRED_CATCHUP_PAYLOADS = [
  {
    machine: {
      slug: 'wo-shu-sky-spin',
      name: 'Wo Shu: Sky Spin',
      manufacturer: 'Incredible Technologies',
      type: 'Sky Spin Multiplier Meters',
      difficulty: 'Advanced',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'High',
      popularity_summary: 'Color meters 19–23+ · all-colors 52+',
      release_year: 2020,
    },
    guide: {
      title: 'Wo Shu: Sky Spin',
      published: true,
      card_ev_threshold: 'Blue 19+ · Green 20+ · Purple 23+ · all colors 52+',
      when_to_play: `**Primary play (per meter tier on your bet level):**

**Game 1 — color-specific Sky Spin meters:**
- **Blue (2×) meter 19+**
- **Green (3×) meter 20+**
- **Purple (4×) meter 23+**

**Game 2 — combined chase:**
- **All three color meters 52+** together

Scout every **denom/bet** ... meters are **persistent per bet level**.`,
      when_to_stop: `Stop after the **Sky Spin bonus** you chased pays or meters fall below scout tier on your bet.`,
      how_to_check: `**Blue / green / purple** Sky Spin meter counts on the bet pad (2× / 3× / 4× labels). Cycle through all bets/denoms.`,
      risk_bankroll: `**150 units**`,
      risk_summary: `Feeding **Game 2** totals while **Game 1** color lines are cold burns bankroll ... match the tier you are actually sitting for.`,
      risk_bullets: [],
      skins_markdown: `**Wo Shu: Sky Spin**.`,
      gameplay_mechanics: `**Wo Shu: Sky Spin** (Incredible Technologies, **2020**) banks **persistent color meters** for the **Sky Spin** wheel bonus. **Blue (2×)**, **green (3×)**, and **purple (4×)** tiers climb independently until the feature fires.`,
    },
  },
  {
    machine: {
      slug: 'wish-mistress',
      name: 'Wish Mistress',
      manufacturer: 'IGT',
      type: 'Persistent Gem Wild Meters',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium',
      popularity_summary: 'Dual 3-gem meters · 5+ blue+yellow',
      release_year: 2019,
    },
    guide: {
      title: 'Wish Mistress',
      published: true,
      card_ev_threshold: 'Dual 3-gem meters · 5+ blue+yellow · no 3-center lock',
      when_to_play: `**Primary play:**

- **Two gem meters at 3 gems each** (blue/red/yellow ... next spin fires **two wild features**)
- **5+ combined blue + yellow gems** across meters
- **5+ total gems** across all meters **unless 3 gems sit in the middle jewel set**

**Color value:** **blue** (full-reel wilds) pays best, **yellow** (surrounding wilds) second, **red** (random wilds) weakest ... still counts toward dual-meter math.`,
      when_to_stop: `Stop after the **wild-feature stack** or **free-games pick** you chased completes and meters reset.`,
      how_to_check: `Blue/red/yellow **gem counts** above the reels and on the bet pad. Watch the **middle jewel set** before sitting a **5+ total** line. Cycle through all bets/denoms.`,
      risk_bankroll: `**60 units**`,
      risk_summary: `A **single** gem meter hitting **4** and firing **one** wild mode rarely pays enough ... edge is **two features on the same spin**.`,
      risk_bullets: [],
      skins_markdown: `**Wish Mistress**.`,
      gameplay_mechanics: `**Wish Mistress** (IGT, **2019**) collects **blue, red, and yellow gems** into **persistent meters** per bet level. **Four gems** of one color fires that color's wild enhancement; **multiple full meters** on one spin stack. **Lamp scatters** launch adjustable-volatility free games.`,
    },
  },
  {
    machine: {
      slug: 'wild-mermaid',
      name: 'Reef of Riches / Wild Mermaid',
      manufacturer: 'Unknown',
      type: 'Shattered Tile Persistent Grid',
      difficulty: 'Intermediate',
      popularity: 'Uncommon',
      nerf_risk: 'Low',
      has_calculator: false,
      calculator_slug: null,
      volatility_index: 'Medium-High',
      popularity_summary: '≤2 tiles left · R5 clear scout',
      release_year: null,
    },
    guide: {
      title: 'Reef of Riches / Wild Mermaid',
      published: true,
      card_ev_threshold: '≤2 tiles remaining · or R5 fully clear',
      when_to_play: `**Primary play:**

- **Two or fewer tiles** remaining anywhere on the **5×4** grid (count on the **bet pad** per bet level)
- **No tiles remaining on reel 5** (less common but strong)

**20 hidden tiles** behind symbols shatter from **line hits**, **scatters**, or the **pirate character**. When all **20** break, the bonus starts. Left-side tiles fall faster; **R5** tiles are the grind.`,
      when_to_stop: `Stop after the **tile bonus** completes and the post-bonus **clam pick** reshapes the next board.`,
      how_to_check: `**Tiles remaining** per bet level on the bet pad (not just what you see on the main reels). Cycle through all bets/denoms.`,
      risk_bankroll: `**100 units**`,
      risk_summary: `Chasing the **last R5 tile** with **3+ tiles** still elsewhere is a variance trap ... the final column is the slowest to clear.`,
      risk_bullets: [],
      skins_markdown: `**Reef of Riches**, **Wild Mermaid**, **Jungle Riches** (regional reskin ... same tile math).`,
      gameplay_mechanics: `**Reef of Riches / Wild Mermaid** hides **20 tiles** behind a **5×4** reel set. Tiles shatter from wins or random pirate breaks; **all 20 gone** launches the bonus. After the feature, a **clam pick** removes random tiles (can **retrigger** if it clears the board).`,
    },
  },
]
