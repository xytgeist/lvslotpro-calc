import { useEffect } from 'react'

/**
 * Cloudflare Stream HLS attach for lounge inline / shared feed player.
 * @param {import('react').RefObject<HTMLVideoElement | null>} videoRef
 * @param {string} src
 * @param {number} attachKey
 * @param {object} [opts]
 */
export function useLoungeStreamHlsAttachment(videoRef, src, attachKey = 0, opts = {}) {
  const {
    enabled = true,
    feedStyleAbr = false,
    ringWarmPrefetch = false,
    preferMseHls = false,
    recoveryBurstRef = null,
    onAutoReattach = null,
    onDebugHlsError = null,
    onDebugLifecycle = null,
    savedTimeRef = null,
  } = opts

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return undefined

    const cleanupVideo = () => {
      try {
        video.removeAttribute('src')
        video.load()
      } catch {
        // ignore
      }
    }

    const savePlaybackTime = () => {
      if (!savedTimeRef) return
      if (!Number.isFinite(video.currentTime) || video.currentTime <= 0.05) return
      savedTimeRef.current = video.currentTime
    }

    const restoreSavedTime = () => {
      if (!savedTimeRef) return
      const t = savedTimeRef.current
      if (!Number.isFinite(t) || t <= 0.05) return
      try {
        if (Math.abs(video.currentTime - t) > 0.35) video.currentTime = t
      } catch {
        // ignore
      }
    }

    if (!enabled) {
      savePlaybackTime()
      cleanupVideo()
      return undefined
    }

    if (onDebugLifecycle) onDebugLifecycle(`attach key=${attachKey}`)

    let cancelled = false
    let hlsInstance = null
    /** @type {((event: string, data: unknown) => void) | null} */
    let hlsErrorHandler = null

    const onRecovered = () => {
      if (recoveryBurstRef) recoveryBurstRef.current = 0
    }
    video.addEventListener('canplay', onRecovered, { once: true })
    video.addEventListener('loadedmetadata', restoreSavedTime, { once: true })

    const canNativeHls = Boolean(video.canPlayType('application/vnd.apple.mpegurl'))
    const attachNativeHls = () => {
      if (onDebugLifecycle) onDebugLifecycle(`attach key=${attachKey} native`)
      video.src = src
      return () => {
        cancelled = true
        savePlaybackTime()
        video.removeEventListener('canplay', onRecovered)
        video.removeEventListener('loadedmetadata', restoreSavedTime)
        cleanupVideo()
      }
    }

    if (canNativeHls && !preferMseHls) {
      return attachNativeHls()
    }

    import('hls.js')
      .then(({ default: Hls }) => {
        if (cancelled || !videoRef.current || videoRef.current !== video) return
        if (Hls.isSupported()) {
          if (onDebugLifecycle) onDebugLifecycle(`attach key=${attachKey} mse`)
          const maxBufferLength = feedStyleAbr ? (ringWarmPrefetch ? 6 : 18) : 45
          const maxMaxBufferLength = feedStyleAbr ? (ringWarmPrefetch ? 12 : 36) : 120
          const hls = new Hls({
            maxBufferLength,
            maxMaxBufferLength,
            lowLatencyMode: false,
            ...(feedStyleAbr ? { startLevel: 0, capLevelToPlayerSize: true } : {}),
          })
          hlsInstance = hls
          let didMediaRecover = false
          let didNetRestart = false
          hlsErrorHandler = (_event, data) => {
            if (!data?.fatal || cancelled) return
            try {
              if (data.type === 'networkError' && !didNetRestart) {
                didNetRestart = true
                hls.startLoad()
                return
              }
              if (data.type === 'mediaError' && !didMediaRecover) {
                didMediaRecover = true
                hls.recoverMediaError()
                return
              }
              const ref = recoveryBurstRef
              if (ref && ref.current < 2 && onAutoReattach) {
                ref.current += 1
                queueMicrotask(() => onAutoReattach())
                return
              }
              if (onDebugHlsError) {
                const detail = [data.type, data.details, data.response?.code]
                  .filter((x) => x != null && x !== '')
                  .join(' ')
                onDebugHlsError(detail || 'fatal')
              }
            } catch {
              // ignore
            }
          }
          hls.on(Hls.Events.ERROR, hlsErrorHandler)
          if (feedStyleAbr) {
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (cancelled || !hls.levels?.length) return
              let cap = hls.levels.length - 1
              for (let i = hls.levels.length - 1; i >= 0; i -= 1) {
                const h = hls.levels[i]?.height
                if (h && h <= 720) {
                  cap = i
                  break
                }
              }
              try {
                hls.autoLevelCapping = cap
              } catch {
                // ignore
              }
            })
          }
          hls.loadSource(src)
          hls.attachMedia(video)
        } else if (canNativeHls) {
          if (onDebugLifecycle) onDebugLifecycle(`attach key=${attachKey} native-fallback`)
          video.src = src
        }
      })
      .catch(() => {
        if (!cancelled && videoRef.current === video) {
          video.src = src
        }
      })

    return () => {
      cancelled = true
      savePlaybackTime()
      if (onDebugLifecycle) onDebugLifecycle(`detach key=${attachKey}`)
      video.removeEventListener('canplay', onRecovered)
      video.removeEventListener('loadedmetadata', restoreSavedTime)
      if (hlsInstance) {
        try {
          hlsInstance.destroy()
        } catch {
          // ignore
        }
        hlsInstance = null
      }
      cleanupVideo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit videoRef; opts refs stable
  }, [src, attachKey, enabled, feedStyleAbr, preferMseHls, onAutoReattach, recoveryBurstRef])
}
