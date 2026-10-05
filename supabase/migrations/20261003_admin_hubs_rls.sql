create or replace function public.is_active_lyft_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin as admin_user
    where admin_user.clerk_id = (select auth.jwt() ->> 'sub')
      and admin_user.role in ('super_admin', 'verifier', 'support', 'finance')
      and coalesce(to_jsonb(admin_user) ->> 'status', 'active') = 'active'
  );
$$;

revoke all on function public.is_active_lyft_admin() from public;
grant execute on function public.is_active_lyft_admin() to authenticated;

alter table public.hubs enable row level security;
revoke all on table public.hubs from anon, public;
grant select, insert, update, delete on table public.hubs to authenticated;

drop policy if exists "anon can read hubs" on public.hubs;
drop policy if exists "anon can create hubs" on public.hubs;
drop policy if exists "anon can update hubs" on public.hubs;
drop policy if exists "anon can delete hubs" on public.hubs;

drop policy if exists "Active admins can read hubs" on public.hubs;
create policy "Active admins can read hubs"
  on public.hubs
  for select
  to authenticated
  using (public.is_active_lyft_admin());

drop policy if exists "Active admins can create hubs" on public.hubs;
create policy "Active admins can create hubs"
  on public.hubs
  for insert
  to authenticated
  with check (public.is_active_lyft_admin());

drop policy if exists "Active admins can update hubs" on public.hubs;
create policy "Active admins can update hubs"
  on public.hubs
  for update
  to authenticated
  using (public.is_active_lyft_admin())
  with check (public.is_active_lyft_admin());

drop policy if exists "Active admins can delete hubs" on public.hubs;
create policy "Active admins can delete hubs"
  on public.hubs
  for delete
  to authenticated
  using (public.is_active_lyft_admin());
