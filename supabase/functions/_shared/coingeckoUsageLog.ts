/**
 * Per-request CoinGecko call accounting for `lounge-market-data` debugging.
 * Enable via POST body `debug_coingecko: true` or Edge secret `LOUNGE_MARKET_DEBUG_COINGECKO=1`.
 */

export type CoingeckoCallRecord = {
  seq: number
  endpoint: string
  reason: string
  params?: Record<string, string>
  cache_hit: boolean
  ms: number
  ok: boolean
  error?: string
}

export type CoingeckoUsageSummary = {
  request_id: string
  action: string
  meta: Record<string, unknown>
  duration_ms: number
  network_calls: number
  cache_hits: number
  calls: CoingeckoCallRecord[]
  by_reason: Record<string, number>
  by_endpoint: Record<string, number>
}

type UsageScope = {
  requestId: string
  action: string
  meta: Record<string, unknown>
  calls: CoingeckoCallRecord[]
  startedAt: number
  seq: number
  emitConsoleLog: boolean
}

const scopeStack: UsageScope[] = []

function getScope(): UsageScope | null {
  return scopeStack.length ? scopeStack[scopeStack.length - 1] : null
}

export function shouldDebugCoingecko(body: Record<string, unknown> | null | undefined): boolean {
  if (body?.debug_coingecko === true) return true
  const env = String(Deno.env.get('LOUNGE_MARKET_DEBUG_COINGECKO') || '').trim().toLowerCase()
  return env === '1' || env === 'true' || env === 'yes'
}

export function buildCoingeckoActionMeta(
  action: string,
  body: Record<string, unknown>,
): Record<string, unknown> {
  const meta: Record<string, unknown> = { action }
  const q = String(body?.query || body?.q || '').trim()
  if (q) meta.query = q.slice(0, 32)
  const symbol = String(body?.symbol || '').trim()
  if (symbol) meta.symbol = symbol
  const assetClass = String(body?.asset_class || '').trim()
  if (assetClass) meta.asset_class = assetClass
  if (body?.refresh === true) meta.refresh = true
  if (body?.before_sec != null && body.before_sec !== '') meta.before_sec = body.before_sec
  const resolution = String(body?.resolution || '').trim()
  if (resolution) meta.resolution = resolution
  const kind = String(body?.kind || '').trim()
  if (kind) meta.kind = kind
  const rawSymbols = Array.isArray(body?.symbols) ? body.symbols : []
  if (rawSymbols.length) meta.symbols_count = rawSymbols.length
  const postId = String(body?.post_id || body?.entity_id || '').trim()
  if (postId) meta.post_id = postId.slice(0, 8)
  return meta
}

export function summarizeCoingeckoUsage(scope: UsageScope): CoingeckoUsageSummary {
  const by_reason: Record<string, number> = {}
  const by_endpoint: Record<string, number> = {}
  let network_calls = 0
  let cache_hits = 0
  for (const call of scope.calls) {
    if (call.cache_hit) {
      cache_hits += 1
    } else {
      network_calls += 1
    }
    by_reason[call.reason] = (by_reason[call.reason] || 0) + 1
    by_endpoint[call.endpoint] = (by_endpoint[call.endpoint] || 0) + 1
  }
  return {
    request_id: scope.requestId,
    action: scope.action,
    meta: scope.meta,
    duration_ms: Date.now() - scope.startedAt,
    network_calls,
    cache_hits,
    calls: scope.calls,
    by_reason,
    by_endpoint,
  }
}

export function flushCoingeckoUsageLog(scope: UsageScope) {
  if (!scope.calls.length || !scope.emitConsoleLog) return
  const summary = summarizeCoingeckoUsage(scope)
  console.log('[coingeckoUsage]', JSON.stringify(summary))
}

export function attachCoingeckoDebugPayload(
  requestBody: Record<string, unknown>,
  responseBody: Record<string, unknown>,
): Record<string, unknown> {
  if (!shouldDebugCoingecko(requestBody)) return responseBody
  const scope = getScope()
  if (!scope) return responseBody
  return {
    ...responseBody,
    _debug: {
      coingecko: summarizeCoingeckoUsage(scope),
    },
  }
}

export async function runCoingeckoUsageScope<T>(
  meta: { action: string; meta?: Record<string, unknown>; emitConsoleLog?: boolean },
  fn: () => Promise<T>,
): Promise<T> {
  const scope: UsageScope = {
    requestId: crypto.randomUUID().slice(0, 8),
    action: meta.action,
    meta: meta.meta ?? {},
    calls: [],
    startedAt: Date.now(),
    seq: 0,
    emitConsoleLog: meta.emitConsoleLog ?? shouldDebugCoingecko(undefined),
  }
  scopeStack.push(scope)
  try {
    return await fn()
  } finally {
    scopeStack.pop()
    flushCoingeckoUsageLog(scope)
  }
}

export function recordCoingeckoCall(input: {
  endpoint: string
  reason: string
  params?: Record<string, string>
  cache_hit?: boolean
  ms?: number
  ok?: boolean
  error?: string
}) {
  const scope = getScope()
  if (!scope) return
  scope.seq += 1
  scope.calls.push({
    seq: scope.seq,
    endpoint: input.endpoint,
    reason: input.reason,
    params: input.params,
    cache_hit: input.cache_hit === true,
    ms: Math.max(0, Math.floor(Number(input.ms) || 0)),
    ok: input.ok !== false,
    error: input.error,
  })
}
