/**
 * Delete an abandoned R2 object when upload succeeded but no DB row references it yet.
 * Caller must own the `{userId}/…` prefix (same JWT as direct-upload).
 *
 * Body: `{ publicUrl?: string, objectKey?: string }`
 */
import {
  loungeCfR2ConfigHint,
  loungeCfR2CorsHeaders,
  loungeCfR2DeleteObject,
  loungeCfR2KeyOwnedByUser,
  loungeCfR2ParseObjectKeyFromPublicUrl,
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
          error: `Image cleanup is not configured (missing Cloudflare R2 credentials on the server).${loungeCfR2ConfigHint()}`,
        }),
        { status: 503, headers: { ...loungeCfR2CorsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { user } = await loungeCfR2RequireUser(req)

    let publicUrl = ''
    let objectKey = ''
    try {
      const body = (await req.json()) as { publicUrl?: string; objectKey?: string }
      publicUrl = typeof body?.publicUrl === 'string' ? body.publicUrl.trim() : ''
      objectKey = typeof body?.objectKey === 'string' ? body.objectKey.trim().replace(/^\/+/, '') : ''
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
        status: 400,
        headers: { ...loungeCfR2CorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!objectKey && publicUrl) {
      objectKey = loungeCfR2ParseObjectKeyFromPublicUrl(cfg, publicUrl)
    }
    if (!objectKey) {
      return new Response(JSON.stringify({ error: 'Missing or invalid publicUrl / objectKey.' }), {
        status: 400,
        headers: { ...loungeCfR2CorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!loungeCfR2KeyOwnedByUser(objectKey, user.id)) {
      return new Response(JSON.stringify({ error: 'You do not have permission to remove this image.' }), {
        status: 403,
        headers: { ...loungeCfR2CorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await loungeCfR2DeleteObject(cfg, objectKey)

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...loungeCfR2CorsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    if (e instanceof Response) return e
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: msg || 'Server error' }), {
      status: 500,
      headers: { ...loungeCfR2CorsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
