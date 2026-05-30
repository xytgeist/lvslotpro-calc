/**
 * App-wide stacking (low → high). Keep Lounge viewport dock below modal/sheet layers.
 *
 * Lounge detail/profile/lightbox use their own 97–111 band inside feed chrome.
 * Dock menu click-shield uses z-200 *inside* the dock layer (still capped by this root).
 */

/** Draggable cyan menu FAB + wheel (SocialFeed viewport dock). */
export const Z_LOUNGE_DOCK_VIEWPORT = 48

/** Default floor for full-screen app sheets/dialogs (bankroll, logbook, offers, lounge prompts). */
export const Z_APP_MODAL = 120
