import ScrollLinkedEdgeTitleBarShell from '../../components/ScrollLinkedEdgeTitleBarShell.jsx'
import NavLockGlyph from '../../components/NavLockGlyph.jsx'
import { calculatorsTabFullyGated } from '../calculators/calculatorAccess.js'
import { guidesTabFullyGated } from '../guides/guideAccess.js'

const SLOTS_TOOLS = [
  {
    id: 'calculators',
    label: 'Calcs',
    icon: '🧮',
    description: 'EV calculators for slot games',
    subscriberGated: (gatesMap) => calculatorsTabFullyGated(gatesMap),
  },
  {
    id: 'offers',
    label: 'Calendar',
    icon: '📅',
    description: 'Offers, mailers, and trip planning',
    subscriberGated: () => false,
  },
  {
    id: 'bankroll',
    label: 'Bankroll',
    icon: '💰',
    description: 'Track sessions and bankroll growth',
    subscriberGated: () => true,
  },
  {
    id: 'guides',
    label: 'AP Guides',
    icon: '📗',
    description: 'Advantage-play guides and community Q&A',
    subscriberGated: (gatesMap) => guidesTabFullyGated(gatesMap),
  },
  {
    id: 'intel',
    label: 'Intel',
    icon: '📍',
    description: 'Local casino conditions and field reports',
    subscriberGated: () => false,
  },
]

export default function SlotsScreen({
  titleBarNavSlot = null,
  browseMode = 'member',
  onOpenAuth,
  onOpenTool,
  onRequireSubscribe,
  hasSlotsEdge = false,
  isStaff = false,
  gatesMap = null,
}) {
  const showSubscriberLocks = browseMode === 'member' && !isStaff && !hasSlotsEdge

  const handleOpen = (tool) => {
    if (browseMode !== 'member') {
      onOpenAuth?.()
      return
    }
    const locked = showSubscriberLocks && tool.subscriberGated(gatesMap)
    if (locked) {
      onRequireSubscribe?.('slots-edge')
      return
    }
    onOpenTool?.(tool.id)
  }

  return (
    <ScrollLinkedEdgeTitleBarShell
      titleBarNavSlot={titleBarNavSlot}
      contentClassName="px-3 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="mb-6">
        <div className="text-gray-900 dark:text-white text-2xl font-black tracking-tight">Slots</div>
        <div className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">Tools for advantage slot play</div>
      </div>

      <div className="space-y-3">
        {SLOTS_TOOLS.map((tool) => {
          const locked = showSubscriberLocks && tool.subscriberGated(gatesMap)
          return (
            <button
              key={tool.id}
              type="button"
              title={locked ? 'Subscribe to unlock Slots Edge' : undefined}
              onClick={() => handleOpen(tool)}
              className="flex w-full items-center gap-4 rounded-3xl bg-zinc-100 dark:bg-zinc-900 px-4 py-4 text-left touch-manipulation active:scale-[0.99] transition-transform"
            >
              <span
                aria-hidden
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-2xl"
              >
                {tool.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-lg font-bold text-gray-900 dark:text-white">{tool.label}</span>
                  {locked ? <NavLockGlyph className="h-4 w-4 shrink-0 text-amber-400/95" /> : null}
                </span>
                <span className="mt-0.5 block text-sm leading-snug text-zinc-500">{tool.description}</span>
              </span>
              <span aria-hidden className="shrink-0 text-zinc-400 dark:text-zinc-600 text-lg">
                →
              </span>
            </button>
          )
        })}
      </div>
    </ScrollLinkedEdgeTitleBarShell>
  )
}
