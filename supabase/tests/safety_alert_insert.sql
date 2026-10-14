begin;

do $$
declare
  function_oid oid := 'public.can_submit_safety_alert(bigint, text, bigint)'::regprocedure;
  function_owner oid;
begin
  select p.proowner
  into function_owner
  from pg_catalog.pg_proc as p
  where p.oid = function_oid;

  if not pg_catalog.has_function_privilege('authenticated', function_oid, 'EXECUTE') then
    raise exception 'FAIL: authenticated must be able to execute the RLS policy function';
  end if;
  if pg_catalog.has_function_privilege('anon', function_oid, 'EXECUTE') then
    raise exception 'FAIL: anon must not be able to execute the RLS policy function';
  end if;
  if not pg_catalog.has_function_privilege('service_role', function_oid, 'EXECUTE') then
    raise exception 'FAIL: service_role execute grant was not preserved';
  end if;
  if not pg_catalog.has_function_privilege(function_owner, function_oid, 'EXECUTE') then
    raise exception 'FAIL: function owner must retain execute privileges';
  end if;
  if exists (
    select 1
    from pg_catalog.pg_proc as p
    cross join lateral pg_catalog.aclexplode(
      coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))
    ) as privilege
    where p.oid = function_oid
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ) then
    raise exception 'FAIL: PUBLIC must not have execute privileges';
  end if;
  if not pg_catalog.has_table_privilege(function_owner, 'public.rides', 'SELECT')
     or not pg_catalog.has_table_privilege(function_owner, 'public.drivers', 'SELECT') then
    raise exception 'FAIL: function owner needs SELECT on rides and drivers';
  end if;
  if not pg_catalog.has_sequence_privilege('authenticated', 'public.safety_alerts_id_seq', 'USAGE') then
    raise exception 'FAIL: authenticated needs sequence USAGE for generated safety_alerts.id values';
  end if;
  if not exists (
    select 1
    from pg_catalog.pg_proc as p
    cross join lateral pg_catalog.unnest(p.proconfig) as config(setting)
    where p.oid = function_oid
      and config.setting = 'search_path=pg_catalog, pg_temp'
      and p.prosecdef
  ) then
    raise exception 'FAIL: function must be SECURITY DEFINER with a restricted search_path';
  end if;
  raise notice 'PASS: function execute grants and owner table privileges';
end
$$;

create temporary table safety_alert_insert_test_fixtures (
  fixture_name text primary key,
  ride_id bigint not null,
  passenger_id text not null,
  driver_id bigint not null,
  driver_clerk_id text not null
) on commit drop;

with candidates as (
  select distinct on (ride.user_id)
    ride.ride_id,
    ride.user_id as passenger_id,
    ride.driver_id,
    driver.clerk_id as driver_clerk_id
  from public.rides as ride
  join public.drivers as driver on driver.id = ride.driver_id
  where nullif(ride.user_id, '') is not null
    and nullif(driver.clerk_id, '') is not null
  order by ride.user_id, ride.created_at desc nulls last, ride.ride_id
),
numbered as (
  select
    candidates.*,
    row_number() over (order by candidates.ride_id) as fixture_number
  from candidates
)
insert into pg_temp.safety_alert_insert_test_fixtures
  (fixture_name, ride_id, passenger_id, driver_id, driver_clerk_id)
select
  case fixture_number when 1 then 'primary' else 'other' end,
  ride_id,
  passenger_id,
  driver_id,
  driver_clerk_id
from numbered
where fixture_number <= 2;

do $$
begin
  if (select count(*) from pg_temp.safety_alert_insert_test_fixtures) <> 2 then
    raise exception 'FAIL: tests need two rides with distinct passengers and Clerk-linked drivers';
  end if;
end
$$;

grant select on table pg_temp.safety_alert_insert_test_fixtures to authenticated, anon;

update public.rides as ride
set status = 'in_progress'
from pg_temp.safety_alert_insert_test_fixtures as fixture
where ride.ride_id = fixture.ride_id;

select pg_catalog.set_config(
  'request.jwt.claims',
  pg_catalog.json_build_object(
    'sub', (select passenger_id from pg_temp.safety_alert_insert_test_fixtures where fixture_name = 'primary'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;
do $$
declare
  fixture record;
begin
  select * into fixture
  from pg_temp.safety_alert_insert_test_fixtures
  where fixture_name = 'primary';

  insert into public.safety_alerts (
    ride_id, passenger_id, driver_id, trigger_source, reason, status
  ) values (
    fixture.ride_id, fixture.passenger_id, fixture.driver_id,
    'MANUAL', 'rollback-only authorized passenger test', 'open'
  );
  raise notice 'PASS: authorized passenger insert';
end
$$;
reset role;

select pg_catalog.set_config(
  'request.jwt.claims',
  pg_catalog.json_build_object(
    'sub', (select driver_clerk_id from pg_temp.safety_alert_insert_test_fixtures where fixture_name = 'primary'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;
do $$
declare
  fixture record;
begin
  select * into fixture
  from pg_temp.safety_alert_insert_test_fixtures
  where fixture_name = 'primary';

  insert into public.safety_alerts (
    ride_id, passenger_id, driver_id, trigger_source, reason, route_deviation_meters, status
  ) values (
    fixture.ride_id, fixture.passenger_id, fixture.driver_id,
    'AUTOMATED', 'rollback-only authorized driver test', 75, 'open'
  );
  raise notice 'PASS: authorized driver automated insert';
end
$$;
reset role;

select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"not-a-ride-participant","role":"authenticated"}',
  true
);
set local role authenticated;
do $$
declare
  fixture record;
begin
  select * into fixture
  from pg_temp.safety_alert_insert_test_fixtures
  where fixture_name = 'primary';

  begin
    insert into public.safety_alerts (
      ride_id, passenger_id, driver_id, trigger_source, reason, status
    ) values (
      fixture.ride_id, fixture.passenger_id, fixture.driver_id,
      'MANUAL', 'must be rejected', 'open'
    );
  exception when insufficient_privilege then
    raise notice 'PASS: unrelated authenticated user rejected';
    return;
  end;
  raise exception 'FAIL: unrelated authenticated user inserted an SOS alert';
end
$$;
reset role;

select pg_catalog.set_config(
  'request.jwt.claims',
  pg_catalog.json_build_object(
    'sub', (select passenger_id from pg_temp.safety_alert_insert_test_fixtures where fixture_name = 'other'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;
do $$
declare
  fixture record;
begin
  select * into fixture
  from pg_temp.safety_alert_insert_test_fixtures
  where fixture_name = 'primary';

  begin
    insert into public.safety_alerts (
      ride_id, passenger_id, driver_id, trigger_source, reason, status
    ) values (
      fixture.ride_id, fixture.passenger_id, fixture.driver_id,
      'MANUAL', 'must be rejected', 'open'
    );
  exception when insufficient_privilege then
    raise notice 'PASS: passenger cannot submit another person''s ride details';
    return;
  end;
  raise exception 'FAIL: passenger submitted another person''s ride details';
end
$$;
reset role;

select pg_catalog.set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
do $$
declare
  fixture record;
begin
  select * into fixture
  from pg_temp.safety_alert_insert_test_fixtures
  where fixture_name = 'primary';

  begin
    insert into public.safety_alerts (
      ride_id, passenger_id, driver_id, trigger_source, reason, status
    ) values (
      fixture.ride_id, fixture.passenger_id, fixture.driver_id,
      'MANUAL', 'must be rejected', 'open'
    );
  exception when insufficient_privilege then
    raise notice 'PASS: anonymous insert rejected';
    return;
  end;
  raise exception 'FAIL: anonymous user inserted an SOS alert';
end
$$;
reset role;

update public.rides as ride
set status = 'completed'
from pg_temp.safety_alert_insert_test_fixtures as fixture
where fixture.fixture_name = 'other'
  and ride.ride_id = fixture.ride_id;

select pg_catalog.set_config(
  'request.jwt.claims',
  pg_catalog.json_build_object(
    'sub', (select passenger_id from pg_temp.safety_alert_insert_test_fixtures where fixture_name = 'other'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;
do $$
declare
  fixture record;
begin
  select * into fixture
  from pg_temp.safety_alert_insert_test_fixtures
  where fixture_name = 'other';

  begin
    insert into public.safety_alerts (
      ride_id, passenger_id, driver_id, trigger_source, reason, status
    ) values (
      fixture.ride_id, fixture.passenger_id, fixture.driver_id,
      'MANUAL', 'must be rejected', 'open'
    );
  exception when insufficient_privilege then
    raise notice 'PASS: non-active ride rejected';
    return;
  end;
  raise exception 'FAIL: SOS alert inserted for a non-active ride';
end
$$;
reset role;

rollback;
