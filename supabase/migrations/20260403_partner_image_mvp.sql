begin;

alter table public.partner_profiles
  add column if not exists image_path text null;

alter table public.partner_profiles
  add column if not exists image_updated_at timestamptz null;

comment on column public.partner_profiles.image_path
  is 'Path del file immagine partner nel bucket partner-images';

comment on column public.partner_profiles.image_updated_at
  is 'Timestamp ultimo aggiornamento immagine partner';

commit;