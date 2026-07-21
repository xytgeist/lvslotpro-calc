import CreatorFanSubscribeBellIcon from './CreatorFanSubscribeBellIcon.jsx'

/**
 * Neumorphic Subscribe capsule + glossy bell knob (profile + modal).
 *
 * @param {{
 *   label?: string,
 *   showBellKnob?: boolean,
 *   disabled?: boolean,
 *   onClick?: () => void,
 *   type?: 'button' | 'submit',
 *   className?: string,
 *   title?: string,
 *   bellAlertsActive?: boolean,
 * }} props
 */
export default function CreatorFanSubscribeRubberButton({
  label = 'Subscribe',
  showBellKnob = true,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  title,
  bellAlertsActive = false,
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      data-creator-fan-rubber-btn
      className={`creator-fan-rubber-btn touch-manipulation disabled:opacity-55 disabled:saturate-50 ${className}`.trim()}
    >
      <span className="creator-fan-rubber-label">{label}</span>
      {showBellKnob ? (
        <span
          className={`creator-fan-rubber-bell ${bellAlertsActive ? 'creator-fan-rubber-bell--alerts-on' : ''}`}
          aria-hidden
        >
          <CreatorFanSubscribeBellIcon className="h-3.5 w-3.5 text-zinc-950" filled />
        </span>
      ) : null}
    </button>
  )
}
