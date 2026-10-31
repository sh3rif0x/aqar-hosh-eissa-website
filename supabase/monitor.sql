-- ================= الجداول =================
create table if not exists public.visits (
  id bigserial primary key, session_id text, user_id uuid, path text, referrer text, source text,
  device text, browser text, os text, country text, city text, ip inet, load_ms int,
  created_at timestamptz not null default now());
create index if not exists visits_created_idx on public.visits(created_at desc);
create index if not exists visits_session_idx on public.visits(session_id);
create index if not exists visits_ip_idx on public.visits(ip);

create table if not exists public.presence (
  session_id text primary key, user_id uuid, path text, device text, ip inet,
  last_seen timestamptz not null default now());
create index if not exists presence_seen_idx on public.presence(last_seen desc);

create table if not exists public.login_logs (
  id bigserial primary key, user_id uuid, email text, ip inet, device text, country text,
  success boolean not null default true, created_at timestamptz not null default now());
create index if not exists login_logs_created_idx on public.login_logs(created_at desc);

create table if not exists public.listing_events (
  id bigserial primary key, listing_id text not null, event text not null, session_id text, user_id uuid,
  created_at timestamptz not null default now());
create index if not exists listing_events_idx on public.listing_events(listing_id, event, created_at desc);

create table if not exists public.search_logs (
  id bigserial primary key, term text not null default '', filters jsonb not null default '{}'::jsonb,
  results int, session_id text, created_at timestamptz not null default now());
create index if not exists search_logs_created_idx on public.search_logs(created_at desc);

create table if not exists public.blocked_ips (
  ip inet primary key, reason text, expires_at timestamptz, created_by uuid,
  created_at timestamptz not null default now());

create table if not exists public.error_logs (
  id bigserial primary key, path text, message text, user_id uuid, created_at timestamptz not null default now());
create index if not exists error_logs_created_idx on public.error_logs(created_at desc);

alter table public.visits enable row level security;
alter table public.presence enable row level security;
alter table public.login_logs enable row level security;
alter table public.listing_events enable row level security;
alter table public.search_logs enable row level security;
alter table public.blocked_ips enable row level security;
alter table public.error_logs enable row level security;
revoke all on public.visits, public.presence, public.login_logs, public.listing_events,
  public.search_logs, public.blocked_ips, public.error_logs from anon, authenticated;

-- ================= أدوات مشتركة =================
create or replace function public.mon_assert_super() returns void
language plpgsql security definer set search_path = public as $$
begin
  if coalesce((select role::text from public.profiles where id = auth.uid()), '') <> 'super_admin' then
    raise exception 'forbidden';
  end if;
end $$;

create or replace function public.mon_run(p_sql text, p_days int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb; d int := greatest(1, least(coalesce(p_days, 7), 365));
begin
  execute 'select coalesce(jsonb_agg(t), ''[]''::jsonb) from (' || p_sql || ') t' into r using d;
  return r;
end $$;
revoke all on function public.mon_run(text, int) from public, anon, authenticated;

-- ================= الاستقبال (يُستدعى من /api/track فقط) =================
create or replace function public.mon_is_blocked(p_ip text) returns boolean
language sql security definer set search_path = public as $$
  select exists(select 1 from blocked_ips where ip = p_ip::inet and (expires_at is null or expires_at > now()));
$$;

create or replace function public.mon_ingest_heartbeat(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into presence(session_id, user_id, path, device, ip, last_seen)
  values (left(p->>'session_id', 64), nullif(p->>'user_id','')::uuid, left(p->>'path', 300),
          left(p->>'device', 20), nullif(p->>'ip','')::inet, now())
  on conflict (session_id) do update set
    user_id = coalesce(excluded.user_id, presence.user_id), path = excluded.path, device = excluded.device,
    ip = coalesce(excluded.ip, presence.ip), last_seen = now();
  if random() < 0.01 then delete from presence where last_seen < now() - interval '1 day'; end if;
end $$;

create or replace function public.mon_ingest_pageview(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into visits(session_id, user_id, path, referrer, source, device, browser, os, country, city, ip, load_ms)
  values (left(p->>'session_id',64), nullif(p->>'user_id','')::uuid, left(p->>'path',300), left(p->>'referrer',300),
          left(p->>'source',40), left(p->>'device',20), left(p->>'browser',40), left(p->>'os',40),
          left(p->>'country',60), left(p->>'city',80), nullif(p->>'ip','')::inet, nullif(p->>'load_ms','')::int);
  perform public.mon_ingest_heartbeat(p);
end $$;

create or replace function public.mon_ingest_listing_event(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into listing_events(listing_id, event, session_id, user_id)
  values (left(p->>'listing_id',64), left(p->>'event',20), left(p->>'session_id',64), nullif(p->>'user_id','')::uuid);
end $$;

create or replace function public.mon_ingest_search(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into search_logs(term, filters, results, session_id)
  values (lower(left(coalesce(p->>'term',''),100)),
          case when jsonb_typeof(p->'filters') = 'object' then p->'filters' else '{}'::jsonb end,
          nullif(p->>'results','')::int, left(p->>'session_id',64));
end $$;

create or replace function public.mon_ingest_login(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into login_logs(user_id, email, ip, device, country, success)
  values (nullif(p->>'user_id','')::uuid, left(p->>'email',200), nullif(p->>'ip','')::inet,
          left(p->>'device',20), left(p->>'country',60), coalesce((p->>'success')::boolean, true));
end $$;

create or replace function public.mon_ingest_error(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into error_logs(path, message, user_id)
  values (left(p->>'path',300), left(p->>'message',500), nullif(p->>'user_id','')::uuid);
end $$;

grant execute on function public.mon_is_blocked(text), public.mon_ingest_heartbeat(jsonb),
  public.mon_ingest_pageview(jsonb), public.mon_ingest_listing_event(jsonb), public.mon_ingest_search(jsonb),
  public.mon_ingest_login(jsonb), public.mon_ingest_error(jsonb) to anon, authenticated;

-- ================= القراءة (Super Admin فقط) =================
-- ---- live ----
create or replace function public.mon_online_now(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select 'المتصلون الآن' as label, count(*) as value from presence where last_seen > now() - interval '2 minutes'
  union all select 'مسجلون منهم', count(user_id) from presence where last_seen > now() - interval '2 minutes'
$q$, p_days); end $$;

create or replace function public.mon_online_list(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select coalesce(pr.full_name, 'زائر') as who, p.path, p.device, host(p.ip) as ip, p.last_seen
  from presence p left join profiles pr on pr.id = p.user_id
  where p.last_seen > now() - interval '2 minutes' order by p.last_seen desc limit 100
$q$, p_days); end $$;

-- ---- visitors ----
create or replace function public.mon_visitor_totals(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select 'زوار اليوم' as label, count(distinct session_id) as value from visits where created_at >= date_trunc('day', now())
  union all select 'زوار فريدون', count(distinct session_id) from visits where created_at > now() - $1 * interval '1 day'
  union all select 'مشاهدات الصفحات', count(*) from visits where created_at > now() - $1 * interval '1 day'
  union all select 'مستخدمون مسجلون', count(distinct user_id) from visits where created_at > now() - $1 * interval '1 day'
$q$, p_days); end $$;

create or replace function public.mon_visits_daily(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select to_char(d, 'MM-DD') as label, count(v.id) as value
  from generate_series(date_trunc('day', now()) - ($1 - 1) * interval '1 day', date_trunc('day', now()), interval '1 day') d
  left join visits v on date_trunc('day', v.created_at) = d group by d order by d
$q$, p_days); end $$;

create or replace function public.mon_top_pages(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select coalesce(path,'—') as label, count(*) as value from visits
  where created_at > now() - $1 * interval '1 day' group by path order by 2 desc limit 15
$q$, p_days); end $$;

create or replace function public.mon_sources(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select coalesce(source,'direct') as label, count(*) as value from visits
  where created_at > now() - $1 * interval '1 day' and coalesce(source,'direct') <> 'internal'
  group by 1 order by 2 desc limit 15
$q$, p_days); end $$;

create or replace function public.mon_devices(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select coalesce(device,'غير معروف') as label, count(*) as value from visits
  where created_at > now() - $1 * interval '1 day' group by 1 order by 2 desc
$q$, p_days); end $$;

create or replace function public.mon_browsers(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select coalesce(browser,'غير معروف') as label, count(*) as value from visits
  where created_at > now() - $1 * interval '1 day' group by 1 order by 2 desc
$q$, p_days); end $$;

create or replace function public.mon_os(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select coalesce(os,'غير معروف') as label, count(*) as value from visits
  where created_at > now() - $1 * interval '1 day' group by 1 order by 2 desc
$q$, p_days); end $$;

create or replace function public.mon_countries(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select coalesce(country,'غير معروف') as label, count(*) as value from visits
  where created_at > now() - $1 * interval '1 day' group by 1 order by 2 desc limit 15
$q$, p_days); end $$;

create or replace function public.mon_cities(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select coalesce(city,'غير معروف') as label, count(*) as value from visits
  where created_at > now() - $1 * interval '1 day' group by 1 order by 2 desc limit 15
$q$, p_days); end $$;

-- ---- users ----
create or replace function public.mon_recent_logins(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select email, host(ip) as ip, device, country, success, created_at from login_logs
  where created_at > now() - $1 * interval '1 day' order by created_at desc limit 100
$q$, p_days); end $$;

create or replace function public.mon_last_seen(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select coalesce(pr.full_name,'—') as name, max(v.created_at) as last_seen, count(*) as pages, count(distinct host(v.ip)) as ips
  from visits v join profiles pr on pr.id = v.user_id
  where v.created_at > now() - $1 * interval '1 day' group by pr.id, pr.full_name order by 2 desc limit 50
$q$, p_days); end $$;

create or replace function public.mon_shared_ips(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select host(ip) as ip, count(distinct user_id) as accounts, max(created_at) as last_seen from visits
  where user_id is not null and ip is not null and created_at > now() - $1 * interval '1 day'
  group by ip having count(distinct user_id) > 1 order by 2 desc limit 50
$q$, p_days); end $$;

create or replace function public.mon_signups_daily(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select to_char(d, 'MM-DD') as label, count(u.id) as value
  from generate_series(date_trunc('day', now()) - ($1 - 1) * interval '1 day', date_trunc('day', now()), interval '1 day') d
  left join auth.users u on date_trunc('day', u.created_at) = d group by d order by d
$q$, p_days); end $$;

-- ---- listings ----
create or replace function public.mon_top_viewed(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select l.title,
    count(*) filter (where e.event = 'view') as views,
    count(distinct e.session_id) filter (where e.event = 'view') as uniq,
    count(*) filter (where e.event = 'call') as calls,
    count(*) filter (where e.event = 'whatsapp') as whatsapp,
    count(*) filter (where e.event = 'favorite') as favs,
    count(*) filter (where e.event = 'share') as shares
  from listing_events e join listings l on l.id::text = e.listing_id
  where e.created_at > now() - $1 * interval '1 day'
  group by l.id, l.title order by views desc limit 20
$q$, p_days); end $$;

create or replace function public.mon_top_engaged(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select l.title, count(*) filter (where e.event in ('call','whatsapp','favorite','share')) as interactions,
    count(*) filter (where e.event = 'view') as views
  from listing_events e join listings l on l.id::text = e.listing_id
  where e.created_at > now() - $1 * interval '1 day'
  group by l.id, l.title order by interactions desc limit 20
$q$, p_days); end $$;

create or replace function public.mon_conversion(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select l.title,
    count(*) filter (where e.event = 'view') as views,
    count(*) filter (where e.event in ('call','whatsapp')) as contacts,
    round(100.0 * count(*) filter (where e.event in ('call','whatsapp')) / nullif(count(*) filter (where e.event = 'view'), 0), 1) as rate
  from listing_events e join listings l on l.id::text = e.listing_id
  where e.created_at > now() - $1 * interval '1 day'
  group by l.id, l.title having count(*) filter (where e.event = 'view') > 0
  order by contacts desc, views desc limit 20
$q$, p_days); end $$;

create or replace function public.mon_no_views(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select l.title, l.created_at from listings l
  where l.status = 'published' and not exists (
    select 1 from listing_events e where e.listing_id = l.id::text and e.event = 'view'
      and e.created_at > now() - $1 * interval '1 day')
  order by l.created_at desc limit 50
$q$, p_days); end $$;

create or replace function public.mon_event_types(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select event as label, count(*) as value from listing_events
  where created_at > now() - $1 * interval '1 day' group by event order by 2 desc
$q$, p_days); end $$;

-- ---- behavior ----
create or replace function public.mon_session_stats(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  with s as (
    select session_id, count(*) as pages, extract(epoch from max(created_at) - min(created_at)) as secs
    from visits where session_id is not null and created_at > now() - $1 * interval '1 day' group by session_id)
  select 'متوسط الصفحات في الزيارة' as label, coalesce(round(avg(pages), 1), 0) as value from s
  union all select 'متوسط مدة الزيارة (ثانية)', coalesce(round(avg(secs)), 0) from s
  union all select 'معدل الارتداد %', coalesce(round(100.0 * count(*) filter (where pages = 1) / nullif(count(*), 0), 1), 0) from s
$q$, p_days); end $$;

create or replace function public.mon_top_terms(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select term as label, count(*) as value from search_logs
  where term <> '' and created_at > now() - $1 * interval '1 day' group by term order by 2 desc limit 20
$q$, p_days); end $$;

create or replace function public.mon_empty_terms(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select term, count(*) as searches, max(created_at) as last_at from search_logs
  where term <> '' and results = 0 and created_at > now() - $1 * interval '1 day'
  group by term order by 2 desc limit 50
$q$, p_days); end $$;

create or replace function public.mon_filters_used(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select k as label, count(*) as value
  from search_logs s, jsonb_object_keys(case when jsonb_typeof(s.filters) = 'object' then s.filters else '{}'::jsonb end) k
  where s.created_at > now() - $1 * interval '1 day' group by k order by 2 desc limit 15
$q$, p_days); end $$;

create or replace function public.mon_top_regions(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select r.name_ar as label, count(*) as value
  from listing_events e join listings l on l.id::text = e.listing_id join regions r on r.id = l.region_id
  where e.event = 'view' and e.created_at > now() - $1 * interval '1 day' group by r.name_ar order by 2 desc limit 15
$q$, p_days); end $$;

create or replace function public.mon_top_categories(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select c.name_ar as label, count(*) as value
  from listing_events e join listings l on l.id::text = e.listing_id join categories c on c.id = l.category_id
  where e.event = 'view' and e.created_at > now() - $1 * interval '1 day' group by c.name_ar order by 2 desc limit 15
$q$, p_days); end $$;

create or replace function public.mon_exit_pages(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select path as label, count(*) as value from (
    select distinct on (session_id) session_id, path from visits
    where session_id is not null and created_at > now() - $1 * interval '1 day'
    order by session_id, created_at desc) x
  group by path order by 2 desc limit 15
$q$, p_days); end $$;

-- ---- security ----
create or replace function public.mon_failed_logins(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select email, host(ip) as ip, device, country, created_at from login_logs
  where success = false and created_at > now() - $1 * interval '1 day' order by created_at desc limit 100
$q$, p_days); end $$;

create or replace function public.mon_suspicious_ips(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select * from (
    select host(ip) as ip, 'محاولات دخول فاشلة' as reason, count(*) as cnt from login_logs
      where success = false and ip is not null and created_at > now() - $1 * interval '1 day'
      group by ip having count(*) >= 5
    union all
    select host(ip), 'طلبات كثيرة خلال ساعة', count(*) from visits
      where ip is not null and created_at > now() - interval '1 hour'
      group by ip having count(*) >= 200
  ) a order by cnt desc limit 50
$q$, p_days); end $$;

create or replace function public.mon_blocked_ips(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select host(ip) as ip, reason, expires_at, created_at from blocked_ips
  where expires_at is null or expires_at > now() order by created_at desc
$q$, p_days); end $$;

create or replace function public.mon_block_ip(p_ip text, p_reason text default '', p_hours int default 24) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
  insert into blocked_ips(ip, reason, expires_at, created_by)
  values (p_ip::inet, left(coalesce(p_reason,''), 200), case when coalesce(p_hours,0) > 0 then now() + p_hours * interval '1 hour' end, auth.uid())
  on conflict (ip) do update set reason = excluded.reason, expires_at = excluded.expires_at,
    created_by = excluded.created_by, created_at = now();
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.mon_unblock_ip(p_ip text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
  delete from blocked_ips where ip = p_ip::inet;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.mon_new_countries(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select l.email, l.country, host(l.ip) as ip, l.created_at from login_logs l
  where l.success and l.country is not null and l.created_at > now() - $1 * interval '1 day'
    and exists (select 1 from login_logs o where o.user_id = l.user_id and o.created_at < l.created_at)
    and not exists (select 1 from login_logs o where o.user_id = l.user_id and o.country = l.country and o.created_at < l.created_at)
  order by l.created_at desc limit 50
$q$, p_days); end $$;

create or replace function public.mon_duplicate_phones(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select contact_phone as phone, count(distinct user_id) as accounts, count(*) as listings from listings
  where contact_phone is not null group by contact_phone having count(distinct user_id) > 1
  order by 2 desc limit 50
$q$, p_days); end $$;

-- ---- health ----
create or replace function public.mon_errors_recent(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select e.path, e.message, coalesce(pr.full_name, 'زائر') as who, e.created_at
  from error_logs e left join profiles pr on pr.id = e.user_id
  where e.created_at > now() - $1 * interval '1 day' order by e.created_at desc limit 100
$q$, p_days); end $$;

create or replace function public.mon_errors_by_path(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select coalesce(path,'—') as label, count(*) as value from error_logs
  where created_at > now() - $1 * interval '1 day' group by path order by 2 desc limit 15
$q$, p_days); end $$;

create or replace function public.mon_slow_pages(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select path as label, round(avg(load_ms)) as value from visits
  where load_ms is not null and created_at > now() - $1 * interval '1 day'
  group by path order by 2 desc limit 15
$q$, p_days); end $$;

create or replace function public.mon_db_tables(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select c.relname::text as label, round(pg_total_relation_size(c.oid) / 1024.0) as value
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' order by 2 desc limit 12
$q$, p_days); end $$;

create or replace function public.mon_storage_files(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select bucket_id::text as label, round(coalesce(sum((metadata->>'size')::bigint), 0) / 1024.0) as value
  from storage.objects group by bucket_id order by 2 desc
$q$, p_days); end $$;

-- ---- reports ----
create or replace function public.mon_alerts(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select * from (
    select 'تحذير' as level, 'محاولات دخول فاشلة خلال ساعة' as alert, count(*)::text as value from login_logs
      where success = false and created_at > now() - interval '1 hour' having count(*) >= 10
    union all
    select 'تحذير', 'أخطاء الموقع خلال ساعة', count(*)::text from error_logs
      where created_at > now() - interval '1 hour' having count(*) >= 20
    union all
    select 'تنبيه', 'تسجيلات اليوم أعلى من ضعف المتوسط', count(*)::text from auth.users
      where created_at >= date_trunc('day', now())
      having count(*) > 2 * greatest(1, (select count(*) from auth.users
        where created_at > now() - interval '8 days' and created_at < date_trunc('day', now())) / 7.0)
  ) a
$q$, p_days); end $$;

create or replace function public.mon_compare(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select 'زيارات · الفترة الحالية' as label, count(*) as value from visits where created_at > now() - $1 * interval '1 day'
  union all select 'زيارات · الفترة السابقة', count(*) from visits
    where created_at <= now() - $1 * interval '1 day' and created_at > now() - 2 * $1 * interval '1 day'
  union all select 'تسجيلات · الفترة الحالية', count(*) from auth.users where created_at > now() - $1 * interval '1 day'
  union all select 'تسجيلات · الفترة السابقة', count(*) from auth.users
    where created_at <= now() - $1 * interval '1 day' and created_at > now() - 2 * $1 * interval '1 day'
$q$, p_days); end $$;

create or replace function public.mon_daily_summary(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
return public.mon_run($q$
  select d::date as day,
    (select count(*) from visits where created_at >= d and created_at < d + interval '1 day') as visits,
    (select count(distinct session_id) from visits where created_at >= d and created_at < d + interval '1 day') as visitors,
    (select count(*) from auth.users where created_at >= d and created_at < d + interval '1 day') as signups,
    (select count(*) from login_logs where success = false and created_at >= d and created_at < d + interval '1 day') as failed_logins
  from generate_series(date_trunc('day', now()) - ($1 - 1) * interval '1 day', date_trunc('day', now()), interval '1 day') d
  order by d desc
$q$, p_days); end $$;

-- ---- صيانة (يدوي): select mon_purge(180); ----
create or replace function public.mon_purge(p_days int default 180) returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform public.mon_assert_super();
  delete from visits where created_at < now() - p_days * interval '1 day';
  delete from listing_events where created_at < now() - p_days * interval '1 day';
  delete from search_logs where created_at < now() - p_days * interval '1 day';
  delete from error_logs where created_at < now() - p_days * interval '1 day';
  delete from login_logs where created_at < now() - p_days * interval '1 day';
  delete from blocked_ips where expires_at is not null and expires_at < now();
  return jsonb_build_object('ok', true);
end $$;
