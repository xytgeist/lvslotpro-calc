import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  dismissPwaInstallBanner,
  iosPwaInstallBannerSteps,
  isPwaInstallBannerDismissed,
  isSafariBrowser,
  isStandalonePwa,
  shouldShowPwaInstallBanner,
} from '../utils/pwaNotificationPrompt.js'

function IosShareIcon({ className = 'h-[1.1em] w-[1.1em] inline-block align-[-0.15em] mx-0.5' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M12 3v10.2M12 3l3.5 3.5M12 3 8.5 6.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 14v4.5A2.5 2.5 0 0 0 7.5 21h9A2.5 2.5 0 0 0 19 18.5V14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function syncPwaInstallBannerLayout(heightPx) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (heightPx > 0) {
    root.dataset.pwaInstallBanner = '1'
    root.style.setProperty('--lv-pwa-install-banner-height', `${heightPx}px`)
  } else {
    delete root.dataset.pwaInstallBanner
    root.style.removeProperty('--lv-pwa-install-banner-height')
  }
}

/** PokerNews-style iOS Home Screen install strip — fixed top, expandable steps. */
export default function PwaInstallBanner() {
  const rootRef = useRef(null)
  const [visible, setVisible] = useState(() => shouldShowPwaInstallBanner())
  const [expanded, setExpanded] = useState(false)
  const safari = isSafariBrowser()
  const steps = iosPwaInstallBannerSteps(safari)

  useEffect(() => {
    const syncVisible = () => {
      if (isStandalonePwa() || isPwaInstallBannerDismissed()) {
        setVisible(false)
        setExpanded(false)
        syncPwaInstallBannerLayout(0)
        return
      }
      setVisible(shouldShowPwaInstallBanner())
    }
    syncVisible()
    const mq = window.matchMedia?.('(display-mode: standalone)')
    mq?.addEventListener?.('change', syncVisible)
    return () => mq?.removeEventListener?.('change', syncVisible)
  }, [])

  const applyLayoutHeight = useCallback(() => {
    const el = rootRef.current
    if (!visible || !el) {
      syncPwaInstallBannerLayout(0)
      return
    }
    syncPwaInstallBannerLayout(Math.ceil(el.getBoundingClientRect().height))
  }, [visible])

  useLayoutEffect(() => {
    if (!visible) {
      syncPwaInstallBannerLayout(0)
      return undefined
    }
    applyLayoutHeight()
    const el = rootRef.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => applyLayoutHeight())
    ro.observe(el)
    window.addEventListener('resize', applyLayoutHeight)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', applyLayoutHeight)
      syncPwaInstallBannerLayout(0)
    }
  }, [visible, expanded, applyLayoutHeight])

  const onDismiss = useCallback(() => {
    dismissPwaInstallBanner()
    setVisible(false)
    setExpanded(false)
    syncPwaInstallBannerLayout(0)
  }, [])

  if (!visible) return null

  return (
    <div
      ref={rootRef}
      data-pwa-install-banner
      className="fixed inset-x-0 top-0 z-[94] border-b border-zinc-300/80 bg-zinc-100 text-zinc-900 shadow-sm"
    >
      <div className="mx-auto flex w-full max-w-2xl items-center gap-2.5 px-2.5 pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-500 touch-manipulation hover:bg-zinc-200/80 [-webkit-tap-highlight-color:transparent]"
          aria-label="Dismiss install banner"
        >
          <span aria-hidden className="text-[22px] leading-none">
            ×
          </span>
        </button>

        <img
          src="/apple-touch-icon.png"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-[10px] shadow-sm"
          loading="lazy"
        />

        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold leading-tight text-zinc-900">Install Edge</div>
          <div className="truncate text-[12px] leading-snug text-zinc-600">
            Add to Home Screen for quick access and push alerts
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="shrink-0 rounded-lg bg-[#007aff] px-3.5 py-2 text-[13px] font-semibold text-white touch-manipulation hover:bg-[#0066d6] [-webkit-tap-highlight-color:transparent]"
          aria-expanded={expanded}
        >
          {expanded ? 'Hide steps' : 'How to add'}
        </button>
      </div>

      {expanded ? (
        <div className="mx-auto w-full max-w-2xl border-t border-zinc-300/70 px-4 py-3 pb-3.5 text-[14px] leading-relaxed text-zinc-800">
          <ol className="space-y-2">
            {steps.map((step, index) => (
              <li key={step.id} className="flex gap-2">
                <span className="w-4 shrink-0 tabular-nums text-zinc-500">{index + 1}.</span>
                <span>
                  {step.lead ? `${step.lead} ` : null}
                  {step.showShareIcon ? <IosShareIcon /> : null}
                  <span className="font-semibold text-zinc-950">{step.emphasis}</span>
                  {step.tail ? ` ${step.tail}` : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  )
}
