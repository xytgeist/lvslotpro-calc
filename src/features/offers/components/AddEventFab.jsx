export default function AddEventFab({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add event"
      className="fixed right-[4.25rem] bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] z-50 grid h-12 w-12 place-items-center rounded-full bg-violet-600 text-white shadow-lg touch-manipulation hover:bg-violet-500"
    >
      <span aria-hidden className="block leading-none text-[2rem] -translate-y-px">
        +
      </span>
    </button>
  )
}
