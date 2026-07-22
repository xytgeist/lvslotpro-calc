import LoungeFanOnlyLockedCaptionBlock from './LoungeFanOnlyLockedCaptionBlock.jsx'
import LoungeFanOnlySubscribeCta from './LoungeFanOnlySubscribeCta.jsx'

/**
 * Locked subs-only body (feed row, quote embed, plain repost display).
 *
 * @param {{
 *   text: string,
 *   captionOpts?: object,
 *   creatorHandle?: string | null,
 *   onSubscribe: () => void,
 *   busy?: boolean,
 *   className?: string,
 * }} props
 */
export default function LoungeFanOnlyLockedPostInset({
  text,
  captionOpts = {},
  creatorHandle,
  onSubscribe,
  busy = false,
  className = 'mt-1',
}) {
  const body = String(text ?? '').trim()
  if (body) {
    return (
      <LoungeFanOnlyLockedCaptionBlock
        text={text}
        captionOpts={captionOpts}
        creatorHandle={creatorHandle}
        onSubscribe={onSubscribe}
        busy={busy}
        className={className}
      />
    )
  }
  return (
    <LoungeFanOnlySubscribeCta
      creatorHandle={creatorHandle}
      onSubscribe={onSubscribe}
      busy={busy}
      className={className}
    />
  )
}
