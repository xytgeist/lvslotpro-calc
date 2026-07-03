/** Inline runbook links for Edge Monitor Phase 4. */

/** @typedef {{ id: string, title: string, href: string, hint?: string }} OpsMonitorRunbook */

/** @type {OpsMonitorRunbook[]} */
export const OPS_MONITOR_RUNBOOKS = [
  {
    id: 'prod-checklist',
    title: 'Production rollout checklist',
    href: '/docs/production-rollout-checklist.md',
    hint: 'Promote test work to prod',
  },
  {
    id: 'stripe-handoff',
    title: 'Stripe billing handoff',
    href: '/docs/stripe-billing-test-to-prod-handoff.md',
    hint: 'Webhook + secrets replay',
  },
  {
    id: 'stream-purge',
    title: 'Stream pending-upload purge',
    href: '/supabase/functions/lounge-cf-stream-purge-pending-uploads/README.md',
    hint: 'Cron / manual CF cleanup',
  },
  {
    id: 'starter-drops',
    title: 'Starter weekly drops',
    href: '/docs/access-tiers.md',
    hint: 'Freemium + starter entitlements',
  },
  {
    id: 'sentry',
    title: 'Sentry dashboard',
    href: 'https://edge-ev.sentry.io/',
    hint: 'Errors + releases',
  },
  {
    id: 'edge-monitor-roadmap',
    title: 'Edge Monitor roadmap',
    href: '/docs/edge-monitor-roadmap.md',
  },
]

/** @param {string} id */
export function opsMonitorRunbookById(id) {
  return OPS_MONITOR_RUNBOOKS.find((r) => r.id === id) || null
}

/** @param {string} sectionKey */
export function opsMonitorRunbooksForSection(sectionKey) {
  switch (sectionKey) {
    case 'subs':
      return [opsMonitorRunbookById('stripe-handoff'), opsMonitorRunbookById('prod-checklist')].filter(Boolean)
    case 'search':
      return [opsMonitorRunbookById('prod-checklist')].filter(Boolean)
    case 'lounge':
      return [opsMonitorRunbookById('stream-purge')].filter(Boolean)
    case 'ops':
      return [opsMonitorRunbookById('starter-drops'), opsMonitorRunbookById('stream-purge')].filter(Boolean)
    case 'external':
      return [
        opsMonitorRunbookById('sentry'),
        opsMonitorRunbookById('stripe-handoff'),
        opsMonitorRunbookById('stream-purge'),
        opsMonitorRunbookById('prod-checklist'),
      ].filter(Boolean)
    default:
      return [opsMonitorRunbookById('edge-monitor-roadmap')].filter(Boolean)
  }
}
