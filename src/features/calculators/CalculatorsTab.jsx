import { lazy, Suspense } from 'react'
import ScrollLinkedEdgeTitleBarShell from '../../components/ScrollLinkedEdgeTitleBarShell.jsx'
import NavLockGlyph from '../../components/NavLockGlyph.jsx'
import {
  CALCULATOR_CATALOG,
  canOpenCalculator,
  showCalculatorLock,
} from './calculatorAccess.js'

const PhoenixLink = lazy(() => import('./games/PhoenixLink.jsx'))
const BuffaloLink = lazy(() => import('./games/BuffaloLink.jsx'))
const StackUpPays = lazy(() => import('./games/StackUpPays.jsx'))
const MHBCalculator = lazy(() => import('./games/MHBCalculator.jsx'))

function CalculatorLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center text-zinc-500 text-[15px] px-4">
      Loading calculator…
    </div>
  )
}

function CalculatorsHome({
  onSelectCalculator,
  browseMode,
  onOpenAuth,
  hasSlotsEdge = false,
  isStaff = false,
  onRequireSubscribe,
}) {
  const access = { browseMode, isStaff, hasSlotsEdge }

  const handleSelect = (key) => {
    if (browseMode !== 'member') {
      onOpenAuth?.()
      return
    }
    if (!canOpenCalculator(key, { isStaff, hasSlotsEdge })) {
      onRequireSubscribe?.('slots-edge')
      return
    }
    onSelectCalculator(key)
  }

  return (
    <div className="w-full pt-2 sm:pt-3">
      <div className="mb-10 text-left sm:mb-12">
        <p className="text-base text-zinc-400">Select a calculator</p>
      </div>

      {CALCULATOR_CATALOG.map((calc) => {
        const locked = showCalculatorLock(calc.key, access)
        return (
          <button
            key={calc.key}
            type="button"
            title={locked ? 'Subscribe to unlock Slots Edge' : undefined}
            onClick={() => handleSelect(calc.key)}
            className={calc.buttonClassName}
          >
            {calc.iconWrapClassName?.includes('relative') ? (
              <div className={calc.iconWrapClassName}>
                <img
                  src={calc.iconSrc}
                  alt={calc.iconAlt}
                  className={calc.iconImgClassName || 'h-full w-full object-cover object-center'}
                />
              </div>
            ) : (
              <img src={calc.iconSrc} alt={calc.iconAlt} className={calc.iconWrapClassName} />
            )}
            <div className="min-w-0 flex-1 self-center">
              <div className="flex min-w-0 items-center gap-2">
                <div className={`min-w-0 flex-1 ${calc.titleClassName}`}>{calc.title}</div>
                {locked ? <NavLockGlyph className="h-4 w-4 shrink-0 text-amber-400/95" /> : null}
              </div>
              <p
                className={calc.subtitleClassName}
                title={calc.subtitleTitle || undefined}
              >
                {calc.subtitle}
              </p>
            </div>
          </button>
        )
      })}

      {browseMode !== 'member' ? (
        <div className="mt-10 sm:mt-12 flex flex-col items-center gap-2 text-center">
          <button
            type="button"
            onClick={onOpenAuth}
            className="min-h-12 inline-flex items-center justify-center text-base text-cyan-400 hover:text-cyan-300 underline touch-manipulation transition-colors px-4 py-2"
          >
            Log in or create account
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default function CalculatorsTab({
  activeCalculator,
  setActiveCalculator,
  browseMode,
  onOpenAuth,
  hasSlotsEdge = false,
  isStaff = false,
  onRequireSubscribe,
  titleBarNavSlot = null,
}) {
  if (!activeCalculator) {
    return (
      <ScrollLinkedEdgeTitleBarShell
        titleBarNavSlot={titleBarNavSlot}
        contentClassName="px-3 pt-3 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]"
      >
        <CalculatorsHome
          onSelectCalculator={setActiveCalculator}
          browseMode={browseMode}
          onOpenAuth={onOpenAuth}
          hasSlotsEdge={hasSlotsEdge}
          isStaff={isStaff}
          onRequireSubscribe={onRequireSubscribe}
        />
      </ScrollLinkedEdgeTitleBarShell>
    )
  }
  return (
    <Suspense
      fallback={
        <ScrollLinkedEdgeTitleBarShell
          titleBarNavSlot={titleBarNavSlot}
          contentClassName="px-3 pt-3 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]"
        >
          <CalculatorLoadingFallback />
        </ScrollLinkedEdgeTitleBarShell>
      }
    >
      {activeCalculator === 'phoenix' ? (
        <ScrollLinkedEdgeTitleBarShell titleBarNavSlot={titleBarNavSlot} contentClassName="px-3 pt-3 pb-[calc(3rem+env(safe-area-inset-bottom,0px))]">
          <PhoenixLink onBack={() => setActiveCalculator(null)} />
        </ScrollLinkedEdgeTitleBarShell>
      ) : null}
      {activeCalculator === 'buffalo' ? (
        <ScrollLinkedEdgeTitleBarShell titleBarNavSlot={titleBarNavSlot} contentClassName="px-3 pt-3 pb-[calc(3rem+env(safe-area-inset-bottom,0px))]">
          <BuffaloLink onBack={() => setActiveCalculator(null)} />
        </ScrollLinkedEdgeTitleBarShell>
      ) : null}
      {activeCalculator === 'stackup' ? (
        <ScrollLinkedEdgeTitleBarShell titleBarNavSlot={titleBarNavSlot} contentClassName="px-3 pt-3 pb-[calc(3rem+env(safe-area-inset-bottom,0px))]">
          <StackUpPays onBack={() => setActiveCalculator(null)} />
        </ScrollLinkedEdgeTitleBarShell>
      ) : null}
      {activeCalculator === 'mhb' ? (
        <ScrollLinkedEdgeTitleBarShell titleBarNavSlot={titleBarNavSlot} contentClassName="px-3 pt-3 pb-[calc(3rem+env(safe-area-inset-bottom,0px))]">
          <MHBCalculator onBack={() => setActiveCalculator(null)} />
        </ScrollLinkedEdgeTitleBarShell>
      ) : null}
    </Suspense>
  )
}
