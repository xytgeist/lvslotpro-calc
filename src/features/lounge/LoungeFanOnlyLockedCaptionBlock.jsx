import { useMemo } from 'react'
import { renderRichCaption } from './loungeCaption.jsx'
import { LOUNGE_FEED_CAPTION_TEXT_CLASS, LOUNGE_FEED_CAPTION_TOP_CLASS } from './loungeFeedAvatar.js'
import { useLoungeMarketFeedQuotes } from './LoungeMarketFeedContext.jsx'

/**
 * Locked fan-only feed caption: one rounded blur plate with subscribe CTA on top.
 *
 * @param {{
 *   text: string,
 *   captionOpts?: object,
 *   creatorHandle?: string | null,
 *   onSubscribe: () => void,
 *   busy?: boolean,
 * }} props
 */
export default function LoungeFanOnlyLockedCaptionBlock({
  text,
  captionOpts = {},
  creatorHandle,
  onSubscribe,
  busy = false,
}) {
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
  const raw = creatorHandle ? String(creatorHandle).replace(/^@/, '').trim() : ''
  const handleLabel = raw ? `@${raw}` : 'this creator'

  if (!body.trim() && !rich) return null

  return (
    <div
      className={`${LOUNGE_FEED_CAPTION_TOP_CLASS} relative text-left text-zinc-200`}
      data-lounge-fan-only-locked
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-zinc-700/45 bg-zinc-900/35 pb-[3.35rem]"
        data-lounge-fan-only-blur-frame
      >
        <div
          className={`${LOUNGE_FEED_CAPTION_TEXT_CLASS} max-h-[4.25rem] overflow-hidden px-3 pt-3 pb-2 blur-[3px] select-none pointer-events-none opacity-85`}
          aria-hidden
        >
          <span className="whitespace-pre-wrap break-words">{rich}</span>
        </div>
        <div
          className="lounge-fan-only-blur-frame-overlay pointer-events-none absolute inset-0 backdrop-blur-[2px] bg-zinc-950/20"
          aria-hidden
        />
        <div className="absolute inset-x-2.5 bottom-2.5 z-10" data-lounge-fan-only-cta>
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation()
              onSubscribe()
            }}
            className="flex w-full min-h-11 items-center justify-center rounded-xl bg-cyan-400 px-4 text-[15px] font-semibold text-zinc-950 touch-manipulation hover:bg-cyan-300 active:bg-cyan-500 disabled:opacity-50 [-webkit-tap-highlight-color:transparent]"
          >
            {busy ? (
              'Loading…'
            ) : (
              <span className="inline-flex max-w-full min-w-0 items-center justify-center">
                <span className="shrink-0">Subscribe to&nbsp;</span>
                <span className="truncate">{handleLabel}</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
