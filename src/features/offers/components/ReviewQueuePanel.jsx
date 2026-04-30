export default function ReviewQueuePanel({ reviewQueue, onComplete, onSkip }) {
  if (!reviewQueue.length) return null

  return (
    <div className="mb-4 rounded-3xl border border-amber-500/35 bg-amber-950/35 p-4">
      <div className="text-amber-100 font-semibold text-sm">Needs your input ({reviewQueue.length})</div>
      <p className="mt-1 text-amber-100/80 text-xs leading-relaxed">
        Partial OCR results — complete the form for each image, or skip. Successful images from the same batch can already be on
        your calendar.
      </p>
      <ul className="mt-3 space-y-2">
        {reviewQueue.map((item) => {
          const up = item.offer_uploads
          const fileName = Array.isArray(up) ? up[0]?.file_name : up?.file_name
          const itemTitle = String(item?.draft?.title || '').trim()
          const itemSeq = Number(item?.draft?.ai_sequence || 0)
          const warns = (item.warnings || []).filter(Boolean)
          return (
            <li key={item.id} className="rounded-2xl bg-zinc-900/90 px-3 py-2.5 border border-zinc-700/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="min-w-0 text-sm font-medium text-zinc-100 truncate">{fileName || 'Image'}</div>
                  {(itemTitle || itemSeq > 0) && (
                    <div className="text-[11px] text-zinc-400 truncate">
                      {itemSeq > 0 ? `Item ${itemSeq}` : 'Item'}
                      {itemTitle ? ` - ${itemTitle}` : ''}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onComplete(item)}
                    className="text-cyan-300 hover:text-cyan-200 text-xs font-semibold touch-manipulation"
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => onSkip(item.id)}
                    className="text-zinc-400 hover:text-zinc-300 text-xs font-semibold touch-manipulation"
                  >
                    Skip
                  </button>
                </div>
              </div>
              {warns.length > 0 && <div className="mt-1 text-[11px] leading-snug text-amber-200/85">{warns.join(' · ')}</div>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
