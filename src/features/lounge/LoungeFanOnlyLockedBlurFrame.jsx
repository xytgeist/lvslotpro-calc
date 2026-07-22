import { useMemo } from 'react'
import { renderRichCaption } from './loungeCaption.jsx'
import { LOUNGE_FEED_CAPTION_TEXT_CLASS } from './loungeFeedAvatar.js'
import { useLoungeMarketFeedQuotes } from './LoungeMarketFeedContext.jsx'

/**
 * Locked fan-only feed: blurred caption plate below the subscribe CTA.
 *
 * @param {{ text: string, captionOpts?: object }} props
 */
export default function LoungeFanOnlyLockedBlurFrame({ text, captionOpts = {} }) {
  const { cashtagQuotesByTicker } = useLoungeMarketFeedQuotes()
  const body = String(text ?? '')
  const mergedCaptionOpts = useMemo(
    () => ({
      ...captionOpts,
      cashtagQuotesByTicker: captionOpts.cashtagQuotesByTicker ?? cashtagQuotesByTicker,
    }),
    [captionOpts, cashtagQuotesByTicker],
  )
  const rich = useMemo(() => renderRichCaption(body, mergedCaptionOpts), [body, mergedCaptionOpts])
  if (!body.trim() && !rich) return null

  return (
    <div
      className="relative z-0 min-h-[4.5rem] overflow-hidden rounded-2xl border border-zinc-700/45 bg-zinc-900/35"
      data-lounge-fan-only-blur-frame
      aria-hidden
    >
      <div
        className={`${LOUNGE_FEED_CAPTION_TEXT_CLASS} px-3 py-3 blur-[6px] select-none pointer-events-none opacity-75`}
      >
        <span className="whitespace-pre-wrap break-words">{rich}</span>
      </div>
      <div
        className="lounge-fan-only-blur-frame-overlay pointer-events-none absolute inset-0 backdrop-blur-[5px] bg-gradient-to-b from-zinc-950/15 via-zinc-950/45 to-zinc-950/75"
        aria-hidden
      />
    </div>
  )
}
