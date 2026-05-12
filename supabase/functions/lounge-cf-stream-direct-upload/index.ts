/**
 * Mint a one-time Cloudflare Stream direct upload URL (max 60s). Caller must be authenticated.
 *
 * Secrets (Supabase project → Edge Functions):
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_STREAM_API_TOKEN   (Stream:Edit)
 *
 * @see https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/
 */
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_DURATION_SECONDS = 60

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')?.trim()
    const apiToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN')?.trim()
    if (!accountId || !apiToken) {
      return new Response(
        JSON.stringify({
          error: 'Video uploads are not configured (missing Cloudflare Stream credentials on the server).',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.toLowerCase().startsWith('bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Authorization bearer token.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()
    const admin = createClient(supabaseUrl, serviceRoleKey)
    const {
      data: { user },
      error: userErr,
    } = await admin.auth.getUser(jwt)
    if (userErr || !user?.id) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`
    const cfRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxDurationSeconds: MAX_DURATION_SECONDS,
        requireSignedURLs: false,
      }),
    })

    const cfJson = (await cfRes.json()) as {
      success?: boolean
      errors?: Array<{ message?: string }>
      result?: { uploadURL?: string; uid?: string }
    }

    if (!cfRes.ok || !cfJson?.success || !cfJson.result?.uploadURL || !cfJson.result?.uid) {
      const msg =
        cfJson?.errors?.map((e) => e.message).filter(Boolean).join('; ') ||
        `Cloudflare Stream error (${cfRes.status})`
      return new Response(JSON.stringify({ error: msg }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        uploadURL: cfJson.result.uploadURL,
        uid: cfJson.result.uid,
        maxDurationSeconds: MAX_DURATION_SECONDS,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: msg || 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
