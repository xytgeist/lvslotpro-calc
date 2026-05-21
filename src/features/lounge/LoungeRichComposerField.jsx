import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import {
  getCaretTextOffset,
  insertPlainTextAtSelection,
  plainTextFromComposerRoot,
  syncComposerHtml,
} from './loungeRichComposerDom.js'

/**
 * Contenteditable Lounge caption field — real @ / # / link styling with aligned caret.
 * Value contract is plain text (same as the former textarea + mirror stack).
 */
const LoungeRichComposerField = forwardRef(function LoungeRichComposerField(
  {
    value = '',
    onChange,
    maxLength = 280,
    className = '',
    ariaLabel = 'Lounge post caption',
    placeholder = '',
    onKeyDown,
    onKeyUp,
    onMouseUp,
    onBlur,
    onFocus,
    onInput,
    disabled = false,
  },
  ref,
) {
  const rootRef = useRef(null)
  const lastValueRef = useRef(value)
  const composingRef = useRef(false)

  useImperativeHandle(ref, () => rootRef.current, [])

  const readAndEmit = useCallback(() => {
    const el = rootRef.current
    if (!el || composingRef.current) return
    const caret = getCaretTextOffset(el)
    let text = plainTextFromComposerRoot(el)
    const capped =
      maxLength != null && text.length > maxLength ? text.slice(0, maxLength) : text
    const nextCaret =
      maxLength != null ? Math.min(caret, capped.length) : caret
    lastValueRef.current = capped
    syncComposerHtml(el, capped, nextCaret)
    if (capped !== value) onChange?.(capped)
    onInput?.()
  }, [maxLength, onChange, onInput, value])

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el || composingRef.current) return
    if (plainTextFromComposerRoot(el) === value) {
      lastValueRef.current = value
      return
    }
    lastValueRef.current = value
    const caret =
      document.activeElement === el
        ? Math.min(getCaretTextOffset(el), value.length)
        : value.length
    syncComposerHtml(el, value, caret)
  }, [value])

  const handleInput = useCallback(() => {
    readAndEmit()
  }, [readAndEmit])

  const handlePaste = useCallback(
    (e) => {
      e.preventDefault()
      const text = e.clipboardData?.getData('text/plain') ?? ''
      if (!text) return
      insertPlainTextAtSelection(rootRef.current, text)
      readAndEmit()
    },
    [readAndEmit],
  )

  const handleKeyDown = useCallback(
    (e) => {
      onKeyDown?.(e)
      if (e.defaultPrevented) return
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        insertPlainTextAtSelection(rootRef.current, '\n')
        readAndEmit()
      }
    },
    [onKeyDown, readAndEmit],
  )

  return (
    <div className="relative min-h-0 w-full">
      {!value && placeholder ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 select-none whitespace-pre-wrap pt-[10px] text-[17px] leading-[1.25] text-zinc-500 sm:pt-[13px]"
        >
          {placeholder}
        </span>
      ) : null}
      <div
        ref={rootRef}
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        contentEditable={disabled ? 'false' : 'true'}
        suppressContentEditableWarning
        spellCheck
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onKeyUp={onKeyUp}
        onMouseUp={onMouseUp}
        onBlur={onBlur}
        onFocus={onFocus}
        onCompositionStart={() => {
          composingRef.current = true
        }}
        onCompositionEnd={() => {
          composingRef.current = false
          readAndEmit()
        }}
        className={`min-h-[2.75rem] max-h-[min(50vh,22rem)] w-full touch-manipulation overflow-y-auto whitespace-pre-wrap break-words px-0 py-0 pt-[10px] text-left text-[17px] leading-[1.25] text-zinc-100 outline-none selection:bg-cyan-500/25 empty:min-h-[2.75rem] sm:min-h-[3rem] sm:pt-[13px] ${className}`}
      />
    </div>
  )
})

export default LoungeRichComposerField
