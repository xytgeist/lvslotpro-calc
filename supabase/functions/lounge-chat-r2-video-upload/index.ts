/**
 * Mint a presigned PUT URL for Lounge chat videos (Cloudflare R2).
 * Only accepts video/mp4 — used by the chat composer after browser-side encoding.
 *
 * Secrets (same as lounge-cf-r2-direct-upload):
 *   CLOUDFLARE_ACCOUNT_ID
 *   LOUNGE_CF_R2_ACCESS_KEY_ID
 *   LOUNGE_CF_R2_SECRET_ACCESS_KEY
 *   LOUNGE_CF_R2_BUCKET
 *   LOUNGE_CF_R2_PUBLIC_BASE_URL   (public custom domain, e.g. https://media.example.com)
 */
import {
  loungeCfR2ConfigHint,
  loungeCfR2CorsHeaders,
  loungeCfR2ObjectKey,
  loungeCfR2PresignedPutUrl,
  loungeCfR2PublicUrl,
  loungeCfR2RequireUser,
  readLoungeCfR2Config,
} from '../_shared/loungeCfR2.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: loungeCfR2CorsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...loungeCfR2CorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const cfg = readLoungeCfR2Config()
    if (!cfg) {
      return new Response(
        JSON.stringify({
          error: `Video uploads are not configured (missing Cloudflare R2 credentials on the server).${loungeCfR2ConfigHint()}`,
        }),
        { status: 503, headers: { ...loungeCfR2CorsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { user } = await loungeCfR2RequireUser(req)

    let contentType = 'video/mp4'
    try {
      const body = (await req.json()) as { contentType?: string }
      if (typeof body?.contentType === 'string' && body.contentType.trim()) {
        contentType = body.contentType.trim()
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
        status: 400,
        headers: { ...loungeCfR2CorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (contentType.toLowerCase() !== 'video/mp4') {
      return new Response(JSON.stringify({ error: 'Only video/mp4 uploads are allowed.' }), {
        status: 400,
        headers: { ...loungeCfR2CorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const objectKey = loungeCfR2ObjectKey(user.id, 'mp4')
    const uploadURL = await loungeCfR2PresignedPutUrl(cfg, objectKey, 'video/mp4')
    const publicUrl = loungeCfR2PublicUrl(cfg, objectKey)

    return new Response(
      JSON.stringify({ uploadURL, publicUrl, objectKey }),
      { headers: { ...loungeCfR2CorsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    if (e instanceof Response) return e
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: msg || 'Server error' }), {
      status: 500,
      headers: { ...loungeCfR2CorsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
