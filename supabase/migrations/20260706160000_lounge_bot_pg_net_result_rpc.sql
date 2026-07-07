-- Portal: read pg_net Edge response by request_id (async Scott queue follow-up).

create or replace function public.admin_lounge_bot_pg_net_result(p_request_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, net, pg_temp
as $$
declare
  v_row net._http_response%rowtype;
  v_body jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if not public.play_log_viewer_is_admin() then
    raise exception 'admin only';
  end if;

  if p_request_id is null or p_request_id <= 0 then
    raise exception 'request_id required';
  end if;

  select *
  into v_row
  from net._http_response r
  where r.id = p_request_id;

  if not found then
    return jsonb_build_object('ready', false, 'request_id', p_request_id);
  end if;

  begin
    v_body := v_row.content::jsonb;
  exception
    when others then
      v_body := jsonb_build_object('raw', left(coalesce(v_row.content, ''), 2000));
  end;

  return jsonb_build_object(
    'ready', true,
    'request_id', p_request_id,
    'status_code', v_row.status_code,
    'timed_out', coalesce(v_row.timed_out, false),
    'error_msg', v_row.error_msg,
    'body', v_body
  );
end;
$$;

comment on function public.admin_lounge_bot_pg_net_result(bigint) is
  'Admin portal: poll net._http_response for async Scott Edge invoke (queue RPC request_id).';

revoke all on function public.admin_lounge_bot_pg_net_result(bigint) from public;
grant execute on function public.admin_lounge_bot_pg_net_result(bigint) to authenticated;
