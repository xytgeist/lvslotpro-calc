/** Option A: fraction of tile visible inside the scroll root (intersectionRatio). */
export const LOUNGE_VIDEO_SOUND_ON_RATIO = 0.6
export const LOUNGE_VIDEO_SOUND_OFF_RATIO = 0.4
/** Strong handoff (fallback): outgoing ≥20% clipped, incoming ≥95% visible. */
export const LOUNGE_VIDEO_STRONG_OUT_MAX = 0.8
export const LOUNGE_VIDEO_STRONG_IN_MIN = 0.95
/** Contested handoff (fallback): outgoing ≥50% clipped, incoming ≥50% visible. */
export const LOUNGE_VIDEO_CONTEST_OUT_MAX = 0.5
export const LOUNGE_VIDEO_CONTEST_IN_MIN = 0.5
/** Primary handoff: challenger tile midpoint vs scroll-column centerline (see pickCenterCrossTakeover). */
/** #fuckflingers — only defer cold-start on new tiles; handoff + mute still run while scrolling. */
export const LOUNGE_VIDEO_FLINGER_IDLE_MS = 120

const EMPTY_RING = Object.freeze([])
const EMPTY_RATIOS = Object.freeze({})

/** @type {import('./loungeFeedVideoAutoplayStore.js').LoungeFeedAutoplaySnapshot} */
const INITIAL_SNAPSHOT = Object.freeze({
  activeId: null,
  prefetchPrevId: null,
  prefetchNextId: null,
  ringIds: EMPTY_RING,
  flingerMode: false,
  heroLocked: false,
  heroClientId: null,
  coordinatorSuspended: false,
  tileRatios: EMPTY_RATIOS,
})

/**
 * @typedef {Object} LoungeFeedAutoplaySnapshot
 * @property {string | null} activeId — sole inline `play()` target (when not hero/flinger/suspended).
 * @property {string | null} prefetchPrevId — feed-order predecessor in `{prev, active, next}` ring.
 * @property {string | null} prefetchNextId — feed-order successor in ring.
 * @property {readonly string[]} ringIds — up to three client ids allowed HLS attach (paused warm outside active).
 * @property {boolean} flingerMode — fast scroll: poster only, no new play/handoff.
 * @property {boolean} heroLocked — hero flyout owns resources; ring collapses to hero tile only.
 * @property {string | null} heroClientId
 * @property {boolean} coordinatorSuspended — overlay/detail: freeze feed coordinator.
 * @property {Readonly<Record<string, number>>} tileRatios — clientId → Option A visible fraction.
 */

function tileVisibleRatio(el, rootEl) {
  if (!el || !rootEl) return 0
  const tileRect = el.getBoundingClientRect()
  const rootRect = rootEl.getBoundingClientRect()
  if (tileRect.width < 2 || tileRect.height < 2) return 0
  const overlapTop = Math.max(tileRect.top, rootRect.top)
  const overlapBottom = Math.min(tileRect.bottom, rootRect.bottom)
  const overlapLeft = Math.max(tileRect.left, rootRect.left)
  const overlapRight = Math.min(tileRect.right, rootRect.right)
  if (overlapBottom <= overlapTop || overlapRight <= overlapLeft) return 0
  const overlapArea = (overlapBottom - overlapTop) * (overlapRight - overlapLeft)
  const tileArea = tileRect.width * tileRect.height
  if (tileArea < 1) return 0
  return overlapArea / tileArea
}

/**
 * Scroll-surface coordinator: visibility-band autoplay, `{prev, active, next}` HLS ring,
 * centerline handoff (primary) + clip thresholds (fallback), hero-first resource lock.
 */
export function createAutoplayStore() {
  /** @type {Map<string, () => HTMLElement | null>} */
  const entries = new Map()
  /** @type {Set<() => void>} */
  const listeners = new Set()
  let scheduled = false
  /** @type {React.RefObject<HTMLElement | null> | null} */
  let rootRef = null
  /** @type {LoungeFeedAutoplaySnapshot} */
  let snapshot = INITIAL_SNAPSHOT

  /** @type {string | null} */
  let activeId = null
  let heroLocked = false
  /** @type {string | null} */
  let heroClientId = null
  let coordinatorSuspended = false
  let flingerMode = false
  let lastScrollTop = 0
  /** @type {1 | -1 | 0} */
  let scrollDirection = 0
  /** @type {ReturnType<typeof setTimeout> | null} */
  let flingerIdleTimer = null

  const emit = () => {
    listeners.forEach((l) => {
      try {
        l()
      } catch {
        // ignore
      }
    })
  }

  const buildOrderedIds = (rootEl) => {
    /** @type {{ id: string, top: number, left: number }[]} */
    const rows = []
    for (const [id, getEl] of entries) {
      const el = getEl()
      if (!el) continue
      const rect = el.getBoundingClientRect()
      rows.push({ id, top: rect.top, left: rect.left })
    }
    rows.sort((a, b) => a.top - b.top || a.left - b.left)
    return rows.map((r) => r.id)
  }

  const computeTileMetrics = (rootEl) => {
    /** @type {Record<string, number>} */
    const ratios = {}
    /** @type {Record<string, number>} */
    const centerYs = {}
    for (const [id, getEl] of entries) {
      const el = getEl()
      if (!el || !rootEl) {
        ratios[id] = 0
        centerYs[id] = 0
        continue
      }
      const rect = el.getBoundingClientRect()
      ratios[id] = tileVisibleRatio(el, rootEl)
      centerYs[id] = (rect.top + rect.bottom) / 2
    }
    return { ratios, centerYs }
  }

  const scrollPortMidY = (rootEl) => {
    if (!rootEl) {
      return typeof window !== 'undefined' ? window.innerHeight / 2 : 400
    }
    const rootRect = rootEl.getBoundingClientRect()
    return rootRect.top + rootRect.height / 2
  }

  /**
   * Primary handoff: next/prev Stream tile midpoint crosses the scroll-column centerline.
   * Scroll down → feed successor with centerY ≤ midY; scroll up → predecessor with centerY ≥ midY.
   */
  const pickCenterCrossTakeover = (incumbent, orderedIds, ratios, centerYs, midY, direction) => {
    const idx = orderedIds.indexOf(incumbent)
    if (idx < 0) return null

    const visible = (id) => (ratios[id] ?? 0) > 0

    if (direction > 0) {
      for (let i = idx + 1; i < orderedIds.length; i += 1) {
        const id = orderedIds[i]
        if (!visible(id)) continue
        if ((centerYs[id] ?? 0) <= midY) return id
      }
      return null
    }

    if (direction < 0) {
      for (let i = idx - 1; i >= 0; i -= 1) {
        const id = orderedIds[i]
        if (!visible(id)) continue
        if ((centerYs[id] ?? 0) >= midY) return id
      }
      return null
    }

    for (let i = idx + 1; i < orderedIds.length; i += 1) {
      const id = orderedIds[i]
      if (!visible(id)) continue
      if ((centerYs[id] ?? 0) <= midY) return id
    }
    for (let i = idx - 1; i >= 0; i -= 1) {
      const id = orderedIds[i]
      if (!visible(id)) continue
      if ((centerYs[id] ?? 0) >= midY) return id
    }
    return null
  }

  /**
   * Fallback handoff when center cross has not fired (clip thresholds).
   * @param {string | null} incumbent
   * @param {readonly string[]} orderedIds
   * @param {Record<string, number>} ratios
   */
  const pickClipTakeover = (incumbent, orderedIds, ratios) => {
    if (!incumbent) return null
    const incRatio = ratios[incumbent] ?? 0
    const idx = orderedIds.indexOf(incumbent)
    if (idx < 0) return null

    /** @type {string[]} */
    const searchOrder = []
    if (scrollDirection >= 0) {
      for (let i = idx + 1; i < orderedIds.length; i += 1) searchOrder.push(orderedIds[i])
      for (let i = idx - 1; i >= 0; i -= 1) searchOrder.push(orderedIds[i])
    } else if (scrollDirection < 0) {
      for (let i = idx - 1; i >= 0; i -= 1) searchOrder.push(orderedIds[i])
      for (let i = idx + 1; i < orderedIds.length; i += 1) searchOrder.push(orderedIds[i])
    } else {
      for (let i = idx + 1; i < orderedIds.length; i += 1) searchOrder.push(orderedIds[i])
      for (let i = idx - 1; i >= 0; i -= 1) searchOrder.push(orderedIds[i])
    }

    /** @type {{ id: string, ratio: number, strong: boolean, contested: boolean }[]} */
    const qualified = []
    for (const id of searchOrder) {
      if (id === incumbent) continue
      const ratio = ratios[id] ?? 0
      const strong = incRatio <= LOUNGE_VIDEO_STRONG_OUT_MAX && ratio >= LOUNGE_VIDEO_STRONG_IN_MIN
      const contested = incRatio <= LOUNGE_VIDEO_CONTEST_OUT_MAX && ratio >= LOUNGE_VIDEO_CONTEST_IN_MIN
      if (strong || contested) qualified.push({ id, ratio, strong, contested })
    }
    if (qualified.length === 0) return null

    qualified.sort((a, b) => {
      if (a.strong !== b.strong) return a.strong ? -1 : 1
      if (b.ratio !== a.ratio) return b.ratio - a.ratio
      return orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
    })
    return qualified[0].id
  }

  const pickBestVisibleNearCenter = (orderedIds, ratios, centerYs, midY, exceptId = null) => {
    /** @type {string | null} */
    let best = null
    let bestDist = Infinity
    for (const id of orderedIds) {
      if (id === exceptId) continue
      if ((ratios[id] ?? 0) <= 0) continue
      const dist = Math.abs((centerYs[id] ?? 0) - midY)
      if (dist < bestDist) {
        bestDist = dist
        best = id
      }
    }
    return best
  }

  const publish = (orderedIds, ratios, centerYs, rootEl) => {
    const midY = scrollPortMidY(rootEl)
    let nextActive = activeId
    let prefetchPrevId = null
    let prefetchNextId = null
    /** @type {string[]} */
    let ringIds = []

    if (heroLocked && heroClientId) {
      ringIds = [heroClientId]
      prefetchPrevId = null
      prefetchNextId = null
    } else if (!coordinatorSuspended) {
      if (!nextActive) {
        const firstVisible = orderedIds.find((id) => (ratios[id] ?? 0) > 0)
        if (firstVisible) nextActive = firstVisible
      }

      if (nextActive) {
        const centerTakeover = pickCenterCrossTakeover(
          nextActive,
          orderedIds,
          ratios,
          centerYs,
          midY,
          scrollDirection,
        )
        const clipTakeover = centerTakeover
          ? null
          : pickClipTakeover(nextActive, orderedIds, ratios)
        const takeover = centerTakeover ?? clipTakeover
        if (takeover) nextActive = takeover

        const incRatio = ratios[nextActive] ?? 0
        if (incRatio <= 0) {
          nextActive = pickBestVisibleNearCenter(orderedIds, ratios, centerYs, midY, nextActive)
        }
      } else {
        nextActive = pickBestVisibleNearCenter(orderedIds, ratios, centerYs, midY)
      }

      if (nextActive) {
        const idx = orderedIds.indexOf(nextActive)
        if (idx >= 0) {
          prefetchPrevId = idx > 0 ? orderedIds[idx - 1] : null
          prefetchNextId = idx < orderedIds.length - 1 ? orderedIds[idx + 1] : null
          if (flingerMode) {
            /** Fling: keep one decoder on active only — no ring expansion until scroll settles. */
            ringIds = [nextActive]
          } else {
            ringIds = [prefetchPrevId, nextActive, prefetchNextId].filter(Boolean)
          }
        }
      }
    } else if (coordinatorSuspended) {
      ringIds = nextActive ? [nextActive] : []
      if (nextActive) {
        const idx = orderedIds.indexOf(nextActive)
        if (idx >= 0) {
          prefetchPrevId = idx > 0 ? orderedIds[idx - 1] : null
          prefetchNextId = idx < orderedIds.length - 1 ? orderedIds[idx + 1] : null
        }
      }
    }

    const prevActiveId = activeId
    activeId = nextActive

    if (prevActiveId && prevActiveId !== nextActive) {
      try {
        const prevGetEl = entries.get(prevActiveId)
        const prevEl = prevGetEl?.()
        const video = prevEl?.querySelector?.('video')
        if (video) {
          video.pause()
          video.muted = true
        }
      } catch {
        // ignore
      }
    }

    const nextSnapshot = Object.freeze({
      activeId: nextActive,
      prefetchPrevId,
      prefetchNextId,
      ringIds: Object.freeze(ringIds),
      flingerMode,
      heroLocked,
      heroClientId,
      coordinatorSuspended,
      tileRatios: Object.freeze({ ...ratios }),
    })

    const structuralChange =
      nextSnapshot.activeId !== snapshot.activeId ||
      nextSnapshot.prefetchPrevId !== snapshot.prefetchPrevId ||
      nextSnapshot.prefetchNextId !== snapshot.prefetchNextId ||
      nextSnapshot.flingerMode !== snapshot.flingerMode ||
      nextSnapshot.heroLocked !== snapshot.heroLocked ||
      nextSnapshot.heroClientId !== snapshot.heroClientId ||
      nextSnapshot.coordinatorSuspended !== snapshot.coordinatorSuspended ||
      nextSnapshot.ringIds.length !== snapshot.ringIds.length ||
      nextSnapshot.ringIds.some((id, i) => id !== snapshot.ringIds[i])

    const ratioIds = new Set([...Object.keys(snapshot.tileRatios), ...Object.keys(ratios)])
    let ratiosChanged = false
    let soundBandCrossed = false
    const activeForSound = nextActive ?? snapshot.activeId
    for (const id of ratioIds) {
      const prev = snapshot.tileRatios[id] ?? 0
      const next = ratios[id] ?? 0
      if (Math.abs(prev - next) > 0.004) ratiosChanged = true
      if (id === activeForSound) {
        const wasOn = prev >= LOUNGE_VIDEO_SOUND_ON_RATIO
        const wasOff = prev <= LOUNGE_VIDEO_SOUND_OFF_RATIO
        const nowOn = next >= LOUNGE_VIDEO_SOUND_ON_RATIO
        const nowOff = next <= LOUNGE_VIDEO_SOUND_OFF_RATIO
        if (wasOn !== nowOn || wasOff !== nowOff) soundBandCrossed = true
      }
    }

    if (structuralChange || ratiosChanged || soundBandCrossed) {
      snapshot = nextSnapshot
      emit()
    }
  }

  const recompute = () => {
    scheduled = false
    const rootEl = rootRef?.current ?? null
    const orderedIds = buildOrderedIds(rootEl)
    const { ratios, centerYs } = computeTileMetrics(rootEl)
    publish(orderedIds, ratios, centerYs, rootEl)
  }

  const schedule = () => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(recompute)
  }

  /** Scroll tick: always recompute handoff; flinger only shrinks prefetch ring. */
  const markScroll = () => {
    const rootEl = rootRef?.current
    if (rootEl) {
      const st = rootEl.scrollTop
      if (st > lastScrollTop) scrollDirection = 1
      else if (st < lastScrollTop) scrollDirection = -1
      lastScrollTop = st
    }
    if (!heroLocked && !coordinatorSuspended) {
      flingerMode = true
      if (flingerIdleTimer) window.clearTimeout(flingerIdleTimer)
      flingerIdleTimer = window.setTimeout(() => {
        flingerIdleTimer = null
        flingerMode = false
        schedule()
      }, LOUNGE_VIDEO_FLINGER_IDLE_MS)
    }
    schedule()
  }

  return {
    /** @param {React.RefObject<HTMLElement | null> | null} ref */
    setScrollRootRef(ref) {
      rootRef = ref
    },
    /** @returns {() => void} */
    register(id, getEl) {
      entries.set(id, getEl)
      queueMicrotask(schedule)
      return () => {
        entries.delete(id)
        if (activeId === id) activeId = null
        if (heroClientId === id && heroLocked) {
          heroLocked = false
          heroClientId = null
        }
        queueMicrotask(schedule)
      }
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot() {
      return snapshot
    },
    schedule,
    markScroll,
    /** Promote a tile to active (tap for sound / hero intent). */
    forceActive(id) {
      if (!id || activeId === id) return
      activeId = id
      schedule()
    },
    /** Hero flyout: collapse ring to hero tile only — max one decoder for flyout perf. */
    enterHeroLock(id) {
      if (!id) return
      heroLocked = true
      heroClientId = id
      flingerMode = false
      if (flingerIdleTimer) {
        window.clearTimeout(flingerIdleTimer)
        flingerIdleTimer = null
      }
      schedule()
    },
    exitHeroLock() {
      if (!heroLocked) return
      heroLocked = false
      heroClientId = null
      schedule()
    },
    /** Post detail / overlay: freeze handoff and shrink ring (feed stays mounted). */
    setCoordinatorSuspended(suspended) {
      const next = Boolean(suspended)
      if (coordinatorSuspended === next) return
      coordinatorSuspended = next
      schedule()
    },
  }
}
