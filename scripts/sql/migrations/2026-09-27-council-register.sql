-- Open data from mySociety (docs/automation/open-data-mysociety.md), sections 1 and 3.
--
-- council_register: every UK local authority, past and current, from mySociety's "UK Local Authorities (past,
-- current and future)" (CC BY 4.0) joined to the WhatDoTheyKnow authorities list (CC BY-SA 4.0) for each council's own
-- website. Loaded weekly by scripts/auto/council_register.py. A council that leaves the file is never deleted: it is
-- marked not current, with the file's end date and successor. Codes that ONS lists but mySociety does not yet are
-- recorded with in_mysociety = false and only what ONS gives (code and name), never an invented type.
create table if not exists public.council_register (
  code text primary key,                      -- mySociety's three-letter code (BS 6879); the GSS code for ONS-only rows
  official_name text not null,
  nice_name text not null,
  slug text not null,                         -- from nice_name, the style of lib/councils.json; unique among current rows
  gss_code text,
  former_gss_codes text,
  ons_gss_code text,                          -- a newer code ONS lists for this council that mySociety's file does not yet carry
  nation text,
  region text,
  la_type text,                               -- NMD, UA, MD, LBO, CTY, SCO, WPA, NID, COMB, SRA, CC
  la_type_name text,
  powers text,                                -- combined, lower tier, ni district, unitary, upper tier
  lower_or_unitary boolean,
  county_la text,
  combined_authority text,
  start_date date,
  end_date date,
  replaced_by text,
  current boolean not null default true,
  gov_uk_slug text,
  open_council_data_id int,
  wdtk_id int,
  pop_2020 int,
  lat double precision,
  long double precision,
  alt_names text,
  home_page text,                             -- the council's own site, after following redirects
  home_page_raw text,                         -- as WhatDoTheyKnow lists it
  publication_scheme text,
  disclosure_log text,
  wdtk_url_name text,
  in_mysociety boolean not null default true,
  note text,
  source_versions text,                       -- the dataset versions read, e.g. "uk_la_future 1.7.3; wdtk authorities 0.73.0"
  retrieved_at timestamptz not null default now(),
  ended_seen_at timestamptz                   -- when the job first saw the council gone from the file
);
create unique index if not exists council_register_slug_current on public.council_register (slug) where current;
create index if not exists council_register_gss on public.council_register (gss_code);
alter table public.council_register enable row level security;
drop policy if exists "public read" on public.council_register;
create policy "public read" on public.council_register for select to anon, authenticated using (true);

-- deprivation_areas: the official index of each devolved nation, one row per small area, from the publisher's own file
-- (scripts/loaders/deprivation_nations.py). England stays in deprivation_2025. Domains differ between indices, so they
-- are kept as the index publishes them: [{"name": "Income", "rank": 407, "decile": 3}, ...]. Deciles not given by the
-- publisher are computed from the rank as each index defines them (ten equal groups of areas).
create table if not exists public.deprivation_areas (
  area_code text primary key,                 -- W01 LSOA (2021), S01 data zone (2011), NI Super Output Area (2001)
  nation text not null check (nation in ('Wales', 'Scotland', 'Northern Ireland')),
  index_name text not null,
  edition text not null,
  publisher text not null,
  area_name text,
  council text,
  overall_rank int,
  overall_decile int,
  domains jsonb not null default '[]'::jsonb,
  source_url text,
  loaded_at timestamptz not null default now()
);
create index if not exists deprivation_areas_nation on public.deprivation_areas (nation);
alter table public.deprivation_areas enable row level security;
drop policy if exists "public read" on public.deprivation_areas;
create policy "public read" on public.deprivation_areas for select to anon, authenticated using (true);

-- council_lines: a sentence from a council's own document, found and checked by a job, shown on the council page under a
-- topic (section 5 of the brief: the council's climate-emergency motion, from the mySociety / Climate Emergency UK list of
-- declarations used only as a list of leads). A row exists only while the document is still on the council's own site and
-- still contains the words; the job replaces the table's rows for its dataset on every run. Dates come from the document
-- itself (null when the document gives none), never from the lead dataset.
create table if not exists public.council_lines (
  council_code text not null,                 -- council_register.code
  topic text not null,                        -- housing, transport, council_tax, environment, education
  url text not null,
  quote text not null,                        -- verbatim from the document
  title text,
  doc_date date,
  publisher text not null,
  dataset text not null,                      -- the list of leads this came from
  checked_at timestamptz not null default now(),
  primary key (council_code, topic, url)
);
alter table public.council_lines enable row level security;
drop policy if exists "public read" on public.council_lines;
create policy "public read" on public.council_lines for select to anon, authenticated using (true);
