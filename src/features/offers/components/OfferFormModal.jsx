import { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import {
  dateFromDatetimeLocalValue,
  datetimeLocalValueFromDate,
  defaultAlertPresetForAllDay,
  OFFER_ALERT_DAY_9AM,
  OFFER_ALERT_HOUR_BEFORE,
  OFFER_ALERT_NONE
} from '../utils'

function FieldGroup({ children }) {
  return <div className="overflow-visible rounded-3xl border border-zinc-600/80 bg-zinc-900/95 shadow-[0_14px_30px_rgba(0,0,0,0.45)]">{children}</div>
}

function GroupRow({ children, divider = true }) {
  return (
    <>
      <div className="px-4">{children}</div>
      {divider ? <div className="mx-4 h-px bg-zinc-700/75" /> : null}
    </>
  )
}

const selectIos =
  'min-w-0 flex-1 cursor-pointer appearance-none bg-transparent py-3 pr-10 text-[15px] text-zinc-100 outline-none focus:outline-none [&>option]:bg-zinc-900 [&>option]:text-zinc-100'

const inputFlush =
  'w-full bg-transparent px-4 py-1.5 text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500 focus:outline-none'

export default function OfferFormModal({
  showForm,
  editingId,
  closeForm,
  completingReviewItemId,
  fileInputRef,
  handleImportPhotos,
  uploading,
  reviewSourceImageLoading,
  reviewSourceImageUrl,
  draft,
  setDraft,
  setPropagateCasinoOnSave,
  setShowCasinoSuggestions,
  showCasinoSuggestions,
  filteredCasinoOptions,
  setPropagateTitleOnSave,
  setShowTitleSuggestions,
  showTitleSuggestions,
  filteredTitleOptions,
  allDay,
  setAllDay,
  startSelected,
  endSelected,
  endMinTime,
  endMaxTime,
  saveEvent,
  saving,
  notice,
  propagateCasinoOnSave,
  setPropagateCasinoOnSaveChecked,
  propagateTitleOnSave,
  setPropagateTitleOnSaveChecked,
  propagateValueOnSave,
  setPropagateValueOnSaveChecked,
  skipCurrentReviewFromForm,
  casinoFieldRef,
  titleFieldRef
}) {
  if (!showForm) return null
  const canSave = !!(draft.casinoName?.trim() && draft.title?.trim() && draft.startAt)
  const hasTitleSuggestions = filteredTitleOptions.length > 0
  const hasCasinoSuggestions = filteredCasinoOptions.length > 0
  const [valueFocused, setValueFocused] = useState(false)
  const [activeCalendar, setActiveCalendar] = useState(null) // 'start' | 'end' | null
  const [activeTime, setActiveTime] = useState(null) // 'start' | 'end' | null

  const valueRaw = String(draft.valueAmount ?? '')
  const valueFormatted = useMemo(() => {
    const cleaned = valueRaw.replace(/[^0-9.]/g, '')
    if (!cleaned) return ''
    const num = Number(cleaned)
    if (!Number.isFinite(num)) return ''
    const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
    return `$${fmt.format(num)}`
  }, [valueRaw])

  // Keep Ends populated whenever Starts exists.
  useEffect(() => {
    if (!draft.startAt || draft.endAt) return
    const startDt = dateFromDatetimeLocalValue(draft.startAt)
    if (!startDt) return
    const defaultEnd = allDay
      ? new Date(startDt.getFullYear(), startDt.getMonth(), startDt.getDate(), 0, 0, 0, 0)
      : new Date(startDt.getTime() + 60 * 60 * 1000)
    const nextEnd = datetimeLocalValueFromDate(defaultEnd)
    setDraft((cur) => {
      if (!cur.startAt || cur.endAt) return cur
      return { ...cur, endAt: nextEnd }
    })
  }, [allDay, draft.endAt, draft.startAt, setDraft])

  const formatPillValue = (dt) => {
    if (!dt) return ''
    if (allDay) {
      return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    }
    const datePart = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    const timePart = dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    return `${datePart} ${timePart}`
  }

  const formatDateOnly = (dt) => (dt ? dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '')
  const formatTimeOnly = (dt) => (dt ? dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '')

  const applyTimeToField = (field, hour12, minute, period) => {
    const source = field === 'start' ? startSelected : endSelected
    if (!source) return
    let hour24 = hour12 % 12
    if (period === 'PM') hour24 += 12
    const next = new Date(source)
    next.setHours(hour24, minute, 0, 0)
    const nextVal = datetimeLocalValueFromDate(next)
    if (field === 'start') {
      setDraft((cur) => {
        const curEnd = dateFromDatetimeLocalValue(cur.endAt)
        const nextEnd = curEnd && curEnd.getTime() > next.getTime() ? cur.endAt : datetimeLocalValueFromDate(new Date(next.getTime() + 60 * 60 * 1000))
        return { ...cur, startAt: nextVal, endAt: nextEnd }
      })
    } else {
      setDraft((cur) => ({ ...cur, endAt: nextVal }))
    }
  }

  const renderTimePicker = (field) => {
    const dt = field === 'start' ? startSelected : endSelected
    if (!dt || allDay || activeTime !== field) return null
    const hour24 = dt.getHours()
    const selectedPeriod = hour24 >= 12 ? 'PM' : 'AM'
    const selectedHour = hour24 % 12 || 12
    const selectedMinute = dt.getMinutes()
    const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5)
    return (
      <>
        <div className="mx-4 h-px bg-zinc-700/75" />
        <div className="px-4 py-2">
          <div className="relative rounded-2xl bg-zinc-900/90 px-3 py-2">
            <div className="pointer-events-none absolute left-3 right-3 top-1/2 h-9 -translate-y-1/2 rounded-full bg-zinc-700/55" />
            <div className="grid grid-cols-3 gap-2">
              <div className="max-h-40 overflow-y-auto no-scrollbar">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => applyTimeToField(field, h, selectedMinute, selectedPeriod)}
                    className={`block w-full py-1 text-center text-2xl ${h === selectedHour ? 'text-zinc-100' : 'text-zinc-500'}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
              <div className="max-h-40 overflow-y-auto no-scrollbar">
                {minuteOptions.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => applyTimeToField(field, selectedHour, m, selectedPeriod)}
                    className={`block w-full py-1 text-center text-2xl ${m === selectedMinute ? 'text-zinc-100' : 'text-zinc-500'}`}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                ))}
              </div>
              <div>
                {(['AM', 'PM']).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => applyTimeToField(field, selectedHour, selectedMinute, p)}
                    className={`block w-full py-3 text-center text-2xl ${p === selectedPeriod ? 'text-zinc-100' : 'text-zinc-500'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const InlineCalendar = activeCalendar ? (
    <>
      <div className="mx-4 h-px bg-zinc-700/75" />
      <div className="px-4 py-2">
        <DatePicker
          inline
          selected={activeCalendar === 'start' ? startSelected : endSelected}
          onChange={(d) => {
            if (!d) return
            if (activeCalendar === 'start') {
              setDraft((cur) => {
                const nextStart = datetimeLocalValueFromDate(d)
                const curEnd = dateFromDatetimeLocalValue(cur.endAt)
                if (!allDay) {
                  const nextEndDt = new Date(d.getTime() + 60 * 60 * 1000)
                  const nextEndValue = datetimeLocalValueFromDate(nextEndDt)
                  const shouldBumpEnd = !curEnd || curEnd.getTime() <= d.getTime()
                  return { ...cur, startAt: nextStart, endAt: shouldBumpEnd ? nextEndValue : cur.endAt }
                }
                const shouldResetEnd = !curEnd || curEnd.getTime() < d.getTime()
                return { ...cur, startAt: nextStart, endAt: shouldResetEnd ? nextStart : cur.endAt }
              })
            } else {
              setDraft((cur) => ({ ...cur, endAt: datetimeLocalValueFromDate(d) }))
            }
            setActiveCalendar(null)
            setActiveTime(null)
          }}
          showTimeSelect={false}
          dateFormat="MMM d, yyyy"
          minDate={activeCalendar === 'end' ? startSelected || undefined : undefined}
          calendarClassName="offer-datepicker offer-datepicker-inline"
          renderCustomHeader={({ date, decreaseMonth, increaseMonth }) => (
            <div className="flex items-center justify-between pb-2 pt-1">
              <div className="text-zinc-100 font-semibold">
                {date.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={decreaseMonth} className="text-red-400 text-lg font-semibold px-2 -mr-1">
                  ‹
                </button>
                <button type="button" onClick={increaseMonth} className="text-red-400 text-lg font-semibold px-2 -mr-2">
                  ›
                </button>
              </div>
            </div>
          )}
          formatWeekDay={(dayName) => String(dayName || '').toUpperCase().slice(0, 3)}
        />
      </div>
    </>
  ) : null

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-zinc-950/92 px-3 py-6 backdrop-blur-[4px] sm:py-8">
      <div className="mx-auto flex max-w-lg flex-col px-3">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={closeForm}
            aria-label="Close event form"
            className="grid h-12 w-12 place-items-center rounded-full border border-zinc-600 bg-zinc-800/90 text-2xl leading-none text-zinc-300 touch-manipulation"
          >
            ×
          </button>
          <button
            type="button"
            onClick={saveEvent}
            disabled={!canSave || saving}
            aria-label={editingId ? 'Update event' : 'Save event'}
            className={`grid h-12 w-12 place-items-center rounded-full border text-2xl leading-none touch-manipulation transition-colors ${
              canSave && !saving
                ? 'border-emerald-400/70 bg-emerald-500 text-white'
                : 'border-zinc-600 bg-zinc-800/90 text-zinc-500'
            }`}
          >
            {saving ? '…' : '✓'}
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {!completingReviewItemId && !editingId && (
            <div className="rounded-3xl border border-zinc-600/80 bg-zinc-900/95 p-3 shadow-[0_14px_30px_rgba(0,0,0,0.45)]">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-11 touch-manipulation text-left text-[15px] font-medium text-cyan-400 hover:text-cyan-300 disabled:opacity-55"
              >
                {uploading ? 'Uploading…' : "Import from photo(s): We'll auto-magically create events from your casino mailers. 🤖"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void handleImportPhotos(e)}
              />
            </div>
          )}

          {completingReviewItemId && (
            <div className="rounded-3xl border border-amber-700/45 bg-amber-950/25 p-2.5">
              <div className="text-[15px] font-medium text-amber-100">Source mailer image</div>
              {reviewSourceImageLoading ? (
                <div className="mt-2 text-[15px] text-amber-200/85">Loading…</div>
              ) : reviewSourceImageUrl ? (
                <a href={reviewSourceImageUrl} target="_blank" rel="noreferrer" className="-mx-3 mt-2 block px-3" title="Open full image">
                  <img src={reviewSourceImageUrl} alt="" className="max-h-56 w-full rounded-lg object-contain" />
                </a>
              ) : (
                <div className="mt-2 text-[15px] text-amber-200/85">Preview unavailable · you can still edit below.</div>
              )}
            </div>
          )}

          {/* Title + Casino */}
          <FieldGroup>
            <GroupRow>
              <div ref={titleFieldRef} className="relative">
                <input
                  aria-label="Title"
                  value={draft.title}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, title: e.target.value }))
                    if (completingReviewItemId && !editingId) setPropagateTitleOnSave(true)
                    setShowTitleSuggestions(hasTitleSuggestions)
                  }}
                  onFocus={() => setShowTitleSuggestions(hasTitleSuggestions)}
                  onBlur={() => setTimeout(() => setShowTitleSuggestions(false), 120)}
                  className="w-full bg-transparent py-1.5 pr-10 text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500 focus:outline-none"
                  placeholder="Title"
                  autoComplete="off"
                />
                {hasTitleSuggestions ? (
                  <button
                    type="button"
                    aria-label="Title suggestions"
                    tabIndex={-1}
                    onMouseDown={(ev) => ev.preventDefault()}
                    onClick={() => setShowTitleSuggestions((v) => !v)}
                    className="pointer-events-auto absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-zinc-500"
                  >
                    ▾
                  </button>
                ) : null}
                {showTitleSuggestions && hasTitleSuggestions && (
                  <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-44 overflow-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
                    {filteredTitleOptions.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onMouseDown={(ev) => ev.preventDefault()}
                        onClick={() => {
                          setDraft((d) => ({ ...d, title: t }))
                          if (completingReviewItemId && !editingId) setPropagateTitleOnSave(true)
                          setShowTitleSuggestions(false)
                        }}
                        className="w-full px-4 py-2.5 text-left text-[15px] text-zinc-200 hover:bg-zinc-800"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </GroupRow>
            <GroupRow divider={false}>
              <div ref={casinoFieldRef} className="relative">
                <input
                  aria-label="Casino"
                  value={draft.casinoName}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, casinoName: e.target.value }))
                    if (completingReviewItemId && !editingId) setPropagateCasinoOnSave(true)
                    setShowCasinoSuggestions(hasCasinoSuggestions)
                  }}
                  onFocus={() => setShowCasinoSuggestions(hasCasinoSuggestions)}
                  onBlur={() => setTimeout(() => setShowCasinoSuggestions(false), 120)}
                  className="w-full bg-transparent py-1.5 pr-10 text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500 focus:outline-none"
                  placeholder="Casino"
                  autoComplete="off"
                />
                {hasCasinoSuggestions ? (
                  <button
                    type="button"
                    aria-label="Casino suggestions"
                    onMouseDown={(ev) => ev.preventDefault()}
                    onClick={() => setShowCasinoSuggestions((v) => !v)}
                    className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-zinc-500"
                  >
                    ▾
                  </button>
                ) : null}
                {showCasinoSuggestions && hasCasinoSuggestions && (
                  <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-44 overflow-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
                    {filteredCasinoOptions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onMouseDown={(ev) => ev.preventDefault()}
                        onClick={() => {
                          setDraft((d) => ({ ...d, casinoName: name }))
                          if (completingReviewItemId && !editingId) setPropagateCasinoOnSave(true)
                          setShowCasinoSuggestions(false)
                        }}
                        className="w-full px-4 py-2.5 text-left text-[15px] text-zinc-200 hover:bg-zinc-800"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </GroupRow>
          </FieldGroup>

          {/* Type + Amount */}
          <FieldGroup>
            <GroupRow>
              <div className="relative min-h-[2.25rem]">
              <select
                aria-label="Offer type"
                value={draft.offerType}
                onChange={(e) => setDraft((d) => ({ ...d, offerType: e.target.value }))}
                className="w-full cursor-pointer appearance-none bg-transparent py-2 pr-10 text-left text-[15px] text-zinc-100 outline-none focus:outline-none [&>option]:bg-zinc-900 [&>option]:text-zinc-100"
              >
                <option value="free_play">Free play</option>
                <option value="hotel">Hotel stay</option>
                <option value="dining">Dining credit</option>
                <option value="gift">Gift day</option>
                <option value="multiplier">Tier multiplier</option>
                <option value="tournament">Tournament</option>
                <option value="drawing">Drawing</option>
                <option value="other">Other</option>
              </select>
              <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 text-lg leading-none text-zinc-400 -translate-y-1/2">
                ›
              </span>
              </div>
            </GroupRow>
            <GroupRow divider={false}>
              <input
                aria-label="Promo value in dollars"
                type="text"
                inputMode="decimal"
                value={valueFocused ? valueRaw : valueFormatted}
                onChange={(e) => {
                  const next = String(e.target.value || '').replace(/[^0-9.]/g, '')
                  const parts = next.split('.')
                  const normalized = parts.length <= 1 ? next : `${parts[0]}.${parts.slice(1).join('')}`
                  setDraft((d) => ({ ...d, valueAmount: normalized }))
                  if (completingReviewItemId && !editingId) setPropagateValueOnSaveChecked(true)
                }}
                onFocus={() => setValueFocused(true)}
                onBlur={() => setValueFocused(false)}
                className="w-full bg-transparent py-1.5 text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500 focus:outline-none"
                placeholder="$ Value"
              />
            </GroupRow>
          </FieldGroup>

          {/* All-day · Starts · Ends · Alert */}
          <FieldGroup>
            <GroupRow>
              <div className="flex h-11 items-center justify-between gap-4">
              <span className="text-[15px] text-zinc-100">All-day</span>
              <label className="relative inline-flex cursor-pointer items-center shrink-0">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => {
                    const v = e.target.checked
                    setAllDay(v)
                    const nextPreset = defaultAlertPresetForAllDay(v)
                    setDraft((cur) => {
                      if (!cur.startAt) return { ...cur, alertPreset: nextPreset }
                      if (v) {
                        const dt = dateFromDatetimeLocalValue(cur.startAt)
                        if (!dt) return { ...cur, alertPreset: nextPreset }
                        const midnight = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0)
                        const curEnd = dateFromDatetimeLocalValue(cur.endAt)
                        const endMidnight = curEnd
                          ? new Date(curEnd.getFullYear(), curEnd.getMonth(), curEnd.getDate(), 0, 0, 0, 0)
                          : midnight
                        return {
                          ...cur,
                          alertPreset: nextPreset,
                          startAt: datetimeLocalValueFromDate(midnight),
                          endAt: datetimeLocalValueFromDate(endMidnight)
                        }
                      }
                    // Switching from all-day -> timed:
                    // Default Starts to the next closest hour from *now*, and Ends to +1 hour.
                    const base = dateFromDatetimeLocalValue(cur.startAt)
                    if (!base) return { ...cur, alertPreset: nextPreset }
                    const now = new Date()
                    const trunc = new Date(now)
                    trunc.setMinutes(0, 0, 0)
                    const nextHour = new Date(trunc)
                    if (now.getTime() > trunc.getTime()) nextHour.setHours(nextHour.getHours() + 1)
                    const isLate = now.getHours() >= 23
                    const nextStart = isLate
                      ? new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1, 0, 0, 0, 0)
                      : new Date(base.getFullYear(), base.getMonth(), base.getDate(), nextHour.getHours(), 0, 0, 0)
                    const nextEnd = new Date(nextStart.getTime() + 60 * 60 * 1000)
                    return {
                      ...cur,
                      alertPreset: nextPreset,
                      startAt: datetimeLocalValueFromDate(nextStart),
                      endAt: datetimeLocalValueFromDate(nextEnd)
                    }
                    })
                  }}
                  className="peer sr-only"
                />
                <span className="relative block h-[26px] w-[58px] rounded-[999px] bg-zinc-600 transition-colors after:absolute after:left-[2px] after:top-[2px] after:block after:h-[22px] after:w-[36px] after:rounded-[999px] after:bg-white after:shadow after:transition-transform peer-checked:bg-[#34C759] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-violet-500 peer-checked:after:translate-x-[18px]" />
              </label>
              </div>
            </GroupRow>
            <GroupRow>
            <div className="flex h-11 items-center gap-4">
              <span className="w-[74px] shrink-0 pt-0.5 text-[15px] text-zinc-100">Starts</span>
              <button
                type="button"
                onClick={() => {
                  setActiveTime(null)
                  setActiveCalendar((v) => (v === 'start' ? null : 'start'))
                }}
                className="min-w-0 flex-1 flex justify-end"
                aria-label="Pick start date"
              >
                {!allDay ? (
                  <span className="inline-flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full bg-zinc-700/70 px-3 py-1 ${activeCalendar === 'start' ? 'text-red-400' : 'text-zinc-50'}`}>
                      {formatDateOnly(startSelected)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveCalendar(null)
                        setActiveTime((v) => (v === 'start' ? null : 'start'))
                      }}
                      className={`inline-flex items-center rounded-full bg-zinc-700/70 px-3 py-1 ${activeTime === 'start' ? 'text-red-400' : 'text-zinc-50'}`}
                    >
                      {formatTimeOnly(startSelected)}
                    </button>
                  </span>
                ) : (
                  <span className={`inline-flex items-center rounded-full bg-zinc-700/70 px-3 py-1 ${activeCalendar === 'start' ? 'text-red-400' : 'text-zinc-50'}`}>
                    {formatDateOnly(startSelected)}
                  </span>
                )}
              </button>
            </div>
            </GroupRow>
            {activeCalendar === 'start' ? InlineCalendar : null}
            {renderTimePicker('start')}
            <GroupRow>
            <div className="flex h-11 items-center gap-4">
              <span className="w-[74px] shrink-0 pt-0.5 text-[15px] text-zinc-100">Ends</span>
              <button
                type="button"
                onClick={() => {
                  setActiveTime(null)
                  setActiveCalendar((v) => (v === 'end' ? null : 'end'))
                }}
                className="min-w-0 flex-1 flex justify-end"
                aria-label="Pick end date"
              >
                {!allDay ? (
                  <span className="inline-flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full bg-zinc-700/70 px-3 py-1 ${activeCalendar === 'end' ? 'text-red-400' : 'text-zinc-50'}`}>
                      {formatDateOnly(endSelected)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveCalendar(null)
                        setActiveTime((v) => (v === 'end' ? null : 'end'))
                      }}
                      className={`inline-flex items-center rounded-full bg-zinc-700/70 px-3 py-1 ${activeTime === 'end' ? 'text-red-400' : 'text-zinc-50'}`}
                    >
                      {formatTimeOnly(endSelected)}
                    </button>
                  </span>
                ) : (
                  <span className={`inline-flex items-center rounded-full bg-zinc-700/70 px-3 py-1 ${activeCalendar === 'end' ? 'text-red-400' : 'text-zinc-50'}`}>
                    {formatDateOnly(endSelected)}
                  </span>
                )}
              </button>
            </div>
            </GroupRow>
            {activeCalendar === 'end' ? InlineCalendar : null}
            {renderTimePicker('end')}

            <GroupRow divider={false}>
            <div className="flex h-11 items-center gap-4">
              <span className="w-[74px] shrink-0 pt-0.5 text-[15px] text-zinc-100">Alert</span>
              <div className="relative min-w-0 flex-1">
                <select
                  aria-label="Notification alert"
                  value={draft.alertPreset || OFFER_ALERT_DAY_9AM}
                  onChange={(e) => setDraft((d) => ({ ...d, alertPreset: e.target.value }))}
                  className={`${selectIos} h-11 py-0 text-zinc-100`}
                >
                  <option value={OFFER_ALERT_NONE}>None</option>
                  {allDay ? (
                    <option value={OFFER_ALERT_DAY_9AM}>On day of event (9 AM)</option>
                  ) : (
                    <option value={OFFER_ALERT_HOUR_BEFORE}>1 hour before</option>
                  )}
                </select>
                <span aria-hidden className="pointer-events-none absolute right-0 top-1/2 text-zinc-400 -translate-y-1/2 text-lg leading-none">
                  ›
                </span>
              </div>
            </div>
            </GroupRow>
          </FieldGroup>

          {/* Notes */}
          <FieldGroup>
            <textarea
              aria-label="Notes"
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              className="min-h-[4rem] w-full resize-y bg-transparent px-4 py-1.5 text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500 focus:outline-none"
              placeholder="Notes"
              rows={4}
            />
          </FieldGroup>

          {completingReviewItemId && !editingId && notice && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-[15px] text-emerald-100">{notice}</div>
          )}

          {completingReviewItemId && !editingId && (
            <div className="rounded-xl border border-zinc-700 bg-zinc-900/90 px-4 py-3">
              <div className="mb-3 text-[15px] text-zinc-500">Apply to matching open drafts · same offer type only</div>
              <label className="flex items-center gap-3 text-[15px] text-zinc-200">
                <input
                  type="checkbox"
                  checked={propagateCasinoOnSave}
                  onChange={(e) => setPropagateCasinoOnSaveChecked(e.target.checked)}
                  className="h-5 w-5 accent-violet-500"
                />
                Casino name
              </label>
              <label className="mt-3 flex items-center gap-3 text-[15px] text-zinc-200">
                <input
                  type="checkbox"
                  checked={propagateTitleOnSave}
                  onChange={(e) => setPropagateTitleOnSaveChecked(e.target.checked)}
                  className="h-5 w-5 accent-violet-500"
                />
                Title
              </label>
              <label className="mt-3 flex items-center gap-3 text-[15px] text-zinc-200">
                <input
                  type="checkbox"
                  checked={propagateValueOnSave}
                  onChange={(e) => setPropagateValueOnSaveChecked(e.target.checked)}
                  className="h-5 w-5 accent-violet-500"
                />
                Amount
              </label>
            </div>
          )}

          {completingReviewItemId && !editingId && (
            <button
              type="button"
              onClick={() => void skipCurrentReviewFromForm()}
              disabled={saving}
              className="min-h-[3rem] w-full touch-manipulation rounded-xl border border-zinc-600 bg-zinc-900 py-3 text-[15px] font-medium text-red-400/95 hover:bg-zinc-800 disabled:opacity-55"
            >
              Remove this draft
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
