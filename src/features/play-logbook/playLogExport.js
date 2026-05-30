import { formatMetricValue, sortMetricSlugs } from './playLogMetrics.js'

/** @typedef {import('./playLogMetrics.js').PlayLogEntry} PlayLogEntry */
/** @typedef {import('./playLogMetrics.js').PlayLogTemplate} PlayLogTemplate */

function csvEscape(cell) {
  const s = String(cell ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/**
 * @param {PlayLogEntry[]} entries
 * @param {PlayLogTemplate | null | undefined} template
 * @param {Record<string, import('./playLogMetrics.js').PlayLogMetricDef>} defsMap
 */
export function buildPlayLogCsv(entries, template, defsMap) {
  const slugs = sortMetricSlugs(template?.metric_slugs || [], defsMap)
  const headers = ['captured_at', 'casino_name', 'notes', ...slugs]
  const rows = entries.map(e => {
    const cells = [
      e.captured_at || '',
      e.casino_name || '',
      e.notes || '',
      ...slugs.map(slug => {
        const def = defsMap[slug]
        const v = e.values?.[slug]
        if (v == null || v === '') return ''
        return def ? formatMetricValue(v, def.value_type) : String(v)
      }),
    ]
    return cells.map(csvEscape).join(',')
  })
  return [headers.map(csvEscape).join(','), ...rows].join('\r\n')
}

/**
 * @param {string} csv
 * @param {string} filename
 */
export function downloadPlayLogCsv(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
