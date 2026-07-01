-- ============================================================
-- Bankroll metrics additions
-- 1. game_type column on bankroll_sessions
-- 2. bankroll_adjustments table for manual bankroll edits
-- Run on Supabase test (and prod when promoted).
-- ============================================================

-- ── 1. game_type ─────────────────────────────────────────────────────────────

alter table public.bankroll_sessions
  add column if not exists game_type text not null default 'slots'
  check (game_type in ('slots', 'tables'));

-- ── 2. bankroll_adjustments ──────────────────────────────────────────────────
-- Stores every manual bankroll edit as a delta so the trend graph can
-- reconstruct the full history including user-initiated adjustments.

create table if not exists public.bankroll_adjustments (
  id          uuid          primary key default gen_random_uuid(),
  user_id     uuid          not null references auth.users(id) on delete cascade,
  amount      numeric(12,2) not null,   -- positive = deposit / add, negative = withdrawal / subtract
  note        text,
  occurred_at timestamptz   not null default now(),
  created_at  timestamptz   not null default now()
);

create index if not exists bankroll_adjustments_user_id_idx
  on public.bankroll_adjustments(user_id);

create index if not exists bankroll_adjustments_user_occurred_idx
  on public.bankroll_adjustments(user_id, occurred_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.bankroll_adjustments enable row level security;

drop policy if exists "bankroll_adjustments_select" on public.bankroll_adjustments;
create policy "bankroll_adjustments_select"
  on public.bankroll_adjustments for select
  using (auth.uid() = user_id);

drop policy if exists "bankroll_adjustments_insert" on public.bankroll_adjustments;
create policy "bankroll_adjustments_insert"
  on public.bankroll_adjustments for insert
  with check (auth.uid() = user_id);

drop policy if exists "bankroll_adjustments_update" on public.bankroll_adjustments;
create policy "bankroll_adjustments_update"
  on public.bankroll_adjustments for update
  using (auth.uid() = user_id);

drop policy if exists "bankroll_adjustments_delete" on public.bankroll_adjustments;
create policy "bankroll_adjustments_delete"
  on public.bankroll_adjustments for delete
  using (auth.uid() = user_id);
