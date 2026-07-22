import {
  LOUNGE_COMPOSER_AUDIENCE_ALL,
  LOUNGE_COMPOSER_AUDIENCE_SUBS,
} from '../../utils/loungeFanOnlyPost.js'

/**
 * Minimal chooser when a monetized creator posts — pick Everyone vs Subscribers only.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onSelect: (audience: typeof LOUNGE_COMPOSER_AUDIENCE_ALL | typeof LOUNGE_COMPOSER_AUDIENCE_SUBS) => void,
 * }} props
 */
export default function LoungeComposerAudienceSheet({ open, onClose, onSelect }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 backdrop-blur-[2px] sm:items-center sm:pb-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lounge-composer-audience-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default touch-manipulation bg-transparent"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-zinc-700/85 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-md">
        <h2 id="lounge-composer-audience-title" className="text-[17px] font-bold text-white">
          Who should see this?
        </h2>
        <p className="mt-1.5 text-[14px] leading-snug text-zinc-400">
          Choose before your post goes live. Subscribers-only posts show a teaser to everyone else.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            className="min-h-12 w-full rounded-xl border border-zinc-600 bg-zinc-900/80 px-4 text-left touch-manipulation hover:bg-zinc-800"
            onClick={() => onSelect(LOUNGE_COMPOSER_AUDIENCE_ALL)}
          >
            <span className="block text-[15px] font-semibold text-white">Everyone</span>
            <span className="mt-0.5 block text-[13px] text-zinc-400">Full post on the Lounge feed</span>
          </button>
          <button
            type="button"
            className="min-h-12 w-full rounded-xl border border-fuchsia-700/60 bg-fuchsia-950/40 px-4 text-left touch-manipulation hover:bg-fuchsia-950/60"
            onClick={() => onSelect(LOUNGE_COMPOSER_AUDIENCE_SUBS)}
          >
            <span className="block text-[15px] font-semibold text-fuchsia-100">Subscribers only</span>
            <span className="mt-0.5 block text-[13px] text-fuchsia-200/70">
              Fans see everything; others see a teaser
            </span>
          </button>
          <button
            type="button"
            className="min-h-11 w-full rounded-xl px-4 text-[15px] font-semibold text-zinc-400 hover:text-zinc-200 touch-manipulation"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
