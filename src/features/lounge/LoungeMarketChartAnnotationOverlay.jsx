import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MARKET_CHART_ANNOTATION_PEN_COLOR,
  MARKET_CHART_ANNOTATION_PEN_WIDTH,
  renderMarketChartAnnotations,
} from './loungeMarketChartAnnotation.js'

/**
 * @param {{
 *   hostRef: React.RefObject<HTMLElement | null>,
 *   active: boolean,
 *   visible: boolean,
 *   tool: 'pen' | 'text',
 *   items: import('./loungeMarketChartAnnotation.js').MarketChartAnnotationItem[],
 *   onItemsChange: (next: import('./loungeMarketChartAnnotation.js').MarketChartAnnotationItem[]) => void,
 * }} props
 */
export default function LoungeMarketChartAnnotationOverlay({
  hostRef,
  active,
  visible,
  tool,
  items,
  onItemsChange,
}) {
  const canvasRef = useRef(null)
  const itemsRef = useRef(items)
  itemsRef.current = items
  const [liveStroke, setLiveStroke] = useState(
    /** @type {import('./loungeMarketChartAnnotation.js').MarketChartAnnotationStroke | null} */ (null),
  )
  const [textDraft, setTextDraft] = useState(/** @type {{ nx: number, ny: number } | null} */ (null))
  const [textValue, setTextValue] = useState('')

  const paint = useCallback(
    (stroke) => {
      const host = hostRef.current
      const canvas = canvasRef.current
      if (!host || !canvas) return
      const w = host.clientWidth
      const h = host.clientHeight
      if (!w || !h) return
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
      const nextW = Math.max(1, Math.round(w * dpr))
      const nextH = Math.max(1, Math.round(h * dpr))
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW
        canvas.height = nextH
      }
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const ink = stroke ? [...items, stroke] : items
      renderMarketChartAnnotations(ctx, ink, canvas.width, canvas.height)
    },
    [hostRef, items],
  )

  useEffect(() => {
    paint(liveStroke)
  }, [paint, liveStroke, visible, active, items])

  useEffect(() => {
    const host = hostRef.current
    if (!host || !visible) return undefined
    const ro = new ResizeObserver(() => paint(liveStroke))
    ro.observe(host)
    return () => ro.disconnect()
  }, [hostRef, visible, paint, liveStroke])

  useEffect(() => {
    if (!active) {
      setLiveStroke(null)
      setTextDraft(null)
      setTextValue('')
    }
  }, [active])

  const pointerNorm = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    const nx = (clientX - rect.left) / rect.width
    const ny = (clientY - rect.top) / rect.height
    if (!Number.isFinite(nx) || !Number.isFinite(ny)) return null
    return {
      nx: Math.min(1, Math.max(0, nx)),
      ny: Math.min(1, Math.max(0, ny)),
    }
  }, [])

  const commitTextDraft = useCallback(() => {
    const draft = textDraft
    const text = String(textValue || '').trim()
    setTextDraft(null)
    setTextValue('')
    if (!draft || !text) return
    onItemsChange([
      ...items,
      { type: 'text', nx: draft.nx, ny: draft.ny, text: text.slice(0, 120) },
    ])
  }, [items, onItemsChange, textDraft, textValue])

  const onPointerDown = useCallback(
    (e) => {
      if (!active) return
      if (textDraft) return
      if (tool === 'text') {
        const norm = pointerNorm(e.clientX, e.clientY)
        if (!norm) return
        e.preventDefault()
        e.stopPropagation()
        setTextDraft(norm)
        setTextValue('')
        return
      }
      const norm = pointerNorm(e.clientX, e.clientY)
      if (!norm) return
      e.preventDefault()
      e.stopPropagation()
      setLiveStroke({
        type: 'stroke',
        color: MARKET_CHART_ANNOTATION_PEN_COLOR,
        width: MARKET_CHART_ANNOTATION_PEN_WIDTH,
        points: [norm],
      })
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    },
    [active, pointerNorm, textDraft, tool],
  )

  const onPointerMove = useCallback(
    (e) => {
      if (!active || tool !== 'pen') return
      setLiveStroke((prev) => {
        if (!prev) return prev
        const norm = pointerNorm(e.clientX, e.clientY)
        if (!norm) return prev
        e.preventDefault()
        e.stopPropagation()
        const last = prev.points[prev.points.length - 1]
        if (last && Math.hypot(norm.nx - last.nx, norm.ny - last.ny) < 0.0015) return prev
        return { ...prev, points: [...prev.points, norm] }
      })
    },
    [active, pointerNorm, tool],
  )

  const onPointerUp = useCallback(
    (e) => {
      if (tool === 'pen') {
        setLiveStroke((prev) => {
          if (!prev || prev.points.length < 2) return null
          onItemsChange([...itemsRef.current, prev])
          return null
        })
      }
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    },
    [onItemsChange, tool],
  )

  if (!visible) return null

  const draftStyle = textDraft
    ? {
        left: `${textDraft.nx * 100}%`,
        top: `${textDraft.ny * 100}%`,
      }
    : null

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 touch-none select-none ${active ? 'z-[25] cursor-crosshair' : 'z-[15] pointer-events-none'}`}
        aria-hidden={!active}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      {active && textDraft ? (
        <div
          className="absolute z-[26] min-w-[8rem] max-w-[min(70vw,16rem)] -translate-y-1 rounded-md border border-cyan-500/50 bg-zinc-950/95 p-1 shadow-lg"
          style={draftStyle}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitTextDraft()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setTextDraft(null)
                setTextValue('')
              }
            }}
            onBlur={() => commitTextDraft()}
            autoFocus
            maxLength={120}
            placeholder="Label…"
            className="w-full rounded bg-zinc-900 px-2 py-1 text-[12px] text-zinc-100 outline-none ring-1 ring-cyan-500/40"
          />
        </div>
      ) : null}
    </>
  )
}
