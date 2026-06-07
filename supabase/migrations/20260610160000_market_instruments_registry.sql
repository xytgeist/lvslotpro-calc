-- Canonical market instrument metadata (lazy-fill + seed). Hot quotes stay in market_quote_cache / embeds.

create table if not exists public.market_instruments (
  cache_key text primary key,
  display_symbol text not null,
  asset_class text not null check (asset_class in ('stock', 'crypto')),
  symbol text not null,
  coin_id text,
  name text not null default '',
  exchange text not null default '',
  logo_url text not null default '',
  market_cap_usd double precision,
  listing_currency text not null default 'USD',
  metadata_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists market_instruments_display_symbol_idx
  on public.market_instruments (upper(display_symbol), asset_class);

comment on table public.market_instruments is
  'Stable instrument identity: Finnhub/Yahoo symbol, CoinGecko coin_id, logo/name/mcap. Filled on attach/search seed; read on rolling batch for coin_id.';

comment on column public.market_instruments.cache_key is
  'Lowercase `{asset_class}:{provider_symbol}` e.g. crypto:binance:btcusdt, stock:aapl';

alter table public.market_instruments enable row level security;

drop policy if exists market_instruments_select_authenticated on public.market_instruments;
create policy market_instruments_select_authenticated on public.market_instruments
  for select to authenticated
  using (true);

-- Edge (service role) writes; no direct client insert/update.

-- Seed top crypto cashtags (CoinGecko coin_id). Keep in sync with marketCashtagCrypto.ts.
insert into public.market_instruments (cache_key, display_symbol, asset_class, symbol, coin_id, name, exchange)
values
  ('crypto:binance:btcusdt', 'BTC', 'crypto', 'BINANCE:BTCUSDT', 'bitcoin', 'Bitcoin', 'Crypto'),
  ('crypto:binance:ethusdt', 'ETH', 'crypto', 'BINANCE:ETHUSDT', 'ethereum', 'Ethereum', 'Crypto'),
  ('crypto:binance:solusdt', 'SOL', 'crypto', 'BINANCE:SOLUSDT', 'solana', 'Solana', 'Crypto'),
  ('crypto:binance:dogeusdt', 'DOGE', 'crypto', 'BINANCE:DOGEUSDT', 'dogecoin', 'Dogecoin', 'Crypto'),
  ('crypto:binance:xrpusdt', 'XRP', 'crypto', 'BINANCE:XRPUSDT', 'ripple', 'XRP', 'Crypto'),
  ('crypto:binance:adausdt', 'ADA', 'crypto', 'BINANCE:ADAUSDT', 'cardano', 'Cardano', 'Crypto'),
  ('crypto:binance:avaxusdt', 'AVAX', 'crypto', 'BINANCE:AVAXUSDT', 'avalanche-2', 'Avalanche', 'Crypto'),
  ('crypto:binance:linkusdt', 'LINK', 'crypto', 'BINANCE:LINKUSDT', 'chainlink', 'Chainlink', 'Crypto'),
  ('crypto:binance:bnbusdt', 'BNB', 'crypto', 'BINANCE:BNBUSDT', 'binancecoin', 'BNB', 'Crypto'),
  ('crypto:binance:ltcusdt', 'LTC', 'crypto', 'BINANCE:LTCUSDT', 'litecoin', 'Litecoin', 'Crypto'),
  ('crypto:binance:dotusdt', 'DOT', 'crypto', 'BINANCE:DOTUSDT', 'polkadot', 'Polkadot', 'Crypto'),
  ('crypto:binance:maticusdt', 'MATIC', 'crypto', 'BINANCE:MATICUSDT', 'matic-network', 'Polygon', 'Crypto'),
  ('crypto:binance:shibusdt', 'SHIB', 'crypto', 'BINANCE:SHIBUSDT', 'shiba-inu', 'Shiba Inu', 'Crypto'),
  ('crypto:binance:uniusdt', 'UNI', 'crypto', 'BINANCE:UNIUSDT', 'uniswap', 'Uniswap', 'Crypto'),
  ('crypto:binance:atomusdt', 'ATOM', 'crypto', 'BINANCE:ATOMUSDT', 'cosmos', 'Cosmos', 'Crypto'),
  ('crypto:binance:bchusdt', 'BCH', 'crypto', 'BINANCE:BCHUSDT', 'bitcoin-cash', 'Bitcoin Cash', 'Crypto'),
  ('crypto:binance:xlmusdt', 'XLM', 'crypto', 'BINANCE:XLMUSDT', 'stellar', 'Stellar', 'Crypto'),
  ('crypto:binance:etcusdt', 'ETC', 'crypto', 'BINANCE:ETCUSDT', 'ethereum-classic', 'Ethereum Classic', 'Crypto'),
  ('crypto:binance:filusdt', 'FIL', 'crypto', 'BINANCE:FILUSDT', 'filecoin', 'Filecoin', 'Crypto'),
  ('crypto:binance:nearusdt', 'NEAR', 'crypto', 'BINANCE:NEARUSDT', 'near', 'NEAR Protocol', 'Crypto'),
  ('crypto:binance:aptusdt', 'APT', 'crypto', 'BINANCE:APTUSDT', 'aptos', 'Aptos', 'Crypto'),
  ('crypto:binance:arbusdt', 'ARB', 'crypto', 'BINANCE:ARBUSDT', 'arbitrum', 'Arbitrum', 'Crypto'),
  ('crypto:binance:opusdt', 'OP', 'crypto', 'BINANCE:OPUSDT', 'optimism', 'Optimism', 'Crypto'),
  ('crypto:binance:pepeusdt', 'PEPE', 'crypto', 'BINANCE:PEPEUSDT', 'pepe', 'Pepe', 'Crypto'),
  ('crypto:binance:wifusdt', 'WIF', 'crypto', 'BINANCE:WIFUSDT', 'dogwifcoin', 'dogwifhat', 'Crypto'),
  ('crypto:binance:bonkusdt', 'BONK', 'crypto', 'BINANCE:BONKUSDT', 'bonk', 'Bonk', 'Crypto'),
  ('crypto:binance:hbarusdt', 'HBAR', 'crypto', 'BINANCE:HBARUSDT', 'hedera-hashgraph', 'Hedera', 'Crypto'),
  ('crypto:binance:icpusdt', 'ICP', 'crypto', 'BINANCE:ICPUSDT', 'internet-computer', 'Internet Computer', 'Crypto'),
  ('crypto:binance:vetusdt', 'VET', 'crypto', 'BINANCE:VETUSDT', 'vechain', 'VeChain', 'Crypto'),
  ('crypto:binance:algousdt', 'ALGO', 'crypto', 'BINANCE:ALGOUSDT', 'algorand', 'Algorand', 'Crypto'),
  ('crypto:binance:aaveusdt', 'AAVE', 'crypto', 'BINANCE:AAVEUSDT', 'aave', 'Aave', 'Crypto'),
  ('crypto:binance:mkrusdt', 'MKR', 'crypto', 'BINANCE:MKRUSDT', 'maker', 'Maker', 'Crypto'),
  ('crypto:binance:crousdt', 'CRO', 'crypto', 'BINANCE:CROUSDT', 'crypto-com-chain', 'Cronos', 'Crypto'),
  ('crypto:binance:stxusdt', 'STX', 'crypto', 'BINANCE:STXUSDT', 'blockstack', 'Stacks', 'Crypto'),
  ('crypto:binance:injusdt', 'INJ', 'crypto', 'BINANCE:INJUSDT', 'injective-protocol', 'Injective', 'Crypto'),
  ('crypto:binance:runeusdt', 'RUNE', 'crypto', 'BINANCE:RUNEUSDT', 'thorchain', 'THORChain', 'Crypto'),
  ('crypto:binance:seiusdt', 'SEI', 'crypto', 'BINANCE:SEIUSDT', 'sei-network', 'Sei', 'Crypto'),
  ('crypto:binance:tiausdt', 'TIA', 'crypto', 'BINANCE:TIAUSDT', 'celestia', 'Celestia', 'Crypto'),
  ('crypto:binance:suiusdt', 'SUI', 'crypto', 'BINANCE:SUIUSDT', 'sui', 'Sui', 'Crypto'),
  ('crypto:binance:taousdt', 'TAO', 'crypto', 'BINANCE:TAOUSDT', 'bittensor', 'Bittensor', 'Crypto'),
  ('crypto:binance:fetusdt', 'FET', 'crypto', 'BINANCE:FETUSDT', 'fetch-ai', 'Fetch.ai', 'Crypto'),
  ('crypto:binance:renderusdt', 'RENDER', 'crypto', 'BINANCE:RENDERUSDT', 'render-token', 'Render', 'Crypto'),
  ('crypto:binance:wldusdt', 'WLD', 'crypto', 'BINANCE:WLDUSDT', 'worldcoin-wld', 'Worldcoin', 'Crypto'),
  ('crypto:binance:trxusdt', 'TRX', 'crypto', 'BINANCE:TRXUSDT', 'tron', 'TRON', 'Crypto')
on conflict (cache_key) do update set
  coin_id = excluded.coin_id,
  name = excluded.name,
  display_symbol = excluded.display_symbol,
  symbol = excluded.symbol;
