import { useEffect, useMemo, useState } from 'react'
import { renderRichCaption, truncateCaptionForDisplay } from './loungeCaption.jsx'
import { LOUNGE_CAPTION_DISPLAY_MAX } from '../../utils/loungeCommentLimits.js'

/**
 * Rich caption with optional collapse at {@link LOUNGE_CAPTION_DISPLAY_MAX} + inline …more.
 *
 * @param {{
 *   text: string,
 *   className?: string,
 *   moreClassName?: string,
 *   displayMax?: number,
 *   startExpanded?: boolean,
 *   captionOpts?: object,
 * }} props
 */
export default function LoungeExpandableRichCaption({
  text,
  className = '',
  moreClassName = 'font-medium text-zinc-400 hover:text-zinc-200',
  displayMax = LOUNGE_CAPTION_DISPLAY_MAX,
  startExpanded = false,
  captionOpts = {},
}) {
  const [expanded, setExpanded] = useState(startExpanded)
  const source = String(text ?? '')

  useEffect(() => {
    setExpanded(startExpanded)
  }, [source, startExpanded])

  const { text: preview, isTruncated } = useMemo(
    () => truncateCaptionForDisplay(source, displayMax),
    [displayMax, source],
  )

  const showMore = isTruncated && !expanded
  const displayText = showMore ? preview : source
  const rich = renderRichCaption(displayText, captionOpts)
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
