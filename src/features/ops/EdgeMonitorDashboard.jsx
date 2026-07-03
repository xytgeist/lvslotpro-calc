import { useMemo } from 'react'
import { APP_BUILD_SHA } from '../../utils/appBuildInfo.js'
import {
  formatOpsMonitorBreakdown,
  formatOpsMonitorCount,
  opsMonitorSupabaseProjectRef,
} from './opsMonitorApi.js'
import {
  MonitorBarChart,
  MonitorCompareBars,
  MonitorDoughnutChart,
  MonitorPulseChart,
  breakdownToDoughnut,
  buildPulseDatasets,
} from './OpsMonitorCharts.jsx'
import {
  OPS_CHART_COLORS,
  OPS_SECTION_THEMES,
  opsMonitorHeroKpis,
  opsMonitorTrendLabels,
  opsMonitorTrendSeries,
} from './opsMonitorTheme.js'
import { useEdgeMonitorSnapshot } from './useEdgeMonitorSnapshot.js'
import { EDGE_MONITOR_PATH } from './opsMonitorNavigation.js'

function HeroKpiCard({ kpi, compact = false }) {
  const theme = kpi.theme || OPS_SECTION_THEMES.users
  return (
    <div
      className={`edge-monitor-hero-card relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${theme.gradient} min-w-0 ${compact ? 'p-3' : 'p-3 lg:p-4'}`}
      style={{ boxShadow: `0 0 0 1px ${theme.accent}22, 0 8px 24px ${theme.accent}14` }}
    >
      <div
        className="absolute -right-3 -top-3 h-16 w-16 rounded-full blur-2xl opacity-40"
        style={{ backgroundColor: theme.accent }}
        aria-hidden
      />
      <div className="relative">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{kpi.label}</div>
        <div
          className={`text-white font-black tabular-nums mt-0.5 tracking-tight ${compact ? 'text-2xl' : 'text-2xl lg:text-3xl'}`}
        >
          {formatOpsMonitorCount(kpi.value)}
        </div>
        <div className="text-[11px] font-medium mt-1 truncate" style={{ color: theme.accent }}>
          {kpi.sub}
        </div>
      </div>
    </div>
  )
}

function MetricTile({ label, value, hint = '', accent = OPS_CHART_COLORS.cyan }) {
  return (
    <div
      className="rounded-2xl bg-zinc-950/45 border border-zinc-800/70 px-3 py-3 min-w-0"
      style={{ borderLeftWidth: 3, borderLeftColor: `${accent}88` }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 truncate">{label}</div>
      <div className="text-white text-lg font-bold tabular-nums mt-1 truncate">{value}</div>
      {hint ? <div className="text-zinc-500 text-[11px] mt-1 leading-snug">{hint}</div> : null}
    </div>
  )
}

function MonitorSection({ themeKey, title, subtitle, chart = null, children, className = '' }) {
  const theme = OPS_SECTION_THEMES[themeKey] || OPS_SECTION_THEMES.ops
  return (
    <section
      className={`edge-monitor-section relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/90 ${className}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${theme.gradient} pointer-events-none`}
        aria-hidden
      />
      <div className="relative p-4 lg:p-5">
        <div className="mb-3 flex items-start gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: `${theme.accent}22`, boxShadow: `inset 0 0 0 1px ${theme.accent}44` }}
            aria-hidden
          >
            {theme.icon}
          </span>
          <div className="min-w-0">
            <div className="text-white font-bold text-[15px]">{title}</div>
            {subtitle ? <div className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{subtitle}</div> : null}
          </div>
        </div>
        {chart ? <div className="mb-3">{chart}</div> : null}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{children}</div>
      </div>
    </section>
  )
}

const PLANNED_METRICS = [
  'Sentry error rate + release health',
  'Stripe MRR / churn dashboard',
  'Cloudflare Stream pending uploads',
  'Edge Function latency + deploy versions',
  'Market API quota (Finnhub / CoinGecko)',
  'Freemium lock → subscribe funnel',
]

/**
 * @param {{
 *   supabaseClient: import('@supabase/supabase-js').SupabaseClient,
 *   layout?: 'mobile' | 'desktop',
 *   onBack?: () => void,
 *   showDesktopLink?: boolean,
 *   headerSlot?: import('react').ReactNode,
 * }} props
 */
export default function EdgeMonitorDashboard({
  supabaseClient,
  layout = 'mobile',
  onBack,
  showDesktopLink = layout === 'mobile',
  headerSlot = null,
}) {
  const isDesktop = layout === 'desktop'
  const { snapshot, loading, error, refreshing, load } = useEdgeMonitorSnapshot(supabaseClient)

  const generatedAt = snapshot?.generated_at
    ? new Date(snapshot.generated_at).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      })
    : null

  const users = snapshot?.users || {}
  const subs = snapshot?.subscriptions || {}
  const lounge = snapshot?.lounge || {}
  const search = snapshot?.search || {}
  const rateLimits = snapshot?.rate_limits || {}
  const chat = snapshot?.chat || {}
  const guides = snapshot?.guides || {}
  const bankroll = snapshot?.bankroll || {}
  const playLog = snapshot?.play_log || {}
  const offers = snapshot?.offers || {}
  const push = snapshot?.push || {}
  const starterDrops = snapshot?.starter_drops || {}
  const activity = snapshot?.activity || {}
  const stripeWebhooks = snapshot?.stripe_webhooks || {}
  const trends = snapshot?.trends

  const heroKpis = useMemo(() => opsMonitorHeroKpis(snapshot), [snapshot])
  const trendLabels = useMemo(() => opsMonitorTrendLabels(trends), [trends])
  const pulseDatasets = useMemo(() => buildPulseDatasets(trends), [trends])

  const roleDoughnut = useMemo(
    () =>
      breakdownToDoughnut(
        [
          { role: 'Users', count: users.role_user },
          { role: 'Mods', count: users.role_moderator },
          { role: 'Admins', count: users.role_admin },
        ],
        'role',
        0,
      ),
    [users.role_admin, users.role_moderator, users.role_user],
  )

  const subsDoughnut = useMemo(
    () => breakdownToDoughnut(subs.active_by_product, 'product_slug', 2),
    [subs.active_by_product],
  )

  const statusDoughnut = useMemo(
    () => breakdownToDoughnut(subs.status_breakdown, 'status', 4),
    [subs.status_breakdown],
  )

  const loungeEngagement = useMemo(
    () => ({
      labels: ['Likes', 'Comments', 'Bookmarks', 'Follows'],
      values: [
        lounge.likes_total,
        lounge.comments_total,
        lounge.bookmarks_total,
        lounge.follows_total,
      ],
    }),
    [lounge.bookmarks_total, lounge.comments_total, lounge.follows_total, lounge.likes_total],
  )

  const velocityCompare = useMemo(
    () => [
      { label: 'Posts', v24: lounge.posts_24h, v7: lounge.posts_7d },
      { label: 'Chat', v24: chat.messages_24h, v7: chat.messages_7d },
      { label: 'Search', v24: search.searches_24h, v7: search.searches_7d },
      { label: 'Activity', v24: activity.events_24h, v7: activity.events_7d },
    ],
    [
      activity.events_24h,
      activity.events_7d,
      chat.messages_24h,
      chat.messages_7d,
      lounge.posts_24h,
      lounge.posts_7d,
      search.searches_24h,
      search.searches_7d,
    ],
  )

  const pulseHeight = isDesktop ? 320 : 240
  const chartPanel = (
    <>
      {trendLabels.length > 0 ? (
        <section className="edge-monitor-panel rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-4 lg:p-5 h-full">
          <div className="mb-3">
            <div className="text-white font-bold text-[15px] lg:text-base">7-day pulse</div>
            <div className="text-zinc-500 text-xs mt-0.5">UTC daily · signups, posts, activity, chat</div>
          </div>
          <MonitorPulseChart labels={trendLabels} datasets={pulseDatasets} height={pulseHeight} />
        </section>
      ) : null}

      <section className="edge-monitor-panel rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-4 lg:p-5">
        <div className="mb-3">
          <div className="text-white font-bold text-[15px] lg:text-base">Velocity</div>
          <div className="text-zinc-500 text-xs mt-0.5">24h vs 7d totals</div>
        </div>
        <MonitorCompareBars items={velocityCompare} height={isDesktop ? 220 : 200} />
      </section>

      <div className={`grid gap-4 ${isDesktop ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
        <section className="edge-monitor-panel rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-4">
          <div className="text-white font-bold text-sm mb-2">Role mix</div>
          <MonitorDoughnutChart
            labels={roleDoughnut.labels}
            values={roleDoughnut.values}
            colors={roleDoughnut.colors}
            height={isDesktop ? 200 : 190}
          />
        </section>
        <section className="edge-monitor-panel rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-4">
          <div className="text-white font-bold text-sm mb-2">Active subs by product</div>
          <MonitorDoughnutChart
            labels={subsDoughnut.labels}
            values={subsDoughnut.values}
            colors={subsDoughnut.colors}
            height={isDesktop ? 200 : 190}
          />
        </section>
      </div>
    </>
  )

  const detailSections = snapshot ? (
    <>
      <MonitorSection
        themeKey="users"
        title="Users & roles"
        subtitle="profiles"
        className="mb-0"
        chart={
          trends?.length ? (
            <MonitorBarChart
              labels={trendLabels}
              values={opsMonitorTrendSeries(trends, 'signups')}
              color={OPS_CHART_COLORS.cyan}
              height={160}
            />
          ) : null
        }
      >
        <MetricTile label="Total" value={formatOpsMonitorCount(users.total_profiles)} accent={OPS_CHART_COLORS.cyan} />
        <MetricTile label="New 24h" value={formatOpsMonitorCount(users.new_24h)} accent={OPS_CHART_COLORS.green} />
        <MetricTile label="New 7d" value={formatOpsMonitorCount(users.new_7d)} />
        <MetricTile label="Stripe linked" value={formatOpsMonitorCount(users.stripe_customer_linked)} accent={OPS_CHART_COLORS.purple} />
        <MetricTile label="Legacy sub flag" value={formatOpsMonitorCount(users.has_active_subscription_flag)} hint="has_active_subscription" />
        <MetricTile label="Mods" value={formatOpsMonitorCount(users.role_moderator)} />
      </MonitorSection>

      <MonitorSection
        themeKey="subs"
        title="Subscriptions"
        subtitle="Stripe + webhooks"
        className="mb-0"
        chart={
          <MonitorDoughnutChart
            labels={statusDoughnut.labels}
            values={statusDoughnut.values}
            colors={statusDoughnut.colors}
            height={180}
          />
        }
      >
        <MetricTile label="Rows" value={formatOpsMonitorCount(subs.rows_total)} accent={OPS_CHART_COLORS.purple} />
        <MetricTile label="Active products" value={formatOpsMonitorBreakdown(subs.active_by_product)} />
        <MetricTile label="Cancel at end" value={formatOpsMonitorCount(subs.cancel_at_period_end)} accent={OPS_CHART_COLORS.orange} />
        <MetricTile label="Monthly" value={formatOpsMonitorCount(subs.monthly_interval)} />
        <MetricTile label="Annual" value={formatOpsMonitorCount(subs.annual_interval)} />
        <MetricTile label="Webhooks 24h" value={formatOpsMonitorCount(stripeWebhooks.events_24h)} accent={OPS_CHART_COLORS.yellow} />
      </MonitorSection>

      <MonitorSection
        themeKey="lounge"
        title="Lounge"
        subtitle="Feed + engagement"
        className="mb-0"
        chart={
          <MonitorBarChart
            labels={loungeEngagement.labels}
            values={loungeEngagement.values}
            color={OPS_CHART_COLORS.green}
            height={180}
          />
        }
      >
        <MetricTile label="Posts" value={formatOpsMonitorCount(lounge.posts_total)} accent={OPS_CHART_COLORS.green} />
        <MetricTile label="Visible" value={formatOpsMonitorCount(lounge.posts_visible)} />
        <MetricTile label="Hidden" value={formatOpsMonitorCount(lounge.posts_hidden)} accent={OPS_CHART_COLORS.red} />
        <MetricTile label="Posts 24h" value={formatOpsMonitorCount(lounge.posts_24h)} />
        <MetricTile label="Stream" value={formatOpsMonitorCount(lounge.with_stream_video)} accent={OPS_CHART_COLORS.cyan} />
        <MetricTile label="Pinned" value={formatOpsMonitorCount(lounge.pinned)} accent={OPS_CHART_COLORS.yellow} />
      </MonitorSection>

      <MonitorSection themeKey="search" title="Search & limits" subtitle="Analytics + rate caps" className="mb-0">
        <MetricTile label="Searches 24h" value={formatOpsMonitorCount(search.searches_24h)} accent={OPS_CHART_COLORS.yellow} />
        <MetricTile label="Searches 7d" value={formatOpsMonitorCount(search.searches_7d)} />
        <MetricTile label="Searchers 24h" value={formatOpsMonitorCount(search.unique_searchers_24h)} />
        <MetricTile label="Rate hits 24h" value={formatOpsMonitorCount(rateLimits.events_24h)} accent={OPS_CHART_COLORS.red} />
        <MetricTile label="Rate hits 7d" value={formatOpsMonitorCount(rateLimits.events_7d)} />
        <MetricTile label="Kinds 24h" value={formatOpsMonitorBreakdown(rateLimits.by_kind_24h, 'count')} />
      </MonitorSection>

      <MonitorSection
        themeKey="chat"
        title="Chat"
        subtitle="Rooms + messages"
        className="mb-0"
        chart={
          trends?.length ? (
            <MonitorBarChart
              labels={trendLabels}
              values={opsMonitorTrendSeries(trends, 'chat_messages')}
              color={OPS_CHART_COLORS.orange}
              height={160}
            />
          ) : null
        }
      >
        <MetricTile label="Rooms" value={formatOpsMonitorCount(chat.rooms_total)} accent={OPS_CHART_COLORS.orange} />
        <MetricTile label="Messages" value={formatOpsMonitorCount(chat.messages_total)} />
        <MetricTile label="Msgs 24h" value={formatOpsMonitorCount(chat.messages_24h)} accent={OPS_CHART_COLORS.green} />
        <MetricTile label="Msgs 7d" value={formatOpsMonitorCount(chat.messages_7d)} />
        <MetricTile label="Members" value={formatOpsMonitorCount(chat.members_total)} />
      </MonitorSection>

      <MonitorSection themeKey="tools" title="Guides & tools" subtitle="Catalog + session tools" className="mb-0">
        <MetricTile label="Guides live" value={formatOpsMonitorCount(guides.published)} accent={OPS_CHART_COLORS.pink} />
        <MetricTile label="Drafts" value={formatOpsMonitorCount(guides.unpublished)} />
        <MetricTile label="Machines" value={formatOpsMonitorCount(guides.machines_total)} />
        <MetricTile label="Bankroll sessions" value={formatOpsMonitorCount(bankroll.sessions_total)} />
        <MetricTile label="Bankroll 7d" value={formatOpsMonitorCount(bankroll.sessions_7d)} accent={OPS_CHART_COLORS.cyan} />
        <MetricTile label="Play logs" value={formatOpsMonitorCount(playLog.entries_total)} />
        <MetricTile label="Play logs 7d" value={formatOpsMonitorCount(playLog.entries_7d)} />
        <MetricTile label="Logbook users" value={formatOpsMonitorCount(playLog.users_with_entries)} />
      </MonitorSection>

      <MonitorSection themeKey="ops" title="Offers · push · Starter" subtitle="Calendar, notifications, drops" className="mb-0">
        <MetricTile label="Offers" value={formatOpsMonitorCount(offers.events_total)} accent={OPS_CHART_COLORS.red} />
        <MetricTile label="Uploads" value={formatOpsMonitorCount(offers.uploads_total)} />
        <MetricTile label="Push subs" value={formatOpsMonitorCount(push.subscriptions_total)} accent={OPS_CHART_COLORS.cyan} />
        <MetricTile label="Starter unlocks" value={formatOpsMonitorCount(starterDrops.unlocks_total)} accent={OPS_CHART_COLORS.purple} />
        <MetricTile label="Pending scratch" value={formatOpsMonitorCount(starterDrops.pending_reveal)} accent={OPS_CHART_COLORS.yellow} />
        <MetricTile label="Activity 24h" value={formatOpsMonitorCount(activity.events_24h)} />
      </MonitorSection>

      <section className="edge-monitor-panel rounded-3xl border border-dashed border-zinc-700/80 bg-zinc-900/50 p-4 lg:col-span-2">
        <div className="text-transparent bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text font-bold text-[15px] mb-1">
          Coming next
        </div>
        <ul className={`grid gap-2 ${isDesktop ? 'lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {PLANNED_METRICS.map((item) => (
            <li key={item} className="flex gap-2 text-zinc-400 text-xs leading-relaxed">
              <span className="text-lv-purple shrink-0">◆</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  ) : null

  return (
    <div
      data-edge-monitor
      data-edge-monitor-layout={layout}
      className={isDesktop ? 'edge-monitor-desktop' : 'edge-monitor-mobile'}
    >
      <div
        className={
          isDesktop
            ? 'edge-monitor-header relative mb-8 overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-cyan-950/90 via-zinc-900 to-violet-950/80 px-6 py-5'
            : 'edge-monitor-header relative mb-5 overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/80 via-zinc-900 to-violet-950/60 p-4'
        }
      >
        <div className="pointer-events-none absolute inset-0 edge-monitor-header-glow" aria-hidden />
        <div className={`relative flex gap-4 ${isDesktop ? 'items-center justify-between' : 'items-start justify-between'}`}>
          <div className="min-w-0 flex items-start gap-4">
            {isDesktop ? (
              <img
                src="/edge-lounge-logo-transparent.png"
                alt=""
                className="hidden sm:block h-12 w-auto shrink-0 drop-shadow-[0_0_18px_rgba(6,206,252,0.35)]"
              />
            ) : null}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {!isDesktop ? (
                  <span className="text-xl" aria-hidden>
                    📊
                  </span>
                ) : null}
                <div className="text-2xl lg:text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">
                  Edge Monitor
                </div>
                {isDesktop ? (
                  <span className="hidden md:inline rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-200 ring-1 ring-violet-400/30">
                    Desktop
                  </span>
                ) : null}
              </div>
              <div className="text-zinc-400 text-sm mt-1">Live pulse · admin ops</div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full bg-black/30 px-2.5 py-1 font-semibold text-cyan-200 ring-1 ring-cyan-500/30">
                  {opsMonitorSupabaseProjectRef()}
                </span>
                <span className="rounded-full bg-black/30 px-2.5 py-1 font-semibold text-zinc-300 ring-1 ring-zinc-600/50">
                  {APP_BUILD_SHA.slice(0, 7)}
                </span>
                {generatedAt ? (
                  <span className="rounded-full bg-black/20 px-2.5 py-1 font-medium text-zinc-400">{generatedAt}</span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {headerSlot}
            {showDesktopLink ? (
              <a
                href={EDGE_MONITOR_PATH}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-9 inline-flex items-center rounded-xl bg-zinc-800/80 px-3 text-zinc-200 text-xs font-semibold hover:bg-zinc-700"
              >
                Desktop ↗
              </a>
            ) : null}
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="min-h-9 rounded-xl bg-zinc-800/80 px-3 text-zinc-200 text-xs font-semibold touch-manipulation hover:bg-zinc-700"
              >
                ← Lounge
              </button>
            ) : null}
            <button
              type="button"
              disabled={loading || refreshing}
              onClick={() => void load(true)}
              className="min-h-9 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 px-4 text-white text-xs font-bold touch-manipulation hover:from-cyan-500 hover:to-violet-500 disabled:opacity-50 shadow-lg shadow-cyan-900/30"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-red-100 text-sm leading-relaxed">
          {error}
          <div className="mt-2 text-red-200/70 text-xs">
            Apply migrations <span className="font-mono">20260703100000</span> +{' '}
            <span className="font-mono">20260703110000</span>, then refresh.
          </div>
        </div>
      ) : null}

      {loading && !snapshot ? (
        <div className={`grid gap-2 mb-4 ${isDesktop ? 'grid-cols-5' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {Array.from({ length: isDesktop ? 5 : 6 }).map((_, i) => (
            <div key={i} className="edge-monitor-shimmer h-20 rounded-2xl bg-zinc-800/60" />
          ))}
        </div>
      ) : null}

      {snapshot ? (
        <>
          <div className={`grid gap-3 mb-4 ${isDesktop ? 'grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
            {heroKpis.map((kpi) => (
              <HeroKpiCard key={kpi.id} kpi={kpi} compact={!isDesktop} />
            ))}
          </div>

          {isDesktop ? (
            <div className="edge-monitor-desktop-charts mb-6 grid grid-cols-1 xl:grid-cols-12 gap-4">
              <div className="xl:col-span-8 space-y-4">
                {trendLabels.length > 0 ? (
                  <section className="edge-monitor-panel rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-5 h-full">
                    <div className="mb-3">
                      <div className="text-white font-bold text-base">7-day pulse</div>
                      <div className="text-zinc-500 text-xs mt-0.5">UTC daily · signups, posts, activity, chat</div>
                    </div>
                    <MonitorPulseChart labels={trendLabels} datasets={pulseDatasets} height={pulseHeight} />
                  </section>
                ) : null}
              </div>
              <div className="xl:col-span-4 space-y-4">
                <section className="edge-monitor-panel rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-5">
                  <div className="mb-3">
                    <div className="text-white font-bold text-base">Velocity</div>
                    <div className="text-zinc-500 text-xs mt-0.5">24h vs 7d</div>
                  </div>
                  <MonitorCompareBars items={velocityCompare} height={220} />
                </section>
                <div className="grid grid-cols-2 gap-4">
                  <section className="edge-monitor-panel rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-4">
                    <div className="text-white font-bold text-sm mb-2">Roles</div>
                    <MonitorDoughnutChart
                      labels={roleDoughnut.labels}
                      values={roleDoughnut.values}
                      colors={roleDoughnut.colors}
                      height={170}
                    />
                  </section>
                  <section className="edge-monitor-panel rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-4">
                    <div className="text-white font-bold text-sm mb-2">Subs</div>
                    <MonitorDoughnutChart
                      labels={subsDoughnut.labels}
                      values={subsDoughnut.values}
                      colors={subsDoughnut.colors}
                      height={170}
                    />
                  </section>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 space-y-4">{chartPanel}</div>
          )}

          <div className={isDesktop ? 'edge-monitor-desktop-sections grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-4'}>
            {detailSections}
          </div>
        </>
      ) : null}
    </div>
  )
}
