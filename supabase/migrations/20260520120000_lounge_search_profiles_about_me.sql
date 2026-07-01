-- Profile search: return about_me for result rows. See supabase/lounge_search_phase_g.sql.

create or replace function public.lounge_search_profiles(
  p_query text,
  p_limit integer default 20
)
returns table (
  user_id uuid,
  handle text,
  display_name text,
  avatar_url text,
  role text,
  is_og boolean,
  about_me text
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  term text;
  handle_term text;
  lim int;
begin
  if auth.uid() is null then
    raise exception 'LOUNGE_SEARCH_AUTH_REQUIRED'
      using message = 'Sign in to search profiles.';
  end if;

  term := public.lounge_normalize_search_term(p_query);
  if char_length(term) < 2 then
    return;
  end if;

  handle_term := term;
  if left(handle_term, 1) = '@' then
    handle_term := substring(handle_term from 2);
  end if;

  lim := greatest(1, least(coalesce(p_limit, 20), 40));

  return query
  select
    p.user_id,
    p.handle,
    p.display_name,
    p.avatar_url,
    p.role,
    coalesce(p.is_og, false),
    p.about_me
  from public.profiles p
  where p.banned_at is null
    and (
      lower(p.handle) like '%' || handle_term || '%'
      or lower(p.display_name) like '%' || term || '%'
    )
  order by
    case
      when lower(p.handle) = handle_term then 0
      when lower(p.handle) like handle_term || '%' then 1
      when lower(p.display_name) like term || '%' then 2
      else 3
    end,
    p.display_name asc
  limit lim;
end;
$$;
