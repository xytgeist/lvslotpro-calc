import { LOUNGE_FEED_SCOPE_ALL, LOUNGE_FEED_SCOPE_FOLLOWING } from '../../utils/loungeFeedScope'

/**
 * All vs Following filter for the Lounge home feed.
 */
export default function LoungeFeedScopeSwitch({
  scope = LOUNGE_FEED_SCOPE_ALL,
  onScopeChange,
  followingDisabled = false,
  followingDisabledTitle = 'Sign in to see posts from people you follow',
}) {
  const btnBase =
    'min-h-10 flex-1 rounded-[10px] px-3 text-[14px] font-bold touch-manipulation transition-colors [-webkit-tap-highlight-color:transparent]'
  return (
    <div
      className="flex rounded-xl border border-zinc-700/80 bg-zinc-900/80 p-0.5"
      role="group"
      aria-label="Feed filter"
    >
      <button
        type="button"
        aria-pressed={scope === LOUNGE_FEED_SCOPE_ALL}
        onClick={() => onScopeChange?.(LOUNGE_FEED_SCOPE_ALL)}
        className={`${btnBase} ${
          scope === LOUNGE_FEED_SCOPE_ALL ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        All
      </button>
      <button
        type="button"
        aria-pressed={scope === LOUNGE_FEED_SCOPE_FOLLOWING}
        disabled={followingDisabled}
        title={followingDisabled ? followingDisabledTitle : undefined}
        onClick={() => {
          if (followingDisabled) return
          onScopeChange?.(LOUNGE_FEED_SCOPE_FOLLOWING)
        }}
        className={`${btnBase} disabled:cursor-not-allowed disabled:opacity-45 ${
          scope === LOUNGE_FEED_SCOPE_FOLLOWING
            ? 'bg-violet-700 text-white shadow-sm'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        Following
      </button>
    </div>
  )
}
