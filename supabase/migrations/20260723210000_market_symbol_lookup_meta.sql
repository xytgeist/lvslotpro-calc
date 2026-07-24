-- Tracks daily bulk sync for cashtag symbol lookup (`market_instruments`).

create table if not exists public.market_symbol_lookup_meta (
  id int primary key default 1 check (id = 1),
  last_sync_at timestamptz not null default '1970-01-01'::timestamptz,
  row_count int not null default 0
);

insert into public.market_symbol_lookup_meta (id)
values (1)
on conflict (id) do nothing;

comment on table public.market_symbol_lookup_meta is
  'Single-row metadata for Edge daily market_instruments bulk sync (tickers + diff logos).';

alter table public.market_symbol_lookup_meta enable row level security;

-- Edge service role only; no client policies.
