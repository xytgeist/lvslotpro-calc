/** Feed / comment / detail post row avatar (+20% vs former h-10 / 2.75rem). No top margin — cap-align with meta row. */
export const LOUNGE_FEED_AVATAR_CLASS =
  'h-12 w-12 shrink-0 overflow-hidden rounded-full border border-zinc-700 bg-zinc-900 font-bold text-zinc-200 text-[18px] sm:h-[3.3rem] sm:w-[3.3rem] sm:text-[19px]'

/** Nudge meta line up to cap-align with avatar top (name, badges, handle, menu). */
export const LOUNGE_FEED_META_ROW_CAP_ALIGN_CLASS = '-translate-y-0.5'

/** Display name + badges + handle row; top-align with avatar (not items-center). */
export const LOUNGE_FEED_META_ROW_CLASS = `flex min-w-0 flex-nowrap items-start justify-start gap-x-1.5 text-[15px] leading-none ${LOUNGE_FEED_META_ROW_CAP_ALIGN_CLASS}`

export const LOUNGE_FEED_POST_ROW_MENU_ANCHOR_CLASS = `absolute right-0 top-0 z-10 ${LOUNGE_FEED_META_ROW_CAP_ALIGN_CLASS}`

export const LOUNGE_FEED_COMMENT_ROW_MENU_CLASS = `shrink-0 self-start ${LOUNGE_FEED_META_ROW_CAP_ALIGN_CLASS}`

export const LOUNGE_FEED_DISPLAY_NAME_CLASS =
  'min-w-0 truncate font-semibold text-[17px] leading-none text-zinc-100'

/** Post detail — matches detail caption (`text-[18px]`). */
export const LOUNGE_FEED_DISPLAY_NAME_DETAIL_CLASS =
  'min-w-0 truncate font-semibold text-[18px] leading-none text-zinc-100'

/** Display name + in-cluster badge(s): gap-x-1 (staff crown or OG-only). */
export function loungeFeedAuthorIdentityClusterClass(hasStaffBadge, showOgBadge) {
  const gap =
    hasStaffBadge || (showOgBadge && !hasStaffBadge) ? 'gap-x-1' : 'gap-x-0.5'
  return `inline-flex min-w-0 max-w-full flex-nowrap items-start ${gap}`
}

export function loungeFeedAuthorHasStaffBadge(role) {
  const r = String(role ?? '')
    .trim()
    .toLowerCase()
  return r === 'admin' || r === 'moderator'
}

/** Staff / OG icons — slight lift vs display name on the meta row. */
export const LOUNGE_FEED_META_BADGE_WRAP_CLASS = 'shrink-0 -translate-y-px'

/** OG after staff icons on the meta row (pulls toward shield; meta row still gap-x-1.5). */
export const LOUNGE_FEED_OG_AFTER_STAFF_CLASS = 'shrink-0 -ml-0.5 -translate-y-px'

/** Handle · time on the meta row — slight drop vs name/badges. */
export const LOUNGE_FEED_META_HANDLE_TIME_CLASS =
  'inline-flex min-w-0 max-w-[min(11rem,52vw)] shrink-[3] items-center gap-x-1 overflow-hidden text-zinc-500 translate-y-px sm:max-w-[13rem]'

/** Post detail OP — stacked header (name + badges, then handle · time). */
export const LOUNGE_FEED_POST_DETAIL_AUTHOR_BLOCK_CLASS =
  'flex min-w-0 flex-col items-start leading-none translate-y-1'

export const LOUNGE_FEED_POST_DETAIL_NAME_BADGE_ROW_CLASS =
  'flex min-w-0 max-w-full flex-wrap items-start gap-x-1.5'

export const LOUNGE_FEED_POST_DETAIL_HANDLE_TIME_CLASS =
  'mt-1 -translate-y-px inline-flex min-w-0 max-w-full items-center gap-x-1 overflow-hidden text-[18px] leading-none text-zinc-500'

/** Space between meta row and caption — tight; slight lift vs handle row. */
export const LOUNGE_FEED_CAPTION_TOP_CLASS = 'mt-0 -translate-y-px'

/** Media directly under a caption, or first block when there is no caption. */
export const LOUNGE_FEED_MEDIA_AFTER_CAPTION_TOP_CLASS = 'mt-1'
export const LOUNGE_FEED_MEDIA_ONLY_TOP_CLASS = 'mt-0.5'

/** Indents detail-thread body to align with column beside avatar (scaled with avatar). */
export const LOUNGE_COMMENT_DETAIL_THREAD_PAD = 'pl-[3.3rem] sm:pl-[3.9rem]'
