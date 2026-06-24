/** Ultimate X Poker — batch 25 skip reversed (VP counted as AP slot for Edge). */
/** @type {{ machine: Record<string, unknown>, guide: Record<string, unknown>, diagrams?: unknown[] }} */
export const ULTIMATE_X_POKER_PAYLOAD = {
  machine: {
    slug: 'ultimate-x-poker',
    name: 'Ultimate X Poker',
    manufacturer: 'IGT',
    type: 'Multiplier Video Poker',
    difficulty: 'Beginner',
    popularity: 'Very Common',
    nerf_risk: 'Low',
    has_calculator: false,
    calculator_slug: null,
    volatility_index: 'Low-Medium',
    popularity_summary: 'Nationwide IGT VP banks; next-hand multiplier scavenger.',
    release_year: null,
  },
  guide: {
    title: 'Ultimate X Poker',
    published: true,
    card_ev_threshold: 'Next-hand multipliers on screen',
    when_to_play: `**Primary play:** any **next-hand multiplier** lit on the game/denom you are scouting. Sit **one draw at 5 credits per line** to play off the tag without paying the **10-credit** multiplier bet.

**Quick check:** multiplier copy reads **next hand** (not a dead carry). Even small **2x** tags are worth one 5-credit draw when the prior player already paid the premium.

Scout **every pay-table variant** at **every denom** on the bank ... multipliers are per game/level.`,
    when_to_stop: `Stop after **one 5-credit-per-line draw** clears the multiplier you sat for ... then bounce.`,
    how_to_check: `Open each **Ultimate X** game and denom on the bank. Read the multiplier rail for **next hand** tags on any line. Cycle through all bets/denoms when a cabinet stacks multiple levels.`,
    risk_bankroll: `**5 units**`,
    risk_summary: `Some casinos **86** regular multiplier vultures ... machine hopping is obvious to staff and other VP players.`,
    risk_bullets: [],
    where_to_find: '',
    skins_markdown: `**Jacks or Better**, **Bonus Poker**, **Double Bonus**, **Triple Double Bonus**, **Deuces Wild**, and other IGT pay tables on the same cabinet ... same scavenger math on every variant.`,
    gameplay_mechanics: `**Ultimate X Poker** (IGT) runs **multi-line video poker** (**3-, 5-, and 10-play** are common). Betting **10 credits per line** turns on multiplier mode: any **winning hand** seeds **2x–12x** multipliers on that line for the **next draw**. Normal VP tops out at **5 credits per line**.

Wins are usually pairs or **three of a kind** ... occasionally a fat hand hits with a free multiplier attached.`,
  },
}
