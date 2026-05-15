/** Poker chip + heart like icon — simplified for ~20px (no rim micro-hearts). */
const HEART =
  'M12 17.15C9.35 14.85 7.85 13.35 7.85 11.2c0-1.55 1.15-2.65 2.55-2.65.75 0 1.45.35 2.05.95.6-.6 1.3-.95 2.05-.95 1.4 0 2.55 1.1 2.55 2.65 0 2.15-1.5 3.65-4.15 5.95z'

export default function LoungeFlameIcon({ className = 'h-5 w-5', liked = false, readOnly = false }) {
  const lit = liked && !readOnly

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeDasharray="2.85 2.15"
        fill={lit ? '#fafafa' : 'none'}
        fillOpacity={lit ? (readOnly ? 0.2 : 0.95) : 0}
      />
      <circle
        cx="12"
        cy="12"
        r="7.1"
        stroke="currentColor"
        strokeWidth={lit ? 0.9 : 0.75}
        strokeOpacity={readOnly ? 0.35 : lit ? 0.7 : 0.45}
      />
      <path
        d={HEART}
        fill={lit ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
        fillOpacity={readOnly ? 0.25 : 1}
      />
    </svg>
  )
}
