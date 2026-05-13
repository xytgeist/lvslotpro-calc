import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LOUNGE_VIDEO_MAX_SECONDS } from '../../utils/loungeVideoUpload'

const MIN_CLIP_SEC = 0.5
const MAX_CLIP_SEC = LOUNGE_VIDEO_MAX_SECONDS
/** Filmstrip: one column per second of source; selection math uses full `duration` (fractional seconds). */
const FILMSTRIP_PX_PER_SEC = 26
const CAPTURE_W = 52
const CAPTURE_H = 30
const JPEG_QUALITY = 0.38
/** Do not block more than this per seek (iOS / long-GOP can stall). */
const SEEK_TIMEOUT_MS = 2800
const VIDEO_READY_TIMEOUT_MS = 14000

function formatClock(sec) {
  const s = Math.max(0, sec)
  const mm = Math.floor(s / 60)
  const ss = Math.floor(s % 60)
  const frac = Math.floor((s % 1) * 10)
  return `${mm}:${String(ss).padStart(2, '0')}.${frac}`
}

function waitSeeked(video, targetTime, timeoutMs) {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => {
      video.removeEventListener('seeked', onSeeked)
      reject(new Error('seek-timeout'))
    }, timeoutMs)
    const onSeeked = () => {
      window.clearTimeout(t)
      video.removeEventListener('seeked', onSeeked)
      resolve(undefined)
    }
    video.addEventListener('seeked', onSeeked, { once: true })
    try {
      video.currentTime = targetTime
    } catch (e) {
      window.clearTimeout(t)
      video.removeEventListener('seeked', onSeeked)
      reject(e)
    }
  })
}

function waitVideoReady(video, timeoutMs) {
  return new Promise((resolve, reject) => {
    const tryOk = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        resolve(undefined)
        return true
      }
      return false
    }
    if (tryOk()) return
    const t = window.setTimeout(() => {
      video.removeEventListener('loadeddata', onLd)
      video.removeEventListener('canplay', onLd)
      video.removeEventListener('error', onErr)
      reject(new Error('video-ready-timeout'))
    }, timeoutMs)
    const onLd = () => {
      if (tryOk()) {
        window.clearTimeout(t)
        video.removeEventListener('loadeddata', onLd)
        video.removeEventListener('canplay', onLd)
        video.removeEventListener('error', onErr)
      }
    }
    const onErr = () => {
      window.clearTimeout(t)
      video.removeEventListener('loadeddata', onLd)
      video.removeEventListener('canplay', onLd)
      video.removeEventListener('error', onErr)
      reject(new Error('video-error'))
    }
    video.addEventListener('loadeddata', onLd)
    video.addEventListener('canplay', onLd)
    video.addEventListener('error', onErr)
    try {
      video.load()
    } catch {
      // ignore
    }
  })
}

/** Wait until `drawImage` is likely to succeed; short poll first, then full wait. */
async function waitUntilVideoFrameable(video, pollMs) {
  const deadline = Date.now() + pollMs
  while (Date.now() < deadline) {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return
    await new Promise((r) => window.setTimeout(r, 40))
  }
  await waitVideoReady(video, VIDEO_READY_TIMEOUT_MS)
}

/**
 * Trim a video to at most 60s: filmstrip (~1 frame / sec) for picking range; ffmpeg only after "Use this clip".
 *
 * @param {{ file: File, knownDurationSec?: number, onCancel: () => void, onConfirm: (file: File) => void }} props
 */
export default function LoungeVideoCropModal({ file, knownDurationSec, onCancel, onConfirm }) {
  const videoRef = useRef(null)
  const trackRef = useRef(null)
  const filmstripInnerRef = useRef(null)
  const urlRef = useRef('')
  const dragRef = useRef(null)
  const durationRef = useRef(0)
  const clipRef = useRef({ start: 0, end: MAX_CLIP_SEC })
  const listenersRef = useRef({ move: null, up: null })
  const filmstripAbortRef = useRef(false)

  const [duration, setDuration] = useState(0)
  const [clipStart, setClipStart] = useState(0)
  const [clipEnd, setClipEnd] = useState(MAX_CLIP_SEC)
  const [phase, setPhase] = useState('idle')
  const [trimErr, setTrimErr] = useState('')
  const [trimProgress, setTrimProgress] = useState(0)
  const trimAbortRef = useRef(null)

  /** data URL per integer second index (parallel to 0..ceil(duration)-1). */
  const [filmstripUrls, setFilmstripUrls] = useState([])
  const [filmstripDone, setFilmstripDone] = useState(0)
  const [filmstripTotal, setFilmstripTotal] = useState(0)
  const [filmstripErr, setFilmstripErr] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  useEffect(() => {
    clipRef.current = { start: clipStart, end: clipEnd }
  }, [clipStart, clipEnd])

  useEffect(() => {
    durationRef.current = duration
  }, [duration])

  useEffect(() => {
    if (!file) {
      setVideoUrl('')
      urlRef.current = ''
      return undefined
    }
    const u = URL.createObjectURL(file)
    urlRef.current = u
    setVideoUrl(u)
    setTrimErr('')
    setTrimProgress(0)
    setPhase('idle')
    setFilmstripUrls([])
    setFilmstripDone(0)
    setFilmstripTotal(0)
    setFilmstripErr('')
    filmstripAbortRef.current = false
    const probed =
      typeof knownDurationSec === 'number' &&
      Number.isFinite(knownDurationSec) &&
      knownDurationSec > 0
    if (probed) {
      const d0 = knownDurationSec
      durationRef.current = d0
      setDuration(d0)
      const span = Math.min(MAX_CLIP_SEC, d0)
      setClipStart(0)
      setClipEnd(span)
      clipRef.current = { start: 0, end: span }
    } else {
      durationRef.current = 0
      setDuration(0)
      setClipStart(0)
      setClipEnd(MAX_CLIP_SEC)
      clipRef.current = { start: 0, end: MAX_CLIP_SEC }
    }
    return () => {
      filmstripAbortRef.current = true
      try {
        URL.revokeObjectURL(u)
      } catch {
        // ignore
      }
      urlRef.current = ''
      setVideoUrl('')
    }
  }, [file, knownDurationSec])

  /** Progressive filmstrip: one seek + canvas grab per second (no ffmpeg until confirm). */
  useEffect(() => {
    if (!file || duration <= 0 || !videoUrl) return undefined
    const v = videoRef.current
    if (!v) return undefined

    filmstripAbortRef.current = false
    const total = Math.max(1, Math.ceil(duration - 1e-6))
    setFilmstripTotal(total)
    setFilmstripDone(0)
    setFilmstripUrls(Array.from({ length: total }, () => ''))
    setFilmstripErr('')

    const canvas = document.createElement('canvas')
    canvas.width = CAPTURE_W
    canvas.height = CAPTURE_H
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setFilmstripErr('Could not build preview.')
      return undefined
    }

    let cancelled = false
    const run = async () => {
      try {
        try {
          v.pause()
        } catch {
          // ignore
        }
        await waitUntilVideoFrameable(v, 2800)
        if (cancelled || filmstripAbortRef.current) return

        const urls = Array.from({ length: total }, () => '')
        const durEl = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : duration

        for (let i = 0; i < total; i += 1) {
          if (cancelled || filmstripAbortRef.current) return
          const target = Math.min(i, Math.max(0, durEl - 0.05))
          try {
            await waitSeeked(v, target, SEEK_TIMEOUT_MS)
          } catch {
            urls[i] = ''
            setFilmstripUrls([...urls])
            setFilmstripDone(i + 1)
            await new Promise((r) => {
              window.requestAnimationFrame(r)
            })
            continue
          }
          try {
            ctx.fillStyle = '#09090b'
            ctx.fillRect(0, 0, CAPTURE_W, CAPTURE_H)
            ctx.drawImage(v, 0, 0, CAPTURE_W, CAPTURE_H)
            urls[i] = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
          } catch {
            urls[i] = ''
          }
          urls[i] = urls[i] || ''
          setFilmstripUrls([...urls])
          setFilmstripDone(i + 1)
          await new Promise((r) => {
            window.requestAnimationFrame(r)
          })
        }
      } catch {
        if (!cancelled && !filmstripAbortRef.current) {
          setFilmstripErr('Preview frames are still loading slowly — you can still drag the range and post.')
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [file, duration, videoUrl])

  const cleanupDrag = useCallback(() => {
    const { move, up } = listenersRef.current
    if (move) window.removeEventListener('pointermove', move)
    if (up) {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    listenersRef.current = { move: null, up: null }
    dragRef.current = null
  }, [])

  const timeFromClientX = useCallback((clientX) => {
    const scrollEl = trackRef.current
    const inner = filmstripInnerRef.current
    const dur = durationRef.current
    if (!scrollEl || !inner || dur <= 0) return 0
    const sr = scrollEl.getBoundingClientRect()
    const x = clientX - sr.left + scrollEl.scrollLeft
    const w = inner.offsetWidth || 1
    const t = (x / w) * dur
    return Math.min(dur, Math.max(0, t))
  }, [])

  const startLeftDrag = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      const end0 = clipRef.current.end
      dragRef.current = { kind: 'left', end0 }
      const move = (ev) => {
        const drag = dragRef.current
        const dur = durationRef.current
        if (!drag || dur <= 0) return
        const t = timeFromClientX(ev.clientX)
        let ns = Math.min(t, drag.end0 - MIN_CLIP_SEC)
        ns = Math.max(0, ns)
        let ne = drag.end0
        if (ne - ns > MAX_CLIP_SEC) ne = ns + MAX_CLIP_SEC
        if (ne > dur) {
          ne = dur
          ns = Math.max(0, ne - MAX_CLIP_SEC)
        }
        setClipStart(ns)
        setClipEnd(ne)
      }
      const up = () => cleanupDrag()
      listenersRef.current = { move, up }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    },
    [cleanupDrag, timeFromClientX],
  )

  const startRightDrag = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      const start0 = clipRef.current.start
      dragRef.current = { kind: 'right', start0 }
      const move = (ev) => {
        const drag = dragRef.current
        const dur = durationRef.current
        if (!drag || dur <= 0) return
        const t = timeFromClientX(ev.clientX)
        let ne = Math.max(t, drag.start0 + MIN_CLIP_SEC)
        ne = Math.min(dur, ne)
        let ns = drag.start0
        if (ne - ns > MAX_CLIP_SEC) ns = ne - MAX_CLIP_SEC
        if (ns < 0) {
          ns = 0
          ne = Math.min(dur, ns + MAX_CLIP_SEC)
        }
        setClipStart(ns)
        setClipEnd(ne)
      }
      const up = () => cleanupDrag()
      listenersRef.current = { move, up }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    },
    [cleanupDrag, timeFromClientX],
  )

  const startMoveDrag = useCallback(
    (e) => {
      e.preventDefault()
      const { start: s0, end: e0 } = clipRef.current
      const t0 = timeFromClientX(e.clientX)
      dragRef.current = { kind: 'move', start0: s0, end0: e0, grabT: t0 - s0 }
      const move = (ev) => {
        const drag = dragRef.current
        const dur = durationRef.current
        if (!drag || dur <= 0) return
        const t = timeFromClientX(ev.clientX)
        const span = drag.end0 - drag.start0
        let ns = t - drag.grabT
        let ne = ns + span
        if (ns < 0) {
          ns = 0
          ne = span
        }
        if (ne > dur) {
          ne = dur
          ns = dur - span
        }
        if (ns < 0) ns = 0
        setClipStart(ns)
        setClipEnd(ne)
      }
      const up = () => cleanupDrag()
      listenersRef.current = { move, up }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    },
    [cleanupDrag, timeFromClientX],
  )

  const playSelection = useCallback(() => {
    const v = videoRef.current
    const { start, end } = clipRef.current
    if (!v) return
    try {
      v.pause()
      v.currentTime = start
      void v.play()
      const onTime = () => {
        if (v.currentTime >= end - 0.04) {
          v.pause()
          v.removeEventListener('timeupdate', onTime)
        }
      }
      v.addEventListener('timeupdate', onTime)
    } catch {
      // ignore
    }
  }, [])

  const cancelTrim = useCallback(() => {
    try {
      trimAbortRef.current?.abort()
    } catch {
      // ignore
    }
    trimAbortRef.current = null
    setPhase('idle')
    setTrimProgress(0)
  }, [])

  const confirmTrim = useCallback(async () => {
    setTrimErr('')
    setPhase('trimming')
    setTrimProgress(0)
    const ac = new AbortController()
    trimAbortRef.current = ac
    const { start, end } = clipRef.current
    try {
      const { trimVideoFileToMp4 } = await import('../../utils/loungeVideoFfmpegTrim')
      const out = await trimVideoFileToMp4(file, start, end, {
        signal: ac.signal,
        onProgress: (p) => setTrimProgress(p),
      })
      onConfirm(out)
    } catch (err) {
      if (err?.name === 'AbortError') {
        setPhase('idle')
        return
      }
      setTrimErr(err instanceof Error ? err.message : 'Could not trim video.')
      setPhase('idle')
    } finally {
      trimAbortRef.current = null
    }
  }, [file, onConfirm])

  useEffect(() => () => cleanupDrag(), [cleanupDrag])

  if (!file) return null

  const stripInnerPx = duration > 0 ? duration * FILMSTRIP_PX_PER_SEC : 0
  const pct = (t) => (duration > 0 ? (t / duration) * 100 : 0)
  const span = clipEnd - clipStart
  const busy = phase === 'trimming'
  const nStripCells = duration > 0 ? Math.max(1, Math.ceil(duration - 1e-6)) : 0

  return createPortal(
    <div
      className="fixed inset-0 z-[96] flex items-end justify-center bg-black/55 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-10 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Trim video"
    >
      <button type="button" className="absolute inset-0 cursor-default bg-transparent" aria-label="Close" onClick={busy ? undefined : onCancel} disabled={busy} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-700/85 bg-zinc-950/96 p-4 shadow-2xl backdrop-blur-md">
        <h2 className="text-[17px] font-bold text-white">Trim video (max {MAX_CLIP_SEC}s)</h2>
        <p className="mt-1 text-[13px] leading-snug text-zinc-400">
          Drag the handles on the strip (about one thumbnail per second). Encoding runs only after you tap{' '}
          <span className="font-semibold text-zinc-300">Use this clip</span>.
        </p>

        {duration > 0 ? (
          <>
            <div
              ref={trackRef}
              className="mt-3 max-h-[42vh] overflow-x-auto overflow-y-hidden rounded-xl border border-zinc-700/80 bg-zinc-900/80 [-webkit-overflow-scrolling:touch]"
            >
              <div
                ref={filmstripInnerRef}
                className="flex shrink-0 flex-col flex-nowrap"
                style={{ width: stripInnerPx > 0 ? `${stripInnerPx}px` : undefined, minWidth: '100%' }}
              >
                <div className="relative flex h-[4.5rem] shrink-0 flex-nowrap">
                  {Array.from({ length: nStripCells }, (_, i) => {
                    const src = filmstripUrls[i]
                    const w = FILMSTRIP_PX_PER_SEC
                    return (
                      <div
                        key={i}
                        className="flex shrink-0 items-center justify-center border-r border-zinc-800/90 bg-black"
                        style={{ width: `${w}px` }}
                        aria-hidden
                      >
                        {src ? (
                          <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
                        ) : (
                          <div className="h-full w-full animate-pulse bg-zinc-800/80" />
                        )}
                      </div>
                    )
                  })}
                  <div
                    className="pointer-events-none absolute inset-y-1 rounded-md border-2 border-cyan-400/90 bg-cyan-500/15"
                    style={{
                      left: `${pct(clipStart)}%`,
                      width: `${Math.max(0.2, pct(clipEnd) - pct(clipStart))}%`,
                    }}
                  />
                </div>

                <div className="relative mt-1 h-9 w-full shrink-0 select-none touch-none">
                  <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-zinc-800/90" />
                  <button
                    type="button"
                    aria-label="Move clip range"
                    className="absolute top-1/2 z-0 h-4 -translate-y-1/2 cursor-grab rounded-md bg-cyan-500/40 active:cursor-grabbing"
                    style={{
                      left: `${pct(clipStart)}%`,
                      width: `${Math.max(0.5, pct(clipEnd) - pct(clipStart))}%`,
                    }}
                    onPointerDown={startMoveDrag}
                  />
                  <button
                    type="button"
                    aria-label="Trim start"
                    className="absolute top-1/2 z-[2] h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400 bg-zinc-900 shadow-md touch-manipulation"
                    style={{ left: `${pct(clipStart)}%` }}
                    onPointerDown={startLeftDrag}
                  />
                  <button
                    type="button"
                    aria-label="Trim end"
                    className="absolute top-1/2 z-[2] h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400 bg-zinc-900 shadow-md touch-manipulation"
                    style={{ left: `${pct(clipEnd)}%` }}
                    onPointerDown={startRightDrag}
                  />
                </div>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] tabular-nums text-zinc-400">
              <span>
                Start {formatClock(clipStart)} · End {formatClock(clipEnd)}
              </span>
              <span>
                Length {formatClock(span)} / max {MAX_CLIP_SEC}s
              </span>
            </div>

            {filmstripTotal > 0 ? (
              <p className="mt-1 text-[12px] text-zinc-500">
                Filmstrip {filmstripDone}/{filmstripTotal}s
                {filmstripDone < filmstripTotal ? ' · still capturing…' : ' · ready'}
              </p>
            ) : null}
            {filmstripErr ? <p className="mt-1 text-[12px] text-amber-200/90">{filmstripErr}</p> : null}

            <div className="mt-2 overflow-hidden rounded-lg border border-zinc-800 bg-black">
              <video
                ref={videoRef}
                src={videoUrl || undefined}
                className="max-h-[7rem] w-full object-contain"
                controls={!busy}
                playsInline
                muted
                preload="auto"
                aria-label="Trim preview"
              />
            </div>

            <button
              type="button"
              onClick={playSelection}
              disabled={busy}
              className="mt-2 text-[13px] font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-40"
            >
              Play selection
            </button>
          </>
        ) : (
          <p className="mt-3 text-[13px] text-zinc-500">
            Reading video…{' '}
            <span className="text-zinc-600">If this hangs, try exporting as MP4 in Photos or a shorter clip.</span>
          </p>
        )}

        {trimErr ? (
          <div className="mt-3 rounded-lg border border-rose-500/40 bg-rose-950/30 px-2 py-1.5 text-[13px] text-rose-200">{trimErr}</div>
        ) : null}

        {busy ? (
          <div className="mt-3">
            <div className="text-[13px] text-zinc-300">Encoding clip… first run may download the encoder.</div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-cyan-500 transition-[width] duration-200"
                style={{ width: `${Math.round(trimProgress * 100)}%` }}
              />
            </div>
            <button
              type="button"
              onClick={cancelTrim}
              className="mt-2 text-[13px] font-semibold text-zinc-400 underline hover:text-zinc-200"
            >
              Cancel encoding
            </button>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || duration <= 0}
            onClick={() => void confirmTrim()}
            className="min-h-11 flex-1 rounded-xl bg-cyan-600 px-4 text-[15px] font-semibold text-white hover:bg-cyan-500 disabled:opacity-40 touch-manipulation"
          >
            Use this clip
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="min-h-11 flex-1 rounded-xl border border-zinc-600 px-4 text-[15px] font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 touch-manipulation"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
