/**
 * GuideCardPreview — pixel-faithful replica of the collapsed AP guide card.
 * Reads the same fields as GuidesScreen and applies identical logic/classes
 * so what you see here is exactly what renders in the app.
 *
 * Props:
 *   guide   — guide row fields (slug, title, card_ev_threshold, created_at, updated_at, …)
 *   machine — machines row fields (name, manufacturer, type, volatility_index, …)
 *   heroFile — optional File object for a newly chosen hero image (shows local preview)
 *   heroUrl  — existing stored hero URL (from DB / static fallback)
 */
import { useMemo } from 'react'

const BUFFALO_PLACEHOLDER =
  'https://media-test.lvslotpro.com/guides/buffalo-link/hero.webp'

// ─── accent theming ───────────────────────────────────────────────────────────
function cardAccent(slug) {
  if (slug === 'phoenix-link')
    return {
      strong: 'text-orange-50', subtitle: 'text-orange-200/90',
      evTablesBox: 'rounded-xl border border-dashed border-orange-400/55 bg-gradient-to-br from-orange-950/35 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'text-orange-300', evTablesRule: 'border-orange-400/65',
    }
  if (slug === 'legend-of-the-phoenix')
    return {
      strong: 'text-orange-50', subtitle: 'text-amber-200/88',
      evTablesBox: 'rounded-xl border border-dashed border-orange-400/55 bg-gradient-to-br from-red-950/30 via-orange-950/25 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'text-orange-300', evTablesRule: 'border-orange-400/65',
    }
  if (slug === 'stack-up-pays')
    return {
      strong: 'text-cyan-50', subtitle: 'text-cyan-200/90',
      evTablesBox: 'rounded-xl border border-dashed border-cyan-400/55 bg-gradient-to-br from-cyan-950/35 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'text-cyan-300', evTablesRule: 'border-cyan-400/65',
    }
  if (slug === 'lightning-buffalo-link')
    return {
      strong: 'text-indigo-50', subtitle: 'text-amber-200/85',
      evTablesBox: 'rounded-xl border border-dashed border-indigo-400/55 bg-gradient-to-br from-indigo-950/40 via-blue-950/25 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'text-indigo-300', evTablesRule: 'border-indigo-400/65',
    }
  if (slug === 'ainsworth-must-hit-by' || slug === 'must-hit-by-aig')
    return {
      strong: 'text-violet-50', subtitle: 'text-fuchsia-200/90',
      evTablesBox: 'rounded-xl border border-dashed border-violet-400/55 bg-gradient-to-br from-violet-950/35 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'text-violet-300', evTablesRule: 'border-violet-400/65',
    }
  if (slug === 'ags-must-hit-by' || slug === 'must-hit-by-ags')
    return {
      strong: 'text-rose-50', subtitle: 'text-rose-200/90',
      evTablesBox: 'rounded-xl border border-dashed border-rose-400/55 bg-gradient-to-br from-rose-950/35 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'text-rose-300', evTablesRule: 'border-rose-400/65',
    }
  if (slug === 'igt-must-hit-by' || slug === 'must-hit-by-igt')
    return {
      strong: 'text-sky-50', subtitle: 'text-sky-200/90',
      evTablesBox: 'rounded-xl border border-dashed border-sky-400/55 bg-gradient-to-br from-sky-950/35 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'text-sky-300', evTablesRule: 'border-sky-400/65',
    }
  if (slug === 'aladdins-fortune')
    return {
      strong: 'text-emerald-50', subtitle: 'text-emerald-200/90',
      evTablesBox: 'rounded-xl border border-dashed border-emerald-400/55 bg-gradient-to-br from-emerald-950/35 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'text-emerald-300', evTablesRule: 'border-emerald-400/65',
    }
  if (slug === 'aztec-banner')
    return {
      strong: 'text-lime-50', subtitle: 'text-orange-200/88',
      evTablesBox: 'rounded-xl border border-dashed border-lime-400/50 bg-gradient-to-br from-green-950/40 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'text-lime-300', evTablesRule: 'border-lime-400/60',
    }
  if (slug === 'pegasus-banner')
    return {
      strong: 'text-sky-50', subtitle: 'text-amber-200/88',
      evTablesBox: 'rounded-xl border border-dashed border-sky-400/55 bg-gradient-to-br from-blue-950/38 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
      evTablesHead: 'text-sky-300', evTablesRule: 'border-sky-400/60',
    }
  return {
    strong: 'text-amber-50', subtitle: 'text-amber-200/90',
    evTablesBox: 'rounded-xl border border-dashed border-amber-400/55 bg-gradient-to-br from-amber-950/35 via-zinc-950/40 to-zinc-950 px-4 py-3.5',
    evTablesHead: 'text-amber-300', evTablesRule: 'border-amber-400/65',
  }
}

function heroGradientClass(slug) {
  if (slug === 'lightning-buffalo-link') return 'from-indigo-950/85 via-sky-950/40 to-zinc-950'
  if (slug === 'phoenix-link') return 'from-orange-950/80 via-zinc-900/40 to-zinc-950'
  if (slug === 'legend-of-the-phoenix') return 'from-red-950/80 via-orange-950/40 to-zinc-950'
  if (slug === 'stack-up-pays') return 'from-cyan-950/80 via-sky-950/40 to-zinc-950'
  if (slug === 'aladdins-fortune') return 'from-emerald-950/75 via-amber-950/30 to-zinc-950'
  if (slug === 'aztec-banner') return 'from-green-950/80 via-orange-950/35 to-zinc-950'
  if (slug === 'pegasus-banner') return 'from-sky-950/80 via-amber-950/30 to-zinc-950'
  if (slug === 'ainsworth-must-hit-by' || slug === 'must-hit-by-aig') return 'from-violet-950/85 via-fuchsia-950/35 to-zinc-950'
  if (slug === 'ags-must-hit-by' || slug === 'must-hit-by-ags') return 'from-rose-950/85 via-red-950/40 to-zinc-950'
  if (slug === 'igt-must-hit-by' || slug === 'must-hit-by-igt') return 'from-sky-950/80 via-blue-950/45 to-zinc-950'
  return 'from-amber-900/40 to-zinc-950'
}

// ─── ratings logic (mirrors GuidesScreen exactly) ─────────────────────────────
function volatilityLabel(m) {
  if (!m) return '—'
  const vi = typeof m.volatility_index === 'string' ? m.volatility_index.trim() : m.volatility_index
  if (vi != null && vi !== '') return vi
  if (m.nerf_risk && m.difficulty) return `${m.difficulty} play / ${m.nerf_risk} nerf risk`
  return m.difficulty || m.nerf_risk || '—'
}

function popularityLabel(m) {
  if (!m) return '—'
  if (m.popularity_summary) return m.popularity_summary
  return m.vegas_availability || '—'
}

function volatilityCount(m) {
  if (!m) return 3
  const label = volatilityLabel(m)
  const blob = `${m.volatility_index || ''} ${label}`.toLowerCase()
  if (/\bmed-?high\b|\bmedium[- ]high\b/.test(blob)) return 4
  if (/\blow[- –]medium\b/.test(blob)) return 2
  if (/\bhigh\b/.test(blob)) return 5
  if (/\bmedium\b/.test(blob)) return 3
  if (/\blow\b/.test(blob)) return 1
  const nerf = String(m.nerf_risk || '').toLowerCase().trim()
  if (nerf === 'high') return 5
  if (nerf === 'medium') return 3
  if (nerf === 'low') return 2
  const diff = String(m.difficulty || '').toLowerCase().trim()
  if (diff === 'advanced') return 4
  if (diff === 'beginner') return 2
  if (diff === 'intermediate') return 3
  return 3
}

function popularityCount(m) {
  if (!m) return 3
  const h = `${m.popularity_summary || ''} ${m.vegas_availability || ''} ${popularityLabel(m)}`.toLowerCase()
  if (h.includes('extremely common')) return 5
  if (h.includes('abundant')) return 4
  if (h.includes('very common')) return 4
  if (h.includes('uncommon')) return 2
  if (h.includes('rare')) return 1
  if (h.includes('common')) return 3
  return 3
}

function lightningMeter(n) { return '⚡'.repeat(Math.min(5, Math.max(1, n))) }
function fireMeter(n)      { return '🔥'.repeat(Math.min(5, Math.max(1, n))) }

// ─── +EV panel icon ───────────────────────────────────────────────────────────
function IconEvTrendingUp({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3.5 13.5L8.25 8.75l2.75 2.75 5-6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.25 5.25h4.5v4.5"              stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── date helper ──────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return '—' }
}

// ─── main component ───────────────────────────────────────────────────────────
export default function GuideCardPreview({ guide = {}, machine = {}, heroFile = null, heroUrl = null }) {
  const slug = machine.slug || guide.slug || ''
  const accent = useMemo(() => cardAccent(slug), [slug])

  const heroSrc = useMemo(() => {
    if (heroFile) return URL.createObjectURL(heroFile)
    if (heroUrl)  return heroUrl
    return slug ? `/guides/${slug}/hero.webp` : BUFFALO_PLACEHOLDER
  }, [heroFile, heroUrl, slug])

  const evLine = guide.card_ev_threshold?.trim() || guide.card_gist?.trim() || 'Verify +EV on the glass — open guide'
  const calcKey = machine.has_calculator
    ? (machine.calculator_slug || machine.slug || slug)
    : null

  const vLabel = volatilityLabel(machine)
  const pLabel = popularityLabel(machine)
  const vCount = volatilityCount(machine)
  const pCount = popularityCount(machine)

  return (
    <article
      className={[
        'rounded-3xl border overflow-hidden bg-zinc-900',
        'border-zinc-700/85 ring-1 ring-zinc-500/15',
        'shadow-[0_12px_40px_-8px_rgba(0,0,0,0.65)]',
      ].join(' ')}
    >
      {/* ── HERO ── */}
      <div className={`relative h-[10.5rem] w-full overflow-hidden bg-gradient-to-br ${heroGradientClass(slug)}`}>
        <img
          src={heroSrc}
          alt={machine.name || guide.title || 'Guide hero'}
          className="h-full w-full object-cover opacity-95"
          onError={(e) => {
            if (e.currentTarget.dataset.fallback === '1') return
            e.currentTarget.dataset.fallback = '1'
            e.currentTarget.src = BUFFALO_PLACEHOLDER
          }}
        />
        {/* vignette */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        {/* title bar */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-transparent px-4 pb-3 pt-12">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-white font-black text-xl tracking-tight drop-shadow-md leading-tight">
                {machine.name || guide.title || (
                  <span className="text-zinc-500 italic">Machine name</span>
                )}
              </h2>
              <div className={`${accent.subtitle} text-[11px] font-semibold mt-0.5`}>
                {machine.manufacturer || <span className="text-zinc-600 italic">Manufacturer</span>}
              </div>
            </div>
            <div className="shrink-0 text-right leading-tight pb-px">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400/95">Released</div>
              <div className="text-[11px] font-bold tabular-nums text-zinc-100 drop-shadow-md">
                {machine.release_year ?? '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUMMARY ── */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">

          {/* Volatility */}
          <div className="rounded-xl bg-zinc-950/80 px-3 py-2 border border-zinc-800">
            <div className="text-zinc-500 font-semibold uppercase tracking-wide text-[10px]">Volatility</div>
            <div className="text-amber-300 mt-0.5">
              <span
                className="inline-block origin-left scale-[0.65] text-sm leading-none"
                title={`${vCount} of 5`}
              >
                {lightningMeter(vCount)}
              </span>
            </div>
            <div className="text-zinc-100 font-bold mt-0.5 leading-snug">{vLabel}</div>
          </div>

          {/* Popularity */}
          <div className="rounded-xl bg-zinc-950/80 px-3 py-2 border border-zinc-800">
            <div className="text-zinc-500 font-semibold uppercase tracking-wide text-[10px]">Floor presence</div>
            <div className="mt-0.5">
              <span
                className="inline-block origin-left scale-[0.65] text-sm leading-none"
                title={`${pCount} of 5`}
              >
                {fireMeter(pCount)}
              </span>
            </div>
            <div className="text-zinc-100 font-bold mt-0.5 leading-snug">{pLabel}</div>
          </div>

          {/* Type — full width */}
          <div className="rounded-xl bg-zinc-950/80 px-3 py-2 border border-zinc-800 col-span-2">
            <div className="text-zinc-500 font-semibold uppercase tracking-wide text-[10px]">Type</div>
            <div className="text-zinc-200 font-semibold mt-0.5">
              {machine.type || <span className="text-zinc-600 italic">—</span>}
            </div>
          </div>
        </div>

        {/* +EV threshold panel */}
        <div className={accent.evTablesBox}>
          <div className={`flex items-center gap-2 ${accent.evTablesHead} text-[10px] font-semibold uppercase tracking-[0.2em]`}>
            <IconEvTrendingUp className="h-3.5 w-3.5 shrink-0" />
            +EV Threshold
          </div>
          <div className={`relative mt-2 border-l-2 pl-3 ${accent.evTablesRule}`}>
            <p className={`text-base font-normal leading-snug ${accent.strong}`}>
              {evLine || <span className="text-zinc-500 italic">Enter +EV threshold above</span>}
            </p>
          </div>
        </div>

        {/* Dates + expand hint */}
        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800/80 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {guide.created_at && (
              <span className="text-[10px] leading-snug text-zinc-500">
                <span className="text-zinc-600">Added </span>
                <span className="tabular-nums text-zinc-400">{fmtDate(guide.created_at)}</span>
              </span>
            )}
            {guide.updated_at && (
              <span className="text-[10px] leading-snug text-zinc-500">
                <span className="text-zinc-600">Updated </span>
                <span className="tabular-nums text-zinc-400">{fmtDate(guide.updated_at)}</span>
              </span>
            )}
          </div>
          <div className="inline-flex shrink-0 items-center gap-1.5 text-zinc-500 text-xs font-medium">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="6 9 12 15 18 9" />
            </svg>
            Tap for full guide
          </div>
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="px-4 pb-4 flex flex-col gap-2 border-t border-zinc-800/80 pt-3 -mt-px">
        <div className="flex gap-2">
          {calcKey && (
            <button
              type="button"
              className="flex-1 min-h-11 rounded-2xl bg-emerald-600 text-white text-sm font-bold touch-manipulation cursor-default select-none"
            >
              Open calculator
            </button>
          )}
          <button
            type="button"
            className="flex-1 min-h-11 rounded-2xl bg-cyan-700 text-white text-sm font-bold touch-manipulation cursor-default select-none"
          >
            Ask community
          </button>
        </div>
      </div>
    </article>
  )
}
