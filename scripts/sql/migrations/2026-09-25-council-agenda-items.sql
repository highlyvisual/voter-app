-- Applied to the live project 25 Sept 2026 as migration council_agenda_items.
create table if not exists council_agenda_items (
  council_slug text not null, body text not null, committee_title text, meeting_id int not null, meeting_date date not null,
  meeting_status text, item_id int not null, item_number text, title text not null,
  kind text not null check (kind in ('item','motion','placeholder')), proposer text, url text not null,
  retrieved_at timestamptz not null default now(), primary key (council_slug, item_id)
);
create index if not exists council_agenda_items_by_date on council_agenda_items (council_slug, meeting_date);
alter table council_agenda_items enable row level security;
drop policy if exists "public read" on council_agenda_items;
create policy "public read" on council_agenda_items for select to anon, authenticated using (true);
