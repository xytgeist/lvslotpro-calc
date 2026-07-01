const STORAGE_KEY = 'lvsp:playLogSavedGuests:v1'

/** @param {string} userId */
function storageKey(userId) {
  return `${String(userId || '').trim()}`
}

/** @param {string} userId */
export function loadSavedGuestLabels(userId) {
  const uid = storageKey(userId)
  if (!uid || typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const list = parsed?.[uid]
    if (!Array.isArray(list)) return []
    return list
      .map(l => String(l || '').trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

/** @param {string} userId @param {string[]} labels */
function writeSavedGuestLabels(userId, labels) {
  const uid = storageKey(userId)
  if (!uid || typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw && typeof raw === 'object' ? JSON.parse(raw) : {}
    const base = parsed && typeof parsed === 'object' ? parsed : {}
    base[uid] = labels
    localStorage.setItem(STORAGE_KEY, JSON.stringify(base))
  } catch {
    /* quota / private mode */
  }
}

/** @param {string} userId @param {string} label */
export function addSavedGuestLabel(userId, label) {
  const trimmed = String(label || '').trim()
  if (!trimmed) return
  const key = trimmed.toLowerCase()
  const existing = loadSavedGuestLabels(userId)
  if (existing.some(g => g.toLowerCase() === key)) return
  writeSavedGuestLabels(userId, [...existing, trimmed])
}

/** @param {string} userId @param {string} label */
export function removeSavedGuestLabel(userId, label) {
  const key = String(label || '')
    .trim()
    .toLowerCase()
  if (!key) return
  const next = loadSavedGuestLabels(userId).filter(g => g.toLowerCase() !== key)
  writeSavedGuestLabels(userId, next)
}

/**
 * @param {string[]} savedLabels
 * @param {Map<string, { label: string, count: number }>} usageByKey
 */
export function mergeGuestLabelsForPicker(savedLabels, usageByKey) {
  /** @type {Map<string, { label: string, count: number }>} */
  const merged = new Map()
  for (const [key, row] of usageByKey || []) {
    merged.set(key, { label: row.label, count: row.count })
  }
  for (const label of savedLabels || []) {
    const trimmed = String(label || '').trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (!merged.has(key)) merged.set(key, { label: trimmed, count: 0 })
  }
  return [...merged.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  })
}
