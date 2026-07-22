import {
  LOUNGE_COMPOSER_AUDIENCE_ALL,
  LOUNGE_COMPOSER_AUDIENCE_SUBS,
} from '../../utils/loungeFanOnlyPost.js'

/**
 * @param {{ value: 'all' | 'subs', onChange: (v: 'all' | 'subs') => void, disabled?: boolean }} props
 */
export default function LoungeComposerAudienceToggle({ value, onChange, disabled = false }) {
  const current = value === LOUNGE_COMPOSER_AUDIENCE_SUBS ? LOUNGE_COMPOSER_AUDIENCE_SUBS : LOUNGE_COMPOSER_AUDIENCE_ALL

  const btnClass = (active) =>
    [
      'min-h-8 rounded-md px-2.5 text-[12px] font-semibold touch-manipulation transition-colors',
      active
        ? 'bg-fuchsia-600/90 text-white'
        : 'text-zinc-400 hover:text-zinc-200',
      disabled ? 'pointer-events-none opacity-50' : '',
    ].join(' ')

  return (
    <div
      className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-zinc-700/80 bg-zinc-900/60 p-0.5"
      role="group"
      aria-label="Post audience"
    >
      <button
        type="button"
        disabled={disabled}
        className={btnClass(current === LOUNGE_COMPOSER_AUDIENCE_ALL)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(LOUNGE_COMPOSER_AUDIENCE_ALL)}
      >
        All
      </button>
      <button
        type="button"
        disabled={disabled}
        className={btnClass(current === LOUNGE_COMPOSER_AUDIENCE_SUBS)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(LOUNGE_COMPOSER_AUDIENCE_SUBS)}
      >
        Subs
      </button>
    </div>
  )
}
