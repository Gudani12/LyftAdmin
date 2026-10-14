alter table public.rides enable row level security;

grant select (ride_id, origin_address, origin_latitude, origin_longitude, status, created_at)
  on public.rides to authenticated;

drop policy if exists "Active admins can read rides" on public.rides;
create policy "Active admins can read rides"
  on public.rides
  for select
  to authenticated
  using (public.is_active_lyft_admin());
