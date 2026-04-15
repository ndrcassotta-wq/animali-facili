create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'animal_partner_link_status'
  ) then
    create type public.animal_partner_link_status as enum (
      'pending',
      'active',
      'revoked'
    );
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'animal_partner_link_status'
  ) and not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typnamespace = 'public'::regnamespace
      and t.typname = 'animal_partner_link_status'
      and e.enumlabel = 'pending'
  ) then
    alter type public.animal_partner_link_status add value 'pending';
  end if;
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.animal_partner_links (
  id uuid primary key default gen_random_uuid(),
  animale_id uuid not null references public.animali(id) on delete cascade,
  partner_profile_id uuid not null references public.partner_profiles(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  status public.animal_partner_link_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz null,
  revoked_at timestamptz null
);

alter table public.animal_partner_links
  alter column status set default 'pending';

alter table public.animal_partner_links
  alter column activated_at drop default;

drop index if exists uq_animal_partner_links_live;

create unique index if not exists uq_animal_partner_links_live_pair
  on public.animal_partner_links(animale_id, partner_profile_id)
  where status in ('pending', 'active');

create index if not exists idx_animal_partner_links_animale_id
  on public.animal_partner_links(animale_id);

create index if not exists idx_animal_partner_links_partner_profile_id
  on public.animal_partner_links(partner_profile_id);

create index if not exists idx_animal_partner_links_created_by_user_id
  on public.animal_partner_links(created_by_user_id);

create index if not exists idx_animal_partner_links_status
  on public.animal_partner_links(status);

alter table public.animal_partner_links
  drop constraint if exists animal_partner_links_status_dates_chk;

alter table public.animal_partner_links
  add constraint animal_partner_links_status_dates_chk
  check (
    (status = 'pending' and activated_at is null and revoked_at is null)
    or (status = 'active' and activated_at is not null and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null)
  );

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

  if new.status = 'pending' then
    new.activated_at := null;
    new.revoked_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_animal_partner_links_set_updated_at
on public.animal_partner_links;

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

drop function if exists public.get_animale_professionisti(uuid);

create or replace function public.get_animale_professionisti(
  p_animale_id uuid
)
returns table (
  id uuid,
  partner_profile_id uuid,
  partner_slug text,
  partner_nome text,
  partner_categoria public.partner_category,
  partner_citta text,
  partner_provincia text,
  partner_image_path text,
  partner_image_updated_at timestamptz,
  status public.animal_partner_link_status,
  created_at timestamptz,
  updated_at timestamptz,
  activated_at timestamptz,
  revoked_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Utente non autenticato.';
  end if;

  if not exists (
    select 1
    from public.animali a
    where a.id = p_animale_id
      and a.user_id = auth.uid()
  ) then
    raise exception 'Non sei autorizzato a vedere i professionisti collegati a questo animale.';
  end if;

  return query
  select
    apl.id,
    apl.partner_profile_id,
    pp.slug as partner_slug,
    pp.nome as partner_nome,
    pp.categoria as partner_categoria,
    pp.citta as partner_citta,
    pp.provincia as partner_provincia,
    pp.image_path as partner_image_path,
    pp.image_updated_at as partner_image_updated_at,
    apl.status,
    apl.created_at,
    apl.updated_at,
    apl.activated_at,
    apl.revoked_at
  from public.animal_partner_links apl
  join public.partner_profiles pp
    on pp.id = apl.partner_profile_id
  where apl.animale_id = p_animale_id
  order by
    case apl.status
      when 'active' then 0
      when 'pending' then 1
      else 2
    end,
    coalesce(apl.activated_at, apl.created_at) desc,
    apl.created_at desc;
end;
$$;

drop function if exists public.richiedi_collegamento_animale_professionista(uuid, uuid);

create or replace function public.richiedi_collegamento_animale_professionista(
  p_animale_id uuid,
  p_partner_profile_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Utente non autenticato.';
  end if;

  if not exists (
    select 1
    from public.animali a
    where a.id = p_animale_id
      and a.user_id = auth.uid()
  ) then
    raise exception 'Puoi collegare professionisti solo ai tuoi animali.';
  end if;

  if not exists (
    select 1
    from public.partner_profiles pp
    where pp.id = p_partner_profile_id
      and pp.status = 'approvato'
      and pp.published_at is not null
  ) then
    raise exception 'Il professionista selezionato non è disponibile per il collegamento.';
  end if;

  if not exists (
    select 1
    from public.partner_members pm
    where pm.partner_profile_id = p_partner_profile_id
      and pm.status = 'active'
      and pm.role in ('owner', 'editor')
  ) then
    raise exception 'Il professionista selezionato non ha ancora uno spazio operativo attivo.';
  end if;

  if exists (
    select 1
    from public.animal_partner_links apl
    where apl.animale_id = p_animale_id
      and apl.partner_profile_id = p_partner_profile_id
      and apl.status in ('pending', 'active')
  ) then
    raise exception 'Esiste già un collegamento aperto con questo professionista.';
  end if;

  insert into public.animal_partner_links (
    animale_id,
    partner_profile_id,
    created_by_user_id,
    status
  )
  values (
    p_animale_id,
    p_partner_profile_id,
    auth.uid(),
    'pending'
  )
  returning id into v_link_id;

  return v_link_id;
end;
$$;

drop function if exists public.collega_animale_a_professionista(uuid, uuid);

create or replace function public.collega_animale_a_professionista(
  p_animale_id uuid,
  p_partner_profile_id uuid
)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.richiedi_collegamento_animale_professionista(
    p_animale_id,
    p_partner_profile_id
  );
$$;

drop function if exists public.revoca_collegamento_animale_professionista(uuid);

create or replace function public.revoca_collegamento_animale_professionista(
  p_link_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.animal_partner_links%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Utente non autenticato.';
  end if;

  select *
  into v_link
  from public.animal_partner_links
  where id = p_link_id;

  if not found then
    raise exception 'Collegamento non trovato.';
  end if;

  if v_link.status = 'revoked' then
    raise exception 'Questo collegamento è già stato revocato.';
  end if;

  if not (
    exists (
      select 1
      from public.animali a
      where a.id = v_link.animale_id
        and a.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.partner_members pm
      where pm.partner_profile_id = v_link.partner_profile_id
        and pm.user_id = auth.uid()
        and pm.status = 'active'
        and pm.role in ('owner', 'editor')
    )
  ) then
    raise exception 'Non sei autorizzato a revocare questo collegamento.';
  end if;

  update public.animal_partner_links
  set
    status = 'revoked',
    revoked_at = coalesce(revoked_at, now()),
    updated_at = now()
  where id = p_link_id;

  return p_link_id;
end;
$$;

drop function if exists public.rispondi_collegamento_animale_professionista(uuid, text);

create or replace function public.rispondi_collegamento_animale_professionista(
  p_link_id uuid,
  p_azione text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.animal_partner_links%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Utente non autenticato.';
  end if;

  if p_azione not in ('accepted', 'revoked') then
    raise exception 'Azione non valida.';
  end if;

  select *
  into v_link
  from public.animal_partner_links
  where id = p_link_id;

  if not found then
    raise exception 'Collegamento non trovato.';
  end if;

  if v_link.status <> 'pending' then
    raise exception 'Solo i collegamenti in attesa possono essere aggiornati da qui.';
  end if;

  if not exists (
    select 1
    from public.partner_members pm
    where pm.partner_profile_id = v_link.partner_profile_id
      and pm.user_id = auth.uid()
      and pm.status = 'active'
      and pm.role in ('owner', 'editor')
  ) then
    raise exception 'Non sei autorizzato a rispondere a questo collegamento.';
  end if;

  if p_azione = 'accepted' then
    update public.animal_partner_links
    set
      status = 'active',
      activated_at = coalesce(activated_at, now()),
      revoked_at = null,
      updated_at = now()
    where id = p_link_id;
  else
    update public.animal_partner_links
    set
      status = 'revoked',
      revoked_at = coalesce(revoked_at, now()),
      updated_at = now()
    where id = p_link_id;
  end if;

  return p_link_id;
end;
$$;

drop function if exists public.get_partner_animali_collegati(uuid);

create or replace function public.get_partner_animali_collegati(
  p_partner_profile_id uuid
)
returns table (
  id uuid,
  animale_id uuid,
  animale_nome text,
  animale_categoria text,
  animale_specie text,
  animale_razza text,
  animale_sesso text,
  animale_foto_url text,
  status public.animal_partner_link_status,
  created_at timestamptz,
  updated_at timestamptz,
  activated_at timestamptz,
  revoked_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Utente non autenticato.';
  end if;

  if not exists (
    select 1
    from public.partner_members pm
    where pm.partner_profile_id = p_partner_profile_id
      and pm.user_id = auth.uid()
      and pm.status = 'active'
      and pm.role in ('owner', 'editor')
  ) then
    raise exception 'Non sei autorizzato a vedere gli animali collegati a questo profilo professionista.';
  end if;

  return query
  select
    apl.id,
    a.id as animale_id,
    a.nome as animale_nome,
    a.categoria::text as animale_categoria,
    a.specie as animale_specie,
    a.razza as animale_razza,
    a.sesso::text as animale_sesso,
    a.foto_url as animale_foto_url,
    apl.status,
    apl.created_at,
    apl.updated_at,
    apl.activated_at,
    apl.revoked_at
  from public.animal_partner_links apl
  join public.animali a
    on a.id = apl.animale_id
  where apl.partner_profile_id = p_partner_profile_id
  order by
    case apl.status
      when 'pending' then 0
      when 'active' then 1
      else 2
    end,
    coalesce(apl.activated_at, apl.created_at) desc,
    apl.created_at desc;
end;
$$;

grant execute on function public.get_animale_professionisti(uuid) to authenticated;
grant execute on function public.richiedi_collegamento_animale_professionista(uuid, uuid) to authenticated;
grant execute on function public.collega_animale_a_professionista(uuid, uuid) to authenticated;
grant execute on function public.revoca_collegamento_animale_professionista(uuid) to authenticated;
grant execute on function public.rispondi_collegamento_animale_professionista(uuid, text) to authenticated;
grant execute on function public.get_partner_animali_collegati(uuid) to authenticated;

notify pgrst, 'reload schema';