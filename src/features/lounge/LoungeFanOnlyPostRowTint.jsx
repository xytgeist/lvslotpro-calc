import { LOUNGE_FAN_ONLY_POST_TINT_RAIL_CLASS } from './loungeFeedAvatar.js'

/** Left-edge fade on feed/profile rows for unlocked subs-only posts (cyan dark / blue light in index.css). */
export default function LoungeFanOnlyPostRowTint() {
  return (
    <span
      aria-hidden
      data-lounge-fan-only-row-tint
      className={LOUNGE_FAN_ONLY_POST_TINT_RAIL_CLASS}
    />
  )
}
