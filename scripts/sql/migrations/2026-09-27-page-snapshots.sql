-- Eve-of-poll archive copies of every ballot and candidate page (applied 27 Sep 2026).
create table if not exists public.page_snapshots (
  id bigserial primary key,
  ballot_paper_id text not null,
  page_url text not null,
  archive_url text,
  taken_at timestamptz not null default now(),
  note text
);
create index if not exists page_snapshots_ballot on public.page_snapshots (ballot_paper_id);
alter table public.page_snapshots enable row level security;
create policy "public read page_snapshots" on public.page_snapshots for select using (true);
