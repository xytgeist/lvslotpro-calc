-- Server-side Lounge post drafts (caption, tribes, GIF URL, uploaded image URLs).
-- Local video is not persisted — client prompts to re-attach after restore.

create table if not exists public.lounge_post_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  caption text not null default '',
  category_pills text[] not null default '{}'::text[],
  gif_url text not null default '',
  image_urls jsonb not null default '[]'::jsonb,
  quote_repost_of_post_id uuid references public.community_feed_posts (id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint lounge_post_drafts_caption_len check (char_length(caption) <= 1000)
);

create index if not exists lounge_post_drafts_user_updated_idx
  on public.lounge_post_drafts (user_id, updated_at desc);

comment on table public.lounge_post_drafts is
  'Per-user Lounge compose drafts (not shown in feed). Max 20 rows per user.';

create or replace function public.lounge_post_drafts_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  draft_count int;
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  if new.user_id is distinct from auth.uid() then
    raise exception 'Not allowed';
  end if;

  new.updated_at := now();

  if tg_op = 'INSERT' then
    select count(*)::int into draft_count
    from public.lounge_post_drafts d
    where d.user_id = new.user_id;
    if draft_count >= 20 then
      raise exception 'Draft limit reached (20). Delete an old draft first.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_lounge_post_drafts_before_write on public.lounge_post_drafts;
create trigger trg_lounge_post_drafts_before_write
  before insert or update on public.lounge_post_drafts
  for each row
  execute function public.lounge_post_drafts_before_write();

alter table public.lounge_post_drafts enable row level security;

drop policy if exists lounge_post_drafts_select_own on public.lounge_post_drafts;
create policy lounge_post_drafts_select_own on public.lounge_post_drafts
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists lounge_post_drafts_insert_own on public.lounge_post_drafts;
create policy lounge_post_drafts_insert_own on public.lounge_post_drafts
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists lounge_post_drafts_update_own on public.lounge_post_drafts;
create policy lounge_post_drafts_update_own on public.lounge_post_drafts
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists lounge_post_drafts_delete_own on public.lounge_post_drafts;
create policy lounge_post_drafts_delete_own on public.lounge_post_drafts
  for delete to authenticated
  using (auth.uid() = user_id);
