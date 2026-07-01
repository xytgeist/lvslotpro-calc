import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MARKET_CHART_ANNOTATION_PEN_COLOR,
  MARKET_CHART_ANNOTATION_PEN_WIDTH,
  MARKET_CHART_ANNOTATION_TEXT_COLOR,
  MARKET_CHART_ANNOTATION_TEXT_STROKE,
  marketChartAnnotationStrokeItems,
  marketChartAnnotationTextFontSize,
  marketChartAnnotationTextStrokeWidth,
  renderMarketChartAnnotations,
} from './loungeMarketChartAnnotation.js'

/** @param {number} fontSize */
function annotationTextDomStyle(fontSize) {
  const stroke = marketChartAnnotationTextStrokeWidth(fontSize)
  return {
    fontSize: `${fontSize}px`,
    fontWeight: 600,
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    lineHeight: 1.15,
    color: MARKET_CHART_ANNOTATION_TEXT_COLOR,
    WebkitTextStroke: `${stroke}px ${MARKET_CHART_ANNOTATION_TEXT_STROKE}`,
    paintOrder: 'stroke fill',
  }
}

/**
 * @param {{
 *   hostRef: React.RefObject<HTMLElement | null>,
 *   active: boolean,
 *   visible: boolean,
 *   tool: 'pen' | 'text',
 *   items: import('./loungeMarketChartAnnotation.js').MarketChartAnnotationItem[],
 *   onItemsChange: (next: import('./loungeMarketChartAnnotation.js').MarketChartAnnotationItem[] | ((prev: import('./loungeMarketChartAnnotation.js').MarketChartAnnotationItem[]) => import('./loungeMarketChartAnnotation.js').MarketChartAnnotationItem[])) => void,
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
  const [hostSize, setHostSize] = useState({ w: 0, h: 0 })
  const [liveStroke, setLiveStroke] = useState(
    /** @type {import('./loungeMarketChartAnnotation.js').MarketChartAnnotationStroke | null} */ (null),
  )
  const [textDraft, setTextDraft] = useState(/** @type {{ nx: number, ny: number } | null} */ (null))
  const [textValue, setTextValue] = useState('')
  const [editingTextIndex, setEditingTextIndex] = useState(/** @type {number | null} */ (null))
  const [selectedTextIndex, setSelectedTextIndex] = useState(/** @type {number | null} */ (null))
  /** @type {React.MutableRefObject<{ kind: 'draft' } | { kind: 'text', index: number } | null>} */
  const dragTargetRef = useRef(null)

  const textFontSize = useMemo(
    () => marketChartAnnotationTextFontSize(hostSize.w, hostSize.h),
    [hostSize.h, hostSize.w],
  )
  const textDomStyle = useMemo(() => annotationTextDomStyle(textFontSize), [textFontSize])

  const paint = useCallback(
    (stroke) => {
      const host = hostRef.current
      const canvas = canvasRef.current
      if (!host || !canvas) return
      const w = host.clientWidth
      const h = host.clientHeight
      if (!w || !h) return
      setHostSize({ w, h })
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
      const canvasItems = active ? marketChartAnnotationStrokeItems(ink) : ink
      renderMarketChartAnnotations(ctx, canvasItems, canvas.width, canvas.height)
    },
    [active, hostRef, items],
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
      setEditingTextIndex(null)
      setSelectedTextIndex(null)
      dragTargetRef.current = null
    }
  }, [active])

  useEffect(() => {
    if (tool === 'pen') {
      setTextDraft(null)
      setTextValue('')
      setEditingTextIndex(null)
      setSelectedTextIndex(null)
    }
  }, [tool])

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

  const positionStyle = useCallback((nx, ny) => ({
    left: `${nx * 100}%`,
    top: `${ny * 100}%`,
  }), [])

  const commitTextDraft = useCallback(() => {
    const draft = textDraft
    const text = String(textValue || '').trim()
    setTextDraft(null)
    setTextValue('')
    if (!draft || !text) return
    onItemsChange((prev) => [
      ...prev,
      { type: 'text', nx: draft.nx, ny: draft.ny, text: text.slice(0, 120) },
    ])
  }, [onItemsChange, textDraft, textValue])

  const commitTextEdit = useCallback(() => {
    const index = editingTextIndex
    const text = String(textValue || '').trim()
    setEditingTextIndex(null)
    setTextValue('')
    if (index == null) return
    if (!text) {
      onItemsChange((prev) => prev.filter((_, i) => i !== index))
      setSelectedTextIndex(null)
      return
    }
    onItemsChange((prev) =>
      prev.map((item, i) =>
        i === index && item.type === 'text' ? { ...item, text: text.slice(0, 120) } : item,
      ),
    )
  }, [editingTextIndex, onItemsChange, textValue])

  const moveTextItem = useCallback(
    (index, norm) => {
      onItemsChange((prev) =>
        prev.map((item, i) =>
          i === index && item.type === 'text' ? { ...item, nx: norm.nx, ny: norm.ny } : item,
        ),
      )
    },
    [onItemsChange],
  )

  const startTextDrag = useCallback(
    (e, target) => {
      if (!active || tool !== 'text') return
      e.preventDefault()
      e.stopPropagation()
      dragTargetRef.current = target
      if (target.kind === 'text') setSelectedTextIndex(target.index)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    },
    [active, tool],
  )

  const onTextDragMove = useCallback(
    (e) => {
      const target = dragTargetRef.current
      if (!target) return
      const norm = pointerNorm(e.clientX, e.clientY)
      if (!norm) return
      e.preventDefault()
      e.stopPropagation()
      if (target.kind === 'draft') {
        setTextDraft(norm)
        return
      }
      moveTextItem(target.index, norm)
    },
    [moveTextItem, pointerNorm],
  )

  const endTextDrag = useCallback((e) => {
    if (!dragTargetRef.current) return
    dragTargetRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }, [])

  const beginEditText = useCallback((index) => {
    const item = itemsRef.current[index]
    if (!item || item.type !== 'text') return
    setEditingTextIndex(index)
    setSelectedTextIndex(index)
    setTextDraft(null)
    setTextValue(item.text)
  }, [])

  const onPointerDown = useCallback(
    (e) => {
      if (!active) return
      if (textDraft || editingTextIndex != null) return
      if (tool === 'text') {
        const norm = pointerNorm(e.clientX, e.clientY)
        if (!norm) return
        e.preventDefault()
        e.stopPropagation()
        setSelectedTextIndex(null)
        setTextDraft(norm)
        setTextValue('')
        return
      }
      setSelectedTextIndex(null)
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
    [active, editingTextIndex, pointerNorm, textDraft, tool],
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

  const textEditor = (opts) => {
    const { norm, onCommit, onCancel, placeholder = 'Label…' } = opts
    return (
      <div
        className="absolute z-[27] max-w-[min(70vw,16rem)] touch-none select-none"
        style={positionStyle(norm.nx, norm.ny)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          role="presentation"
          className={`mb-1 max-w-[min(70vw,16rem)] cursor-grab touch-none select-none break-words active:cursor-grabbing ${
            opts.showDragHint ? 'rounded ring-1 ring-cyan-500/40 ring-offset-1 ring-offset-zinc-950/80' : ''
          }`}
          style={textDomStyle}
          onPointerDown={(e) => startTextDrag(e, opts.dragTarget)}
          onPointerMove={onTextDragMove}
          onPointerUp={endTextDrag}
          onPointerCancel={endTextDrag}
        >
          {String(textValue || '').trim() || (
            <span className="opacity-45">{placeholder}</span>
          )}
        </div>
        <div className="min-w-[8rem] rounded-md border border-cyan-500/50 bg-zinc-950/95 p-1 shadow-lg">
          <input
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onCommit()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                onCancel()
              }
            }}
            onBlur={() => {
              window.setTimeout(() => {
                if (dragTargetRef.current) return
                onCommit()
              }, 0)
            }}
            autoFocus
            maxLength={120}
            placeholder={placeholder}
            className="w-full rounded bg-zinc-900 px-2 py-1 text-[12px] text-zinc-100 outline-none ring-1 ring-cyan-500/40"
          />
        </div>
      </div>
    )
  }

  if (!visible) return null

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
      {active
        ? items.map((item, index) => {
            if (item.type !== 'text') return null
            const text = String(item.text || '').trim()
            if (!text) return null
            if (editingTextIndex === index) return null
            const selected = selectedTextIndex === index
            return (
              <div
                key={`text-${index}`}
                className="absolute z-[26] max-w-[min(70vw,16rem)] touch-none select-none"
                style={positionStyle(item.nx, item.ny)}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div
                  role="button"
                  tabIndex={-1}
                  aria-label={`Chart label: ${text}. Drag to move; double-click to edit.`}
                  className={`max-w-[min(70vw,16rem)] cursor-grab break-words active:cursor-grabbing ${
                    selected ? 'rounded ring-2 ring-cyan-400/70 ring-offset-1 ring-offset-zinc-950/80' : ''
                  }`}
                  style={textDomStyle}
                  onPointerDown={(e) => startTextDrag(e, { kind: 'text', index })}
                  onPointerMove={onTextDragMove}
                  onPointerUp={endTextDrag}
                  onPointerCancel={endTextDrag}
                  onDoubleClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    beginEditText(index)
                  }}
                >
                  {text}
                </div>
              </div>
            )
          })
        : null}
      {active && textDraft && !editingTextIndex
        ? textEditor({
            norm: textDraft,
            dragTarget: { kind: 'draft' },
            showDragHint: true,
            onCommit: commitTextDraft,
            onCancel: () => {
              setTextDraft(null)
              setTextValue('')
            },
          })
        : null}
      {active && editingTextIndex != null
        ? (() => {
            const item = items[editingTextIndex]
            if (!item || item.type !== 'text') return null
            return textEditor({
              norm: { nx: item.nx, ny: item.ny },
              dragTarget: { kind: 'text', index: editingTextIndex },
              showDragHint: true,
              onCommit: commitTextEdit,
              onCancel: () => {
                setEditingTextIndex(null)
                setTextValue('')
              },
            })
          })()
        : null}
    </>
  )
}
