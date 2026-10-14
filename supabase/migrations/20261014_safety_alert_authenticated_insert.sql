create or replace function public.can_submit_safety_alert(
  p_ride_id bigint,
  p_passenger_id text,
  p_driver_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.rides as ride
    where ride.ride_id = p_ride_id
      and ride.user_id = p_passenger_id
      and ride.driver_id = p_driver_id
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

revoke all on function public.can_submit_safety_alert(bigint, text, bigint) from public, anon;
grant execute on function public.can_submit_safety_alert(bigint, text, bigint) to authenticated;

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

drop policy if exists "Ride participants can create safety alerts" on public.safety_alerts;
create policy "Ride participants can create safety alerts"
  on public.safety_alerts
  for insert
  to authenticated
  with check (
    public.can_submit_safety_alert(ride_id, passenger_id, driver_id)
    and status = 'open'
    and nullif(btrim(incident_type), '') is not null
    and nullif(btrim(severity), '') is not null
    and nullif(btrim(trigger_source), '') is not null
    and nullif(btrim(reason), '') is not null
    and (latitude is null or latitude between -90 and 90)
    and (longitude is null or longitude between -180 and 180)
    and (route_deviation_meters is null or route_deviation_meters >= 0)
  );
