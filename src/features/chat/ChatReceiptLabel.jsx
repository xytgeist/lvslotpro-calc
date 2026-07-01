import { formatReadReceiptTime } from './chatReceiptStatus.js'

/**
 * Delivered / Read label for the viewer's latest outgoing message.
 * @param {{ receipt: import('./chatReceiptStatus.js').ChatMessageReceipt | null }} props
 */
export default function ChatReceiptLabel({ receipt }) {
  if (!receipt) return null

  if (receipt.status === 'sending') {
    return (
      <span className="select-none text-[11px] font-medium leading-none text-zinc-500" aria-label="Sending">
        Sending…
      </span>
    )
  }

  if (receipt.status === 'read') {
    const timeLabel = receipt.readAt ? formatReadReceiptTime(receipt.readAt) : null
    const text = timeLabel ? `Read ${timeLabel}` : 'Read'
    return (
      <span className="select-none text-[11px] font-medium leading-none text-zinc-500" aria-label={text}>
        {text}
      </span>
    )
  }

  return (
    <span className="select-none text-[11px] font-medium leading-none text-zinc-500" aria-label="Delivered">
      Delivered
    </span>
  )
}
