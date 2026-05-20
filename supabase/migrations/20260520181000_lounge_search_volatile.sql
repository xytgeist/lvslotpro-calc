-- lounge_search writes rate_limit_events + lounge_search_analytics; STABLE RPCs run read-only on Supabase.

alter function public.lounge_search(
  text, text, integer, integer, integer, integer, integer, integer
) volatile;
