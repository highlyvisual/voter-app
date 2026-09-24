-- Tables added 22-23 September 2026 for external open data. Applied to the live Supabase project via migrations
-- named open_council_data, deprivation_2025, party_funding, ward_history, council_tax_2026. Kept here so a fresh
-- database can be rebuilt. All tables are public-read; writes only via the service role.
create table if not exists councillors (
  id bigserial primary key, council text not null, ward text not null, name text not null,
  next_election date, party_name text, party_ec_id text, data_year int not null default 2026
);
create index if not exists councillors_council_ward on councillors (lower(council), lower(ward));
create table if not exists council_control (
  id bigserial primary key, authority text not null, year int not null, total int, con int, lab int, ld int, green int,
  ukip int, ref int, pc int, snp int, other int, majority text, unique (authority, year)
);
create table if not exists deprivation_2025 (
  lsoa_code text primary key, lsoa_name text, lad_name text,
  imd_rank int, imd_decile int, income_decile int, employment_decile int, education_decile int,
  health_decile int, crime_decile int, housing_services_decile int, living_env_decile int
);
create table if not exists party_funding (
  ec_id text primary key, entity_name text, period_start date, period_end date,
  private_total numeric, private_count int, public_total numeric, public_count int,
  top_donors jsonb, retrieved_at timestamptz not null default now()
);
create table if not exists ward_history (
  id bigserial primary key, ballot_paper_id text not null, year int not null, council text, ward text,
  candidate text, party_name text, votes int, elected boolean, vote_share numeric, turnout_percentage numeric,
  election_type text, source text
);
create index if not exists ward_history_ballot on ward_history (ballot_paper_id, year);
create table if not exists council_tax_2026 (ons_code text primary key, authority text not null, kind text, own_band_d numeric, area_band_d numeric);
do $$ declare t text; begin
  foreach t in array array['councillors','council_control','deprivation_2025','party_funding','ward_history','council_tax_2026'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists public_read on %I', t);
    execute format('create policy public_read on %I for select using (true)', t);
  end loop;
end $$;
