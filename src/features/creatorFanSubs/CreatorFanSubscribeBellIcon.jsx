/** Notification bell (matches profile post-alert control). */
export default function CreatorFanSubscribeBellIcon({ className = 'h-4 w-4', filled = false }) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M10 2a4.5 4.5 0 00-4.5 4.5v2.1l-1.4 2.1h11.8l-1.4-2.1V6.5A4.5 4.5 0 0010 2z" />
        <path d="M8.2 14.5h3.6a1.8 1.8 0 01-3.6 0z" />
      </svg>
    )
  }
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2.5a5 5 0 015 5v2.5l1.5 2v.5H3.5V10L5 7.5V7.5a5 5 0 015-5z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path d="M7.5 14.5h5a2 2 0 01-4 0z" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  )
}
