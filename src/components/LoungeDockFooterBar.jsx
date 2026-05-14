import { useLayoutEffect, useRef } from 'react'

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.65,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
}

const cyanStroke = {
  stroke: '#22d3ee',
  strokeWidth: 1.85,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
}

/** Outline icons; cyan accents on roof, bell clapper, chat dots. */
function IconHome({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M4.5 10.25 12 4l7.5 6.25V19a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5h-4v4.5a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75v-8.75z" />
      <path {...cyanStroke} d="M4.5 10.25 12 4 19.5 10.25" />
    </svg>
  )
}

function IconSearch({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden>
      <circle {...stroke} cx="10.25" cy="10.25" r="6.25" />
      <path {...stroke} d="M15.5 15.5 21 21" />
    </svg>
  )
}

function IconBell({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        {...stroke}
        d="M10.5 6.75a3.75 3.75 0 017.5 0v.75c0 4.25 1.75 6.5 1.75 6.5H8.75S10.5 12.75 10.5 8.5v-.75z"
      />
      {/* Bottom clapper / striker */}
      <path {...cyanStroke} d="M9.75 18.75h4.5a1.5 1.5 0 01-3 0z" />
    </svg>
  )
}

function IconChat({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        {...stroke}
        d="M6.75 5.25h10.5a2.25 2.25 0 012.25 2.25v6a2.25 2.25 0 01-2.25 2.25h-5.03l-3.72 2.48V15.75H6.75a2.25 2.25 0 01-2.25-2.25v-6a2.25 2.25 0 012.25-2.25z"
      />
      <circle cx="9" cy="10.5" r="1.05" className="fill-cyan-400" stroke="none" />
      <circle cx="12" cy="10.5" r="1.05" className="fill-cyan-400" stroke="none" />
      <circle cx="15" cy="10.5" r="1.05" className="fill-cyan-400" stroke="none" />
    </svg>
  )
}

/**
 * Bottom dock for Lounge shell: matches fixed title bar chrome (zinc bar + blur + border).
 * `reveal` 1 = fully visible, 0 = slid off downward (paired with scroll-linked title hide).
 * Icon-only controls (no chrome around glyphs); active slot uses cyan icon color.
 *
 * @param {'viewport' | 'sheet'} [layout='viewport'] — `sheet` pins to a full-screen sheet bottom (e.g. profile).
 */
export default function LoungeDockFooterBar({
  reveal = 1,
  barHeightPx = 0,
  onHeightChange,
  onHome,
  onSearch,
  onNotifications,
  onChat,
  activePanel = null,
  layout = 'viewport',
}) {
  const measureRef = useRef(null)
  const h = barHeightPx > 0 ? barHeightPx : 52
  const translateY = (1 - Math.min(1, Math.max(0, reveal))) * h
  const isSheet = layout === 'sheet'

  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const apply = () => {
      const rect = Math.ceil(el.getBoundingClientRect().height)
      if (rect > 0) onHeightChange?.(rect)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [onHeightChange, layout])

  const dockBtn = (active, onClick, label, children) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 min-w-0 flex-1 touch-manipulation items-center justify-center bg-transparent px-1 py-2 [-webkit-tap-highlight-color:transparent] transition-colors duration-150 ${
        active ? 'text-cyan-300' : 'text-zinc-400 hover:text-zinc-100'
      }`}
    >
      {children}
    </button>
  )

  /** Flush to physical bottom; safe area is padding inside so chrome is not “floating” above the screen edge. */
  const outerClass = isSheet
    ? 'pointer-events-none absolute bottom-0 left-0 right-0 z-[40] w-full border-t border-zinc-800/95 bg-zinc-950/95 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[0_-1px_0_rgba(0,0,0,0.22)] backdrop-blur supports-[backdrop-filter]:bg-zinc-950/85 will-change-transform'
    : 'pointer-events-none fixed bottom-0 left-1/2 z-[56] w-full max-w-2xl border-t border-zinc-800/95 bg-zinc-950/95 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[0_-1px_0_rgba(0,0,0,0.22)] backdrop-blur supports-[backdrop-filter]:bg-zinc-950/85 will-change-transform'

  const transform = isSheet ? `translate3d(0, ${translateY}px, 0)` : `translate3d(-50%, ${translateY}px, 0)`

  return (
    <div
      ref={measureRef}
      className={outerClass}
      style={{
        transform,
        pointerEvents: reveal > 0.12 ? 'auto' : 'none',
      }}
    >
      <div className="flex items-center justify-center gap-2 px-3 py-2">
        {dockBtn(false, onHome, 'Home', <IconHome className="h-7 w-7 shrink-0 opacity-95" />)}
        {dockBtn(activePanel === 'search', onSearch, 'Search', <IconSearch className="h-7 w-7 shrink-0 opacity-95" />)}
        {dockBtn(
          activePanel === 'notifications',
          onNotifications,
          'Notifications',
          <IconBell className="h-7 w-7 shrink-0 opacity-95" />
        )}
        {dockBtn(activePanel === 'chat', onChat, 'Chat', <IconChat className="h-7 w-7 shrink-0 opacity-95" />)}
      </div>
    </div>
  )
}
