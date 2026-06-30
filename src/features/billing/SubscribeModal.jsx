import { useState } from 'react'
import { productDisplayName } from './edgeProducts.js'
import { openBillingPortal, startEdgeCheckout } from './stripeBillingApi.js'

const panelClass =
  'relative z-10 w-full max-w-sm max-h-[min(90dvh,calc(100dvh-2rem))] overflow-y-auto overscroll-contain rounded-3xl border border-zinc-600/80 bg-gray-900 p-6 shadow-2xl sm:p-8'

/**
 * @param {{
 *   open: boolean,
 *   productSlug: string,
 *   onClose: () => void,
 *   supabaseClient: import('@supabase/supabase-js').SupabaseClient,
 *   onCheckoutStarted?: () => void,
 *   hasBillingAccount?: boolean,
 * }} props
 */
export default function SubscribeModal({
  open,
  productSlug,
  onClose,
  supabaseClient,
  onCheckoutStarted,
  hasBillingAccount = false,
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const title = productDisplayName(productSlug)

  const handleSubscribe = async () => {
    setError('')
    setBusy(true)
    try {
      onCheckoutStarted?.()
      await startEdgeCheckout(supabaseClient, productSlug)
    } catch (e) {
      setBusy(false)
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const handlePortal = async () => {
    setError('')
    setBusy(true)
    try {
      await openBillingPortal(supabaseClient)
    } catch (e) {
      setBusy(false)
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/70 [-webkit-tap-highlight-color:transparent]"
        aria-label="Close subscribe dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscribe-modal-title"
        className={panelClass}
        data-subscribe-modal
      >
        <button
          type="button"
          onClick={onClose}
          className="mb-4 text-sm text-zinc-400 hover:text-zinc-200 touch-manipulation"
        >
          ← Not now
        </button>
        <h2 id="subscribe-modal-title" className="text-2xl font-bold text-white">
          Unlock {title}
        </h2>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Subscribe to {title} for full access to locked calculators, AP guides, bankroll tools, and calendar OCR.
          Lounge stays free.
        </p>
        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSubscribe()}
          className="mt-6 w-full min-h-12 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 font-bold text-white touch-manipulation"
        >
          {busy ? 'Redirecting…' : `Subscribe to ${title}`}
        </button>
        {hasBillingAccount ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handlePortal()}
            className="mt-3 w-full min-h-11 rounded-2xl border border-zinc-700 text-zinc-200 text-sm font-semibold touch-manipulation"
          >
            Manage billing
          </button>
        ) : null}
      </div>
    </div>
  )
}
