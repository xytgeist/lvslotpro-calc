import { useCallback, useEffect, useRef, useState } from 'react'

function formatRemaining(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '-0:00'
  const s = Math.ceil(seconds)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `-${m}:${String(r).padStart(2, '0')}`
}

const SEEK_EPSILON_SEC = 0.035

function scrubDurationMax(video, durationState) {
  const fromVideo = Number.isFinite(video?.duration) && video.duration > 0 ? video.duration : 0
  if (fromVideo > 0) return fromVideo
  if (durationState > 0) return durationState
  return 1
}

/** Map pointer X on the range track to seconds (iOS zero-thumb sliders often skip input events). */
function scrubTimeFromPointer(el, clientX, durationMax) {
  const rect = el.getBoundingClientRect()
  if (!rect.width) return 0
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  return ratio * durationMax
}

/**
 * Minimal hero lightbox transport: play/pause + scrubber (video paints behind overlay chrome).
 * Pointer-position scrubbing so hidden-thumb styling still seeks on iOS/Android.
 * @param {{ current: HTMLVideoElement | null }} videoRef
 */
export default function LoungeStreamVideoPlaybackControls({
  videoRef,
  visible = true,
  onUserActivity,
  onScrubbingChange,
}) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [scrubbing, setScrubbing] = useState(false)
  const [scrubPreview, setScrubPreview] = useState(0)
  const scrubbingRef = useRef(false)
  const scrubPreviewRef = useRef(0)
  const durationRef = useRef(0)
  const wasPlayingBeforeScrubRef = useRef(false)
  const scrubSeekRafRef = useRef(0)
  const pendingScrubTimeRef = useRef(/** @type {number | null} */ (null))
  const rafRef = useRef(0)

  const syncDuration = useCallback((v) => {
    setDuration(Number.isFinite(v?.duration) ? v.duration : 0)
  }, [])

  useEffect(() => {
    durationRef.current = duration
  }, [duration])

  const clampScrubTime = useCallback((v, next) => {
    if (!Number.isFinite(next)) return 0
    const cap = scrubDurationMax(v, durationRef.current)
    if (cap > 0) return Math.min(Math.max(0, next), cap)
    return Math.max(0, next)
  }, [])

  const seekVideoTo = useCallback(
    (next, { liveScrub = false } = {}) => {
      const v = videoRef?.current
      const t = clampScrubTime(v, next)
      scrubPreviewRef.current = t
      setScrubPreview(t)
      if (liveScrub || !scrubbingRef.current) {
        setCurrentTime(t)
      }
      if (!v) return t
      if (Math.abs(v.currentTime - t) <= SEEK_EPSILON_SEC) return t
      try {
        v.currentTime = t
      } catch {
        // ignore
      }
      return t
    },
    [videoRef, clampScrubTime],
  )

  const scheduleLiveScrubSeek = useCallback(
    (next) => {
      pendingScrubTimeRef.current = next
      if (scrubSeekRafRef.current) return
      scrubSeekRafRef.current = requestAnimationFrame(() => {
        scrubSeekRafRef.current = 0
        const target = pendingScrubTimeRef.current
        pendingScrubTimeRef.current = null
        if (target == null) return
        seekVideoTo(target, { liveScrub: true })
      })
    },
    [seekVideoTo],
  )

  useEffect(() => {
    scrubbingRef.current = scrubbing
    onScrubbingChange?.(scrubbing)
  }, [scrubbing, onScrubbingChange])

  useEffect(
    () => () => {
      if (scrubSeekRafRef.current) cancelAnimationFrame(scrubSeekRafRef.current)
      pendingScrubTimeRef.current = null
    },
    [],
  )

  useEffect(() => {
    const v = videoRef?.current
    if (!v) return undefined

    const syncPlayState = () => {
      setPlaying(!v.paused && !v.ended)
    }
    syncPlayState()
    syncDuration(v)
    if (!scrubbingRef.current) {
      const t = v.currentTime || 0
      scrubPreviewRef.current = t
      setCurrentTime(t)
      setScrubPreview(t)
    }

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onDurationChange = () => syncDuration(v)
    const onLoadedMetadata = () => syncDuration(v)

    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('durationchange', onDurationChange)
    v.addEventListener('loadedmetadata', onLoadedMetadata)
    return () => {
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('durationchange', onDurationChange)
      v.removeEventListener('loadedmetadata', onLoadedMetadata)
    }
  }, [videoRef, syncDuration])

  useEffect(() => {
    const v = videoRef?.current
    if (!v || !visible) return undefined

    const tick = () => {
      if (!scrubbingRef.current) {
        const t = v.currentTime || 0
        scrubPreviewRef.current = t
        setCurrentTime(t)
        setScrubPreview(t)
      }
      if (!v.paused && !v.ended) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    if (!v.paused && !v.ended) {
      rafRef.current = requestAnimationFrame(tick)
    }

    const onPlay = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }
    const onPause = () => cancelAnimationFrame(rafRef.current)
    const onEnded = () => cancelAnimationFrame(rafRef.current)

    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('ended', onEnded)
    return () => {
      cancelAnimationFrame(rafRef.current)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('ended', onEnded)
    }
  }, [videoRef, visible, playing])

  const togglePlay = useCallback(
    (e) => {
      e.stopPropagation()
      onUserActivity?.()
      const v = videoRef?.current
      if (!v) return
      try {
        if (v.paused) {
          const p = v.play()
          if (p && typeof p.catch === 'function') p.catch(() => {})
        } else {
          v.pause()
        }
      } catch {
        // ignore
      }
    },
    [videoRef, onUserActivity],
  )

  const beginScrub = useCallback(
    (e) => {
      e.stopPropagation()
      onUserActivity?.()
      const v = videoRef?.current
      wasPlayingBeforeScrubRef.current = Boolean(v && !v.paused && !v.ended)
      if (v && wasPlayingBeforeScrubRef.current) {
        try {
          v.pause()
        } catch {
          // ignore
        }
        setPlaying(false)
      }
      pendingScrubTimeRef.current = null
      setScrubbing(true)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
      const max = scrubDurationMax(v, durationRef.current)
      const t = scrubTimeFromPointer(e.currentTarget, e.clientX, max)
      seekVideoTo(t, { liveScrub: true })
    },
    [videoRef, onUserActivity, seekVideoTo],
  )

  const onScrubPointerMove = useCallback(
    (e) => {
      if (!scrubbingRef.current) return
      e.stopPropagation()
      const max = scrubDurationMax(videoRef?.current, durationRef.current)
      const t = scrubTimeFromPointer(e.currentTarget, e.clientX, max)
      scheduleLiveScrubSeek(t)
    },
    [videoRef, scheduleLiveScrubSeek],
  )

  const onScrubInput = useCallback(
    (e) => {
      e.stopPropagation()
      const next = Number(e.target.value)
      if (!Number.isFinite(next)) return
      scheduleLiveScrubSeek(next)
    },
    [scheduleLiveScrubSeek],
  )

  const finishScrub = useCallback(
    (e) => {
      e?.stopPropagation?.()
      if (scrubSeekRafRef.current) {
        cancelAnimationFrame(scrubSeekRafRef.current)
        scrubSeekRafRef.current = 0
      }
      try {
        e?.currentTarget?.releasePointerCapture?.(e.pointerId)
      } catch {
        // ignore
      }
      const fromInput = Number(e?.currentTarget?.value)
      const fromPointer =
        e?.currentTarget && Number.isFinite(e.clientX)
          ? scrubTimeFromPointer(
              e.currentTarget,
              e.clientX,
              scrubDurationMax(videoRef?.current, durationRef.current),
            )
          : null
      const next = Number.isFinite(fromPointer)
        ? fromPointer
        : Number.isFinite(fromInput)
          ? fromInput
          : scrubPreviewRef.current
      const resume = wasPlayingBeforeScrubRef.current
      wasPlayingBeforeScrubRef.current = false
      setScrubbing(false)
      pendingScrubTimeRef.current = null

      seekVideoTo(next)
      const v = videoRef?.current
      if (v && resume) {
        try {
          const p = v.play()
          if (p && typeof p.catch === 'function') p.catch(() => {})
        } catch {
          // ignore
        }
      }
      onUserActivity?.()
    },
    [videoRef, seekVideoTo, onUserActivity],
  )

  const max = duration > 0 ? duration : 1
  const displayTime = scrubbing ? scrubPreview : currentTime
  const remaining = duration > 0 ? duration - displayTime : 0
  const scrubProgressPct = max > 0 ? Math.min(100, Math.max(0, (displayTime / max) * 100)) : 0

  return (
    <div
      className={`flex w-full items-center gap-3 px-1 pt-1 ${visible ? 'pointer-events-auto' : 'pointer-events-none'}`}
      data-lounge-lightbox-no-swipe
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? 'Pause' : 'Play'}
        className="inline-flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-full text-white hover:bg-white/10 [-webkit-tap-highlight-color:transparent]"
      >
        {playing ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
          </svg>
        ) : (
          <svg className="ml-0.5 h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5.14v13.72L19 12 8 5.14z" />
          </svg>
        )}
      </button>
      <input
        type="range"
        min={0}
        max={max}
        step="any"
        value={Math.min(Math.max(displayTime, 0), max)}
        onChange={onScrubInput}
        onInput={onScrubInput}
        onPointerDown={beginScrub}
        onPointerMove={onScrubPointerMove}
        onPointerUp={finishScrub}
        onPointerCancel={finishScrub}
        aria-label="Video progress"
        className="lounge-video-scrubber range-touch-target min-w-0 flex-1"
        style={{
          touchAction: 'none',
          ['--lounge-scrub-progress']: `${scrubProgressPct}%`,
        }}
      />
      <span className="w-10 shrink-0 text-right text-[12px] tabular-nums text-white/90">
        {formatRemaining(remaining)}
      </span>
    </div>
  )
}
