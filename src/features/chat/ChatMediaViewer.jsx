import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const DISMISS_THRESHOLD_PX = 80
const DISMISS_VELOCITY_PX_MS = 0.4

/**
 * Full-screen media viewer for chat messages.
 * Swipe left/right to navigate images; swipe up/down to dismiss; video plays in an iframe.
 *
 * @param {{
 *   items: Array<{ type: 'image' | 'video', url?: string, videoUid?: string, posterUrl?: string }>,
 *   initialIndex?: number,
 *   onClose: () => void,
 * }} props
 */
export default function ChatMediaViewer({ items, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(Math.min(initialIndex, items.length - 1))

  // Swipe-to-dismiss state
  const [dragY, setDragY]         = useState(0)
  const [dismissing, setDismissing] = useState(false)

  const touchStartX  = useRef(0)
  const touchStartY  = useRef(0)
  const touchStartMs = useRef(0)
  const axis         = useRef(null) // 'h' | 'v' | null

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIndex((i) => Math.min(items.length - 1, i + 1)), [items.length])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  const onTouchStart = (e) => {
    touchStartX.current  = e.touches[0].clientX
    touchStartY.current  = e.touches[0].clientY
    touchStartMs.current = Date.now()
    axis.current = null
    setDragY(0)
  }

  const onTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)

    // Lock axis on first significant movement
    if (axis.current === null && (adx > 6 || ady > 6)) {
      axis.current = adx > ady ? 'h' : 'v'
    }

    if (axis.current === 'v') {
      e.stopPropagation()
      setDragY(dy)
    }
  }

  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    const elapsed = Math.max(1, Date.now() - touchStartMs.current)
    const vy = Math.abs(dy) / elapsed

    if (axis.current === 'v') {
      if (Math.abs(dy) > DISMISS_THRESHOLD_PX || vy > DISMISS_VELOCITY_PX_MS) {
        setDismissing(true)
        // Let the transition play then close
        setTimeout(onClose, 220)
      } else {
        setDragY(0)
      }
    } else if (axis.current === 'h') {
      if (dx < -40) next()
      else if (dx > 40) prev()
    }
  }

  const item = items[index]

  // Visual: translate content + fade backdrop as user drags vertically
  const absDragY   = Math.abs(dragY)
  const bgOpacity  = dismissing ? 0 : Math.max(0, 1 - absDragY / 220)
  const translateY = dismissing ? (dragY >= 0 ? 300 : -300) : dragY

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex flex-col"
      style={{
        backgroundColor: `rgba(0,0,0,${bgOpacity})`,
        transition: dismissing ? 'background-color 0.22s ease' : undefined,
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Content wrapper — translates with drag */}
      <div
        className="flex flex-1 flex-col"
        style={{
          transform: `translateY(${translateY}px)`,
          transition: (dismissing || dragY === 0) ? 'transform 0.22s ease' : undefined,
          willChange: 'transform',
        }}
      >
        {/* Header bar */}
        <div className="flex shrink-0 items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white touch-manipulation active:bg-white/20"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {items.length > 1 && (
            <span className="text-[13px] font-semibold text-white/70">{index + 1} / {items.length}</span>
          )}
          <div className="w-9" aria-hidden />
        </div>

        {/* Media area */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          {item.type === 'video' && item.videoUid ? (
            <iframe
              key={item.videoUid}
              src={`https://iframe.videodelivery.net/${item.videoUid}?autoplay=true&muted=false`}
              className="h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Video"
            />
          ) : (
            <img
              key={item.url}
              src={item.url}
              alt=""
              className="max-h-full max-w-full object-contain"
              draggable={false}
            />
          )}

          {/* Prev / next tap zones (desktop) */}
          {index > 0 && (
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white touch-manipulation active:bg-white/20 md:flex hidden"
              aria-label="Previous"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          {index < items.length - 1 && (
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white touch-manipulation active:bg-white/20 md:flex hidden"
              aria-label="Next"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}
        </div>

        {/* Dot indicators */}
        {items.length > 1 && (
          <div className="flex shrink-0 justify-center gap-1.5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all touch-manipulation ${
                  i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                }`}
                aria-label={`Go to item ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
