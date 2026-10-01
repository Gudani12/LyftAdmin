alter table safety_alerts
  add column if not exists acknowledged_at timestamptz,
  add column if not exists acknowledged_by text,
  add column if not exists escalated_at timestamptz,
  add column if not exists escalated_by text,
  add column if not exists escalation_note text,
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by text,
  add column if not exists resolved_note text;

alter table safety_alerts enable row level security;

create or replace function public.is_safety_admin()
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
      and admin_user.role in ('super_admin', 'support')
  );
$$;

revoke all on function public.is_safety_admin() from public;
grant execute on function public.is_safety_admin() to authenticated;

revoke all on table safety_alerts from anon, authenticated, public;
grant select on table safety_alerts to authenticated;
grant update (
  status,
  acknowledged_at,
  acknowledged_by,
  escalated_at,
  escalated_by,
  escalation_note,
  resolved_at,
  resolved_by,
  resolved_note
) on table safety_alerts to authenticated;

drop policy if exists "Active admins can read safety alerts" on safety_alerts;
drop policy if exists "Authorized admins can read safety alerts" on safety_alerts;
create policy "Authorized admins can read safety alerts"
  on safety_alerts
  for select
  to authenticated
  using (public.is_safety_admin());

drop policy if exists "Active admins can respond to safety alerts" on safety_alerts;
drop policy if exists "Authorized admins can respond to safety alerts" on safety_alerts;
create policy "Authorized admins can respond to safety alerts"
  on safety_alerts
  for update
  to authenticated
  using (public.is_safety_admin())
  with check (public.is_safety_admin());

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'safety_alerts'
  ) then
    alter publication supabase_realtime add table safety_alerts;
  end if;
end
$$;
