import { useEffect, useMemo, useRef, useState } from 'react'
import { emptyOfferDraft, localDateKeyFromDate, localDateKeyFromIso, shuffledCopy } from '../utils'

export default function useOffersCalendarState() {
  const fileInputRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const casinoFieldRef = useRef(null)
  const titleFieldRef = useRef(null)
  const importSyncRunningRef = useRef(false)

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingTick, setUploadingTick] = useState(0)
  const [uploadingMessageOrder, setUploadingMessageOrder] = useState([])
  const [syncingImportResults, setSyncingImportResults] = useState(false)
  const [activeImportBatchId, setActiveImportBatchId] = useState(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem('offers_active_import_batch_id')
  })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reviewQueue, setReviewQueue] = useState([])
  const [completingReviewItemId, setCompletingReviewItemId] = useState(null)
  const [completingReviewUploadId, setCompletingReviewUploadId] = useState(null)
  const [propagateCasinoOnSave, setPropagateCasinoOnSave] = useState(false)
  const [propagateTitleOnSave, setPropagateTitleOnSave] = useState(false)
  const [propagateValueOnSave, setPropagateValueOnSave] = useState(false)
  const [reviewSourceImagePath, setReviewSourceImagePath] = useState(null)
  const [reviewSourceImageUrl, setReviewSourceImageUrl] = useState('')
  const [reviewSourceImageLoading, setReviewSourceImageLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedDays, setSelectedDays] = useState([])
  const [cursorMonth, setCursorMonth] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const [draft, setDraft] = useState(() => emptyOfferDraft())
  const [allDay, setAllDay] = useState(true)
  const [showCasinoSuggestions, setShowCasinoSuggestions] = useState(false)
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false)
  const [expandedEventId, setExpandedEventId] = useState(null)
  const notesPreviewRefs = useRef({})
  const [notesOverflowById, setNotesOverflowById] = useState({})
  /** 'auto' = week in landscape, month in portrait; 'month' | 'week' | 'agenda' = forced */
  const [calendarMode, setCalendarMode] = useState('auto')
  const [weekDetailEvent, setWeekDetailEvent] = useState(null)
  const [showWeekPortraitHint, setShowWeekPortraitHint] = useState(false)
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const viewMenuRef = useRef(null)
  const [isLandscape, setIsLandscape] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(orientation: landscape)').matches : false
  )
  const [weekAnchor, setWeekAnchor] = useState(() => new Date())

  const uploadSpinnerMessages = useMemo(
    () => [
      'Doing funky stuff... one sec.',
      'Teaching robots to read casino mailers...',
      'Summoning OCR goblins...',
      'Sorting winners from weird blurry photos...',
      'Almost there, polishing your events...',
      'WTF is that image quality...',
      'Please no more dick pics...',
      'Translating casino hieroglyphics...',
      'OCR is squinting aggressively...',
      'Convincing AI this is not a tournament...',
      'Unblurring the blur. Sort of.',
      'Cooking events with extra chaos...',
      'Stealing dates from tiny print...',
      'Checking if this is free play or free pain...',
      'Shaking snacks out of these pixels...',
      'Bribing the parser with virtual coffee...',
      'Reading mailers so you do not have to...',
      'Almost done. Nobody panic.'
    ],
    []
  )

  const uploadMessageIndex = Math.min(uploadingTick, Math.max(0, uploadingMessageOrder.length - 1))
  const uploadBaseMessage = uploadingMessageOrder[uploadMessageIndex] || uploadSpinnerMessages[0]
  const atLastUploadMessage = uploadingMessageOrder.length > 0 && uploadMessageIndex === uploadingMessageOrder.length - 1
  const uploadEllipsis = atLastUploadMessage ? '.'.repeat((uploadingTick % 3) + 1) : ''
  const uploadSpinnerMessage = `${uploadBaseMessage}${uploadEllipsis}`

  useEffect(() => {
    if (!uploading) {
      setUploadingTick(0)
      setUploadingMessageOrder([])
      return undefined
    }
    const order = shuffledCopy(uploadSpinnerMessages)
    setUploadingMessageOrder(order)
    setUploadingTick(0)
    const id = window.setInterval(() => {
      setUploadingTick((n) => n + 1)
    }, 1600)
    return () => window.clearInterval(id)
  }, [uploading, uploadSpinnerMessages])

  const offerTypeMeta = useMemo(
    () => ({
      free_play: { label: 'Free play', dot: 'bg-violet-400', chip: 'bg-violet-500/15 text-violet-200 border-violet-500/40', card: 'bg-violet-500/18' },
      hotel: { label: 'Hotel stay', dot: 'bg-sky-400', chip: 'bg-sky-500/15 text-sky-200 border-sky-500/40', card: 'bg-sky-500/16' },
      dining: { label: 'Dining credit', dot: 'bg-emerald-400', chip: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40', card: 'bg-emerald-500/16' },
      gift: { label: 'Gift day', dot: 'bg-amber-400', chip: 'bg-amber-500/15 text-amber-200 border-amber-500/40', card: 'bg-amber-500/16' },
      multiplier: { label: 'Tier multiplier', dot: 'bg-fuchsia-400', chip: 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/40', card: 'bg-fuchsia-500/16' },
      tournament: { label: 'Tournament', dot: 'bg-rose-400', chip: 'bg-rose-500/15 text-rose-200 border-rose-500/40', card: 'bg-rose-500/16' },
      drawing: { label: 'Drawing', dot: 'bg-cyan-400', chip: 'bg-cyan-500/15 text-cyan-200 border-cyan-500/40', card: 'bg-cyan-500/16' },
      other: { label: 'Other', dot: 'bg-zinc-400', chip: 'bg-zinc-500/15 text-zinc-200 border-zinc-500/40', card: 'bg-zinc-700/45' }
    }),
    []
  )

  const dayBuckets = useMemo(() => {
    const map = {}
    for (const ev of events) {
      const key = localDateKeyFromIso(ev.start_at)
      if (!map[key]) map[key] = []
      map[key].push(ev)
    }
    return map
  }, [events])

  const dayTypeDots = useMemo(() => {
    const map = {}
    for (const [dayKey, dayEvents] of Object.entries(dayBuckets)) {
      const seen = new Set(dayEvents.map((ev) => ev.offer_type || 'other'))
      map[dayKey] = Array.from(seen).slice(0, 4)
    }
    return map
  }, [dayBuckets])

  const calendarCells = useMemo(() => {
    const y = cursorMonth.getFullYear()
    const month = cursorMonth.getMonth()
    const first = new Date(y, month, 1)
    const lastDay = new Date(y, month + 1, 0).getDate()
    const startDow = first.getDay()
    const cells = []
    for (let i = 0; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= lastDay; d++) cells.push(new Date(y, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [cursorMonth])

  const monthTitle = cursorMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const todayKey = localDateKeyFromDate(new Date())

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (activeImportBatchId) {
      window.localStorage.setItem('offers_active_import_batch_id', activeImportBatchId)
    } else {
      window.localStorage.removeItem('offers_active_import_batch_id')
    }
  }, [activeImportBatchId])

  return {
    fileInputRef,
    longPressTimerRef,
    casinoFieldRef,
    titleFieldRef,
    importSyncRunningRef,
    events,
    setEvents,
    loading,
    setLoading,
    saving,
    setSaving,
    uploading,
    setUploading,
    syncingImportResults,
    setSyncingImportResults,
    activeImportBatchId,
    setActiveImportBatchId,
    error,
    setError,
    notice,
    setNotice,
    reviewQueue,
    setReviewQueue,
    completingReviewItemId,
    setCompletingReviewItemId,
    completingReviewUploadId,
    setCompletingReviewUploadId,
    propagateCasinoOnSave,
    setPropagateCasinoOnSave,
    propagateTitleOnSave,
    setPropagateTitleOnSave,
    propagateValueOnSave,
    setPropagateValueOnSave,
    reviewSourceImagePath,
    setReviewSourceImagePath,
    reviewSourceImageUrl,
    setReviewSourceImageUrl,
    reviewSourceImageLoading,
    setReviewSourceImageLoading,
    showForm,
    setShowForm,
    editingId,
    setEditingId,
    selectedDays,
    setSelectedDays,
    cursorMonth,
    setCursorMonth,
    draft,
    setDraft,
    allDay,
    setAllDay,
    showCasinoSuggestions,
    setShowCasinoSuggestions,
    showTitleSuggestions,
    setShowTitleSuggestions,
    expandedEventId,
    setExpandedEventId,
    notesPreviewRefs,
    notesOverflowById,
    setNotesOverflowById,
    calendarMode,
    setCalendarMode,
    weekDetailEvent,
    setWeekDetailEvent,
    showWeekPortraitHint,
    setShowWeekPortraitHint,
    viewMenuOpen,
    setViewMenuOpen,
    viewMenuRef,
    isLandscape,
    setIsLandscape,
    weekAnchor,
    setWeekAnchor,
    offerTypeMeta,
    dayBuckets,
    dayTypeDots,
    calendarCells,
    monthTitle,
    todayKey,
    uploadSpinnerMessage
  }
}
