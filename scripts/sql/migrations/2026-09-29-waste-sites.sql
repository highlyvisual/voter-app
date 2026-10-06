-- Permitted waste sites in England from the Environment Agency's public register of waste operations (OGL), loaded weekly
-- by scripts/auto/waste_sites.py for the "Permitted waste sites" map layer. The register's own spatial query takes over 20
-- seconds, too slow for a page, so the whole register (permits in force, with a site location) is loaded here and the
-- map reads the rows in a small box around the point. Wales and Scotland are read live from their regulators, which answer
-- in about a second. Replaced wholesale each run; nothing is typed in.
create table if not exists public.waste_sites (
  registration text primary key,             -- the register's registration number, e.g. TP3692NN
  name text not null,                        -- site premises, else the permit holder
  holder text,
  site_type text,                            -- the register's own description, e.g. "A20: Metal Recycling Site (MRS) (mixed)"
  address text,
  local_authority text,
  status text,                               -- "Effective" only is loaded
  effective_date date,
  easting int,
  northing int,
  lat double precision not null,
  lng double precision not null,
  retrieved_at timestamptz not null default now()
);
create index if not exists waste_sites_lat_lng on public.waste_sites (lat, lng);
alter table public.waste_sites enable row level security;
drop policy if exists "public read" on public.waste_sites;
create policy "public read" on public.waste_sites for select to anon, authenticated using (true);
