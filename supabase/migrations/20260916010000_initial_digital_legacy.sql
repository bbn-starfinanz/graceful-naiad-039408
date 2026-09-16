create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'profile_status'
  ) then
    create type public.profile_status as enum ('alive', 'verified_dead');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'message_media_type'
  ) then
    create type public.message_media_type as enum ('audio', 'video');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  status public.profile_status not null default 'alive',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  media_type public.message_media_type not null,
  storage_path text not null unique,
  original_file_name text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  is_unlocked boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recipients (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  email text not null,
  access_token text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.b2b_partners (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_email text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.b2b_partners(id) on delete set null,
  code text not null unique,
  is_redeemed boolean not null default false,
  redeemed_by_profile_id uuid references public.profiles(id) on delete set null,
  redeemed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.death_verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  reporter_email text not null,
  deceased_name text not null,
  certificate_path text not null,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz
);

create table if not exists public.profile_audit (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profile_audit
  add constraint profile_audit_action_check
  check (action <> '');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_messages_updated_at on public.messages;
create trigger set_messages_updated_at
before update on public.messages
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.recipients enable row level security;
alter table public.vouchers enable row level security;
alter table public.death_verifications enable row level security;
alter table public.profile_audit enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own"
on public.messages
for select
to authenticated
using ((select auth.uid()) = profile_id);

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own"
on public.messages
for insert
to authenticated
with check ((select auth.uid()) = profile_id);

drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own"
on public.messages
for update
to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

drop policy if exists "recipients_select_own" on public.recipients;
create policy "recipients_select_own"
on public.recipients
for select
to authenticated
using (
  exists (
    select 1
    from public.messages
    where messages.id = recipients.message_id
      and messages.profile_id = (select auth.uid())
  )
);

drop policy if exists "recipients_insert_own" on public.recipients;
create policy "recipients_insert_own"
on public.recipients
for insert
to authenticated
with check (
  exists (
    select 1
    from public.messages
    where messages.id = recipients.message_id
      and messages.profile_id = (select auth.uid())
  )
);

drop policy if exists "recipients_update_own" on public.recipients;
create policy "recipients_update_own"
on public.recipients
for update
to authenticated
using (
  exists (
    select 1
    from public.messages
    where messages.id = recipients.message_id
      and messages.profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.messages
    where messages.id = recipients.message_id
      and messages.profile_id = (select auth.uid())
  )
);

drop policy if exists "vouchers_select_authenticated" on public.vouchers;
create policy "vouchers_select_authenticated"
on public.vouchers
for select
to authenticated
using (true);

drop policy if exists "vouchers_update_authenticated" on public.vouchers;
create policy "vouchers_update_authenticated"
on public.vouchers
for update
to authenticated
using (not is_redeemed)
with check ((select auth.uid()) = redeemed_by_profile_id);

drop policy if exists "death_verifications_insert_public" on public.death_verifications;
create policy "death_verifications_insert_public"
on public.death_verifications
for insert
to anon, authenticated
with check (true);

drop policy if exists "profile_audit_select_own" on public.profile_audit;
create policy "profile_audit_select_own"
on public.profile_audit
for select
to authenticated
using ((select auth.uid()) = profile_id);

drop policy if exists "profile_audit_insert_admin" on public.profile_audit;
create policy "profile_audit_insert_admin"
on public.profile_audit
for insert
to authenticated
with check (false);

insert into storage.buckets (id, name, public)
values ('legacy-media', 'legacy-media', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('death-certificates', 'death-certificates', false)
on conflict (id) do nothing;

drop policy if exists "legacy_media_upload_own" on storage.objects;
create policy "legacy_media_upload_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'legacy-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "legacy_media_select_own" on storage.objects;
create policy "legacy_media_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'legacy-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "death_certificates_insert_public" on storage.objects;
create policy "death_certificates_insert_public"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'death-certificates');
