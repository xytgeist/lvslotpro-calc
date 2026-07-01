/**
 * Lightweight in-app console log capture.
 * Call `installAppDebugLog()` once at app startup to begin intercepting
 * console.log / console.warn / console.error. Captured lines are stored in
 * a circular buffer (last MAX_LINES entries) and subscribers are notified.
 *
 * Access captured logs via `getAppDebugLines()` or subscribe with
 * `subscribeAppDebugLog(fn)` / `unsubscribeAppDebugLog(fn)`.
 */

const MAX_LINES = 200

/** @type {string[]} */
let lines = []
/** @type {Set<() => void>} */
const subs = new Set()
let installed = false

function notify() {
  subs.forEach((fn) => fn())
}

function formatArgs(args) {
  return args
    .map((a) => {
      if (a === null) return 'null'
      if (a === undefined) return 'undefined'
      if (typeof a === 'object') {
        try { return JSON.stringify(a) } catch { return String(a) }
      }
      return String(a)
    })
    .join(' ')
}

function push(level, args) {
  const now = new Date()
  const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`
  const line = `[${ts}] ${level} ${formatArgs(args)}`
  lines.push(line)
  if (lines.length > MAX_LINES) lines = lines.slice(-MAX_LINES)
  notify()
}

export function installAppDebugLog() {
  if (installed || typeof window === 'undefined') return
  installed = true

  const origLog   = console.log.bind(console)
  const origWarn  = console.warn.bind(console)
  const origError = console.error.bind(console)

  console.log = (...args) => { origLog(...args);   push('LOG',   args) }
  console.warn  = (...args) => { origWarn(...args);  push('WARN',  args) }
  console.error = (...args) => { origError(...args); push('ERR',   args) }
}

export function getAppDebugLines() {
  return [...lines]
}

export function clearAppDebugLines() {
  lines = []
  notify()
}

export function subscribeAppDebugLog(fn) {
  subs.add(fn)
}

export function unsubscribeAppDebugLog(fn) {
  subs.delete(fn)
}
