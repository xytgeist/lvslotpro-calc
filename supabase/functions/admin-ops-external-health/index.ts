/**
 * Admin-only external health probes for Edge Monitor (Phase 3).
 * Secrets stay on the server; client receives counts + dashboard deep links.
 *
 * Auth: Supabase user JWT — caller must have profiles.role = 'admin'
 *
 * Optional secrets:
 *   STRIPE_SECRET_KEY
 *   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_STREAM_API_TOKEN
 *   SENTRY_AUTH_TOKEN, SENTRY_ORG_SLUG, SENTRY_PROJECT_SLUG
 *   OPS_MONITOR_VERCEL_PROJECT_URL (dashboard link override)
 */
import { adminOpsCorsHeaders, adminOpsJson, requireAdminUser } from '../_shared/adminAuth.ts'

type StripeListResponse = {
  data?: Array<{ status?: string }>
  has_more?: boolean
}

type CfStreamListJson = {
  success?: boolean
  result?: Array<{ uid?: string; status?: { state?: string } }>
  errors?: Array<{ message?: string }>
}

type SentryIssuesJson = Array<{ id?: string }>

function supabaseProjectRef(): string {
  try {
    const host = new URL(Deno.env.get('SUPABASE_URL') || '').hostname
    return host.split('.')[0] || 'unknown'
  } catch {
    return 'unknown'
  }
}

function dashboardLinks() {
  const ref = supabaseProjectRef()
  const sentryOrg = Deno.env.get('SENTRY_ORG_SLUG')?.trim() || 'edge-ev'
  const sentryProject = Deno.env.get('SENTRY_PROJECT_SLUG')?.trim() || 'edgetilt'
  const cfAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')?.trim() || ''
  const vercelUrl =
    Deno.env.get('OPS_MONITOR_VERCEL_PROJECT_URL')?.trim() ||
    'https://vercel.com/quantum-capital-ventures/edgetilt'

  return {
    sentry: `https://${sentryOrg}.sentry.io/issues/?project=${sentryProject}`,
    stripe: 'https://dashboard.stripe.com/',
    stripe_webhooks: 'https://dashboard.stripe.com/workbench/webhooks',
    cloudflare_stream: cfAccountId
      ? `https://dash.cloudflare.com/${cfAccountId}/stream/videos`
      : 'https://dash.cloudflare.com/',
    cloudflare_r2: cfAccountId
      ? `https://dash.cloudflare.com/${cfAccountId}/r2/overview`
      : 'https://dash.cloudflare.com/',
    supabase: `https://supabase.com/dashboard/project/${ref}`,
    supabase_functions: `https://supabase.com/dashboard/project/${ref}/functions`,
    vercel: vercelUrl,
  }
}

async function probeStripe() {
  const key = Deno.env.get('STRIPE_SECRET_KEY')?.trim()
  const links = dashboardLinks()
  if (!key) {
    return {
      configured: false,
      dashboard_url: links.stripe,
      error: 'STRIPE_SECRET_KEY not set on Edge.',
    }
  }

  const statuses = ['active', 'past_due', 'canceled'] as const
  const counts: Record<string, number | null> = {}

  for (const status of statuses) {
    try {
      const res = await fetch(
        `https://api.stripe.com/v1/subscriptions?status=${status}&limit=100`,
        { headers: { Authorization: `Bearer ${key}` } },
      )
      if (!res.ok) {
        counts[status] = null
        continue
      }
      const json = (await res.json()) as StripeListResponse
      const base = json.data?.length ?? 0
      counts[status] = json.has_more ? base + 100 : base
    } catch {
      counts[status] = null
    }
  }

  return {
    configured: true,
    dashboard_url: links.stripe,
    webhooks_url: links.stripe_webhooks,
    subscriptions_active: counts.active,
    subscriptions_past_due: counts.past_due,
    subscriptions_canceled_sample: counts.canceled,
  }
}

async function probeCloudflareStream() {
  const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')?.trim()
  const apiToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN')?.trim()
  const links = dashboardLinks()

  if (!accountId || !apiToken) {
    return {
      configured: false,
      dashboard_url: links.cloudflare_stream,
      error: 'CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_STREAM_API_TOKEN not set.',
    }
  }

  try {
    const listUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream?status=pendingupload&limit=1000`
    const res = await fetch(listUrl, { headers: { Authorization: `Bearer ${apiToken}` } })
    const json = (await res.json()) as CfStreamListJson
    if (!res.ok || json.success === false) {
      const msg = json.errors?.[0]?.message || `HTTP ${res.status}`
      return {
        configured: true,
        ok: false,
        dashboard_url: links.cloudflare_stream,
        error: msg,
      }
    }
    const pending = json.result?.length ?? 0
    return {
      configured: true,
      ok: true,
      dashboard_url: links.cloudflare_stream,
      pending_uploads: pending,
      r2_dashboard_url: links.cloudflare_r2,
    }
  } catch (err) {
    return {
      configured: true,
      ok: false,
      dashboard_url: links.cloudflare_stream,
      error: err instanceof Error ? err.message : 'Cloudflare probe failed',
    }
  }
}

async function probeSentry() {
  const token = Deno.env.get('SENTRY_AUTH_TOKEN')?.trim()
  const org = Deno.env.get('SENTRY_ORG_SLUG')?.trim() || 'edge-ev'
  const project = Deno.env.get('SENTRY_PROJECT_SLUG')?.trim() || 'edgetilt'
  const links = dashboardLinks()

  if (!token) {
    return {
      configured: false,
      dashboard_url: links.sentry,
      note: 'Set SENTRY_AUTH_TOKEN (+ optional SENTRY_ORG_SLUG / SENTRY_PROJECT_SLUG) for API probe.',
    }
  }

  try {
    const url = `https://sentry.io/api/0/projects/${org}/${project}/issues/?query=is:unresolved&limit=1`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      return {
        configured: true,
        ok: false,
        dashboard_url: links.sentry,
        error: `Sentry API ${res.status}`,
      }
    }
    const json = (await res.json()) as SentryIssuesJson
    const linkHeader = res.headers.get('Link') || ''
    const totalMatch = linkHeader.match(/results="(\d+)"/)
    const unresolved = totalMatch ? Number(totalMatch[1]) : json.length
    return {
      configured: true,
      ok: true,
      dashboard_url: links.sentry,
      unresolved_issues: Number.isFinite(unresolved) ? unresolved : null,
    }
  } catch (err) {
    return {
      configured: true,
      ok: false,
      dashboard_url: links.sentry,
      error: err instanceof Error ? err.message : 'Sentry probe failed',
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: adminOpsCorsHeaders })
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return adminOpsJson(405, { error: 'Method not allowed' })
  }

  try {
    await requireAdminUser(req)
    const links = dashboardLinks()
    const [stripe, cloudflare, sentry] = await Promise.all([
      probeStripe(),
      probeCloudflareStream(),
      probeSentry(),
    ])

    return adminOpsJson(200, {
      generated_at: new Date().toISOString(),
      links: {
        ...links,
        stripe: stripe.dashboard_url || links.stripe,
        sentry: sentry.dashboard_url || links.sentry,
        cloudflare_stream: cloudflare.dashboard_url || links.cloudflare_stream,
      },
      probes: {
        stripe,
        cloudflare,
        sentry,
        vercel: {
          configured: true,
          dashboard_url: links.vercel,
          deploy_sha_note: 'Client shows VITE build SHA in header.',
        },
        supabase: {
          configured: true,
          project_ref: supabaseProjectRef(),
          dashboard_url: links.supabase,
          functions_url: links.supabase_functions,
        },
      },
    })
  } catch (err) {
    if (err instanceof Response) return err
    return adminOpsJson(500, {
      error: err instanceof Error ? err.message : 'External health probe failed',
    })
  }
})
