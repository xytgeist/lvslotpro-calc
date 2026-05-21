import LoungeFlameIcon from './LoungeFlameIcon.jsx'
import { loungeActivityNotificationBadgeKind } from '../../utils/loungeActivityApi.js'

const COMMENT_BUBBLE_D =
  'M4.75 5.75h10.5a1.5 1.5 0 011.5 1.5v5a1.5 1.5 0 01-1.5 1.5H9l-3.25 2v-2H4.75a1.5 1.5 0 01-1.5-1.5v-5a1.5 1.5 0 011.5-1.5z'

const BOOKMARK_RIBBON_D = 'M6.5 4.75h7a1 1 0 011 1v9.5L10 12.75 5.5 15.25v-9.5a1 1 0 011-1z'

const REPOST_ARROWS_D =
  'M6 6h8l-1.75-1.75M14 14H6l1.75 1.75M14 6l2 2-2 2M6 14l-2-2 2-2'

function BadgeShell({ children, className = '' }) {
  return (
    <span
      className={`pointer-events-none absolute -right-0.5 -top-0.5 z-[1] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-zinc-950 ring-2 ring-zinc-950 ${className}`}
      aria-hidden
    >
      {children}
    </span>
  )
}

function BadgeComment() {
  return (
    <BadgeShell>
      <svg className="h-[13px] w-[13px] text-zinc-200" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d={COMMENT_BUBBLE_D}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </BadgeShell>
  )
}

function BadgeReply() {
  return (
    <BadgeShell>
      <svg className="h-[13px] w-[13px] text-cyan-300" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M6.5 11.5L4 14v-3.25A4.25 4.25 0 014.75 6.5h10.5a4.25 4.25 0 014.25 4.25v.5"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.5 11.5H4.5l2.25-2.25"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </BadgeShell>
  )
}

function BadgeMention() {
  return (
    <BadgeShell>
      <span className="text-[12px] font-bold leading-none text-orange-400">@</span>
    </BadgeShell>
  )
}

function BadgeFollow() {
  return (
    <BadgeShell>
      <svg className="h-[13px] w-[13px] text-cyan-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <circle cx="10" cy="7.25" r="2.75" />
        <path d="M5.25 15.5v-.75c0-2.07 1.68-3.75 3.75-3.75h1.5c2.07 0 3.75 1.68 3.75 3.75v.75H5.25z" />
      </svg>
    </BadgeShell>
  )
}

function BadgeLike() {
  return (
    <BadgeShell>
      <LoungeFlameIcon className="h-[14px] w-[14px] text-zinc-300" liked readOnly={false} />
    </BadgeShell>
  )
}

function BadgeRepost() {
  return (
    <BadgeShell>
      <svg className="h-[13px] w-[13px] text-emerald-400" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d={REPOST_ARROWS_D}
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </BadgeShell>
  )
}

/** Quote repost — white note with writing lines + cyan repost arrows (no pencil). */
function BadgeQuoteRepost() {
  return (
    <BadgeShell>
      <svg className="h-[14px] w-[14px]" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="5.25" y="3.75" width="9.5" height="12.5" rx="1.25" fill="#fafafa" />
        <path d="M7.25 6.75h5.5M7.25 9h5.5M7.25 11.25h3.75" stroke="#a1a1aa" strokeWidth="0.85" strokeLinecap="round" />
        <path
          d="M11.5 13.5h3.25l-.85-.85M14.75 13.5l-1.35 1.35M14.75 13.5l-1.35-1.35"
          stroke="#22d3ee"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </BadgeShell>
  )
}

function BadgeBookmark() {
  return (
    <BadgeShell>
      <svg className="h-[13px] w-[13px] text-lv-yellow" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d={BOOKMARK_RIBBON_D} fill="currentColor" />
      </svg>
    </BadgeShell>
  )
}

const BADGE_BY_KIND = {
  comment: BadgeComment,
  reply: BadgeReply,
  mention: BadgeMention,
  follow: BadgeFollow,
  like: BadgeLike,
  repost: BadgeRepost,
  quote_repost: BadgeQuoteRepost,
  bookmark: BadgeBookmark,
}

/**
 * Small interaction glyph on the avatar corner for notification rows.
 * @param {{ eventType?: string, kind?: string|null }} props
 */
export default function LoungeNotificationActionBadge({ eventType, kind: kindProp }) {
  const kind = kindProp ?? loungeActivityNotificationBadgeKind(eventType)
  const Badge = kind ? BADGE_BY_KIND[kind] : null
  if (!Badge) return null
  return <Badge />
}
