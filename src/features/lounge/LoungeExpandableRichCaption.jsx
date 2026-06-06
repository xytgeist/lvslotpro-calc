import { useEffect, useMemo, useState } from 'react'
import { renderRichCaption, truncateCaptionForDisplay } from './loungeCaption.jsx'
import { LOUNGE_CAPTION_DISPLAY_MAX, LOUNGE_CAPTION_DISPLAY_MAX_LINES } from '../../utils/loungeCommentLimits.js'
import { useLoungeMarketFeedQuotes } from './LoungeMarketFeedContext.jsx'

/**
 * Rich caption with optional collapse at {@link LOUNGE_CAPTION_DISPLAY_MAX} chars /
 * {@link LOUNGE_CAPTION_DISPLAY_MAX_LINES} lines + inline …more.
 *
 * @param {{
 *   text: string,
 *   className?: string,
 *   moreClassName?: string,
 *   displayMax?: number,
 *   displayMaxLines?: number,
 *   startExpanded?: boolean,
 *   captionOpts?: object,
 * }} props
 */
export default function LoungeExpandableRichCaption({
  text,
  className = '',
  moreClassName = 'font-medium text-zinc-400 hover:text-zinc-200',
  displayMax = LOUNGE_CAPTION_DISPLAY_MAX,
  displayMaxLines = LOUNGE_CAPTION_DISPLAY_MAX_LINES,
  startExpanded = false,
  captionOpts = {},
}) {
  const { cashtagQuotesByTicker } = useLoungeMarketFeedQuotes()
  const [expanded, setExpanded] = useState(startExpanded)
  const source = String(text ?? '')

  useEffect(() => {
    setExpanded(startExpanded)
  }, [source, startExpanded])

  const { text: preview, isTruncated } = useMemo(
    () => truncateCaptionForDisplay(source, displayMax, displayMaxLines),
    [displayMax, displayMaxLines, source],
  )

  const mergedCaptionOpts = useMemo(
    () => ({
      ...captionOpts,
      cashtagQuotesByTicker: captionOpts.cashtagQuotesByTicker ?? cashtagQuotesByTicker,
    }),
    [captionOpts, cashtagQuotesByTicker],
  )

  const showMore = isTruncated && !expanded
  const displayText = showMore ? preview : source
  const rich = renderRichCaption(displayText, mergedCaptionOpts)
  if (!rich) return null

  return (
    <span className={`whitespace-pre-wrap break-words ${className}`.trim()}>
      {rich}
      {showMore ? (
        <>
          {'… '}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setExpanded(true)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`inline touch-manipulation [-webkit-tap-highlight-color:transparent] ${moreClassName}`}
          >
            more
          </button>
        </>
      ) : null}
    </span>
  )
}
