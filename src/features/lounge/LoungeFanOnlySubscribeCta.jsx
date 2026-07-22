/**
 * Locked creator fan-only post: subscribe to unlock full post + media.
 *
 * @param {{
 *   creatorHandle?: string | null,
 *   onSubscribe: () => void,
 *   busy?: boolean,
 * }} props
 */
export default function LoungeFanOnlySubscribeCta({ creatorHandle, onSubscribe, busy = false }) {
  const label = creatorHandle ? `@${creatorHandle.replace(/^@/, '')}` : 'this creator'
  return (
    <div className="-mt-1 pt-0.5" data-lounge-fan-only-cta>
      <p className="text-[13px] leading-snug text-zinc-500">
        Subscribers-only · subscribe to <span className="text-zinc-400">{label}</span> to read the rest.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation()
          onSubscribe()
        }}
        className="mt-2 inline-flex min-h-9 items-center justify-center rounded-lg border border-zinc-600/65 bg-zinc-800/45 px-3.5 text-[14px] font-medium text-zinc-200 touch-manipulation hover:border-zinc-500/80 hover:bg-zinc-800/80 active:bg-zinc-800 disabled:opacity-50 [-webkit-tap-highlight-color:transparent]"
      >
        {busy ? 'Loading…' : 'Subscribe'}
      </button>
    </div>
  )
}
