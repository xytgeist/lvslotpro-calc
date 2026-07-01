/**
 * Delete a Lounge R2 image when the caller owns the object prefix or is staff (moderator/admin).
 * Body: `{ publicUrl?: string, objectKey?: string }` — at least one required.
 */
import {
  loungeCfR2ConfigHint,
  loungeCfR2CorsHeaders,
  loungeCfR2DeleteObject,
  loungeCfR2KeyOwnedByUser,
  loungeCfR2ParseObjectKeyFromPublicUrl,
  loungeCfR2RequireUser,
  loungeCfR2ViewerIsStaff,
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

    const { admin, user } = await loungeCfR2RequireUser(req)

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

    const ownerPrefix = objectKey.split('/')[0] || ''
    const ownOk = loungeCfR2KeyOwnedByUser(objectKey, user.id)
    let staffOk = false
    if (!ownOk) {
      staffOk = await loungeCfR2ViewerIsStaff(admin, user.id)
    }
    if (!ownOk && !staffOk) {
      return new Response(JSON.stringify({ error: 'You do not have permission to remove this image.' }), {
        status: 403,
        headers: { ...loungeCfR2CorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await loungeCfR2DeleteObject(cfg, objectKey)

    return new Response(JSON.stringify({ ok: true, objectKey, ownerPrefix }), {
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
