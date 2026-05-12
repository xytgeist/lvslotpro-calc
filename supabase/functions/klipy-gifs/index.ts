import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type KlipyItemOut = { id: string; title: string; gifUrl: string; previewUrl: string }

function getNested(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj
  for (const key of path) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[key]
  }
  return cur
}

function pickFromItem(item: Record<string, unknown>): KlipyItemOut | null {
  const bag = (item.file ?? item.files) as Record<string, unknown> | undefined
  if (!bag || typeof bag !== 'object') return null

  const gifUrl = String(
    getNested(bag, ['hd', 'gif', 'url']) ??
      getNested(bag, ['gif', 'gif', 'url']) ??
      getNested(bag, ['original', 'gif', 'url']) ??
      getNested(bag, ['gif', 'url']) ??
      '',
  ).trim()

  const previewUrl = String(
    getNested(bag, ['xs', 'jpg', 'url']) ??
      getNested(bag, ['sm', 'jpg', 'url']) ??
      getNested(bag, ['md', 'jpg', 'url']) ??
      gifUrl,
  ).trim()

  if (!gifUrl) return null

  const id = String(item.slug ?? item.id ?? item.uuid ?? Math.random().toString(36).slice(2)).slice(0, 200)
  const title = String(item.title ?? item.content_description ?? '').trim().slice(0, 240)

  return { id, title, gifUrl, previewUrl: previewUrl || gifUrl }
}

function unwrapGifList(payload: unknown): unknown[] {
  if (!payload || typeof payload !== 'object') return []
  const root = payload as Record<string, unknown>

  if (root.result === true && root.data != null && typeof root.data === 'object') {
    const inner = root.data as Record<string, unknown>
    if (Array.isArray(inner.data)) return inner.data
  }

  const d = root.data
  if (Array.isArray(d)) return d
  if (d && typeof d === 'object' && Array.isArray((d as Record<string, unknown>).data)) {
    return (d as Record<string, unknown>).data as unknown[]
  }
  return []
}

function unwrapHasNext(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false
  const root = payload as Record<string, unknown>
  if (root.result === true && root.data != null && typeof root.data === 'object') {
    const inner = root.data as Record<string, unknown>
    if (typeof inner.has_next === 'boolean') return inner.has_next
    if (typeof inner.hasNext === 'boolean') return inner.hasNext
  }
  const d = root.data
  if (d && typeof d === 'object') {
    const o = d as Record<string, unknown>
    if (typeof o.has_next === 'boolean') return o.has_next
    if (typeof o.hasNext === 'boolean') return o.hasNext
  }
  return false
}

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const klipyKey = Deno.env.get('KLIPY_API_KEY')?.trim()
    if (!supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: 'Server is missing Supabase env.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!klipyKey) {
      return new Response(JSON.stringify({ error: 'KLIPY_API_KEY is not configured for this project.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.toLowerCase().startsWith('bearer ')) {
      return new Response(JSON.stringify({ error: 'Sign in to search GIFs.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Sign in to search GIFs.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let body: Record<string, unknown>
    try {
      body = (await req.json()) as Record<string, unknown>
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const kind = String(body.kind || body.type || '').toLowerCase()
    const page = Math.max(1, Math.min(500, Number(body.page) || 1))
    const perPage = Math.max(8, Math.min(50, Number(body.per_page) || 24))

    const encKey = encodeURIComponent(klipyKey)
    let upstreamUrl: string
    if (kind === 'trending') {
      upstreamUrl = `https://api.klipy.com/api/v1/${encKey}/gifs/trending?page=${page}&per_page=${perPage}`
    } else if (kind === 'search') {
      const q = String(body.q || '').trim().slice(0, 120)
      if (!q) {
        return new Response(JSON.stringify({ error: 'Search query is required.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const locale = String(body.locale || '').trim().slice(0, 12)
      const rating = String(body.rating || 'g').trim().slice(0, 8)
      const loc = locale ? `&locale=${encodeURIComponent(locale)}` : ''
      upstreamUrl = `https://api.klipy.com/api/v1/${encKey}/gifs/search?q=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}&rating=${encodeURIComponent(rating)}${loc}`
    } else {
      return new Response(JSON.stringify({ error: 'Unknown kind. Use "search" or "trending".' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const ua = req.headers.get('user-agent') || 'LVSlotPro-KlipyProxy/1'
    const klipyRes = await fetch(upstreamUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': ua.slice(0, 400),
      },
    })

    const rawText = await klipyRes.text()
    if (!klipyRes.ok) {
      return new Response(
        JSON.stringify({
          error: `Klipy request failed (${klipyRes.status}).`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(rawText)
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid response from Klipy.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rawList = unwrapGifList(parsed)
    const items: KlipyItemOut[] = []
    for (const row of rawList) {
      if (!row || typeof row !== 'object') continue
      const picked = pickFromItem(row as Record<string, unknown>)
      if (picked) items.push(picked)
    }

    return new Response(
      JSON.stringify({
        items,
        hasNext: unwrapHasNext(parsed),
        page,
        perPage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: msg || 'Unexpected error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
