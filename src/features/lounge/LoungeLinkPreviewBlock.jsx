import ChatLinkPreviewCard from '../../components/ChatLinkPreviewCard.jsx'
import YouTubeLoungeEmbed from '../../components/YouTubeLoungeEmbed.jsx'
import { isYouTubeLinkPreview } from '../../utils/youtubeEmbed.js'

/**
 * Link preview card under a Lounge caption or comment (iMessage-style).
 * YouTube URLs render as an inline player instead of a generic link card.
 *
 * @param {{ preview: object | null, className?: string, onPreviewOpen?: (preview: object, e: MouseEvent) => void, youtubeIframeLoading?: 'lazy' | 'eager' }} props
 */
export default function LoungeLinkPreviewBlock({
  preview,
  className = '',
  onPreviewOpen,
  youtubeIframeLoading = 'lazy',
}) {
  if (!preview?.url) return null
  if (isYouTubeLinkPreview(preview)) {
    return (
      <YouTubeLoungeEmbed preview={preview} className={className} iframeLoading={youtubeIframeLoading} />
    )
  }
  return (
    <ChatLinkPreviewCard
      preview={preview}
      isMine={false}
      className={`max-w-full ${className}`}
      onPreviewOpen={onPreviewOpen}
    />
  )
}
