import { createPortal } from 'react-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const OUT_MS = 220
/** Brief delay so pointer can move from anchor to portaled tip without dismissing. */
const LEAVE_DELAY_MS = 140
/** Coarse-pointer tap: show tip briefly (hover is unreliable on touch). */
const TAP_TIP_MS = Math.round(2800 / 3)

function prefersFinePointerHover() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

const TONE = {
  amber: 'text-amber-200/95 drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]',
  /** Matches admin crown icon (`text-amber-400`). */
  crown: 'text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.35)]',
  violet: 'text-violet-200/95 drop-shadow-[0_0_4px_rgba(167,139,250,0.35)]',
  sky: 'text-sky-200/95 drop-shadow-[0_0_4px_rgba(125,211,252,0.3)]',
}

/**
 * Small hover / tap tooltip for Lounge role + OG badges.
 * Portaled above the anchor so feed scroll / overflow / paint containment cannot clip it,
 * with a short leave delay so the pointer can reach the tip (tip uses pointer-events).
 *
 * @param {{ tip: string, tone?: 'amber' | 'crown' | 'violet' | 'sky', children: import('react').ReactNode, className?: string }} props
 */
export default function LoungeBadgeHoverTip({ tip, tone = 'amber', children, className = '' }) {
  const anchorRef = useRef(null)
  const tipShellRef = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const [tipBox, setTipBox] = useState({ left: 0, top: 0, visible: false })

  const hideTRef = useRef(null)
  const tapDismissTRef = useRef(null)
  const leaveDelayTRef = useRef(null)
  const canRepositionRef = useRef(false)

  const clearLeaveDelay = useCallback(() => {
    if (leaveDelayTRef.current != null) {
      clearTimeout(leaveDelayTRef.current)
      leaveDelayTRef.current = null
    }
  }, [])

  const clearHide = useCallback(() => {
    if (hideTRef.current != null) {
      clearTimeout(hideTRef.current)
      hideTRef.current = null
    }
    if (tapDismissTRef.current != null) {
      clearTimeout(tapDismissTRef.current)
      tapDismissTRef.current = null
    }
  }, [])

  const clearAllTimers = useCallback(() => {
    clearHide()
    clearLeaveDelay()
  }, [clearHide, clearLeaveDelay])

  useEffect(() => () => clearAllTimers(), [clearAllTimers])

  const beginExit = useCallback(() => {
    clearLeaveDelay()
    if (hideTRef.current != null) {
      clearTimeout(hideTRef.current)
      hideTRef.current = null
    }
    setExiting(true)
    hideTRef.current = window.setTimeout(() => {
      canRepositionRef.current = false
      setMounted(false)
      setExiting(false)
      setTipBox((b) => ({ ...b, visible: false }))
      hideTRef.current = null
    }, OUT_MS)
  }, [clearLeaveDelay])

  const updateTipPosition = useCallback(() => {
    if (!canRepositionRef.current) return
    const anchor = anchorRef.current
    const shell = tipShellRef.current
    if (!anchor) return
    const ar = anchor.getBoundingClientRect()
    const h = shell?.offsetHeight ?? 18
    const gap = 6
    setTipBox({
      left: ar.left + ar.width / 2,
      top: ar.top - h - gap,
      visible: true,
    })
  }, [])

  useLayoutEffect(() => {
    if (!mounted) {
      canRepositionRef.current = false
      return undefined
    }
    canRepositionRef.current = true
    let cancelled = false
    const run = () => {
      if (!cancelled) updateTipPosition()
    }
    run()
    requestAnimationFrame(() => {
      run()
      requestAnimationFrame(run)
    })
    const onScrollOrResize = () => run()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    let ro
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(run)
      const anchor = anchorRef.current
      const shell = tipShellRef.current
      if (anchor) ro.observe(anchor)
      if (shell) ro.observe(shell)
    }
    return () => {
      cancelled = true
      canRepositionRef.current = false
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
      ro?.disconnect()
    }
  }, [mounted, tip, updateTipPosition])

  const onEnterAnchor = useCallback(() => {
    clearAllTimers()
    setExiting(false)
    setMounted(true)
    setAnimKey((k) => k + 1)
  }, [clearAllTimers])

  const onLeaveAnchor = useCallback(() => {
    clearLeaveDelay()
    leaveDelayTRef.current = window.setTimeout(() => {
      leaveDelayTRef.current = null
      beginExit()
    }, LEAVE_DELAY_MS)
  }, [beginExit, clearLeaveDelay])

  const onEnterTip = useCallback(() => {
    clearAllTimers()
    setExiting(false)
  }, [clearAllTimers])

  const onLeaveTip = useCallback(() => {
    beginExit()
  }, [beginExit])

  const onWrapperClick = useCallback(
    (e) => {
      e.stopPropagation()
      if (prefersFinePointerHover()) return
      clearAllTimers()
      setExiting(false)
      setMounted(true)
      setAnimKey((k) => k + 1)
      tapDismissTRef.current = window.setTimeout(() => {
        tapDismissTRef.current = null
        beginExit()
      }, TAP_TIP_MS)
    },
    [beginExit, clearAllTimers],
  )

  const toneCls = TONE[tone] ?? TONE.amber

  const tipPortal =
    mounted && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={tipShellRef}
            data-lounge-badge-tip
            role="tooltip"
            className="pointer-events-auto fixed z-[10050] max-w-[13rem] text-center"
            style={{
              left: tipBox.left,
              top: tipBox.top,
              transform: 'translateX(-50%)',
              opacity: tipBox.visible ? 1 : 0,
              visibility: tipBox.visible ? 'visible' : 'hidden',
            }}
            onMouseEnter={onEnterTip}
            onMouseLeave={onLeaveTip}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              key={exiting ? `out-${animKey}` : `in-${animKey}`}
              className={`inline-block whitespace-normal text-[9px] font-semibold leading-snug tracking-wide antialiased ${exiting ? 'lounge-badge-tip-out' : 'lounge-badge-tip-in'} ${toneCls}`}
            >
              {tip}
            </span>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <span
        ref={anchorRef}
        data-lounge-badge-tip
        className={`relative inline-flex shrink-0 cursor-help touch-manipulation ${className}`}
        onMouseEnter={onEnterAnchor}
        onMouseLeave={onLeaveAnchor}
        onClick={onWrapperClick}
      >
        {children}
      </span>
      {tipPortal}
    </>
  )
}
