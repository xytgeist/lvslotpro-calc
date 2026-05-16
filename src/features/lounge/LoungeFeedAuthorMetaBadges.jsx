import LoungeStaffRoleBadge from './LoungeStaffRoleBadge.jsx'
import LoungeOgBadge from './LoungeOgBadge.jsx'
import {
  loungeFeedAuthorHasStaffBadge,
  loungeFeedAuthorIdentityClusterClass,
  LOUNGE_FEED_META_BADGE_WRAP_CLASS,
  LOUNGE_FEED_OG_AFTER_STAFF_CLASS,
} from './loungeFeedAvatar.js'

/**
 * Display name + staff/OG badges — same cluster, wrap nudges, and `feed` icon sizes as
 * `LoungePostArticle` meta row (not `size="detail"` / embed sizing).
 */
export default function LoungeFeedAuthorMetaBadges({
  role,
  isOg = false,
  displayName,
  displayNameClassName,
}) {
  const hasStaffBadge = loungeFeedAuthorHasStaffBadge(role)
  const showOgBadge = isOg === true

  return (
    <>
      <span className={loungeFeedAuthorIdentityClusterClass(hasStaffBadge, showOgBadge)}>
        <span className={displayNameClassName}>{displayName}</span>
        {hasStaffBadge ? (
          <span className={LOUNGE_FEED_META_BADGE_WRAP_CLASS}>
            <LoungeStaffRoleBadge role={role} />
          </span>
        ) : showOgBadge ? (
          <span className={LOUNGE_FEED_META_BADGE_WRAP_CLASS}>
            <LoungeOgBadge isOg />
          </span>
        ) : null}
      </span>
      {hasStaffBadge && showOgBadge ? (
        <span className={LOUNGE_FEED_OG_AFTER_STAFF_CLASS}>
          <LoungeOgBadge isOg />
        </span>
      ) : null}
    </>
  )
}
