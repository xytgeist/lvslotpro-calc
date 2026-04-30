import { forwardRef } from 'react'

const DateTimeInput = forwardRef(({ value, onClick, placeholder }, ref) => {
  const display = value || ''
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="w-full h-12 rounded-2xl bg-zinc-800 text-zinc-100 text-left px-3 outline-none focus:ring-2 focus:ring-violet-500/30"
    >
      {display || <span className="text-zinc-500">{placeholder}</span>}
    </button>
  )
})

DateTimeInput.displayName = 'DateTimeInput'

export default DateTimeInput
