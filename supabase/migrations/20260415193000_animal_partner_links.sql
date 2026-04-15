begin;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'animal_partner_link_status'
  ) then
    create type public.animal_partner_link_status as enum ('active', 'revoked');
  end if;
end
$$;

create table if not exists public.animal_partner_links (
  id uuid primary key default gen_random_uuid(),
  animale_id uuid not null references public.animali(id) on delete cascade,
  partner_profile_id uuid not null references public.partner_profiles(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  status public.animal_partner_link_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz null default now(),
  revoked_at timestamptz null,

  constraint animal_partner_links_status_dates_chk
    check (
      (status = 'active' and revoked_at is null)
      or (status = 'revoked' and revoked_at is not null)
    )
);

create index if not exists idx_animal_partner_links_animale_id
  on public.animal_partner_links(animale_id);

create index if not exists idx_animal_partner_links_partner_profile_id
  on public.animal_partner_links(partner_profile_id);

create index if not exists idx_animal_partner_links_created_by_user_id
  on public.animal_partner_links(created_by_user_id);

create index if not exists idx_animal_partner_links_status
  on public.animal_partner_links(status);

create unique index if not exists uq_animal_partner_links_live
  on public.animal_partner_links(animale_id, partner_profile_id)
  where status = 'active';

create or replace function public.set_animal_partner_links_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();

  if new.status = 'active' and new.activated_at is null then
    new.activated_at := now();
  end if;

  if new.status = 'revoked' and new.revoked_at is null then
    new.revoked_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_animal_partner_links_set_updated_at on public.animal_partner_links;

create trigger trg_animal_partner_links_set_updated_at
before insert or update on public.animal_partner_links
for each row
execute function public.set_animal_partner_links_updated_at();

alter table public.animal_partner_links enable row level security;

revoke all on public.animal_partner_links from anon;
revoke all on public.animal_partner_links from authenticated;
grant all on public.animal_partner_links to service_role;

comment on table public.animal_partner_links
  is 'Collegamenti tra animali e profili professionisti, separati dalla condivisione familiari.';

comment on column public.animal_partner_links.animale_id
  is 'Animale collegato al professionista.';

comment on column public.animal_partner_links.partner_profile_id
  is 'Profilo professionista collegato all’animale.';

comment on column public.animal_partner_links.created_by_user_id
  is 'Utente owner dell’animale che ha creato il collegamento.';

commit;