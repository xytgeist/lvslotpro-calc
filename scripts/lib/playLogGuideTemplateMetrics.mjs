/**
 * Play Logbook system templates for AP slot guides.
 * Standard session fields + calculator-specific extras when a shipped calc exists.
 */

/** Always included (date/time/casino/notes are session UI, not metric slugs). */
export const PLAY_LOG_STANDARD_METRIC_SLUGS = [
  'bet_size',
  'denom',
  'money_in',
  'money_out',
  'acquisition_fee',
  'spin_count',
  'bonus_count',
]

/** @typedef {'phoenix'|'buffalo-link'|'buffalo-diamond'|'stackup'|'mhb'|'wof-collectors-edition'} PlayLogCalcKey */

/**
 * Map machine row → App calculator key (matches GuidesScreen `resolveCalculatorKey`).
 * @param {{ slug?: string, calculator_slug?: string | null, has_calculator?: boolean | null } | null | undefined} machine
 * @returns {PlayLogCalcKey | null}
 */
export function resolvePlayLogCalculatorKey(machine) {
  if (!machine) return null
  const slug = String(machine.slug || '').trim()
  const calc = String(machine.calculator_slug || '').trim()
  const has = Boolean(machine.has_calculator)

  if (
    slug === 'buffalo-link' ||
    slug === 'lightning-buffalo-link' ||
    calc === 'buffalo-link' ||
    calc === 'buffalo'
  ) {
    return 'buffalo-link'
  }
  if (slug === 'buffalo-diamond' || slug === 'buffalo-diamond-extreme' || calc === 'buffalo-diamond') {
    return 'buffalo-diamond'
  }
  if (slug === 'stack-up-pays' || calc === 'stack-up-pays' || calc === 'stackup') return 'stackup'
  if (slug === 'phoenix-link' || calc === 'phoenix-link' || calc === 'phoenix') return 'phoenix'
  if (
    slug === 'wheel-of-fortune-4d-collectors-edition' ||
    calc === 'wof-collectors-edition' ||
    calc === 'wheel-of-fortune-4d-collectors-edition'
  ) {
    return 'wof-collectors-edition'
  }
  if (
    slug === 'ainsworth-must-hit-by' ||
    slug === 'must-hit-by-aig' ||
    slug === 'must-hit-by-ags' ||
    slug === 'must-hit-by-igt' ||
    slug === 'igt-must-hit-by' ||
    calc === 'mhb'
  ) {
    return 'mhb'
  }
  if (has && calc === 'mhb') return 'mhb'
  if (has && calc === 'buffalo-link') return 'buffalo-link'
  if (has && calc === 'buffalo') return 'buffalo-link'
  if (has && calc === 'buffalo-diamond') return 'buffalo-diamond'
  if (has && calc === 'stackup') return 'stackup'
  if (has && calc === 'phoenix') return 'phoenix'
  if (has && calc === 'wof-collectors-edition') return 'wof-collectors-edition'
  return null
}

/** Extra metric slugs per shipped calculator (no EV fields when calc does not model RTP). */
export const PLAY_LOG_CALC_EXTRA_METRIC_SLUGS = /** @type {Record<PlayLogCalcKey, string[]>} */ ({
  phoenix: ['counter', 'counter_at_hit', 'current_ev_rtp', 'average_case_mult', 'average_case_usd'],
  'buffalo-link': ['counter', 'counter_at_hit', 'current_ev_rtp', 'average_case_mult', 'average_case_usd'],
  'buffalo-diamond': ['green_fg', 'blue_fg', 'gold_fg', 'current_ev_rtp', 'average_case_mult', 'average_case_usd'],
  stackup: [
    'mega',
    'grand',
    'major',
    'minor',
    'mini',
    'target_bonus_paid',
    'current_ev_rtp',
    'average_case_mult',
    'average_case_usd',
  ],
  mhb: ['mhb_manufacturer', 'mhb_meter', 'must_hit_by', 'expected_ev_usd'],
  'wof-collectors-edition': ['r1_prize', 'r2_prize', 'r3_prize', 'r4_prize', 'r5_prize'],
})

const TAIL = new Set(['spin_count', 'bonus_count'])

/** @param {string[]} slugs */
export function playLogMetricSlugsSpinBonusLast(slugs) {
  const inSet = new Set(slugs)
  const body = slugs.filter((s) => !TAIL.has(s))
  const tail = ['spin_count', 'bonus_count'].filter((s) => inSet.has(s))
  return [...body, ...tail]
}

/**
 * @param {{ slug?: string, name?: string, calculator_slug?: string | null, has_calculator?: boolean | null }} machine
 * @returns {string[]}
 */
export function metricSlugsForGuideMachine(machine) {
  const calcKey = resolvePlayLogCalculatorKey(machine)
  const extras = calcKey ? PLAY_LOG_CALC_EXTRA_METRIC_SLUGS[calcKey] || [] : []
  const merged = [...extras, ...PLAY_LOG_STANDARD_METRIC_SLUGS]
  return playLogMetricSlugsSpinBonusLast([...new Set(merged)])
}

/**
 * @param {{ slug?: string, name?: string, title?: string, machines?: object | object[] | null }} guideRow
 * @returns {{ slug: string, display_name: string, machine_slug: string, calculator_slug: string | null, metric_slugs: string[] } | null}
 */
export function playLogTemplateFromGuideRow(guideRow) {
  const machineRaw = guideRow?.machines
  const machine = Array.isArray(machineRaw) ? machineRaw[0] : machineRaw
  const machineSlug = String(machine?.slug || guideRow?.slug || '').trim()
  if (!machineSlug) return null

  const displayName = String(machine?.name || guideRow?.title || machineSlug).trim()
  const calcKey = resolvePlayLogCalculatorKey(machine)

  return {
    slug: machineSlug,
    display_name: displayName,
    machine_slug: machineSlug,
    calculator_slug: calcKey,
    metric_slugs: metricSlugsForGuideMachine(machine || { slug: machineSlug }),
  }
}
