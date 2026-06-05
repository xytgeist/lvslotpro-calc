import { useCallback, useMemo, useState } from 'react'
import {
  isYouTubeLinkPreview,
  resolveYouTubeVideoId,
  youtubeEmbedSrc,
  youtubeThumbnailUrl,
} from '../utils/youtubeEmbed.js'
import YouTubeBrandMark from './YouTubeBrandMark.jsx'

/**
 * Telegram-style YouTube preview for chat — thumbnail, title, description; tap to play inline.
 * URL row is omitted when {@link embedded} — caption text already includes the link.
 *
 * @param {{
 *   preview: object,
 *   className?: string,
 *   isMine?: boolean,
 *   embedded?: boolean,
 * }} props
 */
export default function YouTubeChatEmbed({ preview, className = '', isMine = false, embedded = false }) {
  const videoId = useMemo(() => resolveYouTubeVideoId(preview), [preview])
  const [playing, setPlaying] = useState(false)

  const url = String(preview?.url || '').trim()
  const title = String(preview?.title || 'YouTube video').trim()
  const description = String(preview?.description || '').trim()
  const poster = String(preview?.image_url || '').trim() || (videoId ? youtubeThumbnailUrl(videoId) : '')

  const startPlayback = useCallback((e) => {
    e?.stopPropagation?.()
    e?.preventDefault?.()
    setPlaying(true)
  }, [])

  const openExternal = useCallback(
    (e) => {
      e?.stopPropagation?.()
      e?.preventDefault?.()
      if (!url) return
      try {
        window.open(url, '_blank', 'noopener,noreferrer')
      } catch {
        /* */
      }
    },
    [url],
  )

  if (!isYouTubeLinkPreview(preview) || !videoId) return null

  const marginTop = embedded ? 'mt-2' : 'mt-1.5'
  const widthClass = embedded ? 'w-full max-w-full' : 'w-full max-w-[320px]'
  const shellClass = embedded
    ? `pt-2 border-t ${isMine ? 'border-white/20' : 'border-zinc-600/50'}`
    : ''
  const cardBg = embedded
    ? isMine
      ? 'bg-black/12'
      : 'bg-black/25'
    : isMine
      ? 'bg-blue-600/90'
      : 'bg-zinc-800/95'
  const urlClass = isMine ? 'text-white/85 hover:text-white' : 'text-cyan-300 hover:text-cyan-200'
  const titleClass = isMine ? 'text-white' : 'text-zinc-100'
  const bodyClass = isMine ? 'text-white/80' : 'text-zinc-300'
  const metaClass = isMine ? 'text-white/70' : 'text-zinc-400'

  return (
    <div
      className={`${marginTop} ${shellClass} ${widthClass} overflow-hidden rounded-xl ${cardBg} ${className}`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {!embedded && url ? (
        <button
          type="button"
          onClick={openExternal}
          className={`block w-full truncate px-3 pt-2.5 text-left text-[13px] underline underline-offset-2 ${urlClass}`}
        >
          {url}
        </button>
      ) : null}

      <div className={`relative aspect-video w-full bg-black ${embedded || url ? '' : 'mt-2.5'}`}>
        {playing ? (
          <iframe
            src={youtubeEmbedSrc(videoId, { autoplay: true })}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <button
            type="button"
            onClick={startPlayback}
            className="group absolute inset-0 flex h-full w-full items-center justify-center touch-manipulation"
            aria-label={`Play YouTube video: ${title}`}
          >
            {poster ? (
              <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            ) : null}
            <span className="absolute inset-0 bg-black/20 transition group-hover:bg-black/30 group-active:bg-black/40" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-black/50 ring-1 ring-white/25 backdrop-blur-[2px]">
              <svg className="ml-1 h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            </span>
          </button>
        )}
      </div>

      <div className="space-y-1 px-3 py-2.5">
        <YouTubeBrandMark
          labelClassName={`text-[12px] font-semibold uppercase tracking-wide ${metaClass}`}
          iconClassName="h-[14px] w-[20px]"
        />
        <div className={`text-[15px] font-semibold leading-snug ${titleClass}`}>{title}</div>
        {description ? (
          <p className={`whitespace-pre-wrap break-words text-[13px] leading-relaxed line-clamp-5 ${bodyClass}`}>
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}
