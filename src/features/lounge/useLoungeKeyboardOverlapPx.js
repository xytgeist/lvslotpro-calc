import { useEffect, useState } from 'react'

/**
 * visualViewport keyboard overlap — same formula as Lounge post-detail reply composer.
 *
 * @param {boolean} active
 */
export function useLoungeKeyboardOverlapPx(active = true) {
  const [kbOverlapPx, setKbOverlapPx] = useState(0)

  useEffect(() => {
    if (!active || typeof window === 'undefined') {
      setKbOverlapPx(0)
      return undefined
    }
    const vv = window.visualViewport
    if (!vv) return undefined
    const sync = () => {
      try {
        const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
        setKbOverlapPx(Number.isFinite(overlap) ? overlap : 0)
      } catch {
        setKbOverlapPx(0)
      }
    }
    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
      setKbOverlapPx(0)
    }
  }, [active])

  return kbOverlapPx
}
