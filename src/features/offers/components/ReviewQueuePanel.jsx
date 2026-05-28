export default function ReviewQueuePanel({ reviewQueue, onComplete, onSkip }) {
  if (!reviewQueue.length) return null

  const count = reviewQueue.length

  return (
    <div data-review-queue className="mb-4 overflow-hidden rounded-3xl border border-amber-400/30 bg-amber-950/25">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-amber-400/20">
        <span className="text-lg leading-none" aria-hidden>⚠️</span>
        <div className="min-w-0 flex-1">
          <div className="text-amber-100 font-bold text-sm leading-tight">
            {count === 1 ? '1 image needs review' : `${count} images need review`}
          </div>
          <div className="text-amber-200/60 text-[11px] mt-0.5">
            Complete each item to add it to your calendar
          </div>
        </div>
      </div>

      {/* Items */}
      <ul className="divide-y divide-amber-400/10">
        {reviewQueue.map((item) => {
          const up = item.offer_uploads
          const fileName = Array.isArray(up) ? up[0]?.file_name : up?.file_name
          const itemTitle = String(item?.draft?.title || '').trim()
          const itemSeq = Number(item?.draft?.ai_sequence || 0)
          const warns = (item.warnings || []).filter(Boolean)
          const label = [itemSeq > 0 ? `Item ${itemSeq}` : null, itemTitle || null].filter(Boolean).join(' · ')

          return (
            <li key={item.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                {/* File icon */}
                <div className="mt-0.5 shrink-0 h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-400/25 flex items-center justify-center text-sm">
                  📷
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="text-zinc-100 text-sm font-semibold truncate leading-tight">
                    {fileName || 'Image'}
                  </div>
                  {label && (
                    <div className="text-zinc-400 text-[11px] mt-0.5 truncate">{label}</div>
                  )}
                  {warns.length > 0 && (
                    <div className="mt-1.5 text-[11px] leading-snug text-amber-300/90">
                      {warns.join(' · ')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-2 mt-0.5">
                  <button
                    type="button"
                    onClick={() => onComplete(item)}
                    className="rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/25 text-[11px] font-bold px-3 py-1.5 touch-manipulation transition-colors"
                  >
                    Review
                  </button>
                  <button
                    type="button"
                    onClick={() => onSkip(item.id)}
                    className="text-zinc-500 hover:text-zinc-300 text-[11px] font-semibold touch-manipulation"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
