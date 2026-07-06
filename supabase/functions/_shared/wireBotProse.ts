/**
 * Wire bot caption prose — Ryan rule: never em/en dashes in published copy.
 * Prefer ellipses for breaks; hyphen without spaces for numeric ranges only.
 */

/** Strip em dash, en dash (prose), and double-hyphen dash substitutes. */
export function sanitizeWireProse(text: string): string {
  let s = String(text || '')

  // Numeric ranges: 2024–2026, $955–968 → hyphen without spaces
  s = s.replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, '$1-$2')

  // Prose breaks → ellipses (Ryan voice)
  s = s.replace(/\s*[\u2014\u2013]\s*/g, ' ... ')
  s = s.replace(/\s--\s/g, ' ... ')

  return s
    .replace(/(?: \.\.\.){2,}/g, ' ... ')
    .replace(/\s+/g, ' ')
    .trim()
}
