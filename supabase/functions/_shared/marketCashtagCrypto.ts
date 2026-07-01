/** Keep in sync with `COMMON_CRYPTO_CASHTAGS` in `src/utils/loungeMarketCaptionParse.js` and migration seed. */
export const COMMON_CRYPTO_CASHTAGS = new Set([
  'BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'AVAX', 'LINK', 'BNB', 'LTC', 'DOT', 'MATIC', 'SHIB',
  'UNI', 'ATOM', 'BCH', 'XLM', 'ETC', 'FIL', 'NEAR', 'APT', 'ARB', 'OP', 'PEPE', 'WIF', 'BONK',
  'HBAR', 'ICP', 'VET', 'ALGO', 'AAVE', 'MKR', 'CRO', 'STX', 'INJ', 'RUNE', 'SEI', 'TIA', 'SUI',
  'TAO', 'FET', 'RENDER', 'WLD', 'TRX', 'USDT', 'USDC',
])

/** CoinGecko `/coins/{id}` — avoids `/search` on rolling OHLC when known. */
export const COINGECKO_COIN_ID_BY_TICKER: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  DOGE: 'dogecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  BNB: 'binancecoin',
  LTC: 'litecoin',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  SHIB: 'shiba-inu',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  BCH: 'bitcoin-cash',
  XLM: 'stellar',
  ETC: 'ethereum-classic',
  FIL: 'filecoin',
  NEAR: 'near',
  APT: 'aptos',
  ARB: 'arbitrum',
  OP: 'optimism',
  PEPE: 'pepe',
  WIF: 'dogwifcoin',
  BONK: 'bonk',
  HBAR: 'hedera-hashgraph',
  ICP: 'internet-computer',
  VET: 'vechain',
  ALGO: 'algorand',
  AAVE: 'aave',
  MKR: 'maker',
  CRO: 'crypto-com-chain',
  STX: 'blockstack',
  INJ: 'injective-protocol',
  RUNE: 'thorchain',
  SEI: 'sei-network',
  TIA: 'celestia',
  SUI: 'sui',
  TAO: 'bittensor',
  FET: 'fetch-ai',
  RENDER: 'render-token',
  WLD: 'worldcoin-wld',
  TRX: 'tron',
  USDT: 'tether',
  USDC: 'usd-coin',
}

export function isCommonCryptoCashtag(tag: string): boolean {
  const s = String(tag || '').trim().toUpperCase()
  return Boolean(s && COMMON_CRYPTO_CASHTAGS.has(s))
}

export function coingeckoCoinIdForTicker(tag: string): string {
  const s = String(tag || '').trim().toUpperCase()
  return s ? String(COINGECKO_COIN_ID_BY_TICKER[s] || '').trim() : ''
}
