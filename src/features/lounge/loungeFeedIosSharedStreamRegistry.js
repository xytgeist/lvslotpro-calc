/** @typedef {{ getSlotEl: () => HTMLElement | null, streamUid: string }} IosSharedStreamHostSpec */

/** @type {Map<string, IosSharedStreamHostSpec>} */
const hosts = new Map()
/** @type {Set<() => void>} */
const listeners = new Set()

const emit = () => {
  listeners.forEach((listener) => {
    try {
      listener()
    } catch {
      // ignore
    }
  })
}

/** @param {() => void} listener */
export function subscribeIosSharedStreamHosts(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getIosSharedStreamHostSnapshot() {
  return hosts
}

/**
 * Active feed tile registers its flyout slot for the shared iOS `<video>`.
 * @param {string} clientId
 * @param {IosSharedStreamHostSpec} spec
 */
export function registerIosSharedStreamHost(clientId, spec) {
  if (!clientId || !spec?.streamUid) return () => {}
  hosts.set(clientId, spec)
  emit()
  return () => {
    hosts.delete(clientId)
    emit()
  }
}
