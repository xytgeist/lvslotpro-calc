/**
 * Guide card accent theming: legacy slug map, hero-derived hex, or amber default.
 */
import { normalizeAccentHex } from './linkPreviewAccent.js'
import { snapGuideAccentToPalette, guideAccentForLightSurface } from './guideAccentPalette.js'
import { dominantAccentFromRgba } from './dominantAccentFromRgba.js'

function mix(channel, toward255, t) {
  return Math.round(channel + (255 - channel) * t)
}

/**
 * @param {string} hex
 * @returns {Record<string, string> | null}
 */
export function accentCssVarsFromHex(hex) {
  const n = normalizeAccentHex(hex)
  if (!n) return null
  const r = parseInt(n.slice(1, 3), 16)
  const g = parseInt(n.slice(3, 5), 16)
  const b = parseInt(n.slice(5, 7), 16)

  return {
    '--gca-rgb': `${r}, ${g}, ${b}`,
    '--gca-chevron': n,
    '--gca-light-accent': guideAccentForLightSurface(n) || n,
    '--gca-strong': `rgb(${mix(r, 255, 0.88)}, ${mix(g, 255, 0.88)}, ${mix(b, 255, 0.88)})`,
    '--gca-subtitle': `rgba(${mix(r, 255, 0.5)}, ${mix(g, 255, 0.5)}, ${mix(b, 255, 0.5)}, 0.92)`,
    '--gca-border': `rgba(${r}, ${g}, ${b}, 0.5)`,
    '--gca-shadow': `rgba(${r}, ${g}, ${b}, 0.22)`,
    '--gca-ev-border': `rgba(${r}, ${g}, ${b}, 0.55)`,
    '--gca-ev-head': `rgba(${r}, ${g}, ${b}, 0.65)`,
    '--gca-ev-rule': `rgba(${r}, ${g}, ${b}, 0.65)`,
    '--gca-ev-bg-start': `rgba(${r}, ${g}, ${b}, 0.28)`,
    '--gca-ring': `rgba(${r}, ${g}, ${b}, 0.6)`,
    '--gca-hero-via': `rgba(${r}, ${g}, ${b}, 0.32)`,
  }
}

/** @returns {GuideAccentTheme} */
function hexAccentTheme(hex) {
  const cssVars = accentCssVarsFromHex(hex)
  return {
    mode: 'hex',
    cssVars,
    chevron: 'guide-accent-chevron',
    strong: 'guide-accent-strong',
    subtitle: 'guide-accent-subtitle',
    expandedBorder: 'guide-accent-expanded-border ring-1 ring-white/[0.07] shadow-2xl',
    evTablesBox: 'guide-accent-ev-box rounded-xl px-4 py-3.5',
    evTablesHead: 'guide-ev-threshold-accent-label',
    evTablesRule: 'guide-ev-threshold-accent-rule relative mt-2 border-l-2 pl-3',
    ringFocus: 'focus-visible:ring-[color:var(--gca-ring)]',
    heroGradientClass: 'guide-accent-hero-gradient',
    h2Tone: 'guide-accent-strong',
    hrVia: 'guide-accent-ev-rule',
    titleBarTo: 'guide-accent-ev-head',
  }
}

/** Legacy hand-tuned slug accents (pilot cards). */
export function legacyCardAccentFromSlug(machineSlug) {
  if (machineSlug === 'phoenix-link') {
    return {
      mode: 'legacy',
      chevron: 'text-orange-500',
      strong: 'text-orange-50',
      subtitle: 'text-orange-200/90',
      expandedBorder: 'border-orange-500/50 shadow-lg shadow-orange-900/20',
      evTablesBox:
        'rounded-xl border border-dashed border-orange-400/55 bg-gradient-to-br from-orange-950/35 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'guide-ev-threshold-accent-label',
      evTablesRule: 'guide-ev-threshold-accent-rule relative mt-2 border-l-2 pl-3',
      ringFocus: 'focus-visible:ring-orange-500/60',
      heroGradientClass: 'from-orange-950/80 via-zinc-900/40 to-zinc-950',
    }
  }
  if (machineSlug === 'legend-of-the-phoenix') {
    return {
      mode: 'legacy',
      chevron: 'text-orange-400',
      strong: 'text-orange-50',
      subtitle: 'text-amber-200/88',
      expandedBorder: 'border-orange-500/50 shadow-lg shadow-red-950/30',
      evTablesBox:
        'rounded-xl border border-dashed border-orange-400/55 bg-gradient-to-br from-red-950/30 via-orange-950/25 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'guide-ev-threshold-accent-label',
      evTablesRule: 'guide-ev-threshold-accent-rule relative mt-2 border-l-2 pl-3',
      ringFocus: 'focus-visible:ring-orange-500/60',
      heroGradientClass: 'from-red-950/80 via-orange-950/40 to-zinc-950',
    }
  }
  if (machineSlug === 'stack-up-pays') {
    return {
      mode: 'legacy',
      chevron: 'text-cyan-500',
      strong: 'text-cyan-50',
      subtitle: 'text-cyan-200/90',
      expandedBorder: 'border-cyan-500/50 shadow-lg shadow-cyan-900/25',
      evTablesBox:
        'rounded-xl border border-dashed border-cyan-400/55 bg-gradient-to-br from-cyan-950/35 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'guide-ev-threshold-accent-label',
      evTablesRule: 'guide-ev-threshold-accent-rule relative mt-2 border-l-2 pl-3',
      ringFocus: 'focus-visible:ring-cyan-500/60',
      heroGradientClass: 'from-cyan-950/80 via-sky-950/40 to-zinc-950',
    }
  }
  if (machineSlug === 'lightning-buffalo-link') {
    return {
      mode: 'legacy',
      chevron: 'text-indigo-400',
      strong: 'text-indigo-50',
      subtitle: 'text-amber-200/85',
      expandedBorder: 'border-indigo-500/50 shadow-lg shadow-indigo-950/35',
      evTablesBox:
        'rounded-xl border border-dashed border-indigo-400/55 bg-gradient-to-br from-indigo-950/40 via-blue-950/25 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'guide-ev-threshold-accent-label',
      evTablesRule: 'guide-ev-threshold-accent-rule relative mt-2 border-l-2 pl-3',
      ringFocus: 'focus-visible:ring-indigo-500/60',
      heroGradientClass: 'from-indigo-950/85 via-sky-950/40 to-zinc-950',
    }
  }
  if (machineSlug === 'ainsworth-must-hit-by' || machineSlug === 'must-hit-by-aig') {
    return {
      mode: 'legacy',
      chevron: 'text-fuchsia-400',
      strong: 'text-violet-50',
      subtitle: 'text-fuchsia-200/90',
      expandedBorder: 'border-violet-500/50 shadow-lg shadow-fuchsia-950/30',
      evTablesBox:
        'rounded-xl border border-dashed border-violet-400/55 bg-gradient-to-br from-violet-950/35 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'guide-ev-threshold-accent-label',
      evTablesRule: 'guide-ev-threshold-accent-rule relative mt-2 border-l-2 pl-3',
      ringFocus: 'focus-visible:ring-violet-500/60',
      heroGradientClass: 'from-violet-950/85 via-fuchsia-950/35 to-zinc-950',
    }
  }
  if (machineSlug === 'ags-must-hit-by' || machineSlug === 'must-hit-by-ags') {
    return {
      mode: 'legacy',
      chevron: 'text-rose-400',
      strong: 'text-rose-50',
      subtitle: 'text-rose-200/90',
      expandedBorder: 'border-rose-500/50 shadow-lg shadow-rose-950/35',
      evTablesBox:
        'rounded-xl border border-dashed border-rose-400/55 bg-gradient-to-br from-rose-950/35 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'guide-ev-threshold-accent-label',
      evTablesRule: 'guide-ev-threshold-accent-rule relative mt-2 border-l-2 pl-3',
      ringFocus: 'focus-visible:ring-rose-500/60',
      heroGradientClass: 'from-rose-950/85 via-red-950/40 to-zinc-950',
    }
  }
  if (machineSlug === 'igt-must-hit-by' || machineSlug === 'must-hit-by-igt') {
    return {
      mode: 'legacy',
      chevron: 'text-sky-400',
      strong: 'text-sky-50',
      subtitle: 'text-sky-200/90',
      expandedBorder: 'border-sky-500/50 shadow-lg shadow-blue-950/30',
      evTablesBox:
        'rounded-xl border border-dashed border-sky-400/55 bg-gradient-to-br from-sky-950/35 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'guide-ev-threshold-accent-label',
      evTablesRule: 'guide-ev-threshold-accent-rule relative mt-2 border-l-2 pl-3',
      ringFocus: 'focus-visible:ring-sky-500/60',
      heroGradientClass: 'from-sky-950/80 via-blue-950/45 to-zinc-950',
    }
  }
  if (machineSlug === 'aladdins-fortune') {
    return {
      mode: 'legacy',
      chevron: 'text-emerald-400',
      strong: 'text-emerald-50',
      subtitle: 'text-emerald-200/90',
      expandedBorder: 'border-emerald-500/45 shadow-lg shadow-emerald-950/25',
      evTablesBox:
        'rounded-xl border border-dashed border-emerald-400/55 bg-gradient-to-br from-emerald-950/35 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'guide-ev-threshold-accent-label',
      evTablesRule: 'guide-ev-threshold-accent-rule relative mt-2 border-l-2 pl-3',
      ringFocus: 'focus-visible:ring-emerald-500/60',
      heroGradientClass: 'from-emerald-950/75 via-amber-950/30 to-zinc-950',
    }
  }
  if (machineSlug === 'aztec-banner') {
    return {
      mode: 'legacy',
      chevron: 'text-lime-400',
      strong: 'text-lime-50',
      subtitle: 'text-orange-200/88',
      expandedBorder: 'border-green-500/45 shadow-lg shadow-green-950/30',
      evTablesBox:
        'rounded-xl border border-dashed border-lime-400/50 bg-gradient-to-br from-green-950/40 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'guide-ev-threshold-accent-label',
      evTablesRule: 'guide-ev-threshold-accent-rule relative mt-2 border-l-2 pl-3',
      ringFocus: 'focus-visible:ring-lime-500/60',
      heroGradientClass: 'from-green-950/80 via-orange-950/35 to-zinc-950',
    }
  }
  if (machineSlug === 'pegasus-banner') {
    return {
      mode: 'legacy',
      chevron: 'text-sky-400',
      strong: 'text-sky-50',
      subtitle: 'text-amber-200/88',
      expandedBorder: 'border-sky-500/45 shadow-lg shadow-blue-950/35',
      evTablesBox:
        'rounded-xl border border-dashed border-sky-400/55 bg-gradient-to-br from-blue-950/38 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'guide-ev-threshold-accent-label',
      evTablesRule: 'guide-ev-threshold-accent-rule relative mt-2 border-l-2 pl-3',
      ringFocus: 'focus-visible:ring-sky-500/60',
      heroGradientClass: 'from-sky-950/80 via-amber-950/30 to-zinc-950',
    }
  }
  return {
    mode: 'legacy',
    chevron: 'text-amber-500',
    strong: 'text-amber-50',
    subtitle: 'text-amber-200/90',
    expandedBorder: 'border-amber-500/50 shadow-lg shadow-amber-900/20',
    evTablesBox:
      'rounded-xl border border-dashed border-amber-400/55 bg-gradient-to-br from-amber-950/35 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
    evTablesHead: 'guide-ev-threshold-accent-label',
    evTablesRule: 'guide-ev-threshold-accent-rule relative mt-2 border-l-2 pl-3',
    ringFocus: 'focus-visible:ring-amber-500/60',
    heroGradientClass: 'from-amber-900/40 to-zinc-950',
  }
}

/**
 * @param {{ slug?: string | null, cardAccentColor?: string | null }} opts
 * @returns {GuideAccentTheme}
 */
export function resolveGuideAccent({ slug, cardAccentColor }) {
  const raw = normalizeAccentHex(cardAccentColor)
  if (raw) {
    const hex = snapGuideAccentToPalette(raw) || raw
    return hexAccentTheme(hex)
  }
  return legacyCardAccentFromSlug(slug || '')
}

/**
 * @typedef {Object} GuideAccentTheme
 * @property {'legacy' | 'hex'} mode
 * @property {Record<string, string>=} cssVars
 * @property {string} chevron
 * @property {string} strong
 * @property {string} subtitle
 * @property {string} expandedBorder
 * @property {string} evTablesBox
 * @property {string} evTablesHead
 * @property {string} evTablesRule
 * @property {string=} ringFocus
 * @property {string} heroGradientClass
 * @property {string=} h2Tone
 * @property {string=} hrVia
 * @property {string=} titleBarTo
 */

/**
 * Sample accent from a browser File (hero upload preview).
 * @param {File | Blob} file
 * @returns {Promise<string | null>}
 */
export function extractAccentFromImageFile(file) {
  if (!file) return Promise.resolve(null)
  const url = URL.createObjectURL(file)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const size = 32
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)
        resolve(normalizeAccentHex(dominantAccentFromRgba(data)))
      } catch {
        resolve(null)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

/** @deprecated use resolveGuideAccent */
export function cardAccent(machineSlug) {
  return legacyCardAccentFromSlug(machineSlug)
}

/** @deprecated use resolveGuideAccent().heroGradientClass */
export function heroGradientClass(machineSlug) {
  return legacyCardAccentFromSlug(machineSlug).heroGradientClass
}
