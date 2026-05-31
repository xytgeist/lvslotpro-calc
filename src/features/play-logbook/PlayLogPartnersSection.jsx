import { useMemo, useState } from 'react'
import PlayLogPartnerPickerModal from './PlayLogPartnerPickerModal.jsx'
import {
  formatPlayLogPartnerOutcomeShare,
  playLogPartnersEnsureCreatorRow,
  playLogPartnersHasExtraPartner,
  playLogPartnerLabel,
  playLogPartnerOutcomeShareToneClass,
  playLogPartnerOutcomeShareUsdRounded,
  playLogPartnersEnsureManager,
  playLogPartnersPercentSum,
  playLogPartnersWithManager,
} from './playLogPartners.js'

/**
 * @param {{
 *   supabaseClient: import('@supabase/supabase-js').SupabaseClient,
 *   userId: string,
 *   ownerUserId?: string,
 *   viewerProfile?: { handle?: string, display_name?: string } | null,
 *   partners: import('./playLogPartners.js').PlayLogPartnerRow[],
 *   onPartnersChange: (rows: import('./playLogPartners.js').PlayLogPartnerRow[]) => void,
 *   readOnly?: boolean,
 *   canEditManager?: boolean,
 *   canEditPaid?: boolean,
 *   netOutcome?: number | null,
 *   onPaidPersist?: (rows: import('./playLogPartners.js').PlayLogPartnerRow[]) => void | Promise<void>,
 *   onPaidPersistError?: (error: unknown) => void,
 * }} props
 */
export default function PlayLogPartnersSection({
  supabaseClient,
  userId,
  ownerUserId = userId,
  viewerProfile,
  partners,
  onPartnersChange,
  readOnly = false,
  canEditManager = true,
  canEditPaid = false,
  netOutcome = null,
  onPaidPersist = null,
  onPaidPersistError = null,
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [paidSaving, setPaidSaving] = useState(false)

  const hasExtraPartner = useMemo(
    () => playLogPartnersHasExtraPartner(partners, ownerUserId),
    [partners, ownerUserId],
  )
  const displayPartners = useMemo(() => {
    if (readOnly || hasExtraPartner) return partners
    return []
  }, [partners, readOnly, hasExtraPartner])

  const percentSum = useMemo(() => playLogPartnersPercentSum(partners), [partners])
  const sumOk = Math.abs(percentSum - 100) < 0.02
  const showPaidColumn =
    canEditPaid || partners.some(p => !p.isManager && p.paid)

  const usedUserIds = useMemo(
    () => new Set(partners.filter(p => p.kind === 'user').map(p => String(p.userId))),
    [partners],
  )

  const updateRow = (key, patch) => {
    onPartnersChange(partners.map(row => (row.key === key ? { ...row, ...patch } : row)))
  }

  const setManager = key => {
    onPartnersChange(playLogPartnersWithManager(partners, key))
  }

  const togglePaid = async (key, nextPaid) => {
    const prior = partners
    const next = prior.map(row => (row.key === key ? { ...row, paid: nextPaid } : row))
    onPartnersChange(next)
    if (!onPaidPersist) return
    setPaidSaving(true)
    try {
      await onPaidPersist(next)
    } catch (e) {
      onPartnersChange(prior)
      onPaidPersistError?.(e)
    } finally {
      setPaidSaving(false)
    }
  }

  const removeRow = key => {
    let next = partners.filter(row => row.key !== key)
    if (!playLogPartnersHasExtraPartner(next, ownerUserId)) {
      onPartnersChange([])
      return
    }
    if (!next.some(r => r.isManager)) {
      next = playLogPartnersEnsureManager(next, ownerUserId)
    }
    onPartnersChange(next)
  }

  const commitPartnersFromPicker = ({ profiles = [], guestLabels = [] }) => {
    let next = playLogPartnersEnsureCreatorRow(partners, ownerUserId, userId, viewerProfile)
    const seen = new Set(usedUserIds)
    let changed = next.length !== partners.length

    for (const profile of profiles) {
      const uid = String(profile?.user_id || '').trim()
      if (!uid || seen.has(uid)) continue
      seen.add(uid)
      changed = true
      next.push({
        key: `user:${uid}`,
        kind: 'user',
        userId: uid,
        handle: profile?.handle || '',
        displayName: profile?.display_name || '',
        avatarUrl: profile?.avatar_url || '',
        sharePercent: '',
        isManager: false,
        paid: false,
      })
    }

    for (const rawLabel of guestLabels) {
      const label = String(rawLabel || '').trim()
      if (!label) continue
      changed = true
      next.push({
        key: `guest:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'guest',
        guestLabel: label,
        sharePercent: '',
        isManager: false,
        paid: false,
      })
    }

    if (changed) onPartnersChange(next)
    setPickerOpen(false)
  }

  const partnerName = row => (
    <>
      {row.kind === 'guest' ? (
        row.guestLabel
      ) : (
        playLogPartnerLabel({ display_name: row.displayName, handle: row.handle })
      )}
      {row.kind === 'user' && String(row.userId) === String(userId) ? (
        <span className="text-zinc-500"> (you)</span>
      ) : row.kind === 'user' && String(row.userId) === String(ownerUserId) ? (
        <span className="text-zinc-500"> (owner)</span>
      ) : null}
      {row.isManager ? (
        <span className="ml-1 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
          Manager
        </span>
      ) : null}
    </>
  )

  const canRemoveRow = row => {
    if (row.kind === 'user' && String(row.userId) === String(ownerUserId)) {
      return hasExtraPartner
    }
    return true
  }

  const partnerMetricsHeader = (
    <div className="flex items-center gap-2 mb-1">
      {!readOnly && canEditManager ? <span className="w-4 shrink-0" aria-hidden /> : null}
      <span className="min-w-0 flex-1" aria-hidden />
      <div className="flex shrink-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        <span className="w-12 text-right">Share</span>
        <span className="min-w-[4.75rem] text-right">Amount</span>
        {showPaidColumn ? <span className="w-6 text-center">Paid</span> : null}
      </div>
      {!readOnly ? <span className="w-4 shrink-0" aria-hidden /> : null}
    </div>
  )

  const partnerList = (
    <>
      {partnerMetricsHeader}
      <ul className="space-y-2 mb-3">
        {displayPartners.map(row => (
          <li key={row.key} className="flex items-center gap-2">
            {!readOnly && canEditManager ? (
              <input
                type="radio"
                name="play-log-manager"
                checked={Boolean(row.isManager)}
                onChange={() => setManager(row.key)}
                className="h-4 w-4 shrink-0 accent-cyan-500"
                aria-label={`Manager: ${row.kind === 'guest' ? row.guestLabel : playLogPartnerLabel(row)}`}
              />
            ) : null}
            <div className="min-w-0 flex-1 text-sm text-zinc-200 truncate">{partnerName(row)}</div>
            <div className="flex shrink-0 items-center gap-2">
              {readOnly ? (
                <span className="flex h-4 w-12 items-center justify-end text-cyan-300 text-xs font-semibold tabular-nums leading-none">
                  {row.sharePercent}%
                </span>
              ) : (
                <input
                  type="text"
                  inputMode="decimal"
                  value={row.sharePercent}
                  onChange={e => updateRow(row.key, { sharePercent: e.target.value })}
                  placeholder="0"
                  className="w-12 min-h-8 rounded-lg bg-zinc-900 px-1 text-right text-sm text-white font-semibold tabular-nums outline-none focus:ring-2 focus:ring-cyan-500/40"
                  aria-label="Share percent"
                />
              )}
              <div
                className={`flex min-w-[4.75rem] items-center justify-end ${readOnly ? 'h-4' : 'min-h-8'}`}
              >
                <PartnerShareAmount netOutcome={netOutcome} sharePercent={row.sharePercent} />
              </div>
              {showPaidColumn ? (
                <div
                  className={`flex w-6 items-center justify-center ${readOnly ? 'h-4' : 'min-h-8'}`}
                >
                  {!row.isManager ? (
                    <PaidCheckbox
                      checked={Boolean(row.paid)}
                      disabled={!canEditPaid || paidSaving}
                      onChange={next => void togglePaid(row.key, next)}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
            {!readOnly && canRemoveRow(row) ? (
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                className="shrink-0 text-zinc-500 text-xs font-semibold px-1 touch-manipulation active:text-red-400"
                aria-label="Remove partner"
              >
                ×
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  )

  if (readOnly) {
    return (
      <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700/50 p-3">
        <div className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-2">Partners</div>
        {partnerList}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700/50 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">Partners</div>
        {hasExtraPartner ? (
          <span
            className={`text-xs font-semibold tabular-nums ${sumOk ? 'text-emerald-400' : 'text-amber-400'}`}
          >
            Total: {percentSum.toFixed(1)}%
          </span>
        ) : null}
      </div>

      {hasExtraPartner && canEditManager ? (
        <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wide mb-1.5">
          Tap a partner to set manager
        </p>
      ) : null}

      {displayPartners.length > 0 ? partnerList : null}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="w-full min-h-11 rounded-xl bg-zinc-900 border border-zinc-700/60 px-3 py-2 text-sm font-semibold text-cyan-300 touch-manipulation active:bg-zinc-800 mb-2"
      >
        + Add partner
      </button>

      <PlayLogPartnerPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        supabaseClient={supabaseClient}
        userId={userId}
        usedUserIds={usedUserIds}
        onConfirm={commitPartnersFromPicker}
      />

      <p className="text-zinc-500 text-xs leading-snug mt-1">
        {hasExtraPartner ? (
          <>
            The <span className="text-amber-300/90">owner</span> is the manager by default (change the radio if someone
            else tracks paid; manager is not marked paid). Registered partners get this play in their logbook and a
            Lounge alert. Guests are attribution only.
          </>
        ) : (
          <>Tap Add partner to search your network or type a name to add a guest. Your row appears once you add someone.</>
        )}
      </p>
    </div>
  )
}

/** @param {{ checked: boolean, disabled?: boolean, onChange: (next: boolean) => void }} props */
function PaidCheckbox({ checked, disabled = false, onChange }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={e => onChange(e.target.checked)}
      aria-label="Paid"
      className="block h-3.5 w-3.5 shrink-0 rounded border-zinc-600 bg-zinc-900 accent-cyan-500 disabled:opacity-40"
    />
  )
}

/** @param {{ netOutcome: number | null, sharePercent: string }} props */
function PartnerShareAmount({ netOutcome, sharePercent }) {
  const usd = playLogPartnerOutcomeShareUsdRounded(netOutcome, sharePercent)
  const label = formatPlayLogPartnerOutcomeShare(netOutcome, sharePercent)
  if (!label) {
    return <span className="text-zinc-600 text-xs font-semibold tabular-nums">—</span>
  }
  return (
    <span
      className={`text-xs font-bold tabular-nums whitespace-nowrap ${playLogPartnerOutcomeShareToneClass(usd)}`}
      title="Share of session net win/loss"
    >
      {label}
    </span>
  )
}
