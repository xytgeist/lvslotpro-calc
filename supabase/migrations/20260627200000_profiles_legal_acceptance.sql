-- Legal acceptance timestamps on profiles (Terms + Privacy at signup / policy updates).

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists legal_policy_version text;

comment on column public.profiles.terms_accepted_at is
  'When the user accepted the current Terms & Conditions.';
comment on column public.profiles.privacy_accepted_at is
  'When the user accepted the current Privacy Policy.';
comment on column public.profiles.legal_policy_version is
  'Policy version string accepted by the user (see src/features/legal/legalPolicyVersion.js).';

-- Existing accounts: treat as accepted at profile creation for the launch version.
update public.profiles
set
  terms_accepted_at = coalesce(terms_accepted_at, created_at, now()),
  privacy_accepted_at = coalesce(privacy_accepted_at, created_at, now()),
  legal_policy_version = coalesce(legal_policy_version, '2026-06-27')
where terms_accepted_at is null
   or privacy_accepted_at is null
   or legal_policy_version is null;
