/**
 * Small YouTube wordmark + icon (X-style attribution under embeds).
 *
 * @param {{ className?: string, iconClassName?: string, labelClassName?: string }} props
 */
export default function YouTubeBrandMark({ className = '', iconClassName = 'h-[18px] w-[26px]', labelClassName = 'text-[13px] font-medium' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg className={iconClassName} viewBox="0 0 28 20" aria-hidden="true">
        <rect width="28" height="20" rx="4" fill="#FF0000" />
        <path d="M11.5 6.2v7.6l6.2-3.8-6.2-3.8z" fill="#FFFFFF" />
      </svg>
      <span className={labelClassName}>YouTube</span>
    </span>
  )
}
