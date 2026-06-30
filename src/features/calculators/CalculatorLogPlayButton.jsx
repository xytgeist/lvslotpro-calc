import { stashPlayLogPrefill } from '../../utils/playLogPrefill.js'
import { playLogCalcSnapshotNotes } from '../../utils/playLogCalcSnapshot.js'

/** Shared with Guides card row - warm amber, distinct from Ask community (cyan). */
export const LOG_PLAY_LOGBOOK_BTN_CLASS = 'bg-amber-700 hover:bg-amber-600 active:bg-amber-800'

/**
 * Opens Play Logbook with fields pre-filled from the active calculator session.
 *
 * @param {object} props
 * @param {string} props.calculatorSlug - matches `play_log_game_templates.calculator_slug`
 * @param {Record<string, number | string>} props.prefillValues - metric slug → value
 * @param {() => void} props.onOpenLogbook
 * @param {string} [props.accentBtnClass]
 */
export default function CalculatorLogPlayButton({
  calculatorSlug,
  prefillValues = {},
  onOpenLogbook,
  accentBtnClass = LOG_PLAY_LOGBOOK_BTN_CLASS,
}) {
  if (!onOpenLogbook) return null

  return (
    <div className="mb-6">
      <button
        type="button"
        data-log-play-logbook-btn
        onClick={() => {
          stashPlayLogPrefill({
            calculatorSlug,
            values: prefillValues,
            notes: playLogCalcSnapshotNotes(prefillValues),
          })
          onOpenLogbook()
        }}
        className={`w-full min-h-12 rounded-2xl px-4 text-sm font-bold text-white touch-manipulation active:opacity-90 ${accentBtnClass}`}
      >
        Log play in Logbook
      </button>
      <p className="mt-2 text-center text-xs text-zinc-500">
        Pre-fills game fields, Current EV, Average Case, and acquisition fee from this calculator.
      </p>
    </div>
  )
}
