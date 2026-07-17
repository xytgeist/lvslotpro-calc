-- Repair: ensure affiliate admin RPCs are visible to PostgREST (PGRST202 schema cache).
-- Idempotent recreate of the zero-arg snapshot + grants + reload notify.

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

-- Unnamed jsonb overload: some PostgREST clients look for this signature too.
create or replace function public.admin_affiliate_portal_snapshot(jsonb)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.admin_affiliate_portal_snapshot();
$$;

revoke all on function public.admin_affiliate_portal_snapshot(jsonb) from public;
grant execute on function public.admin_affiliate_portal_snapshot(jsonb) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
select pg_notify('pgrst', 'reload config');
