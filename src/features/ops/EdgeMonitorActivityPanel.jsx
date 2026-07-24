import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatOpsMonitorCount } from './opsMonitorApi.js'
import { opsMonitorActivityEventLabel, opsMonitorActivityTypeRows } from './opsMonitorActivity.js'
import { OPS_CHART_COLORS, OPS_SECTION_THEMES } from './opsMonitorTheme.js'

function ActivityMetric({ label, value, accent = OPS_CHART_COLORS.purple }) {
  return (
    <div
      className="edge-monitor-metric-tile rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 min-w-0"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <div className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wide truncate">{label}</div>
      <div className="text-white font-bold tabular-nums mt-0.5">{formatOpsMonitorCount(value)}</div>
    </div>
  )
}

/**
 * @param {{
 *   snapshot: object | null | undefined,
 *   loading?: boolean,
 * }} props
 */
export default function EdgeMonitorActivityPanel({ snapshot, loading = false }) {
  const [open, setOpen] = useState(false)
  const activity = snapshot?.activity || {}
  const chat = snapshot?.chat || {}
  const theme = OPS_SECTION_THEMES.chat

  const typeRows = useMemo(() => opsMonitorActivityTypeRows(activity), [activity])
  const typeCount24h = typeRows.filter((row) => row.count24h > 0).length

  return (
    <section
      className="edge-monitor-panel rounded-2xl border border-zinc-800 bg-zinc-900 p-4 lg:p-5 mb-4 lg:col-span-full"
      data-edge-monitor-activity
      style={{ borderLeftWidth: 3, borderLeftColor: theme.accent }}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              {theme.icon}
            </span>
            <div className="text-white font-bold text-[15px]">Activity alerts</div>
          </div>
          <div className="text-zinc-500 text-xs mt-0.5 leading-relaxed">
            Notification rows in <span className="font-mono text-[11px]">activity_events</span> · not the same as raw chat message count (
            {formatOpsMonitorCount(chat.messages_24h)} msgs 24h)
          </div>
        </div>
      </div>

      {loading && !snapshot ? (
        <div className="edge-monitor-shimmer h-16 rounded-xl bg-zinc-800/60" />
      ) : null}

      {snapshot ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            <ActivityMetric label="Alerts 24h" value={activity.events_24h} accent={OPS_CHART_COLORS.purple} />
            <ActivityMetric label="Alerts 7d" value={activity.events_7d} accent={OPS_CHART_COLORS.cyan} />
            <ActivityMetric
              label="Types active 24h"
              value={typeCount24h}
              accent={OPS_CHART_COLORS.orange}
            />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left touch-manipulation hover:bg-zinc-900/80"
              aria-expanded={open}
            >
              <div className="min-w-0">
                <div className="text-white text-sm font-semibold">By notification type</div>
                <div className="text-zinc-500 text-[10px] mt-0.5">
                  {typeRows.length} types tracked · tap to {open ? 'hide' : 'expand'}
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>

            {open ? (
              <div className="border-t border-zinc-800 px-3 pb-3 pt-2">
                {typeRows.length === 0 ? (
                  <div className="rounded-lg border border-zinc-800 px-3 py-4 text-center text-zinc-500 text-xs">
                    No activity alert rows in the last 7 days
                  </div>
                ) : (
                  <div className="overflow-x-auto overflow-y-auto max-h-64 rounded-lg border border-zinc-800">
                    <table className="w-full min-w-[420px] text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-zinc-950 text-zinc-500 uppercase text-[10px] tracking-wide border-b border-zinc-800">
                        <tr>
                          <th className="px-2.5 py-1.5 font-semibold">Type</th>
                          <th className="px-2.5 py-1.5 font-semibold text-right">24h</th>
                          <th className="px-2.5 py-1.5 font-semibold text-right">7d</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {typeRows.map((row) => (
                          <tr key={row.event_type}>
                            <td className="px-2.5 py-2 min-w-0">
                              <div className="text-zinc-200 font-medium">{opsMonitorActivityEventLabel(row.event_type)}</div>
                              <div className="text-zinc-600 text-[10px] font-mono truncate">{row.event_type}</div>
                            </td>
                            <td className="px-2.5 py-2 text-right text-white font-semibold tabular-nums">
                              {formatOpsMonitorCount(row.count24h)}
                            </td>
                            <td className="px-2.5 py-2 text-right text-zinc-300 tabular-nums">
                              {formatOpsMonitorCount(row.count7d)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  )
}
