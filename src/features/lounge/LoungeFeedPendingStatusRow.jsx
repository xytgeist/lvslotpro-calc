/** Unobtrusive inline spinner + label (feed edit/delete, detail delete, comment delete). */
export default function LoungeFeedPendingStatusRow({ children, className = 'mb-1' }) {
  return (
    <div
      className={`${className} flex items-center gap-1.5 text-[12px] leading-snug text-zinc-500`}
      role="status"
      aria-live="polite"
    >
      <span
        className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-zinc-600 border-t-cyan-400"
        aria-hidden
      />
      {children}
    </div>
  )
}
