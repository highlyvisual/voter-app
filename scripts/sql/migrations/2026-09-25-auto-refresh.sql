-- Automatic refresh (25 Sept 2026): job log, source watch, and the feeds that keep council pages current.
-- Applied to the live project on 25 Sept 2026. Every table is publicly readable; only the service role writes.
alter table candidates add column if not exists withdrawn_at timestamptz;
comment on column candidates.withdrawn_at is 'Set by the nightly ingest when Democracy Club no longer lists this candidacy on the ballot; cleared if it reappears.';

create table if not exists job_runs (
  id bigserial primary key, job text not null, started_at timestamptz not null, finished_at timestamptz not null default now(),
  ok boolean not null, rows integer, note text);
create index if not exists job_runs_job_idx on job_runs (job, finished_at desc);

create table if not exists source_checks (
  id bigserial primary key, url text not null, kind text not null, ref text, checked_at timestamptz not null default now(),
  http_status integer, sha256 text, changed boolean, archive_url text, note text,
  quotes_total integer, quotes_found integer, missing_refs text[]);
create index if not exists source_checks_url_idx on source_checks (url, checked_at desc);

create table if not exists school_changes (
  urn integer not null, name text not null, la_name text, la_gss text, district_gss text, status text not null, phase text, type text,
  reason_opened text, reason_closed text, open_date date, close_date date, gias_url text, retrieved_at timestamptz not null default now(),
  primary key (urn, status));

create table if not exists council_consultations (
  council_slug text not null, title text not null, url text not null, opens date, closes date, platform text, retrieved_at timestamptz not null default now(),
  primary key (council_slug, url));

create table if not exists gazette_notices (
  council_slug text not null, notice_id text not null, notice_type text, title text, published date, url text not null, retrieved_at timestamptz not null default now(),
  primary key (council_slug, notice_id));

create table if not exists local_plans (
  council_slug text not null, entity bigint not null, name text, process text, adopted_date date, period_start date, period_end date,
  required_housing integer, documentation_url text, entry_date date, retrieved_at timestamptz not null default now(),
  primary key (council_slug, entity));

create table if not exists feed_items (
  feed text not null, url text not null, title text, published timestamptz, first_seen timestamptz not null default now(),
  primary key (feed, url));

create table if not exists release_watch (
  key text primary key, latest text, url text, changed_at timestamptz, checked_at timestamptz not null default now());

do $$ declare t text; begin
  foreach t in array array['job_runs','source_checks','school_changes','council_consultations','gazette_notices','local_plans','feed_items','release_watch'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "public read" on %I', t);
    execute format('create policy "public read" on %I for select to anon, authenticated using (true)', t);
  end loop;
end $$;

-- Archived copies on the source itself, so candidate cards can link to them.
alter table sources add column if not exists archive_url text, add column if not exists archived_at timestamptz;
