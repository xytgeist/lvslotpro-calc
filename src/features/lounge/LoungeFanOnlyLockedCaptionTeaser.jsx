import { useMemo } from 'react'
import { renderRichCaption } from './loungeCaption.jsx'
import { LOUNGE_FEED_CAPTION_TEXT_CLASS, LOUNGE_FEED_CAPTION_TOP_CLASS } from './loungeFeedAvatar.js'
import { useLoungeMarketFeedQuotes } from './LoungeMarketFeedContext.jsx'

/**
 * Non-subscriber feed teaser: first line only, top half visible, fade/blur into subscribe CTA below.
 *
 * @param {{ text: string, captionOpts?: object }} props
 */
export default function LoungeFanOnlyLockedCaptionTeaser({ text, captionOpts = {} }) {
  const { cashtagQuotesByTicker } = useLoungeMarketFeedQuotes()
  const firstLine = useMemo(() => String(text ?? '').split(/\r?\n/)[0] ?? '', [text])
  const mergedCaptionOpts = useMemo(
    () => ({
      ...captionOpts,
      cashtagQuotesByTicker: captionOpts.cashtagQuotesByTicker ?? cashtagQuotesByTicker,
    }),
    [captionOpts, cashtagQuotesByTicker],
  )
  const rich = useMemo(
    () => renderRichCaption(firstLine, mergedCaptionOpts),
    [firstLine, mergedCaptionOpts],
  )
  if (!firstLine.trim() && !rich) return null

  return (
    <div className={`relative ${LOUNGE_FEED_CAPTION_TOP_CLASS}`} data-lounge-fan-only-teaser>
      <div
        className={`${LOUNGE_FEED_CAPTION_TEXT_CLASS} relative max-h-[0.5lh] overflow-hidden select-none`}
        aria-hidden
      >
        <span className="whitespace-pre-wrap break-words">{rich}</span>
      </div>
      <div
        className="lounge-fan-only-teaser-fade pointer-events-none absolute inset-x-0 top-[0.28lh] h-14 bg-gradient-to-b from-transparent via-zinc-950/55 to-zinc-950 backdrop-blur-[4px]"
        aria-hidden
      />
    </div>
  )
}
