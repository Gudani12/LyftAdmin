create or replace function public.can_submit_safety_alert(
  p_ride_id bigint,
  p_passenger_id text,
  p_driver_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
  select exists (
    select 1
    from public.rides as ride
    where ride.ride_id = p_ride_id
      and ride.user_id = p_passenger_id
      and ride.driver_id = p_driver_id
      and ride.status = 'in_progress'
      and (
        p_passenger_id = (select auth.jwt() ->> 'sub')
        or exists (
          select 1
          from public.drivers as driver
          where driver.id = p_driver_id
            and driver.clerk_id = (select auth.jwt() ->> 'sub')
        )
      )
  );
$$;

alter function public.can_submit_safety_alert(bigint, text, bigint)
  set search_path = pg_catalog, pg_temp;

revoke all on function public.can_submit_safety_alert(bigint, text, bigint)
  from public, anon, authenticated, service_role;
grant execute on function public.can_submit_safety_alert(bigint, text, bigint)
  to authenticated, service_role;

do $$
declare
  function_owner name;
begin
  select owner_role.rolname
  into function_owner
  from pg_catalog.pg_proc as p
  join pg_catalog.pg_roles as owner_role on owner_role.oid = p.proowner
  where p.oid = 'public.can_submit_safety_alert(bigint, text, bigint)'::regprocedure;

  if not found then
    raise exception 'Could not determine owner of public.can_submit_safety_alert(bigint, text, bigint)';
  end if;

  if not pg_catalog.has_table_privilege(function_owner, 'public.rides', 'SELECT')
     or not pg_catalog.has_table_privilege(function_owner, 'public.drivers', 'SELECT') then
    execute pg_catalog.format(
      'GRANT SELECT ON TABLE public.rides, public.drivers TO %I',
      function_owner
    );
  end if;
end
$$;

grant insert (
  ride_id,
  passenger_id,
  driver_id,
  incident_type,
  severity,
  trigger_source,
  latitude,
  longitude,
  reason,
  route_deviation_meters,
  status
) on public.safety_alerts to authenticated;
grant usage on sequence public.safety_alerts_id_seq to authenticated;

drop policy if exists "Ride participants can create safety alerts" on public.safety_alerts;
create policy "Ride participants can create safety alerts"
  on public.safety_alerts
  for insert
  to authenticated
  with check (
    public.can_submit_safety_alert(ride_id, passenger_id, driver_id)
    and status = 'open'
    and trigger_source in ('MANUAL', 'AUTOMATED')
    and nullif(pg_catalog.btrim(incident_type), '') is not null
    and nullif(pg_catalog.btrim(severity), '') is not null
    and nullif(pg_catalog.btrim(trigger_source), '') is not null
    and nullif(pg_catalog.btrim(reason), '') is not null
    and (latitude is null or latitude between -90 and 90)
    and (longitude is null or longitude between -180 and 180)
    and (route_deviation_meters is null or route_deviation_meters >= 0)
  );
