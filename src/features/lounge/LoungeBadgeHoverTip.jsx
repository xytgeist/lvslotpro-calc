import { useCallback, useEffect, useRef, useState } from 'react'

const OUT_MS = 400
/** Coarse-pointer tap: show tip briefly (hover is unreliable on touch). */
const TAP_TIP_MS = 2800

function prefersFinePointerHover() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

const TONE = {
  amber: 'text-amber-200/95 drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]',
  violet: 'text-violet-200/95 drop-shadow-[0_0_4px_rgba(167,139,250,0.35)]',
  sky: 'text-sky-200/95 drop-shadow-[0_0_4px_rgba(125,211,252,0.3)]',
}

/**
 * Very small hover tooltip with a micro “Giggity”-style drift + blur (see `index.css` / EDGE egg).
 *
 * @param {{ tip: string, tone?: 'amber' | 'violet' | 'sky', children: import('react').ReactNode, className?: string }} props
 */
export default function LoungeBadgeHoverTip({ tip, tone = 'amber', children, className = '' }) {
  const [mounted, setMounted] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const hideTRef = useRef(null)
  const tapDismissTRef = useRef(null)

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

  useEffect(() => () => clearHide(), [clearHide])

  const onEnter = useCallback(() => {
    clearHide()
    setExiting(false)
    setMounted(true)
    setAnimKey((k) => k + 1)
  }, [clearHide])

  const onLeave = useCallback(() => {
    clearHide()
    setExiting(true)
    hideTRef.current = window.setTimeout(() => {
      setMounted(false)
      setExiting(false)
      hideTRef.current = null
    }, OUT_MS)
  }, [clearHide])

  const onWrapperClick = useCallback(
    (e) => {
      e.stopPropagation()
      if (prefersFinePointerHover()) return
      clearHide()
      setExiting(false)
      setMounted(true)
      setAnimKey((k) => k + 1)
      tapDismissTRef.current = window.setTimeout(() => {
        tapDismissTRef.current = null
        setExiting(true)
        hideTRef.current = window.setTimeout(() => {
          setMounted(false)
          setExiting(false)
          hideTRef.current = null
        }, OUT_MS)
      }, TAP_TIP_MS)
    },
    [clearHide],
  )

  const toneCls = TONE[tone] ?? TONE.amber

  return (
    <span
      data-lounge-badge-tip
      className={`relative inline-flex shrink-0 cursor-help touch-manipulation ${className}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onWrapperClick}
    >
      {children}
      {mounted ? (
        <span className="pointer-events-none absolute left-1/2 top-full z-[80] mt-0.5 -translate-x-1/2 text-center">
          <span
            key={exiting ? `out-${animKey}` : `in-${animKey}`}
            role="tooltip"
            className={`inline-block max-w-[13rem] whitespace-normal text-[9px] font-semibold italic leading-snug tracking-wide antialiased ${exiting ? 'lounge-badge-tip-out' : 'lounge-badge-tip-in'} ${toneCls}`}
          >
            {tip}
          </span>
        </span>
      ) : null}
    </span>
  )
}
