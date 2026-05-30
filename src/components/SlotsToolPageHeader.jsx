import QuickLinkPageToggle from './QuickLinkPageToggle.jsx'

/**
 * Top row for slot tool screens: optional quick-link toggle, centered overlay, trailing actions.
 *
 * @param {{
 *   quickLinkDestinationId?: import('../features/shell/quickLinkDestinations.js').QuickLinkId | null,
 *   center?: React.ReactNode,
 *   trailing?: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function SlotsToolPageHeader({
  quickLinkDestinationId = null,
  center = null,
  trailing = null,
  className = '',
}) {
  if (!quickLinkDestinationId && !trailing && !center) return null

  const quickLinkOnRight = Boolean(trailing && !center && quickLinkDestinationId)

  if (center) {
    return (
      <div
        className={`relative mb-3 flex min-h-10 w-full items-center ${className}`}
        data-slots-tool-top-bar
      >
        {quickLinkDestinationId ? (
          <div className="relative z-10 flex shrink-0 items-center">
            <QuickLinkPageToggle destinationId={quickLinkDestinationId} className="mb-0 shrink-0" />
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 flex justify-center px-1">
          <div className="pointer-events-auto min-w-0 max-w-[min(20rem,calc(100%-8.5rem))]">
            {center}
          </div>
        </div>
        {trailing ? (
          <div className="relative z-10 ml-auto flex shrink-0 items-center">
            {trailing}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={`mb-3 flex w-full items-center gap-2 ${className}`}
      data-slots-tool-top-bar
    >
      {quickLinkDestinationId && !quickLinkOnRight ? (
        <QuickLinkPageToggle destinationId={quickLinkDestinationId} className="mb-0 shrink-0" />
      ) : null}
      {quickLinkOnRight || trailing ? (
        <div className={`flex shrink-0 items-center gap-2 ${quickLinkOnRight || trailing ? 'ml-auto' : ''}`}>
          {quickLinkOnRight ? (
            <QuickLinkPageToggle destinationId={quickLinkDestinationId} className="mb-0 shrink-0" />
          ) : null}
          {trailing}
        </div>
      ) : null}
    </div>
  )
}
