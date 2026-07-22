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
    <div
      className="mt-2 rounded-xl border border-fuchsia-500/35 bg-fuchsia-950/40 px-3 py-2.5"
      data-lounge-fan-only-cta
    >
      <p className="text-[14px] leading-snug text-zinc-300">
        Subscribers-only post from{' '}
        <span className="font-semibold text-fuchsia-200">{label}</span>.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation()
          onSubscribe()
        }}
        className="mt-2 min-h-10 w-full rounded-lg bg-fuchsia-600 px-3 text-[15px] font-semibold text-white touch-manipulation hover:bg-fuchsia-500 disabled:opacity-60"
      >
        {busy ? 'Loading…' : 'Subscribe to unlock'}
      </button>
    </div>
  )
}
