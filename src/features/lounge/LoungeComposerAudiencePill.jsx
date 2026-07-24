import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import {
  LOUNGE_COMPOSER_AUDIENCE_ALL,
  LOUNGE_COMPOSER_AUDIENCE_SUBS,
} from '../../utils/loungeFanOnlyPost.js'

const OPTIONS = [
  {
    id: LOUNGE_COMPOSER_AUDIENCE_ALL,
    label: 'Everyone',
    hint: 'Full post on the Lounge feed',
  },
  {
    id: LOUNGE_COMPOSER_AUDIENCE_SUBS,
    label: 'Subscribers',
    hint: 'Fans see everything; others see a teaser',
  },
]

/**
 * X-style audience pill for monetized creators (Everyone vs Subscribers).
 *
 * @param {{
 *   value: typeof LOUNGE_COMPOSER_AUDIENCE_ALL | typeof LOUNGE_COMPOSER_AUDIENCE_SUBS,
 *   onChange: (next: typeof LOUNGE_COMPOSER_AUDIENCE_ALL | typeof LOUNGE_COMPOSER_AUDIENCE_SUBS) => void,
 *   disabled?: boolean,
 *   className?: string,
 * }} props
 */
export default function LoungeComposerAudiencePill({ value, onChange, disabled = false, className = '' }) {
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const selected =
    value === LOUNGE_COMPOSER_AUDIENCE_SUBS ? LOUNGE_COMPOSER_AUDIENCE_SUBS : LOUNGE_COMPOSER_AUDIENCE_ALL
  const selectedOption = OPTIONS.find((o) => o.id === selected) ?? OPTIONS[0]

  useEffect(() => {
    if (!open) return undefined
    const onDocPointerDown = (e) => {
      if (rootRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`.trim()} data-lounge-composer-audience-pill="">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Post audience: ${selectedOption.label}`}
        onClick={() => setOpen((v) => !v)}
        className="lounge-composer-audience-pill-btn inline-flex touch-manipulation items-center gap-0.5 rounded-full border border-zinc-600/90 bg-transparent px-2.5 py-0.5 text-[13px] font-bold leading-none text-sky-400 hover:bg-zinc-800/50 disabled:cursor-not-allowed disabled:opacity-45 [-webkit-tap-highlight-color:transparent]"
      >
        <span>{selectedOption.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2.5}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label="Who can see this post"
          className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-[15.5rem] overflow-hidden rounded-xl border border-zinc-700/90 bg-zinc-950/98 py-1 shadow-xl backdrop-blur-md"
          data-lounge-composer-audience-menu
        >
          {OPTIONS.map((opt) => {
            const on = opt.id === selected
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={on}
                data-lounge-composer-audience-option={opt.id}
                className={`flex w-full touch-manipulation items-start gap-2 px-3 py-2.5 text-left hover:bg-zinc-800/80 [-webkit-tap-highlight-color:transparent] ${
                  opt.id === LOUNGE_COMPOSER_AUDIENCE_SUBS ? 'data-[subs=true]:hover:bg-cyan-950/50' : ''
                }`}
                data-subs={opt.id === LOUNGE_COMPOSER_AUDIENCE_SUBS ? 'true' : undefined}
                onClick={() => {
                  onChange(opt.id)
                  setOpen(false)
                }}
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                  {on ? <Check className="h-3.5 w-3.5 text-sky-400" strokeWidth={2.5} aria-hidden /> : null}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-[14px] font-semibold leading-snug ${
                      opt.id === LOUNGE_COMPOSER_AUDIENCE_SUBS ? 'text-cyan-100' : 'text-white'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span
                    className={`mt-0.5 block text-[12px] leading-snug ${
                      opt.id === LOUNGE_COMPOSER_AUDIENCE_SUBS ? 'text-cyan-200/75' : 'text-zinc-400'
                    }`}
                  >
                    {opt.hint}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
