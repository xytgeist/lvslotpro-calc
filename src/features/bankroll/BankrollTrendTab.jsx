import { useState, useMemo, useRef } from 'react'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

const FILTERS = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: 'YTD', days: null, ytd: true },
  { label: '1Y', days: 365 },
  { label: '3Y', days: 1095 },
  { label: 'MAX', days: null },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(n) {
  if (n == null || isNaN(n)) return '—'
  const abs = Math.abs(n)
  const str = abs >= 10000
    ? '$' + Math.round(abs).toLocaleString()
    : abs >= 100
    ? '$' + abs.toFixed(0)
    : '$' + abs.toFixed(2)
  return n < 0 ? '-' + str : str
}

function fmtDate(isoStr) {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function sessionWinLoss(s) {
  if (s.end_amount == null) return null
  return Number(s.end_amount) - Number(s.start_amount)
}

function sessionDurationHours(s) {
  const start = new Date(s.start_at)
  const end = s.end_at ? new Date(s.end_at) : new Date()
  return Math.max(0, (end - start) / 3_600_000)
}

function fmtDurationHrs(hrs) {
  if (hrs < 0.02) return '—'
  const h = Math.floor(hrs)
  const m = Math.round((hrs - h) * 60)
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ── Session detail modal ──────────────────────────────────────────────────────

function SessionDetailModal({ session, onClose }) {
  const wl = sessionWinLoss(session)
  const hrs = sessionDurationHours(session)
  const hourly = hrs >= 0.02 && wl != null ? wl / hrs : null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-700/50 px-5 pt-5 pb-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-lg truncate">
              {session.casino_name || 'Session'}
            </div>
            <div className="text-zinc-500 text-xs mt-0.5">{fmtDate(session.start_at)}</div>
          </div>
          <button
            onClick={onClose}
            className="ml-3 shrink-0 rounded-full w-8 h-8 flex items-center justify-center bg-zinc-800 text-zinc-400 text-sm touch-manipulation active:bg-zinc-700"
          >
            ✕
          </button>
        </div>

        {/* Win / Loss headline */}
        {wl != null && (
          <div className={`text-4xl font-black tabular-nums mb-5 ${wl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {wl >= 0 ? '+' : ''}{fmt$(wl)}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <DetailStat label="Duration" value={fmtDurationHrs(hrs)} />
          <DetailStat label="Buy-in" value={fmt$(session.start_amount)} />
          <DetailStat label="Cash-out" value={session.end_amount != null ? fmt$(session.end_amount) : '—'} />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <DetailStat label="Hourly" value={hourly != null ? `${hourly >= 0 ? '+' : ''}${fmt$(hourly)}/hr` : '—'} colored={hourly != null} positive={hourly != null && hourly >= 0} />
          <DetailStat label="Game type" value={session.game_type === 'tables' ? '🃏 Tables' : '🎰 Slots'} />
        </div>

        {session.notes && (
          <div className="rounded-2xl bg-zinc-800/60 px-4 py-3">
            <div className="text-zinc-500 text-[10px] uppercase tracking-wide mb-1">Notes</div>
            <div className="text-zinc-300 text-sm leading-relaxed">{session.notes}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailStat({ label, value, colored, positive }) {
  return (
    <div className="rounded-2xl bg-zinc-800/60 px-3 py-3 text-center">
      <div className="text-zinc-500 text-[10px] uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-sm font-bold ${colored ? (positive ? 'text-emerald-400' : 'text-red-400') : 'text-white'}`}>
        {value}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BankrollTrendTab({ sessions, adjustments }) {
  const [filter, setFilter] = useState('MAX')
  const [sessionModal, setSessionModal] = useState(null)

  // Ref for tracking which point is currently "pinned" (tooltip shown)
  // Using a ref (not state) so the Chart.js onClick closure always reads the latest value
  const activeIdxRef = useRef(null)
  // Ref to always have the current ordered sessions inside the onClick closure
  const orderedSessionsRef = useRef([])

  // Sort sessions oldest-first
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(a.start_at) - new Date(b.start_at)),
    [sessions]
  )

  // Apply time filter
  const filteredSessions = useMemo(() => {
    const f = FILTERS.find(f => f.label === filter)
    if (!f || (!f.days && !f.ytd)) return sortedSessions
    const cutoff = f.ytd
      ? new Date(new Date().getFullYear(), 0, 1)
      : new Date(Date.now() - f.days * 86400000)
    return sortedSessions.filter(s => new Date(s.start_at) >= cutoff)
  }, [sortedSessions, filter])

  // Build cumulative P&L series + per-session results for coloring
  const { labels, dataPoints, sessionResults, orderedSessions, adjMarkers } = useMemo(() => {
    const f = FILTERS.find(f => f.label === filter)
    const cutoff = f?.ytd
      ? new Date(new Date().getFullYear(), 0, 1)
      : f?.days
      ? new Date(Date.now() - f.days * 86400000)
      : null

    const labels = []
    const dataPoints = []
    const sessionResults = []  // individual session P&L → drives point + segment color
    const orderedSessions = [] // session object at each data index → for modal
    const adjMarkers = []

    const adjInWindow = (adjustments || []).filter(a => !cutoff || new Date(a.occurred_at) >= cutoff)
    const events = [
      ...filteredSessions.map(s => ({ type: 'session', date: new Date(s.start_at), session: s })),
      ...adjInWindow.map(a => ({ type: 'adj', date: new Date(a.occurred_at), adj: a })),
    ].sort((a, b) => a.date - b.date)

    let running = 0
    let idx = 0
    for (const ev of events) {
      if (ev.type === 'session') {
        const wl = ev.session.end_amount != null
          ? Number(ev.session.end_amount) - Number(ev.session.start_amount)
          : 0
        running += wl
        idx++
        labels.push(`#${idx}`)
        dataPoints.push(parseFloat(running.toFixed(2)))
        sessionResults.push(wl)
        orderedSessions.push(ev.session)
      } else {
        adjMarkers.push({ idx: dataPoints.length, amount: Number(ev.adj.amount) })
      }
    }

    return { labels, dataPoints, sessionResults, orderedSessions, adjMarkers }
  }, [filteredSessions, adjustments, filter])

  // Keep orderedSessions ref fresh so the onClick closure always has the right sessions
  orderedSessionsRef.current = orderedSessions

  const totalPL = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1] : 0
  const maxPL = dataPoints.length > 0 ? Math.max(...dataPoints) : 0
  const minPL = dataPoints.length > 0 ? Math.min(...dataPoints) : 0

  const pointColors = sessionResults.map(r => r >= 0 ? '#34d399' : '#f87171')
  const pointRadius = dataPoints.length <= 20 ? 5 : dataPoints.length <= 50 ? 3 : 0

  const chartData = {
    labels,
    datasets: [
      {
        data: dataPoints,
        segment: {
          borderColor: ctx => sessionResults[ctx.p1DataIndex] >= 0 ? '#34d399' : '#f87171',
        },
        borderColor: '#71717a',
        fill: {
          target: 'origin',
          above: 'rgba(52,211,153,0.10)',
          below: 'rgba(248,113,113,0.10)',
        },
        borderWidth: 2.5,
        pointRadius,
        pointHoverRadius: Math.max(pointRadius + 2, 6),
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        tension: 0.3,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    // Let Chart.js show tooltip on hover/touch automatically; onClick manages pinning
    interaction: {
      mode: 'index',
      intersect: false,
    },
    onClick: (evt, elements, chart) => {
      if (elements.length > 0) {
        const idx = elements[0].index
        if (activeIdxRef.current === idx) {
          // Second tap on the same pinned point → open session detail modal
          setSessionModal(orderedSessionsRef.current[idx])
        } else {
          // First tap → pin this point and hold the tooltip
          activeIdxRef.current = idx
          chart.tooltip.setActiveElements(
            [{ datasetIndex: 0, index: idx }],
            { x: evt.x ?? 0, y: evt.y ?? 0 }
          )
          chart.update('none')
        }
      } else {
        // Tapped empty canvas → dismiss pinned tooltip
        activeIdxRef.current = null
        chart.tooltip.setActiveElements([], { x: 0, y: 0 })
        chart.update('none')
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          // No title (session number removed)
          title: () => [],
          // Show date as the label header manually via afterTitle
          afterTitle: ctx => {
            const idx = ctx[0]?.dataIndex
            const s = orderedSessions[idx]
            return s ? fmtDate(s.start_at) : ''
          },
          label: ctx => {
            const idx = ctx.dataIndex
            const sessionPL = sessionResults[idx]
            const cumPL = ctx.parsed.y
            // This session first, cumulative second
            return [
              `This session:  ${sessionPL >= 0 ? '+' : ''}${fmt$(sessionPL)}`,
              `Cumulative:   ${cumPL >= 0 ? '+' : ''}${fmt$(cumPL)}`,
            ]
          },
          // Hint to tap again
          footer: () => ['Tap again to view details →'],
        },
        titleColor: '#a1a1aa',
        bodyColor: '#fff',
        footerColor: '#52525b',
        footerFont: { size: 10, style: 'italic' },
        backgroundColor: '#18181b',
        borderColor: '#3f3f46',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#71717a',
          maxTicksLimit: 8,
          font: { size: 10 },
          maxRotation: 0,
        },
      },
      y: {
        grid: {
          color: ctx => ctx.tick.value === 0 ? 'rgba(99,179,237,0.45)' : 'rgba(255,255,255,0.06)',
          lineWidth: ctx => ctx.tick.value === 0 ? 0.75 : 1,
        },
        ticks: {
          color: '#71717a',
          font: { size: 10 },
          callback: v => fmt$(v),
        },
      },
    },
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-3">📈</div>
        <div className="text-zinc-400 text-sm">No sessions yet. Start playing to see your trend.</div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-2">
          <StatPill label="Total P&L" value={`${totalPL >= 0 ? '+' : ''}${fmt$(totalPL)}`} positive={totalPL >= 0} />
          <StatPill label="Peak" value={maxPL > 0 ? `+${fmt$(maxPL)}` : '$0'} positive={maxPL > 0} neutral={maxPL <= 0} />
          <StatPill label="Trough" value={fmt$(minPL)} positive={minPL >= 0} />
        </div>

        {/* Chart card */}
        <div data-bankroll-card className="rounded-3xl bg-zinc-900 border border-zinc-800/60 p-4">
          {/* Time filter pills */}
          <div className="flex gap-1 mb-4 overflow-x-auto no-scrollbar">
            {FILTERS.map(f => (
              <button
                key={f.label}
                onClick={() => {
                  activeIdxRef.current = null
                  setFilter(f.label)
                }}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold touch-manipulation transition-colors ${
                  filter === f.label
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-500 active:bg-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredSessions.length < 2 ? (
            <div className="h-[220px] flex items-center justify-center text-zinc-600 text-sm">
              Not enough sessions in this period.
            </div>
          ) : (
            <div className="h-[220px]">
              <Line data={chartData} options={chartOptions} />
            </div>
          )}

          {/* Adjustment markers legend */}
          {adjMarkers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {adjMarkers.map((m, i) => (
                <span key={i} className="text-[10px] text-zinc-500 bg-zinc-800 rounded-full px-2 py-0.5">
                  Manual adj {m.amount >= 0 ? '+' : ''}{fmt$(m.amount)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sessions count note */}
        <div className="text-center text-zinc-600 text-xs">
          {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} in range
          {filteredSessions.length >= 2 && <span className="ml-2 text-zinc-700">· tap a point for details</span>}
        </div>
      </div>

      {sessionModal && (
        <SessionDetailModal session={sessionModal} onClose={() => setSessionModal(null)} />
      )}
    </>
  )
}

function StatPill({ label, value, positive, neutral }) {
  const color = neutral ? 'text-white' : positive ? 'text-emerald-400' : 'text-red-400'
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800/60 px-3 py-3 text-center">
      <div className="text-zinc-500 text-[10px] uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
    </div>
  )
}
