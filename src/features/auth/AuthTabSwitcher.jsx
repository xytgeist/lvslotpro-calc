/** Segmented control: Join Edge | Sign in */
export default function AuthTabSwitcher({ value, onChange }) {
  const tabClass = (active) =>
    `min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold touch-manipulation transition-colors ${
      active
        ? 'bg-orange-600 text-white shadow-sm'
        : 'text-zinc-400 hover:text-zinc-200'
    }`

  return (
    <div
      className="mb-4 flex rounded-2xl bg-zinc-800/90 p-1"
      role="tablist"
      aria-label="Join or sign in"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'join'}
        className={tabClass(value === 'join')}
        onClick={() => onChange('join')}
      >
        Join Edge
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'signin'}
        className={tabClass(value === 'signin')}
        onClick={() => onChange('signin')}
      >
        Sign in
      </button>
    </div>
  )
}
