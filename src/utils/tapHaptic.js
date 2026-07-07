import { isAndroidDevice, isIosDevice } from './pwaNotificationPrompt.js'

const TAP_TARGET_SELECTOR = [
  'button:not(:disabled)',
  'a[href]',
  '[role="button"]:not([aria-disabled="true"])',
  'input[type="button"]:not(:disabled)',
  'input[type="submit"]:not(:disabled)',
  'input[type="reset"]:not(:disabled)',
  'input[type="checkbox"]:not(:disabled)',
  'input[type="radio"]:not(:disabled)',
  'select:not(:disabled)',
  'summary',
  'label[for]',
  '[data-tap-haptic]',
  '.touch-manipulation',
].join(',')

const TEXT_INPUT_TYPES = new Set([
  'text',
  'email',
  'password',
  'search',
  'tel',
  'url',
  'number',
  'date',
  'datetime-local',
  'month',
  'week',
  'time',
  'color',
  'file',
  'hidden',
])

const IOS_SWITCH_INPUT_ID = 'edge-tap-haptic-switch'

let iosHapticLabel = null
let iosHapticInput = null

function hasVibrationApi() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

/** Touch-first phone/tablet ... UA + touch surface, not `(pointer: coarse)` alone. */
function isMobileTapEnvironment() {
  if (typeof window === 'undefined') return false
  if (isIosDevice() || isAndroidDevice()) return true
  return (
    typeof navigator !== 'undefined' &&
    navigator.maxTouchPoints > 0 &&
    window.matchMedia?.('(hover: none)')?.matches === true
  )
}

/** True when this device can fire tap haptics. */
export function isTapHapticSupported() {
  if (typeof document === 'undefined') return false
  if (!isMobileTapEnvironment()) return false
  return hasVibrationApi() || isIosDevice()
}

function ensureIosHapticSwitch() {
  if (iosHapticLabel || typeof document === 'undefined' || !document.body) return

  const input = document.createElement('input')
  input.type = 'checkbox'
  input.id = IOS_SWITCH_INPUT_ID
  input.setAttribute('switch', '')
  input.style.display = 'none'
  document.body.appendChild(input)
  iosHapticInput = input

  const label = document.createElement('label')
  label.htmlFor = IOS_SWITCH_INPUT_ID
  label.setAttribute('aria-hidden', 'true')
  label.style.display = 'none'
  document.body.appendChild(label)
  iosHapticLabel = label
}

function fireIosSwitchHaptic() {
  ensureIosHapticSwitch()
  if (!iosHapticLabel || !iosHapticInput) return
  try {
    iosHapticLabel.click()
  } catch {
    // no-op
  }
}

function fireAndroidVibrate() {
  if (!hasVibrationApi()) return
  try {
    navigator.vibrate(40)
  } catch {
    // no-op
  }
}

/** Light impact for standard button taps (X.com-style). Must run inside the user gesture. */
export function triggerTapHapticLight() {
  if (!isTapHapticSupported()) return

  if (isIosDevice()) {
    fireIosSwitchHaptic()
    return
  }

  fireAndroidVibrate()
}

function isTextEntryElement(el) {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'TEXTAREA') return true
  if (el.isContentEditable) return true
  if (tag !== 'INPUT') return false
  const type = (el.getAttribute('type') || 'text').toLowerCase()
  if (type === 'range') return true
  return TEXT_INPUT_TYPES.has(type)
}

function findTapHapticTarget(node) {
  if (!(node instanceof Element)) return null
  if (node.closest('[data-no-tap-haptic]')) return null

  const el = node.closest(TAP_TARGET_SELECTOR)
  if (!el || !(el instanceof HTMLElement)) return null
  if (isTextEntryElement(el)) return null
  if (el.matches('button:disabled, input:disabled, select:disabled, [aria-disabled="true"]')) return null
  return el
}

function shouldHapticForTapEvent(event) {
  if (!isMobileTapEnvironment() || !isTapHapticSupported()) return false
  // Ignore synthetic keyboard activations; touch/pointer taps have detail >= 1.
  if (event.detail === 0) return false
  return true
}

/**
 * Document-level tap haptics for buttons and other touch targets.
 * Uses trusted click (iOS switch trick needs user activation).
 * Returns a cleanup function (for tests or future teardown).
 */
export function installGlobalTapHaptic() {
  if (typeof document === 'undefined' || !isMobileTapEnvironment()) return () => {}

  ensureIosHapticSwitch()

  const onTap = (event) => {
    if (!shouldHapticForTapEvent(event)) return
    if (!findTapHapticTarget(event.target)) return
    triggerTapHapticLight()
  }

  document.addEventListener('click', onTap, { capture: true, passive: true })

  return () => {
    document.removeEventListener('click', onTap, true)
  }
}
