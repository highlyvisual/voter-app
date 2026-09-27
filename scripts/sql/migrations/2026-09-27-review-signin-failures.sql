-- Failed maintainer sign-ins, for rate limiting /review (applied 27 Sep 2026). Stores a salted hash of the address,
-- never the address itself. No public policy: only the service role can read or write.
create table if not exists public.review_signin_failures (
  id bigserial primary key,
  ip_hash text not null,
  at timestamptz not null default now()
);
create index if not exists review_signin_failures_at on public.review_signin_failures (ip_hash, at);
alter table public.review_signin_failures enable row level security;
