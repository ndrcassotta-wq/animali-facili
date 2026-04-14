grant select on table public.partner_profiles to authenticated;

drop policy if exists "partner_profiles_select_own_memberships"
on public.partner_profiles;

create policy "partner_profiles_select_own_memberships"
on public.partner_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.partner_members pm
    where pm.partner_profile_id = partner_profiles.id
      and pm.user_id = auth.uid()
  )
);