import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2'

export const adminOpsCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function adminOpsJson(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...adminOpsCorsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Validates Supabase user JWT and ensures profiles.role = admin. */
export async function requireAdminUser(req: Request): Promise<{ admin: SupabaseClient; user: User }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  if (!supabaseUrl || !serviceRoleKey) {
    throw adminOpsJson(503, { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.' })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.toLowerCase().startsWith('bearer ')) {
    throw adminOpsJson(401, { error: 'Missing Authorization bearer token.' })
  }

  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()
  const admin = createClient(supabaseUrl, serviceRoleKey)
  const {
    data: { user },
    error: userErr,
  } = await admin.auth.getUser(jwt)

  if (userErr || !user?.id) {
    throw adminOpsJson(401, { error: 'Invalid or expired session.' })
  }

  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileErr) {
    throw adminOpsJson(500, { error: `Profile lookup failed: ${profileErr.message}` })
  }

  if (profile?.role !== 'admin') {
    throw adminOpsJson(403, { error: 'Admin role required.' })
  }

  return { admin, user }
}
