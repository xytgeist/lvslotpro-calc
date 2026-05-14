import { useCallback, useEffect, useRef, useState } from 'react'

const OUT_MS = 400

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

  const clearHide = useCallback(() => {
    if (hideTRef.current != null) {
      clearTimeout(hideTRef.current)
      hideTRef.current = null
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
    setExiting(true)
    hideTRef.current = window.setTimeout(() => {
      setMounted(false)
      setExiting(false)
      hideTRef.current = null
    }, OUT_MS)
  }, [])

  const toneCls = TONE[tone] ?? TONE.amber

  return (
    <span
      className={`relative inline-flex shrink-0 cursor-help ${className}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
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
