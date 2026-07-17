-- Admin affiliate upsert: link creators by profile handle (resolve → user_id).
-- Snapshot includes linked_handle for the edit form.

create or replace function public.admin_affiliate_upsert(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := nullif(trim(coalesce(p_payload->>'id', '')), '')::uuid;
  v_code text := lower(trim(coalesce(p_payload->>'code', '')));
  v_package_id uuid;
  v_package_slug text := lower(trim(coalesce(p_payload->>'package_slug', '')));
  v_user_id uuid := null;
  v_handle text := lower(trim(coalesce(
    p_payload->>'linked_handle',
    p_payload->>'handle',
    ''
  )));
  v_status text := coalesce(nullif(trim(p_payload->>'status'), ''), 'invited');
  v_row public.affiliates%rowtype;
  v_link_by_handle boolean := (p_payload ? 'linked_handle') or (p_payload ? 'handle');
begin
  if not public.play_log_viewer_is_admin() then
    raise exception 'admin only';
  end if;

  if v_code = '' then
    raise exception 'code is required';
  end if;

  if v_status not in ('invited', 'active', 'disabled') then
    raise exception 'invalid status';
  end if;

  if p_payload ? 'package_id' and nullif(trim(coalesce(p_payload->>'package_id', '')), '') is not null then
    v_package_id := (p_payload->>'package_id')::uuid;
  else
    select id into v_package_id
    from public.affiliate_packages
    where slug = v_package_slug
      and active = true
    limit 1;
  end if;

  if v_package_id is null then
    raise exception 'package_id or package_slug required';
  end if;

  -- Strip leading @ from handles.
  if left(v_handle, 1) = '@' then
    v_handle := substr(v_handle, 2);
  end if;

  if v_link_by_handle then
    if v_handle = '' then
      v_user_id := null;
    else
      select p.user_id into v_user_id
      from public.profiles p
      where lower(p.handle) = v_handle
      limit 1;

      if v_user_id is null then
        raise exception 'No profile found for handle @%', v_handle;
      end if;
    end if;
  elsif p_payload ? 'user_id' then
    v_user_id := nullif(trim(coalesce(p_payload->>'user_id', '')), '')::uuid;
  end if;

  if v_id is null then
    insert into public.affiliates (
      code,
      promo_code,
      stripe_coupon_id,
      stripe_promotion_code_id,
      package_id,
      display_name,
      contact_email,
      user_id,
      status,
      payout_notes
    ) values (
      v_code,
      nullif(trim(coalesce(p_payload->>'promo_code', '')), ''),
      nullif(trim(coalesce(p_payload->>'stripe_coupon_id', '')), ''),
      nullif(trim(coalesce(p_payload->>'stripe_promotion_code_id', '')), ''),
      v_package_id,
      coalesce(nullif(trim(p_payload->>'display_name'), ''), v_code),
      nullif(trim(coalesce(p_payload->>'contact_email', '')), ''),
      v_user_id,
      v_status,
      nullif(trim(coalesce(p_payload->>'payout_notes', '')), '')
    )
    returning * into v_row;
  else
    update public.affiliates a
    set
      code = v_code,
      promo_code = case
        when p_payload ? 'promo_code' then nullif(trim(coalesce(p_payload->>'promo_code', '')), '')
        else a.promo_code
      end,
      stripe_coupon_id = case
        when p_payload ? 'stripe_coupon_id' then nullif(trim(coalesce(p_payload->>'stripe_coupon_id', '')), '')
        else a.stripe_coupon_id
      end,
      stripe_promotion_code_id = case
        when p_payload ? 'stripe_promotion_code_id' then nullif(trim(coalesce(p_payload->>'stripe_promotion_code_id', '')), '')
        else a.stripe_promotion_code_id
      end,
      package_id = v_package_id,
      display_name = coalesce(nullif(trim(p_payload->>'display_name'), ''), a.display_name),
      contact_email = case
        when p_payload ? 'contact_email' then nullif(trim(coalesce(p_payload->>'contact_email', '')), '')
        else a.contact_email
      end,
      user_id = case
        when v_link_by_handle or (p_payload ? 'user_id') then v_user_id
        else a.user_id
      end,
      status = v_status,
      payout_notes = case
        when p_payload ? 'payout_notes' then nullif(trim(coalesce(p_payload->>'payout_notes', '')), '')
        else a.payout_notes
      end,
      updated_at = now()
    where a.id = v_id
    returning * into v_row;

    if not found then
      raise exception 'affiliate not found';
    end if;
  end if;

  return to_jsonb(v_row) || jsonb_build_object(
    'linked_handle', (
      select p.handle
      from public.profiles p
      where p.user_id = v_row.user_id
      limit 1
    )
  );
end;
$$;

revoke all on function public.admin_affiliate_upsert(jsonb) from public;
grant execute on function public.admin_affiliate_upsert(jsonb) to authenticated;

create or replace function public.admin_affiliate_portal_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_packages jsonb;
  v_affiliates jsonb;
  v_commissions jsonb;
begin
  if not public.play_log_viewer_is_admin() then
    raise exception 'admin only';
  end if;

  perform public.affiliate_promote_payable_commissions();

  select coalesce(jsonb_agg(to_jsonb(p) order by p.commission_pct_monthly), '[]'::jsonb)
  into v_packages
  from public.affiliate_packages p;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'code', a.code,
        'promo_code', a.promo_code,
        'stripe_coupon_id', a.stripe_coupon_id,
        'stripe_promotion_code_id', a.stripe_promotion_code_id,
        'package_id', a.package_id,
        'package_slug', pkg.slug,
        'display_name', a.display_name,
        'contact_email', a.contact_email,
        'user_id', a.user_id,
        'linked_handle', p.handle,
        'status', a.status,
        'payout_notes', a.payout_notes,
        'stripe_connect_account_id', a.stripe_connect_account_id,
        'connect_onboarding_complete', a.connect_onboarding_complete,
        'created_at', a.created_at,
        'updated_at', a.updated_at,
        'tax_status', coalesce(t.status, 'incomplete'),
        'pending_cents', coalesce((
          select sum(c.commission_cents)::bigint
          from public.affiliate_commissions c
          where c.affiliate_id = a.id and c.status = 'pending'
        ), 0),
        'payable_cents', coalesce((
          select sum(c.commission_cents)::bigint
          from public.affiliate_commissions c
          where c.affiliate_id = a.id and c.status = 'payable'
        ), 0),
        'paid_cents', coalesce((
          select sum(c.commission_cents)::bigint
          from public.affiliate_commissions c
          where c.affiliate_id = a.id and c.status = 'paid'
        ), 0)
      )
      order by a.created_at desc
    ),
    '[]'::jsonb
  )
  into v_affiliates
  from public.affiliates a
  join public.affiliate_packages pkg on pkg.id = a.package_id
  left join public.profiles p on p.user_id = a.user_id
  left join public.affiliate_tax_profiles t on t.affiliate_id = a.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'affiliate_id', c.affiliate_id,
        'affiliate_code', a.code,
        'affiliate_name', a.display_name,
        'user_id', c.user_id,
        'stripe_checkout_session_id', c.stripe_checkout_session_id,
        'stripe_invoice_id', c.stripe_invoice_id,
        'stripe_payment_intent_id', c.stripe_payment_intent_id,
        'product_slug', c.product_slug,
        'price_interval', c.price_interval,
        'gross_cents', c.gross_cents,
        'discount_cents', c.discount_cents,
        'net_cents', c.net_cents,
        'commission_pct', c.commission_pct,
        'commission_cents', c.commission_cents,
        'status', c.status,
        'payable_at', c.payable_at,
        'paid_at', c.paid_at,
        'payout_ref', c.payout_ref,
        'void_reason', c.void_reason,
        'clawback_flag', c.clawback_flag,
        'created_at', c.created_at
      )
      order by c.created_at desc
    ),
    '[]'::jsonb
  )
  into v_commissions
  from public.affiliate_commissions c
  join public.affiliates a on a.id = c.affiliate_id;

  return jsonb_build_object(
    'packages', v_packages,
    'affiliates', v_affiliates,
    'commissions', v_commissions,
    'hold_days', public.affiliate_hold_days()
  );
end;
$$;

revoke all on function public.admin_affiliate_portal_snapshot() from public;
grant execute on function public.admin_affiliate_portal_snapshot() to anon, authenticated, service_role;

notify pgrst, 'reload schema';
