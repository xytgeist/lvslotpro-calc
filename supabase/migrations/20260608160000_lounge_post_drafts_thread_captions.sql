-- Persist multi-part thread drafts; empty array = single-post draft (caption only).

alter table public.lounge_post_drafts
  add column if not exists thread_captions text[] not null default '{}'::text[];

comment on column public.lounge_post_drafts.thread_captions is
  'Ordered thread part captions when length > 1 (part 1 = root). Empty = use caption only.';

-- CHECK constraints cannot use subqueries; validate array shape via function.
create or replace function public.lounge_post_draft_thread_captions_valid(p_parts text[])
returns boolean
language sql
immutable
as $$
  select cardinality(coalesce(p_parts, '{}'::text[])) <= 25
    and coalesce(
      (
        select bool_and(char_length(part) <= 320)
        from unnest(coalesce(p_parts, '{}'::text[])) as part
      ),
      true
    );
$$;

alter table public.lounge_post_drafts
  drop constraint if exists lounge_post_drafts_thread_captions_len;

alter table public.lounge_post_drafts
  add constraint lounge_post_drafts_thread_captions_len
  check (public.lounge_post_draft_thread_captions_valid(thread_captions));
