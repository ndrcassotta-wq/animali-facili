do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'partner_member_role'
  ) then
    create type public.partner_member_role as enum ('owner', 'editor');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'partner_member_status'
  ) then
    create type public.partner_member_status as enum ('pending', 'active', 'revoked');
  end if;
end
$$;

create table public.partner_members (
  id uuid primary key default gen_random_uuid(),
  partner_profile_id uuid not null references public.partner_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.partner_member_role not null default 'owner',
  status public.partner_member_status not null default 'pending',
  created_via text not null default 'application',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz null,
  revoked_at timestamptz null,
  constraint partner_members_partner_profile_user_unique unique (partner_profile_id, user_id),
  constraint partner_members_created_via_check
    check (created_via in ('application', 'claim', 'invite', 'admin'))
);

create index idx_partner_members_partner_profile_id
  on public.partner_members(partner_profile_id);

create index idx_partner_members_user_id
  on public.partner_members(user_id);

create index idx_partner_members_status
  on public.partner_members(status);

create unique index uq_partner_members_live_owner_per_partner
  on public.partner_members(partner_profile_id)
  where role = 'owner' and status in ('pending', 'active');

create or replace function public.set_partner_members_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_partner_members_set_updated_at
before update on public.partner_members
for each row
execute function public.set_partner_members_updated_at();

create or replace function public.activate_pending_partner_owner_memberships_on_approval()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'approvato'
     and (
       tg_op = 'INSERT'
       or old.status is distinct from new.status
     ) then
    update public.partner_members
    set
      status = 'active',
      activated_at = coalesce(activated_at, now()),
      updated_at = now()
    where partner_profile_id = new.id
      and role = 'owner'
      and status = 'pending';
  end if;

  return new;
end;
$$;

create trigger trg_partner_profiles_activate_pending_owner_memberships
after insert or update of status on public.partner_profiles
for each row
execute function public.activate_pending_partner_owner_memberships_on_approval();

alter table public.partner_members enable row level security;

grant select, insert on table public.partner_members to authenticated;
grant all on table public.partner_members to service_role;

create policy "partner_members_select_own"
on public.partner_members
for select
to authenticated
using (auth.uid() = user_id);

create policy "partner_members_insert_own_pending_owner_application"
on public.partner_members
for insert
to authenticated
with check (
  auth.uid() = user_id
  and role = 'owner'
  and status = 'pending'
  and created_via = 'application'
  and activated_at is null
  and revoked_at is null
);