/**
 * Short stat labels for Lounge post actions (comment / repost / like counts) and similar UI.
 * 0–999: full integer. 1000+: truncated one-decimal suffix (e.g. 1456 → "1.4K", 1_200_000 → "1.2M").
 *
 * @param {number} n
 * @returns {string}
 */
export function formatCompactStatCount(n) {
  if (!Number.isFinite(n) || n < 0) return '0'
  const t = Math.trunc(n)
  if (t < 1000) return String(t)

  const trunc1 = (v) => Math.trunc(v * 10) / 10
  const fmt = (divisor, suffix) => {
    const x = trunc1(t / divisor)
    const base = x % 1 === 0 ? String(x) : x.toFixed(1)
    return `${base.replace(/\.0$/, '')}${suffix}`
  }

  if (t < 1_000_000) return fmt(1000, 'K')
  if (t < 1_000_000_000) return fmt(1_000_000, 'M')
  return fmt(1_000_000_000, 'B')
}

/** `title` / tooltip text when the shown label is abbreviated (1000+). */
export function fullStatCountTitle(n) {
  if (!Number.isFinite(n) || n < 1000) return undefined
  return Math.trunc(n).toLocaleString()
}
