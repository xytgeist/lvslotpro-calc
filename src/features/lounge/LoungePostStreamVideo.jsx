import { useEffect, useRef } from 'react'
import { cfStreamManifestUrl, cfStreamPosterUrl } from '../../utils/loungeVideoUpload'

const boxByVariant = {
  feed: 'max-h-64 w-full overflow-hidden rounded-xl border border-zinc-700/80 bg-black sm:max-h-72',
  detail: 'max-h-[min(70vh,520px)] w-full overflow-hidden rounded-xl border border-zinc-700/80 bg-black',
  embed: 'max-h-52 w-full overflow-hidden rounded-lg border border-zinc-700/80 bg-black sm:max-h-56',
  composer: 'max-h-52 w-full overflow-hidden rounded-xl border border-zinc-700/80 bg-black',
}

/**
 * Cloudflare Stream playback (adaptive HLS). `uid` is the Stream asset id from `stream_video_uid`.
 */
export default function LoungePostStreamVideo({ uid, variant = 'feed', firstMarginTopClass = 'mt-2' }) {
  const videoRef = useRef(null)
  const id = String(uid || '').trim()
  const src = cfStreamManifestUrl(id)
  const poster = cfStreamPosterUrl(id, 720)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return undefined

    let cancelled = false
    let hlsInstance = null

    const cleanupVideo = () => {
      try {
        video.removeAttribute('src')
        video.load()
      } catch {
        // ignore
      }
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      return cleanupVideo
    }

    import('hls.js')
      .then(({ default: Hls }) => {
        if (cancelled || !videoRef.current || videoRef.current !== video) return
        if (Hls.isSupported()) {
          const hls = new Hls({
            maxBufferLength: 24,
            maxMaxBufferLength: 90,
          })
          hlsInstance = hls
          hls.loadSource(src)
          hls.attachMedia(video)
        } else {
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
      if (hlsInstance) {
        hlsInstance.destroy()
        hlsInstance = null
      }
      cleanupVideo()
    }
  }, [src])

  if (!id) return null

  const box = boxByVariant[variant] || boxByVariant.feed

  return (
    <div className={`${firstMarginTopClass} ${box}`}>
      <video
        ref={videoRef}
        className="h-full w-full max-h-[inherit] object-contain"
        controls
        playsInline
        controlsList="nodownload"
        poster={poster}
        preload="metadata"
        aria-label="Post video"
      />
    </div>
  )
}
