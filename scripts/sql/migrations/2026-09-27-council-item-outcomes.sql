-- Phase 1 of the automation plan (docs/automation/phase-1-motion-results.md): the result of each council agenda
-- item, read from the published minutes by scripts/auto/motion_outcomes.py. Every row carries the exact sentence
-- from the minutes and a link to them. Keyed on (council_slug, meeting_id, item_id) because council_agenda_items
-- is replaced wholesale each week. Nothing here is typed in by hand.
create table if not exists public.council_item_outcomes (
  council_slug text not null,
  meeting_id int not null,
  item_id int not null,
  outcome text not null check (outcome in ('carried', 'lost', 'withdrawn', 'deferred', 'noted', 'agreed')),
  votes_for int,
  votes_against int,
  abstentions int,
  sentence text not null,
  minutes_url text not null,
  minutes_published date,
  method text not null check (method in ('set-words', 'reader')),
  read_at timestamptz not null default now(),
  primary key (council_slug, meeting_id, item_id)
);
alter table public.council_item_outcomes enable row level security;
drop policy if exists "public read" on public.council_item_outcomes;
create policy "public read" on public.council_item_outcomes for select to anon, authenticated using (true);

-- Items the set-words pass could not settle. The passage is the item's own section of the minutes. A reader (a
-- scheduled Cowork task first, the API later) fills answer_outcome and answer_sentence; the job publishes an answer
-- only when the sentence appears in the passage word for word and the outcome is in the fixed list above.
-- status: open (waiting for an answer), answered (waiting for the check), published, rejected (check failed:
-- the page then says the result could not be read).
create table if not exists public.outcome_queue (
  council_slug text not null,
  meeting_id int not null,
  item_id int not null,
  passage text not null,
  minutes_url text not null,
  minutes_published date,
  status text not null default 'open' check (status in ('open', 'answered', 'published', 'rejected')),
  answer_outcome text,
  answer_sentence text,
  answer_votes_for int,
  answer_votes_against int,
  answer_abstentions int,
  answered_by text,
  answered_at timestamptz,
  note text,
  queued_at timestamptz not null default now(),
  primary key (council_slug, meeting_id, item_id)
);
create index if not exists outcome_queue_by_status on public.outcome_queue (status, queued_at);
alter table public.outcome_queue enable row level security;
drop policy if exists "public read" on public.outcome_queue;
create policy "public read" on public.outcome_queue for select to anon, authenticated using (true);
