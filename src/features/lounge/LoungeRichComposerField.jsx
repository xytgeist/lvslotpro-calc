import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { LOUNGE_CAPTION_MAX } from '../../utils/loungeCommentLimits.js'
import { normalizeCashtagsInCaption } from '../../utils/loungeMarketCaptionParse.js'
import { LOUNGE_RICH_COMPOSER_VARIANTS } from './loungeRichComposerVariants.js'

/**
 * Plain-text Lounge caption field (native textarea for reliable mobile Enter/newlines).
 * Value contract is plain text. @mention autocomplete uses selectionStart on the textarea.
 */
const LoungeRichComposerField = forwardRef(function LoungeRichComposerField(
  {
    value = '',
    onChange,
    maxLength = LOUNGE_CAPTION_MAX,
    variant = 'feed',
    className = '',
    ariaLabel = 'Lounge post caption',
    placeholder = '',
    id,
    onKeyDown,
    onKeyUp,
    onMouseUp,
    onBlur,
    onFocus,
    onInput,
    disabled = false,
    autoGrow = false,
    enterInsertsNewline = true,
  },
  ref,
) {
  const rootRef = useRef(null)
  const lastValueRef = useRef(value)
  const composingRef = useRef(false)
  const pendingSelectionRef = useRef(/** @type {number | null} */ (null))
  const onInputRef = useRef(onInput)
  onInputRef.current = onInput
  const preset = LOUNGE_RICH_COMPOSER_VARIANTS[variant] || LOUNGE_RICH_COMPOSER_VARIANTS.feed

  useImperativeHandle(ref, () => rootRef.current, [])

  const notifyComposerInput = useCallback((el, text, caret, { sync = false } = {}) => {
    const payload = { target: el, text, caret }
    if (sync) onInputRef.current?.(payload)
    requestAnimationFrame(() => {
      onInputRef.current?.(payload)
    })
  }, [])

  const emitValue = useCallback(
    (el, text, caret, { syncNotify = true } = {}) => {
      let next = normalizeCashtagsInCaption(String(text ?? ''))
      if (maxLength != null && next.length > maxLength) {
        next = next.slice(0, maxLength)
      }
      const nextCaret =
        maxLength != null ? Math.min(caret, next.length) : caret
      lastValueRef.current = next
      if (syncNotify) notifyComposerInput(el, next, nextCaret, { sync: true })
      if (next !== value) onChange?.(next)
      return { next, nextCaret }
    },
    [maxLength, notifyComposerInput, onChange, value],
  )

  useLayoutEffect(() => {
    lastValueRef.current = value
    const el = rootRef.current
    if (!el || pendingSelectionRef.current == null) return
    const pos = pendingSelectionRef.current
    pendingSelectionRef.current = null
    try {
      el.setSelectionRange(pos, pos)
    } catch {
      // ignore
    }
  }, [value])

  useLayoutEffect(() => {
    if (!autoGrow) return
    const el = rootRef.current
    if (!el) return
    try {
      el.style.height = 'auto'
      const max = Math.round(Math.min(window.innerHeight * 0.42, 352))
      const lineFloor = 38
      el.style.height = `${Math.min(Math.max(el.scrollHeight, lineFloor), max)}px`
      el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden'
    } catch {
      // ignore
    }
  }, [autoGrow, value])

  const handleChange = useCallback(
    (e) => {
      if (composingRef.current) return
      const caret = e.target.selectionStart ?? e.target.value.length
      emitValue(e.target, e.target.value, caret)
    },
    [emitValue],
  )

  const handleSelect = useCallback(
    (e) => {
      if (composingRef.current) return
      const el = e.target
      const caret = el.selectionStart ?? 0
      notifyComposerInput(el, el.value, caret)
    },
    [notifyComposerInput],
  )

  const handleKeyDown = useCallback(
    (e) => {
      onKeyDown?.(e)
      if (e.defaultPrevented) return
      if (!enterInsertsNewline || e.key !== 'Enter' || e.shiftKey) return
      e.preventDefault()
      const ta = e.target
      const start = ta.selectionStart ?? 0
      const end = ta.selectionEnd ?? start
      const next = `${ta.value.slice(0, start)}\n${ta.value.slice(end)}`
      const { nextCaret } = emitValue(ta, next, start + 1, { syncNotify: true })
      pendingSelectionRef.current = nextCaret
    },
    [emitValue, enterInsertsNewline, onKeyDown],
  )

  return (
    <textarea
      ref={rootRef}
      id={id}
      value={value}
      disabled={disabled}
      rows={1}
      enterKeyHint="enter"
      aria-label={ariaLabel}
      placeholder={placeholder}
      maxLength={maxLength ?? undefined}
      onChange={handleChange}
      onSelect={handleSelect}
      onKeyDown={handleKeyDown}
      onKeyUp={onKeyUp}
      onMouseUp={onMouseUp}
      onBlur={onBlur}
      onFocus={onFocus}
      onCompositionStart={() => {
        composingRef.current = true
      }}
      onCompositionEnd={(e) => {
        composingRef.current = false
        const caret = e.target.selectionStart ?? e.target.value.length
        emitValue(e.target, e.target.value, caret)
      }}
      className={`block w-full touch-manipulation resize-none border-0 bg-transparent whitespace-pre-wrap break-words px-0 text-left text-zinc-100 outline-none selection:bg-cyan-500/25 [-webkit-tap-highlight-color:transparent] ${preset.fieldClass} ${autoGrow ? 'overflow-hidden' : 'overflow-y-auto'} ${className}`}
    />
  )
})

export default LoungeRichComposerField
