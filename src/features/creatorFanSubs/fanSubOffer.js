/** @typedef {import('./creatorFanSubsApi.js').CreatorFanOffer} CreatorFanOffer */

export const CREATOR_FAN_OFFER_LIMITS = {
  headline: 120,
  intro: 800,
  privatePosts: 2000,
  fanChat: 2000,
}

export const CREATOR_FAN_OFFER_MIN_DETAIL = 20

/** @param {CreatorFanOffer | null | undefined} offer */
export function isCreatorFanOfferComplete(offer) {
  if (!offer || typeof offer !== 'object') return false
  if (offer.offer_complete === true) return true
  const intro = String(offer.offer_intro || '').trim()
  const posts = String(offer.offer_private_posts || '').trim()
  const chat = String(offer.offer_fan_chat || '').trim()
  return (
    intro.length >= CREATOR_FAN_OFFER_MIN_DETAIL &&
    (posts.length >= CREATOR_FAN_OFFER_MIN_DETAIL || chat.length >= CREATOR_FAN_OFFER_MIN_DETAIL)
  )
}

/** @param {CreatorFanOffer | null | undefined} offer @param {string} handle */
export function creatorFanOfferHeadline(offer, handle) {
  const custom = String(offer?.offer_headline || '').trim()
  if (custom) return custom
  const h = String(handle || offer?.handle || '').trim()
  return h ? `Support @${h.replace(/^@/, '')}` : 'Fan subscription'
}
