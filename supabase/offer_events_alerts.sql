-- Per-event reminder schedule for offer push (see computeOfferAlertFireIso in app).
alter table public.offer_events
  add column if not exists alert_preset text not null default 'none'
  check (alert_preset in ('none', 'day_9am', 'hour_before'));

alter table public.offer_events
  add column if not exists alert_fire_at timestamptz;

comment on column public.offer_events.alert_preset is 'none | day_9am (9:00 local on start day) | hour_before (60 min before start)';
comment on column public.offer_events.alert_fire_at is 'When to fire web push; null if alert_preset is none';
