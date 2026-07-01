/** Circular caption-length indicator (X-style ring + remaining count near max). */

export function loungeComposerCharRingStrokeClass(len, max) {
  const n = Math.max(0, Number(len) || 0)
  const cap = Math.max(1, Number(max) || 1)
  if (n >= cap) return 'stroke-red-500'
  if (n >= cap - 5) return 'stroke-orange-400'
  if (n >= cap - 15) return 'stroke-yellow-400'
  return 'stroke-cyan-500/70'
}

export function loungeComposerCharRingLabelClass(len, max) {
  const n = Math.max(0, Number(len) || 0)
  const cap = Math.max(1, Number(max) || 1)
  if (n >= cap) return 'text-red-500'
  if (n >= cap - 5) return 'text-orange-400'
  if (n >= cap - 15) return 'text-yellow-400'
  return 'text-zinc-500'
}

export default function LoungeComposerCharRing({
  len,
  max,
  /** Show digits inside the ring when within this many chars of max. */
  showRemainingWithin = 15,
  className = '',
  'aria-live': ariaLive,
}) {
  const n = Math.max(0, Number(len) || 0)
  const cap = Math.max(1, Number(max) || 1)
  const r = 8
  const c = 2 * Math.PI * r
  const pct = Math.min(1, n / cap)
  const offset = c * (1 - pct)
  const remaining = cap - n
  const showRemaining = remaining <= showRemainingWithin

  return (
    <div
      className={`relative flex h-7 w-7 shrink-0 items-center justify-center ${className}`.trim()}
      aria-label={`${n} of ${cap} characters`}
      aria-live={ariaLive}
      title={`${n}/${cap}`}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90" aria-hidden>
        <circle cx="14" cy="14" r={r} fill="none" className="stroke-zinc-600/80" strokeWidth="2" />
        <circle
          cx="14"
          cy="14"
          r={r}
          fill="none"
          className={loungeComposerCharRingStrokeClass(n, cap)}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.15s ease' }}
        />
      </svg>
      {showRemaining ? (
        <span
          className={`absolute text-[9px] font-bold tabular-nums leading-none ${loungeComposerCharRingLabelClass(n, cap)}`}
        >
          {remaining}
        </span>
      ) : null}
    </div>
  )
}
