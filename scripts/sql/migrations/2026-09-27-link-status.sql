-- Weekly check of every outbound link the site shows (scripts/auto/link_check.py). A link is marked dead only when it
-- fails twice with 404, 410 or a 5xx; a 403 is treated as bot protection, not death. Pages then show the archived copy
-- instead, labelled as such (applied 27 Sep 2026).
create table if not exists public.link_status (
  url text primary key,
  status int,
  dead boolean not null default false,
  archive_url text,
  https_url text,
  checked_at timestamptz not null default now()
);
alter table public.link_status enable row level security;
create policy "public read link_status" on public.link_status for select using (true);
