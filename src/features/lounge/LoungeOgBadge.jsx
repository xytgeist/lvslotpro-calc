import LoungeBadgeHoverTip from './LoungeBadgeHoverTip.jsx'

/**
 * Earliest-adopter marker from `profiles.is_og` (first 1k profiles by created_at).
 * Compact, theme-adjacent to staff badges — not a pill.
 *
 * @param {{ isOg?: boolean | null, size?: 'feed' | 'detail' | 'modal' }} props
 */
export default function LoungeOgBadge({ isOg, size = 'feed' }) {
  if (isOg !== true) return null
  const text =
    size === 'detail' || size === 'modal'
      ? 'text-[11px] leading-[22px] tracking-[0.14em]'
      : 'text-[10px] leading-[20px] tracking-[0.14em]'
  return (
    <LoungeBadgeHoverTip tip="One of the first 1,000 members" tone="amber" className="translate-y-[0.5px]">
      <abbr
        aria-label="OG, one of the first 1,000 members"
        className={`inline-flex items-baseline border-b border-amber-600/60 ${text} font-extrabold uppercase text-amber-400/95 no-underline decoration-transparent`}
      >
        OG
      </abbr>
    </LoungeBadgeHoverTip>
  )
}
