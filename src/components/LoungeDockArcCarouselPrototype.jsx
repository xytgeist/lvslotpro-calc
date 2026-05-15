import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LOUNGE_DOCK_FAB_SIZE_PX,
  loungeDockFabDefaultPosition,
  loungeDockFabMoveBounds,
  loungeDockFabPctFromPosition,
  loungeDockFabPositionFromPct,
  loungeDockFanOffsets,
  loungeDockViewportSize,
  readLoungeDockFabPrefs,
  writeLoungeDockFabPrefs,
} from '../utils/loungeDockFabPosition.js'

const ITEM_CIRCLE_PX = 34
const ITEM_ICON_PX = 20
const FAN_STAGGER_MS = 36
const DRAG_THRESHOLD_PX = 8

function IconLock({ locked }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3 w-3" aria-hidden>
      {locked ? (
        <>
          <path
            fill="currentColor"
            d="M8 10V8a4 4 0 018 0v2h1.5a1.5 1.5 0 011.5 1.5v7a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 017 18.5v-7A1.5 1.5 0 018.5 10H8z"
          />
          <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M9 10V8a3 3 0 016 0v2" />
        </>
      ) : (
        <path
          fill="currentColor"
          d="M8 11V8a4 4 0 0 1 8 0v3h1.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 7 17.5v-6A1.5 1.5 0 0 1 8.5 11H8z"
        />
      )}
    </svg>
  )
}

/**
 * Experimental Lounge nav: draggable FAB with edge-aware radial fan (prototype only).
 * Does not replace `LoungeDockFooterBar`.
 */
export default function LoungeDockArcCarouselPrototype({
  items = [],
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [locked, setLocked] = useState(false)
  const [fabPos, setFabPos] = useState(null)
  const [viewport, setViewport] = useState(() => loungeDockViewportSize())
  const [fanOffsets, setFanOffsets] = useState([])

  const fabHostRef = useRef(null)
  const dragRef = useRef(null)
  const fabPosRef = useRef(null)
  const lockedRef = useRef(false)
  const openRef = useRef(false)

  const syncViewport = useCallback(() => {
    setViewport(loungeDockViewportSize())
  }, [])

  useEffect(() => {
    syncViewport()
    const vv = window.visualViewport
    window.addEventListener('resize', syncViewport)
    vv?.addEventListener('resize', syncViewport)
    vv?.addEventListener('scroll', syncViewport)
    return () => {
      window.removeEventListener('resize', syncViewport)
      vv?.removeEventListener('resize', syncViewport)
      vv?.removeEventListener('scroll', syncViewport)
    }
  }, [syncViewport])

  useEffect(() => {
    const { width, height } = viewport
    const bounds = loungeDockFabMoveBounds(width, height)
    const saved = readLoungeDockFabPrefs()
    const pos = saved
      ? loungeDockFabPositionFromPct(saved.xPct, saved.yPct, bounds)
      : loungeDockFabDefaultPosition(width, height)
    setFabPos(pos)
    setLocked(saved?.locked ?? false)
  }, [viewport.width, viewport.height])

  useEffect(() => {
    fabPosRef.current = fabPos
  }, [fabPos])

  useEffect(() => {
    lockedRef.current = locked
  }, [locked])

  useEffect(() => {
    openRef.current = open
  }, [open])

  const persistFabPrefs = useCallback((pos, isLocked) => {
    if (!pos) return
    const bounds = loungeDockFabMoveBounds(viewport.width, viewport.height)
    const pct = loungeDockFabPctFromPosition(pos.left, pos.top, bounds)
    writeLoungeDockFabPrefs({ ...pct, locked: isLocked })
  }, [viewport.width, viewport.height])

  const recomputeFan = useCallback(
    (pos) => {
      if (!pos || items.length === 0) {
        setFanOffsets([])
        return
      }
      const cx = pos.left + LOUNGE_DOCK_FAB_SIZE_PX / 2
      const cy = pos.top + LOUNGE_DOCK_FAB_SIZE_PX / 2
      setFanOffsets(loungeDockFanOffsets(cx, cy, items.length, viewport))
    },
    [items.length, viewport],
  )

  useEffect(() => {
    if (!open) {
      setFanOffsets([])
      return
    }
    recomputeFan(fabPos)
  }, [open, fabPos, recomputeFan])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const clampFabPos = useCallback(
    (left, top) => {
      const bounds = loungeDockFabMoveBounds(viewport.width, viewport.height)
      return {
        left: Math.min(bounds.maxLeft, Math.max(bounds.minLeft, left)),
        top: Math.min(bounds.maxTop, Math.max(bounds.minTop, top)),
      }
    },
    [viewport.width, viewport.height],
  )

  const onFabPointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originLeft: fabPosRef.current?.left ?? 0,
        originTop: fabPosRef.current?.top ?? 0,
        dragging: false,
      }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [],
  )

  const onFabPointerMove = useCallback(
    (e) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return

      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY

      if (!drag.dragging) {
        if (lockedRef.current) return
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
        drag.dragging = true
        if (openRef.current) setOpen(false)
      }

      const next = clampFabPos(drag.originLeft + dx, drag.originTop + dy)
      fabPosRef.current = next
      setFabPos(next)
      if (openRef.current) recomputeFan(next)
    },
    [clampFabPos, recomputeFan],
  )

  const onFabPointerUp = useCallback(
    (e) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return
      dragRef.current = null

      if (drag.dragging) {
        persistFabPrefs(fabPosRef.current, lockedRef.current)
        return
      }

      setOpen((v) => !v)
    },
    [persistFabPrefs],
  )

  const onFabPointerCancel = useCallback((e) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    if (drag.dragging) persistFabPrefs(fabPosRef.current, lockedRef.current)
    dragRef.current = null
  }, [persistFabPrefs])

  const toggleLock = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setLocked((prev) => {
        const next = !prev
        lockedRef.current = next
        persistFabPrefs(fabPosRef.current, next)
        return next
      })
    },
    [persistFabPrefs],
  )

  const selectItem = useCallback((item) => {
    if (item.disabled) return
    item.onSelect?.()
    setOpen(false)
  }, [])

  if (items.length === 0 || !fabPos) return null

  return (
    <div className="fixed inset-0 z-[58]">
      {open ? (
        <button
          type="button"
          className="absolute inset-0 z-0 bg-black/35 backdrop-blur-[2px] [-webkit-tap-highlight-color:transparent]"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div
        ref={fabHostRef}
        className="pointer-events-none absolute z-10 overflow-visible"
        style={{ left: fabPos.left, top: fabPos.top, width: LOUNGE_DOCK_FAB_SIZE_PX, height: LOUNGE_DOCK_FAB_SIZE_PX }}
      >
        {open
          ? items.map((item, i) => {
              const offset = fanOffsets[i] ?? { x: 0, y: 0 }
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => selectItem(item)}
                  className={`pointer-events-auto absolute left-1/2 top-1/2 flex items-center justify-center transition-[transform,opacity] duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-40 ${
                    item.active ? 'text-cyan-300' : 'text-zinc-100'
                  }`}
                  style={{
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                    zIndex: 20 + i,
                    transitionDelay: `${i * FAN_STAGGER_MS}ms`,
                  }}
                >
                  <span
                    className={`flex items-center justify-center rounded-full border shadow-lg backdrop-blur-sm ${
                      item.active
                        ? 'border-cyan-400/70 bg-zinc-900/95 shadow-cyan-500/20 ring-2 ring-cyan-400/40'
                        : 'border-zinc-700/90 bg-zinc-950/90'
                    }`}
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
          aria-label={
            locked
              ? open
                ? 'Close lounge menu'
                : 'Open lounge menu (position locked)'
              : open
                ? 'Close lounge menu'
                : 'Open lounge menu (drag to reposition)'
          }
          aria-expanded={open}
          onPointerDown={onFabPointerDown}
          onPointerMove={onFabPointerMove}
          onPointerUp={onFabPointerUp}
          onPointerCancel={onFabPointerCancel}
          className={`pointer-events-auto absolute inset-0 z-40 flex items-center justify-center rounded-full border shadow-xl backdrop-blur-md transition-[border-color,box-shadow,colors] duration-300 ease-out [-webkit-tap-highlight-color:transparent] ${
            open
              ? 'border-cyan-400/80 bg-zinc-900/95 text-cyan-300 shadow-cyan-500/25'
              : locked
                ? 'border-zinc-600/90 bg-zinc-950/95 text-zinc-200'
                : 'border-dashed border-zinc-500/80 bg-zinc-950/95 text-zinc-200'
          }`}
          style={{ touchAction: locked ? 'manipulation' : 'none' }}
        >
          <span
            className={`block text-xl font-light leading-none transition-transform duration-300 ${
              open ? 'rotate-45' : ''
            }`}
          >
            +
          </span>
        </button>

        <button
          type="button"
          onClick={toggleLock}
          aria-label={locked ? 'Unlock menu button position' : 'Lock menu button position'}
          title={locked ? 'Unlock position' : 'Lock position'}
          className={`pointer-events-auto absolute -left-0.5 -top-0.5 z-50 flex h-5 w-5 items-center justify-center rounded-full border shadow-md transition-colors [-webkit-tap-highlight-color:transparent] ${
            locked
              ? 'border-cyan-500/60 bg-zinc-900 text-cyan-300'
              : 'border-zinc-600 bg-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <IconLock locked={locked} />
        </button>
      </div>
    </div>
  )
}
