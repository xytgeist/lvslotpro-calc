import { useCallback, useEffect, useRef, useState } from 'react'

const FAB_SIZE_PX = 50
/** Nudge FAB inward from the container’s bottom-right corner. */
const FAB_INSET_RIGHT_PX = 14
const FAB_INSET_BOTTOM_PX = 20
const ITEM_SIZE_PX = 38
const ITEM_CIRCLE_PX = 34
const ITEM_ICON_PX = 20
/** Arc sweep: degrees from straight up toward upper-right. */
const ARC_ANGLE_START_DEG = 8
const ARC_ANGLE_END_DEG = 58
const ARC_BASE_RADIUS_PX = 68
const ARC_RADIUS_STEP_PX = 46
const ARC_PANEL_W = 280
const ARC_PANEL_H = 320
const SCROLL_SENSITIVITY = 0.018
const ARC_GUIDE_SLOTS = 5

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function arcOffsetForSlot(slot) {
  const t = clamp(slot, 0, ARC_GUIDE_SLOTS)
  const angleDeg = ARC_ANGLE_START_DEG + ((ARC_ANGLE_END_DEG - ARC_ANGLE_START_DEG) * t) / ARC_GUIDE_SLOTS
  const rad = (angleDeg * Math.PI) / 180
  const radius = ARC_BASE_RADIUS_PX + Math.max(0, slot) * ARC_RADIUS_STEP_PX
  return {
    x: Math.sin(rad) * radius,
    y: -Math.cos(rad) * radius,
  }
}

function fabAnchorInPanel() {
  return {
    x: ARC_PANEL_W - FAB_INSET_RIGHT_PX - FAB_SIZE_PX / 2,
    y: ARC_PANEL_H - FAB_INSET_BOTTOM_PX - FAB_SIZE_PX / 2,
  }
}

function arcGuidePath() {
  const { x: fabX, y: fabY } = fabAnchorInPanel()
  const points = []
  for (let i = 0; i <= ARC_GUIDE_SLOTS; i += 1) {
    const { x, y } = arcOffsetForSlot(i)
    points.push(`${fabX + x},${fabY + y}`)
  }
  return `M ${points.join(' L ')}`
}

/**
 * Experimental Lounge nav: FAB bottom-right opens a scrollable arc carousel (prototype only).
 * Does not replace `LoungeDockFooterBar`.
 */
export default function LoungeDockArcCarouselPrototype({
  items = [],
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [scrollIndex, setScrollIndex] = useState(0)
  const scrollIndexRef = useRef(0)
  const dragRef = useRef(null)
  const wheelAccumRef = useRef(0)
  const maxIndex = Math.max(0, items.length - 1)

  const setScrollClamped = useCallback(
    (next) => {
      const v = clamp(next, 0, maxIndex)
      scrollIndexRef.current = v
      setScrollIndex(v)
    },
    [maxIndex],
  )

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    setScrollClamped(scrollIndexRef.current)
  }, [maxIndex, setScrollClamped])

  useEffect(() => {
    scrollIndexRef.current = scrollIndex
  }, [scrollIndex])

  const onWheel = useCallback(
    (e) => {
      if (!open || items.length < 2) return
      e.preventDefault()
      wheelAccumRef.current += e.deltaY * SCROLL_SENSITIVITY
      if (Math.abs(wheelAccumRef.current) >= 1) {
        const step = wheelAccumRef.current > 0 ? 1 : -1
        wheelAccumRef.current = 0
        setScrollClamped(scrollIndexRef.current + step)
      } else {
        setScrollIndex(scrollIndexRef.current + wheelAccumRef.current)
      }
    },
    [open, items.length, setScrollClamped],
  )

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return
    dragRef.current = { y0: e.clientY, index0: scrollIndexRef.current }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback(
    (e) => {
      const drag = dragRef.current
      if (!drag) return
      const delta = (drag.y0 - e.clientY) * SCROLL_SENSITIVITY * 4
      setScrollIndex(clamp(drag.index0 + delta, 0, maxIndex))
    },
    [maxIndex],
  )

  const onPointerUp = useCallback(() => {
    if (dragRef.current) {
      setScrollClamped(scrollIndexRef.current)
    }
    dragRef.current = null
  }, [setScrollClamped])

  const selectItem = useCallback((item) => {
    if (item.disabled) return
    item.onSelect?.()
    setOpen(false)
  }, [])

  if (items.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[58]" aria-hidden={!open}>
      {open ? (
        <button
          type="button"
          className="pointer-events-auto absolute inset-0 bg-black/35 backdrop-blur-[2px] [-webkit-tap-highlight-color:transparent]"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] h-[min(72vh,420px)] w-[min(72vw,300px)]">
        {open ? (
          <div
            className="pointer-events-auto absolute inset-0 touch-none select-none"
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ touchAction: 'none' }}
          >
            <svg
              className="pointer-events-none absolute bottom-0 right-0 overflow-visible opacity-30"
              width={ARC_PANEL_W}
              height={ARC_PANEL_H}
              aria-hidden
            >
              <path
                d={arcGuidePath()}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 6"
                className="text-cyan-500/50"
              />
            </svg>
          </div>
        ) : null}

        <div
          className="absolute"
          style={{ right: FAB_INSET_RIGHT_PX, bottom: FAB_INSET_BOTTOM_PX }}
        >
          {open
            ? items.map((item, i) => {
                const slot = i - scrollIndex
                if (slot < -0.65 || slot > 4.2) return null
                const { x, y } = arcOffsetForSlot(slot)
                const isFocused = Math.abs(slot) < 0.35
                const scale = isFocused ? 1.08 : clamp(1 - Math.abs(slot) * 0.08, 0.82, 1)
                const opacity = clamp(1 - Math.abs(slot) * 0.14, 0.45, 1)
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={item.disabled}
                    aria-label={item.label}
                    title={item.label}
                    onClick={() => selectItem(item)}
                    className={`pointer-events-auto absolute flex items-center justify-center transition-[transform,opacity] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-40 ${
                      item.active ? 'text-cyan-300' : 'text-zinc-100'
                    }`}
                    style={{
                      right: FAB_SIZE_PX / 2 - ITEM_SIZE_PX / 2 - x,
                      bottom: FAB_SIZE_PX / 2 - ITEM_SIZE_PX / 2 - y,
                      width: ITEM_SIZE_PX,
                      transform: `scale(${scale})`,
                      opacity,
                      zIndex: isFocused ? 30 : 20 - Math.round(Math.abs(slot)),
                    }}
                  >
                    <span
                      className={`flex items-center justify-center rounded-full border shadow-lg backdrop-blur-sm ${
                        isFocused
                          ? 'border-cyan-400/70 bg-zinc-900/95 shadow-cyan-500/20'
                          : 'border-zinc-700/90 bg-zinc-950/90'
                      } ${item.active ? 'ring-2 ring-cyan-400/40' : ''}`}
                      style={{ width: ITEM_CIRCLE_PX, height: ITEM_CIRCLE_PX }}
                    >
                      <span
                        className="flex items-center justify-center [&_svg]:h-full [&_svg]:w-full"
                        style={{ width: ITEM_ICON_PX, height: ITEM_ICON_PX }}
                      >
                        {item.icon}
                      </span>
                    </span>
                  </button>
                )
              })
            : null}

          <button
            type="button"
            aria-label={open ? 'Close lounge menu' : 'Open lounge menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`pointer-events-auto absolute bottom-0 right-0 flex items-center justify-center rounded-full border shadow-xl backdrop-blur-md transition-all duration-300 ease-out [-webkit-tap-highlight-color:transparent] ${
              open
                ? 'border-cyan-400/80 bg-zinc-900/95 text-cyan-300 shadow-cyan-500/25'
                : 'border-zinc-600/90 bg-zinc-950/95 text-zinc-200 hover:border-zinc-500 hover:text-white'
            }`}
            style={{ width: FAB_SIZE_PX, height: FAB_SIZE_PX, zIndex: 40 }}
          >
            <span
              className={`block text-xl font-light leading-none transition-transform duration-300 ${
                open ? 'rotate-45' : ''
              }`}
            >
              +
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
