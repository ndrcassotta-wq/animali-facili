create extension if not exists pgcrypto;

do $$
begin
  create type public.partner_category as enum (
    'veterinario',
    'toelettatore',
    'pet_sitter',
    'educatore',
    'pensione_asilo',
    'allevatore',
    'negozio_animali'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.partner_status as enum (
    'bozza',
    'in_revisione',
    'approvato',
    'sospeso'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.partner_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  categoria public.partner_category not null,
  citta text not null,
  provincia text not null,
  descrizione text not null,
  specie_trattate text[] not null default '{}'::text[],
  servizi_principali text[] not null default '{}'::text[],
  indirizzo_completo text null,
  telefono text null,
  whatsapp text null,
  email text null,
  sito text null,
  zona_servita text null,
  status public.partner_status not null default 'in_revisione',
  created_source text not null default 'public_form',
  submitted_at timestamptz not null default now(),
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partner_profiles_slug_format_chk
    check (
      slug = lower(slug)
      and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),

  constraint partner_profiles_contact_chk
    check (num_nonnulls(telefono, whatsapp, email, sito) >= 1),

  constraint partner_profiles_specie_chk
    check (coalesce(array_length(specie_trattate, 1), 0) >= 1),

  constraint partner_profiles_servizi_chk
    check (coalesce(array_length(servizi_principali, 1), 0) >= 1),

  constraint partner_profiles_created_source_chk
    check (created_source in ('public_form', 'admin', 'import'))
);

create index if not exists partner_profiles_status_idx
  on public.partner_profiles (status);

create index if not exists partner_profiles_categoria_idx
  on public.partner_profiles (categoria);

create index if not exists partner_profiles_citta_idx
  on public.partner_profiles (citta);

create index if not exists partner_profiles_provincia_idx
  on public.partner_profiles (provincia);

create index if not exists partner_profiles_specie_trattate_gin_idx
  on public.partner_profiles
  using gin (specie_trattate);

create or replace function public.set_partner_profiles_timestamps()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();

  if new.status = 'approvato' and new.published_at is null then
    new.published_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_partner_profiles_timestamps on public.partner_profiles;

create trigger trg_set_partner_profiles_timestamps
before insert or update on public.partner_profiles
for each row
execute function public.set_partner_profiles_timestamps();

alter table public.partner_profiles enable row level security;

drop policy if exists "partner_profiles_select_approved" on public.partner_profiles;
create policy "partner_profiles_select_approved"
on public.partner_profiles
for select
to anon, authenticated
using (status = 'approvato');

drop policy if exists "partner_profiles_insert_submission" on public.partner_profiles;
create policy "partner_profiles_insert_submission"
on public.partner_profiles
for insert
to anon, authenticated
with check (
  status = 'in_revisione'
  and created_source = 'public_form'
  and num_nonnulls(telefono, whatsapp, email, sito) >= 1
  and coalesce(array_length(specie_trattate, 1), 0) >= 1
  and coalesce(array_length(servizi_principali, 1), 0) >= 1
);