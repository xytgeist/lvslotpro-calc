import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LOUNGE_DOCK_FAB_SIZE_PX,
  loungeDockCarouselSnapRotation,
  loungeDockFabDefaultPosition,
  loungeDockFabMoveBounds,
  loungeDockFabPctFromPosition,
  loungeDockFabPositionFromPct,
  loungeDockHomeOffset,
  loungeDockMenuLayout,
  loungeDockViewportSize,
  readLoungeDockFabPrefs,
  writeLoungeDockFabPrefs,
} from '../utils/loungeDockFabPosition.js'

const HOME_ITEM_ID = 'home'
const PANEL_CHROME_PANELS = new Set(['search', 'notifications', 'chat'])

const ITEM_CIRCLE_PX = 40
const ITEM_ICON_PX = 23
const DRAG_THRESHOLD_PX = 8
const SPIN_WHEEL_SENSITIVITY = 0.0045

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function angleFromPointer(fabCenterX, fabCenterY, clientX, clientY) {
  return Math.atan2(-(clientX - fabCenterX), -(clientY - fabCenterY))
}

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
 * Experimental Lounge nav: draggable FAB + fan menu or spin wheel when items clip off-screen (prototype only).
 */
export default function LoungeDockArcCarouselPrototype({
  items = [],
  defaultOpen = false,
  reveal = 1,
  /** When set (search / notifications / chat), FAB + home stay visible; tap FAB to expand full menu. */
  panelChrome = null,
}) {
  const panelCompactChrome = panelChrome != null && PANEL_CHROME_PANELS.has(panelChrome)
  const [open, setOpen] = useState(defaultOpen)
  const [locked, setLocked] = useState(false)
  const [fabPos, setFabPos] = useState(null)
  const [viewport, setViewport] = useState(() => loungeDockViewportSize())
  const [carouselRotation, setCarouselRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)

  const fabHostRef = useRef(null)
  const fabDragRef = useRef(null)
  const spinRef = useRef(null)
  const fabPosRef = useRef(null)
  const lockedRef = useRef(false)
  const openRef = useRef(false)
  const carouselRotationRef = useRef(0)

  const syncViewport = useCallback(() => {
    const next = loungeDockViewportSize()
    setViewport((prev) =>
      prev.width === next.width && prev.height === next.height ? prev : next,
    )
  }, [])

  useEffect(() => {
    syncViewport()
    const vv = window.visualViewport
    window.addEventListener('resize', syncViewport)
    vv?.addEventListener('resize', syncViewport)
    return () => {
      window.removeEventListener('resize', syncViewport)
      vv?.removeEventListener('resize', syncViewport)
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

  useEffect(() => {
    carouselRotationRef.current = carouselRotation
  }, [carouselRotation])

  const fabCenterX = fabPos ? fabPos.left + LOUNGE_DOCK_FAB_SIZE_PX / 2 : null
  const fabCenterY = fabPos ? fabPos.top + LOUNGE_DOCK_FAB_SIZE_PX / 2 : null

  const homeItem = useMemo(() => items.find((item) => item.id === HOME_ITEM_ID) ?? null, [items])
  const orbitItems = useMemo(() => items.filter((item) => item.id !== HOME_ITEM_ID), [items])

  const homeOffset = useMemo(() => {
    if (fabCenterX == null) return { x: 0, y: 0, onScreen: true }
    return loungeDockHomeOffset(fabCenterX, viewport.width)
  }, [fabCenterX, viewport.width])

  const menuLayout = useMemo(() => {
    if (fabCenterX == null || fabCenterY == null || orbitItems.length === 0) {
      return {
        mode: 'fan',
        offsets: [],
        radius: 0,
        pickerAngle: 0,
        focusedIndex: 0,
        step: 0,
        spinEnabled: false,
      }
    }
    const itemRadius = ITEM_CIRCLE_PX / 2
    return loungeDockMenuLayout(
      fabCenterX,
      fabCenterY,
      orbitItems.length,
      carouselRotation,
      viewport,
      itemRadius,
    )
  }, [fabCenterX, fabCenterY, orbitItems.length, carouselRotation, viewport.width, viewport.height])

  const wheelMode = menuLayout.mode === 'wheel'

  const spinHitRadiusPx =
    menuLayout.radius > 0
      ? menuLayout.radius + ITEM_CIRCLE_PX + LOUNGE_DOCK_FAB_SIZE_PX / 2
      : 120

  const persistFabPrefs = useCallback(
    (pos, isLocked) => {
      if (!pos) return
      const bounds = loungeDockFabMoveBounds(viewport.width, viewport.height)
      const pct = loungeDockFabPctFromPosition(pos.left, pos.top, bounds)
      writeLoungeDockFabPrefs({ ...pct, locked: isLocked })
    },
    [viewport.width, viewport.height],
  )

  const snapCarouselToPicker = useCallback(
    (rotation) => {
      if (fabCenterX == null || fabCenterY == null || orbitItems.length === 0) return rotation
      const itemRadius = ITEM_CIRCLE_PX / 2
      const layout = loungeDockMenuLayout(
        fabCenterX,
        fabCenterY,
        orbitItems.length,
        rotation,
        viewport,
        itemRadius,
      )
      if (!layout.spinEnabled) return 0
      return loungeDockCarouselSnapRotation(
        layout.focusedIndex,
        layout.step,
        layout.pickerAngle,
      )
    },
    [orbitItems.length, viewport.width, viewport.height, fabCenterX, fabCenterY],
  )

  const applyCarouselSnap = useCallback(
    (rotation) => {
      const snapped = snapCarouselToPicker(rotation)
      if (Math.abs(snapped - carouselRotationRef.current) < 1e-6) return
      carouselRotationRef.current = snapped
      setCarouselRotation(snapped)
    },
    [snapCarouselToPicker],
  )

  const prepareMenuOpen = useCallback(() => {
    if (fabCenterX == null || fabCenterY == null || orbitItems.length === 0) return
    const itemRadius = ITEM_CIRCLE_PX / 2
    const layout = loungeDockMenuLayout(
      fabCenterX,
      fabCenterY,
      orbitItems.length,
      carouselRotationRef.current,
      viewport,
      itemRadius,
    )
    if (layout.spinEnabled) {
      applyCarouselSnap(carouselRotationRef.current)
    } else {
      carouselRotationRef.current = 0
      setCarouselRotation(0)
    }
  }, [fabCenterX, fabCenterY, orbitItems.length, viewport, applyCarouselSnap])

  useEffect(() => {
    setOpen(false)
  }, [panelChrome])

  useEffect(() => {
    if (!open || wheelMode) return
    carouselRotationRef.current = 0
    setCarouselRotation(0)
  }, [open, wheelMode, fabPos?.left, fabPos?.top, viewport.width, viewport.height])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (reveal > 0.12) return
    setOpen(false)
  }, [reveal])

  const fabVisible = reveal > 0.12
  const fabOpacity = clamp(reveal, 0, 1)

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

  const onFabPointerDown = useCallback((e) => {
    if (e.button !== 0) return
    fabDragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originLeft: fabPosRef.current?.left ?? 0,
      originTop: fabPosRef.current?.top ?? 0,
      dragging: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onFabPointerMove = useCallback(
    (e) => {
      const drag = fabDragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return

      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY

      if (!drag.dragging) {
        if (lockedRef.current || openRef.current) return
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
        drag.dragging = true
      }

      const next = clampFabPos(drag.originLeft + dx, drag.originTop + dy)
      fabPosRef.current = next
      setFabPos(next)
    },
    [clampFabPos],
  )

  const onFabPointerUp = useCallback(
    (e) => {
      const drag = fabDragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return
      fabDragRef.current = null

      if (drag.dragging) {
        persistFabPrefs(fabPosRef.current, lockedRef.current)
        return
      }

      if (!fabVisible) return
      if (openRef.current) {
        setOpen(false)
        return
      }
      prepareMenuOpen()
      setOpen(true)
    },
    [persistFabPrefs, fabVisible, prepareMenuOpen],
  )

  const onFabPointerCancel = useCallback((e) => {
    const drag = fabDragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    if (drag.dragging) persistFabPrefs(fabPosRef.current, lockedRef.current)
    fabDragRef.current = null
  }, [persistFabPrefs])

  const onSpinPointerDown = useCallback(
    (e) => {
      if (!openRef.current || !wheelMode || fabCenterX == null || fabCenterY == null || e.button !== 0) return
      spinRef.current = {
        pointerId: e.pointerId,
        startPointerAngle: angleFromPointer(fabCenterX, fabCenterY, e.clientX, e.clientY),
        startRotation: carouselRotationRef.current,
      }
      setSpinning(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [fabCenterX, fabCenterY],
  )

  const onSpinPointerMove = useCallback(
    (e) => {
      const spin = spinRef.current
      if (!spin || spin.pointerId !== e.pointerId || fabCenterX == null || fabCenterY == null) return
      const cur = angleFromPointer(fabCenterX, fabCenterY, e.clientX, e.clientY)
      let delta = cur - spin.startPointerAngle
      if (delta > Math.PI) delta -= Math.PI * 2
      if (delta < -Math.PI) delta += Math.PI * 2
      const next = spin.startRotation + delta
      carouselRotationRef.current = next
      setCarouselRotation(next)
    },
    [fabCenterX, fabCenterY],
  )

  const endSpin = useCallback(
    (pointerId) => {
      const spin = spinRef.current
      if (!spin || spin.pointerId !== pointerId) return
      spinRef.current = null
      setSpinning(false)
      if (wheelMode) applyCarouselSnap(carouselRotationRef.current)
    },
    [applyCarouselSnap, wheelMode],
  )

  const onSpinWheel = useCallback(
    (e) => {
      if (!openRef.current) return
      e.preventDefault()
      e.stopPropagation()
      const next = carouselRotationRef.current + e.deltaY * SPIN_WHEEL_SENSITIVITY
      carouselRotationRef.current = next
      setCarouselRotation(next)
    },
    [],
  )

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

  if (items.length === 0 || !fabPos || fabCenterX == null || fabCenterY == null) return null

  const showHomeChip = Boolean(homeItem) && (open || panelCompactChrome)
  const showOrbitItems = open
  const menuExpanded = open

  const pickerOffset = wheelMode && menuExpanded
    ? (menuLayout.offsets[menuLayout.focusedIndex] ?? { x: 0, y: 0 })
    : { x: 0, y: 0 }

  const renderMenuItem = (item, offset, { isFocused = false, offScreen = false } = {}) => (
    <button
      key={item.id}
      type="button"
      disabled={item.disabled || offScreen}
      aria-label={item.label}
      title={offScreen ? `${item.label} (spin wheel to reach)` : item.label}
      onClick={(e) => {
        e.stopPropagation()
        selectItem(item)
      }}
      className={`pointer-events-auto fixed z-[2] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center disabled:cursor-not-allowed ${
        offScreen ? 'opacity-30' : 'opacity-100'
      } ${item.active ? 'text-cyan-300' : 'text-zinc-100'} ${
        spinning || !wheelMode ? '' : 'transition-[left,top,opacity] duration-200 ease-out'
      }`}
      style={{
        left: fabCenterX + offset.x,
        top: fabCenterY + offset.y,
        zIndex: isFocused ? 32 : 20,
      }}
    >
      <span
        className={`flex items-center justify-center rounded-full border shadow-lg backdrop-blur-sm ${
          isFocused || item.active
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

  return (
    <div className="pointer-events-none fixed inset-0 z-[58]">
      {menuExpanded && fabVisible ? (
        <button
          type="button"
          className="pointer-events-auto fixed inset-0 z-0 bg-black/35 backdrop-blur-[2px] [-webkit-tap-highlight-color:transparent]"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {menuExpanded && fabVisible && wheelMode ? (
        <div
          className="pointer-events-auto fixed z-[1] touch-none select-none rounded-full"
          style={{
            left: fabCenterX - spinHitRadiusPx,
            top: fabCenterY - spinHitRadiusPx,
            width: spinHitRadiusPx * 2,
            height: spinHitRadiusPx * 2,
            touchAction: 'none',
          }}
          onWheel={onSpinWheel}
          onPointerDown={onSpinPointerDown}
          onPointerMove={onSpinPointerMove}
          onPointerUp={(e) => endSpin(e.pointerId)}
          onPointerCancel={(e) => endSpin(e.pointerId)}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-dashed border-cyan-500/40"
            style={{
              width: menuLayout.radius * 2,
              height: menuLayout.radius * 2,
              transform: 'translate(-50%, -50%)',
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 rounded-full border-2 border-cyan-400/80 bg-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.45)]"
            style={{
              transform: `translate(calc(-50% + ${pickerOffset.x}px), calc(-50% + ${pickerOffset.y}px))`,
            }}
            aria-hidden
          />
        </div>
      ) : null}

      {showHomeChip ? renderMenuItem(homeItem, homeOffset) : null}

      {showOrbitItems
        ? orbitItems.map((item, i) => {
            const offset = menuLayout.offsets[i] ?? { x: 0, y: 0, onScreen: true }
            const isFocused = wheelMode && i === menuLayout.focusedIndex
            const offScreen = wheelMode && !offset.onScreen
            return renderMenuItem(item, offset, { isFocused, offScreen })
          })
        : null}

      <div
        ref={fabHostRef}
        className="pointer-events-none fixed z-[3] overflow-visible transition-opacity duration-300 ease-out will-change-[opacity]"
        style={{
          left: fabPos.left,
          top: fabPos.top,
          width: LOUNGE_DOCK_FAB_SIZE_PX,
          height: LOUNGE_DOCK_FAB_SIZE_PX,
          opacity: fabOpacity,
        }}
      >
        <button
          type="button"
          aria-label={
            locked
              ? menuExpanded
                ? 'Close lounge menu'
                : 'Open lounge menu (position locked)'
              : menuExpanded
                ? 'Close lounge menu'
                : panelCompactChrome
                  ? 'Open lounge menu'
                  : 'Open lounge menu (drag to reposition)'
          }
          aria-expanded={menuExpanded}
          onPointerDown={onFabPointerDown}
          onPointerMove={onFabPointerMove}
          onPointerUp={onFabPointerUp}
          onPointerCancel={onFabPointerCancel}
          className={`pointer-events-auto absolute inset-0 rounded-full border shadow-xl backdrop-blur-md transition-[border-color,box-shadow,colors] duration-300 ease-out [-webkit-tap-highlight-color:transparent] ${
            open
              ? 'border-cyan-400/80 bg-zinc-900/95 text-cyan-300 shadow-cyan-500/25'
              : locked
                ? 'border-zinc-600/90 bg-zinc-950/95 text-zinc-200'
                : 'border-dashed border-zinc-500/80 bg-zinc-950/95 text-zinc-200'
          }`}
          style={{
            touchAction: locked || open ? 'manipulation' : 'none',
            pointerEvents: fabVisible ? 'auto' : 'none',
          }}
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
          style={{ pointerEvents: fabVisible ? 'auto' : 'none' }}
        >
          <IconLock locked={locked} />
        </button>
      </div>
    </div>
  )
}
