import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cfStreamManifestUrl } from '../../utils/loungeVideoUpload'
import {
  LOUNGE_HERO_LIGHTBOX_CHROME_X_PAD,
  LOUNGE_HERO_LIGHTBOX_TOP_BTN_CLASS,
} from '../lounge/LoungeStreamVideoLightboxChrome.jsx'
import { useLoungeLightboxSwipeDismiss } from '../lounge/loungeLightboxSwipeDismiss.js'
import { useLoungeStreamHlsAttachment } from '../lounge/useLoungeStreamHlsAttachment.js'
import { notifyLoungeStreamLightboxOpen } from '../lounge/loungeStreamLightboxRegistry.js'
import { loungeFeedImageDeliveryUrl } from '../../utils/loungeCfImageMedia.js'
import { stopLoungeLightboxMedia } from '../../utils/loungeLightboxMediaControl.js'

/**
 * Full-screen chat video viewer - lounge-style chrome (back + swipe dismiss).
 * CF Stream via native HLS `<video>` (same as feed hero); R2 MP4 via direct src.
 * A transparent capture layer sits above the video so Android swipe dismiss works
 * (iframe / native controls steal touches otherwise).
 */
export default function ChatVideoLightbox({
  videoUid = null,
  videoUrl = null,
  posterUrl = null,
  onClose,
  lightboxPortalClass = 'z-[130]',
}) {
  const videoRef = useRef(null)
  const lightboxRootRef = useRef(null)
  const [mediaEnabled, setMediaEnabled] = useState(true)
  const uid = videoUid ? String(videoUid).trim() : ''
  const url = videoUrl ? String(videoUrl).trim() : ''
  const poster = posterUrl ? loungeFeedImageDeliveryUrl(String(posterUrl).trim(), 'poster') : ''
  const manifestSrc = uid ? cfStreamManifestUrl(uid) : ''
  const mp4Src = !uid && url ? url : ''

  useLoungeStreamHlsAttachment(videoRef, manifestSrc, 0, {
    enabled: mediaEnabled && Boolean(manifestSrc),
  })

  const stopPlayback = useCallback(() => {
    setMediaEnabled(false)
    stopLoungeLightboxMedia({
      videoEl: videoRef.current,
      rootEl: lightboxRootRef.current,
    })
  }, [])

  const handleClose = useCallback(() => {
    stopPlayback()
    window.requestAnimationFrame(() => {
      onClose()
    })
  }, [onClose, stopPlayback])

  const togglePlayPause = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      const p = v.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } else {
      v.pause()
    }
  }, [])

  const { swipeSurfaceProps } = useLoungeLightboxSwipeDismiss({
    onClose: handleClose,
    onTap: togglePlayPause,
    allowSwipeOnVideo: true,
  })

  const {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    style: swipeDragStyle,
    className: swipeClassName,
  } = swipeSurfaceProps

  useEffect(() => {
    notifyLoungeStreamLightboxOpen(true)
    return () => notifyLoungeStreamLightboxOpen(false)
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      stopPlayback()
    }
  }, [handleClose, stopPlayback])

  useEffect(() => {
    if (!mediaEnabled) return
    const v = videoRef.current
    if (!v) return
    const startPlayback = () => {
      try {
        v.muted = false
        v.volume = 1
      } catch {
        // ignore
      }
      const p = v.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    }
    if (manifestSrc || mp4Src) {
      if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) startPlayback()
      else v.addEventListener('loadeddata', startPlayback, { once: true })
    }
  }, [mediaEnabled, manifestSrc, mp4Src])

  if (!manifestSrc && !mp4Src) return null

  return createPortal(
    <div
      ref={lightboxRootRef}
      data-lounge-media-lightbox
      className={`fixed inset-0 ${lightboxPortalClass} flex flex-col bg-black`}
      role="dialog"
      aria-modal="true"
      aria-label="Video"
    >
      <div className="pointer-events-none absolute inset-0 z-[3] flex flex-col justify-between">
        <div
          className={`pointer-events-auto flex shrink-0 items-center justify-between gap-2 ${LOUNGE_HERO_LIGHTBOX_CHROME_X_PAD} pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]`}
          data-lounge-lightbox-no-swipe
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleClose()
            }}
            aria-label="Back"
            className={LOUNGE_HERO_LIGHTBOX_TOP_BTN_CLASS}
          >
            <span className="text-[22px] leading-none" aria-hidden>
              ←
            </span>
          </button>
        </div>
      </div>
      <div className="relative z-0 flex min-h-0 flex-1 flex-col">
        <div
          className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2"
          style={swipeDragStyle}
        >
          <video
            ref={videoRef}
            src={mp4Src || undefined}
            poster={poster || undefined}
            playsInline
            className="pointer-events-none max-h-full max-w-full object-contain"
          />
        </div>
        {/* Transparent capture layer: swipe dismiss + tap play/pause (video stays paint-only). */}
        <div
          aria-hidden
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          className={['absolute inset-0 z-[2] touch-none', swipeClassName].filter(Boolean).join(' ')}
        />
      </div>
    </div>,
    document.body,
  )
}
