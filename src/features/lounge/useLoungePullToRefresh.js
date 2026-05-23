import { useEffect, useRef } from 'react'
import {
  LOUNGE_PULL_FINGER_GAIN,
  LOUNGE_PULL_INDICATOR_BASE_PX,
  LOUNGE_PULL_INDICATOR_MAX_PX,
  LOUNGE_PULL_MAX_VISUAL_PX,
  LOUNGE_PULL_REFRESH_THRESHOLD_PX,
  LOUNGE_PULL_SNAP_MS,
  loungePullVisualOffsetPx,
} from '../../utils/loungePullRefresh.js'

/**
 * Touch pull-to-refresh for a scroll root + posts zone below a header row.
 * Updates indicator DOM via refs (no per-frame React re-renders).
 */
export function useLoungePullToRefresh({
  scrollRootRef,
  pullZoneRef,
  pullPostsWrapRef,
  pullIndicatorOverlayRef,
  pullIndicatorWrapRef,
  pullArrowRef,
  pullSpinnerRef,
  pullAriaRef,
  onRefresh,
  enabled = true,
  pullRefreshing = false,
  setPullRefreshing,
}) {
  const pullStartYRef = useRef(null)
  const pullDistanceRef = useRef(0)
  const pullTriggeredRef = useRef(false)
  const pullVisualRafRef = useRef(0)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined
    const zone = scrollRootRef?.current
    const pullZone = pullZoneRef?.current
    if (!zone || !pullZone) return undefined

    const thresholdPx = LOUNGE_PULL_REFRESH_THRESHOLD_PX
    const visualCapPx = LOUNGE_PULL_INDICATOR_MAX_PX
    const refreshIndicatorPx = LOUNGE_PULL_INDICATOR_BASE_PX

    const applyPullVisual = (visualPx, { animate = false } = {}) => {
      const posts = pullPostsWrapRef?.current
      const overlay = pullIndicatorOverlayRef?.current
      const transformTransition = animate ? `transform ${LOUNGE_PULL_SNAP_MS}` : 'none'
      const overlayTransition = animate ? `height ${LOUNGE_PULL_SNAP_MS}, opacity 180ms ease` : 'none'
      if (posts) {
        posts.style.transition = transformTransition
        posts.style.transform = visualPx > 0 ? `translate3d(0, ${visualPx}px, 0)` : ''
      }
      if (overlay) {
        overlay.style.transition = overlayTransition
        overlay.style.height = `${visualPx}px`
        overlay.style.opacity = visualPx > 0 ? '1' : '0'
      }
    }

    const setPullIndicator = (rawDistance, refreshing = false) => {
      const wrap = pullIndicatorWrapRef?.current
      const arrow = pullArrowRef?.current
      const spinner = pullSpinnerRef?.current
      const aria = pullAriaRef?.current
      if (!wrap || !arrow || !spinner) return

      if (refreshing) {
        arrow.classList.add('hidden')
        spinner.classList.remove('hidden')
        wrap.setAttribute('aria-label', 'Refreshing')
        if (aria) aria.textContent = 'Refreshing'
        return
      }

      spinner.classList.add('hidden')
      arrow.classList.remove('hidden')

      if (rawDistance <= 0) {
        arrow.style.transform = 'rotate(0deg)'
        wrap.setAttribute('aria-label', 'Pull down to refresh')
        if (aria) aria.textContent = 'Pull down to refresh'
        return
      }

      if (rawDistance >= thresholdPx) {
        arrow.style.transform = 'rotate(180deg)'
        wrap.setAttribute('aria-label', 'Release to refresh')
        if (aria) aria.textContent = 'Release to refresh'
      } else {
        arrow.style.transform = 'rotate(0deg)'
        wrap.setAttribute('aria-label', 'Pull down to refresh')
        if (aria) aria.textContent = 'Pull down to refresh'
      }
    }

    const flushPullVisual = (rawDistance, { animate = false } = {}) => {
      const visual = loungePullVisualOffsetPx(rawDistance, visualCapPx)
      applyPullVisual(visual, { animate })
      setPullIndicator(rawDistance, false)
    }

    const schedulePullVisual = (rawDistance) => {
      pullDistanceRef.current = rawDistance
      if (pullVisualRafRef.current) return
      pullVisualRafRef.current = window.requestAnimationFrame(() => {
        pullVisualRafRef.current = 0
        flushPullVisual(rawDistance, { animate: false })
      })
    }

    const onTouchStart = (e) => {
      if (zone.scrollTop > 0) {
        pullStartYRef.current = null
        return
      }
      const touch = e.touches?.[0]
      if (!touch) {
        pullStartYRef.current = null
        return
      }
      pullStartYRef.current = touch.clientY
      pullTriggeredRef.current = false
    }

    const onTouchMove = (e) => {
      if (pullRefreshing) return
      const startY = pullStartYRef.current
      if (startY == null) return
      const currentY = e.touches?.[0]?.clientY ?? startY
      const dy = currentY - startY
      if (dy <= 0) {
        schedulePullVisual(0)
        return
      }
      e.preventDefault()
      const raw = Math.min(LOUNGE_PULL_MAX_VISUAL_PX, Math.floor(dy * LOUNGE_PULL_FINGER_GAIN))
      schedulePullVisual(raw)
    }

    const onTouchEnd = async () => {
      const distance = pullDistanceRef.current
      pullStartYRef.current = null
      pullDistanceRef.current = 0
      const shouldRefresh = distance >= thresholdPx && !pullTriggeredRef.current
      if (!shouldRefresh) {
        applyPullVisual(0, { animate: true })
        setPullIndicator(0, false)
        return
      }
      pullTriggeredRef.current = true
      setPullRefreshing?.(true)
      applyPullVisual(refreshIndicatorPx, { animate: true })
      setPullIndicator(0, true)
      try {
        await onRefresh?.()
      } finally {
        setPullRefreshing?.(false)
        pullTriggeredRef.current = false
        applyPullVisual(0, { animate: true })
        setPullIndicator(0, false)
      }
    }

    pullZone.addEventListener('touchstart', onTouchStart, { passive: true })
    zone.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
    zone.addEventListener('touchend', onTouchEnd, { passive: true, capture: true })
    zone.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true })

    return () => {
      if (pullVisualRafRef.current) {
        window.cancelAnimationFrame(pullVisualRafRef.current)
        pullVisualRafRef.current = 0
      }
      pullZone.removeEventListener('touchstart', onTouchStart)
      zone.removeEventListener('touchmove', onTouchMove, { capture: true })
      zone.removeEventListener('touchend', onTouchEnd, { capture: true })
      zone.removeEventListener('touchcancel', onTouchEnd, { capture: true })
    }
  }, [
    enabled,
    onRefresh,
    pullArrowRef,
    pullAriaRef,
    pullIndicatorOverlayRef,
    pullIndicatorWrapRef,
    pullPostsWrapRef,
    pullRefreshing,
    pullSpinnerRef,
    pullZoneRef,
    scrollRootRef,
    setPullRefreshing,
  ])
}
