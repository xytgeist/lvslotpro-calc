import LoungeBadgeHoverTip from './LoungeBadgeHoverTip.jsx'

const BADGE_SRC = '/og-cohort-badge.svg'

/**
 * Earliest-adopter marker from `profiles.is_og` (first 1k profiles by created_at).
 * Flat gold OG + laurel (`public/og-cohort-badge.svg`); swap for PNG at same path if preferred.
 * Hover tip in `LoungeBadgeHoverTip`.
 *
 * @param {{ isOg?: boolean | null, size?: 'feed' | 'detail' | 'modal' }} props
 */
export default function LoungeOgBadge({ isOg, size: _size = 'feed' }) {
  if (isOg !== true) return null
  const iconClass = 'h-6 w-6 shrink-0 object-contain'

  return (
    <LoungeBadgeHoverTip tip="One of the first 1,000 members" tone="amber" className="translate-y-[0.5px]">
      <span
        className="inline-flex h-6 w-6 items-center justify-center"
        role="img"
        aria-label="OG cohort: one of the first 1,000 members"
      >
        <img src={BADGE_SRC} alt="" className={iconClass} draggable={false} width={24} height={24} aria-hidden />
      </span>
    </LoungeBadgeHoverTip>
  )
}
