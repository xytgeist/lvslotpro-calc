/** Max characters per lounge post caption / feed comment body (use thread parts for longer posts). */
export const LOUNGE_CAPTION_MAX = 500

/** Max continuation parts after the root post (root + 24 = 25 posts total). */
export const LOUNGE_POST_THREAD_MAX_PARTS = 25

/** Collapsed caption length in feed/list UI (tap …more for full text up to LOUNGE_CAPTION_MAX). */
export const LOUNGE_CAPTION_DISPLAY_MAX = 320

/** Collapsed caption line count in feed/list UI (whichever limit hits first: chars or lines). */
export const LOUNGE_CAPTION_DISPLAY_MAX_LINES = 8

/** Same cap as post captions (`feed_comments.body`). */
export const LOUNGE_COMMENT_BODY_MAX = LOUNGE_CAPTION_MAX
