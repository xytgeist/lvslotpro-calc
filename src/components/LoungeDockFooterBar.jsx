import { useLayoutEffect, useRef } from 'react'

function IconHome({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M11.47 3.841a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.061l-9.19-9.19a1.5 1.5 0 00-2.12 0l-9.19 9.19a.75.75 0 101.061 1.06l8.69-8.689z" />
      <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" />
    </svg>
  )
}

function IconSearch({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 101.06-1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function IconBell({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M5.25 9a6.75 6.75 0 1113.5 0c0 1.335-.21 2.424-.727 3.437a20.899 20.899 0 01-1.005 1.795 75.672 75.672 0 01-.713 1.14l-.03.047-.006.01h9.468a.75.75 0 010 1.5H4.189a.75.75 0 01-.753-1.002 47.875 47.875 0 011.643-2.027A19.08 19.08 0 009 9zm7.962 11.095a.75.75 0 00-1.454-.364l-.012.042a2.25 2.25 0 01-4.35 0l-.012-.042a.75.75 0 10-1.454.364l.012.042a3.75 3.75 0 007.068 0l.012-.042z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function IconChat({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.023 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.904 48.904 0 01-3.476.323.39.39 0 00-.297.137l-2.893 3.614a.75.75 0 01-1.18 0l-2.893-3.614a.39.39 0 00-.297-.137 48.39 48.39 0 01-3.476-.324C6.822 18.675 5.25 16.944 5.25 15V8.97c0-1.946 1.37-3.68 3.348-3.97zM8.25 9a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H15a.75.75 0 000-1.5H9z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/**
 * Bottom dock for Lounge shell: matches fixed title bar chrome (zinc bar + blur + border).
 * `reveal` 1 = fully visible, 0 = slid off downward (paired with scroll-linked title hide).
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
  }, [onHeightChange])

  const btn = (active, onClick, label, Icon, shortLabel) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`grid min-h-11 min-w-0 flex-1 place-items-center gap-0.5 rounded-xl border py-1 touch-manipulation [-webkit-tap-highlight-color:transparent] ${
        active
          ? 'border-cyan-500/45 bg-cyan-950/50 text-cyan-200'
          : 'border-transparent bg-transparent text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
      }`}
    >
      <Icon className="h-6 w-6 shrink-0 opacity-95" />
      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{shortLabel}</span>
    </button>
  )

  const outerClass = isSheet
    ? 'pointer-events-none absolute bottom-0 left-0 right-0 z-[40] w-full border-t border-zinc-800/95 bg-zinc-950/95 shadow-[0_-1px_0_rgba(0,0,0,0.22)] backdrop-blur supports-[backdrop-filter]:bg-zinc-950/85 will-change-transform'
    : 'pointer-events-none fixed left-1/2 z-[56] w-full max-w-2xl border-t border-zinc-800/95 bg-zinc-950/95 shadow-[0_-1px_0_rgba(0,0,0,0.22)] backdrop-blur supports-[backdrop-filter]:bg-zinc-950/85 will-change-transform bottom-[max(0.5rem,env(safe-area-inset-bottom))]'

  const transform = isSheet ? `translate3d(0, ${translateY}px, 0)` : `translate3d(-50%, ${translateY}px, 0)`

  return (
    <div
      className={outerClass}
      style={{
        transform,
        pointerEvents: reveal > 0.12 ? 'auto' : 'none',
      }}
    >
      <div ref={measureRef} className="flex items-stretch justify-between gap-1 px-2 py-1.5">
        {btn(false, onHome, 'Home — top of feed', IconHome, 'Home')}
        {btn(activePanel === 'search', onSearch, 'Search posts in feed', IconSearch, 'Search')}
        {btn(activePanel === 'notifications', onNotifications, 'Notifications', IconBell, 'Alerts')}
        {btn(activePanel === 'chat', onChat, 'Chat', IconChat, 'Chat')}
      </div>
    </div>
  )
}
