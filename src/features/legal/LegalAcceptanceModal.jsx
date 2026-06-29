import { btnPrimary } from '../shell/shellClasses'
import { LEGAL_POLICY_VERSION } from './legalPolicyVersion.js'

export default function LegalAcceptanceModal({
  busy = false,
  error = '',
  onAccept,
}) {
  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="absolute inset-0 bg-black/80" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-acceptance-title"
        className="relative z-10 w-full max-w-sm rounded-3xl border border-zinc-600/80 bg-gray-900 p-6 shadow-2xl sm:p-8"
        data-auth-modal
      >
        <h2 id="legal-acceptance-title" className="text-xl font-bold text-white text-center">
          Updated policies
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300 text-center">
          Please review and accept our{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">
            Terms &amp; Conditions
          </a>{' '}
          and{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">
            Privacy Policy
          </a>{' '}
          (version {LEGAL_POLICY_VERSION}) to continue using Edge.
        </p>
        {error ? (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-xl text-red-300 text-sm text-center leading-relaxed" role="alert">
            {error}
          </div>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={onAccept}
          className={`${btnPrimary} mt-6 w-full bg-orange-600 hover:bg-orange-500 rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {busy ? 'Saving…' : 'I agree'}
        </button>
      </div>
    </div>
  )
}
