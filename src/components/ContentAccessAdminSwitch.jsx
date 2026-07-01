/** Admin-only Slots Edge lock toggle (calculators + guides). */
export default function ContentAccessAdminSwitch({
  locked,
  disabled = false,
  busy = false,
  onLockedChange,
  label = 'Slots Edge lock',
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={locked}
      aria-label={label}
      aria-busy={busy}
      disabled={disabled || busy}
      onClick={(event) => {
        event.stopPropagation()
        if (disabled || busy) return
        onLockedChange?.(!locked)
      }}
      className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left touch-manipulation backdrop-blur-sm [-webkit-tap-highlight-color:transparent] disabled:opacity-50 transition-colors ${
        locked
          ? 'border-amber-400/80 bg-amber-950/70 hover:bg-amber-950/90'
          : 'border-fuchsia-400/60 bg-fuchsia-950/65 hover:bg-fuchsia-950/85'
      }`}
    >
      <span className={`text-[11px] font-bold uppercase tracking-wide ${locked ? 'text-amber-300' : 'text-fuchsia-300'}`}>
        Lock
      </span>
      <span
        className={`relative h-5 w-9 rounded-full transition-colors ${
          locked ? 'bg-amber-500' : 'bg-zinc-500'
        }`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-transform ${
            locked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}
