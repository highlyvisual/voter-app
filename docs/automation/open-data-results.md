# Open data from mySociety: results (27 September 2026)

Pull request description for branch `automation/open-data`, built from `docs/automation/open-data-mysociety.md`. Kept here
because the build session's GitHub login cannot see the private repository, so Barny opens the PR from the compare page:
`https://github.com/highlyvisual/voter-app/compare/main...automation/open-data?expand=1`

**Depends on the phase-1 PR** (`automation/phase-1`, not merged when this was built): this branch was cut from it as the brief
says, and `origin/main` was merged in so the `llms.txt` route and the data page from main could be edited. Merge phase 1
first; this PR then shows only its own changes.

**Not deployed. Nothing written to the database.** Two migrations to apply, in this order:
`scripts/sql/migrations/2026-09-27-council-register.sql` (tables `council_register` and `deprivation_areas`), then run
`python scripts/loaders/deprivation_nations.py all` once with the service key and the `Council register` workflow by hand.

## 1. Council register (built)

- `scripts/auto/council_register.py`, workflow `.github/workflows/council-register.yml` (Mondays 05:50 UTC, manual, on push
  of the script). Reads mySociety's UK Local Authorities file (version 1.7.3, CC BY 4.0) and the WhatDoTheyKnow authorities
  file (0.73.0, CC BY-SA 4.0), joins on `wdtk-id` (cast from float), follows each home page's redirects, and upserts by
  the three-letter code. Versions go in the `job_runs` note and in every row.
- A council that leaves the file is kept and marked not current (`ended_seen_at`), with the file's `end-date` and
  `replaced-by`; 48 ended rows carry a successor already.
- ONS check: the newest "Local Authority Districts … Names and Codes" and "County and Unitary Authority … Names and Codes"
  feature services on the ONS Geography ArcGIS (April 2025 editions today, 361 + 218 codes). A code ONS has that mySociety
  lacks goes on the council of the same name as `ons_gss_code` with a note, or, if no name matches, as a bare row with
  `in_mysociety = false` and only ONS's name and code (none today). Today the only differences are Barnsley (mySociety
  E08000016, ONS E08000038) and Sheffield (E08000019 / E08000039).
- The job also writes `scripts/sql/council_register.json` (current rows, the fields the pages use), which the site uses
  when the table cannot be read, so every council page exists before the migration is applied.
- Dry run (no service key), from the two downloaded files: 470 rows (397 current: England 332, Scotland 32, Wales 22, Northern Ireland 11; 382 councils with pages once the 14 combined authorities and the Greater London Authority are set aside); 434 register rows joined to a WhatDoTheyKnow body; 387 of the 397 current rows have a home page (the six without: Cumberland, North Northamptonshire, North Yorkshire, Somerset, Westmorland and Furness, West Northamptonshire, all councils created since 2021 that WhatDoTheyKnow's list has no id for in mySociety's file); 362 home pages resolve to https and 14 stay http; 160 have a publication scheme and 29 a disclosure log; ONS-only rows 0; ONS code differs 2 (Barnsley, Sheffield).
- Ten sample rows from the dry run:

| Code | Council | Slug | GSS | Nation | Type | Powers | Website |
|---|---|---|---|---|---|---|---|
| CHW | Cheshire West and Chester | cheshire-west-and-chester | E06000050 | England | Unitary authority | unitary | https://www.cheshirewestandchester.gov.uk/ |
| SLF | Salford | salford | E08000006 | England | Metropolitan district | unitary | https://www.salford.gov.uk/ |
| BOS | Bolsover | bolsover | E07000033 | England | Non-metropolitan district | lower tier | https://www.bolsover.gov.uk |
| GAT | Gateshead | gateshead | E08000037 | England | Metropolitan district | unitary | https://www.gateshead.gov.uk |
| CHA | Charnwood | charnwood | E07000130 | England | Non-metropolitan district | lower tier | https://www.charnwood.gov.uk |
| PTE | Peterborough | peterborough | E06000031 | England | Unitary authority | unitary | https://www.peterborough.gov.uk/ |
| NOW | Norwich | norwich | E07000148 | England | Non-metropolitan district | lower tier | https://www.norwich.gov.uk |
| OAD | Oadby and Wigston | oadby-and-wigston | E07000135 | England | Non-metropolitan district | lower tier | https://www.oadby-wigston.gov.uk |
| TOF | Torfaen | torfaen | W06000020 | Wales | Welsh unitary authority | unitary | https://www.torfaen.gov.uk |
| MAN | Manchester | manchester | E08000003 | England | Metropolitan district | unitary | https://secure.manchester.gov.uk |

- Note for the runner: from Barny's machine the two files trickle from GitHub Pages at 2–3 KB/s (the 25 MB one took a
  sparse `git clone` of `mysociety/wdtk_authorities_list` instead); GitHub's own runners do not have this problem.

## 2. A page for every council (built)

- `lib/councils.ts`: `councilBySlug`, `councilSlugFor` (now async) and the new `listAllCouncils` resolve the 29 hand-built
  councils first, then any current council in the register (combined and strategic authorities excluded). Slugs come from
  `nice-name` in the existing style; all 29 existing slugs derive identically, so nothing moved.
- `/council/[slug]` renders a register-only council with the same template: the register's official name, type, powers,
  nation and region, the council's website (plus WhatDoTheyKnow's publication scheme and disclosure log where listed),
  who runs it and the councillors (Open Council Data, by name), council tax (England), consultations, notices and schools
  where those tables have rows, and the phase-1 decisions block where the meetings reader covers it. Each of the five topics
  says "We haven't read this council's own publications yet." in the same place, with a link to the council's site.
- The 29 hand-built pages are unchanged apart from the attribution line (and the WriteToThem link from section 4).
- `app/sitemap.ts` and `app/llms.txt/route.ts` list every council with a page: 382 today (29 before this branch).
- Attribution on every council page and on `/data`: "Council list: mySociety, UK Local Authorities (CC BY 4.0) and
  WhatDoTheyKnow authorities (CC BY-SA 4.0)."
- Checked on a local dev server (`next dev`, public key, snapshot fallback): register-only pages for Bolsover (England,
  district), Fife (Scotland), Torfaen (Wales), Belfast (Northern Ireland) and Hertfordshire (county) all render (HTTP 200)
  with the five "not read yet" lines; Aberdeen City and Wiltshire (hand-built) still show their facts and "Read on" line
  plus the attribution; an unknown slug gives 404; `/place` for a Fife postcode links "What Fife council is deciding".
  Screenshot of Fife: `docs/automation/open-data-council-fife.jpg` (attached to the PR).

## 3. Deprivation for all four nations (built)

- New table `deprivation_areas` (one table, `nation` column; domains as the index publishes them, in `jsonb`), loader
  `scripts/loaders/deprivation_nations.py` with no third-party packages (zip + XML readers for ODS and XLSX):

| Nation | Index | Publisher, date | Areas | Domains |
|---|---|---|---|---|
| Wales | Welsh Index of Multiple Deprivation 2025 | Welsh Government, 27 Nov 2025, OGL v3 | 1,917 LSOAs (2021) | Income, Employment, Health, Education, Access to Services, Housing, Community Safety, Physical Environment |
| Scotland | Scottish Index of Multiple Deprivation 2020v2 | Scottish Government, 28 Jan 2020, OGL v3 (SIMD 2026 due late 2026) | 6,976 data zones (2011) | Income, Employment, Health, Education, Access, Crime, Housing |
| Northern Ireland | Northern Ireland Multiple Deprivation Measure 2017 | NISRA via OpenDataNI, 23 Nov 2017, OGL v3 | 890 Super Output Areas (2001) | Income, Employment, Health Deprivation and Disability, Education Skills and Training, Access to Services, Living Environment, Crime and Disorder |

  Overall deciles: Wales as published; Scotland and Northern Ireland computed from the rank as each index defines them
  (ten equal groups). Domain deciles computed the same way for all three. The loader asserts that ranks run 1..N with no
  gaps. mySociety's composite UK index was not used, as the brief says.
- `lib/area.ts` `deprivationAt()` picks the table from the postcode's country and the right area code: `lsoa21` for England
  and Wales, `lsoa11` for Scotland (2011 data zones) and Northern Ireland (postcodes.io's `lsoa11` carries the 2001 SOA
  code, e.g. `95GG39S1`; its `lsoa21` is the 2021 super data zone, which NIMDM 2017 does not use). The neighbourhood count
  is counted from the table, not hard-coded (England's too).
- `components/AreaPanel.tsx` names the nation, index, edition and publisher, shows only that index's domains under its own
  names, and says deciles are not comparable across nations.
- Release watch: three new checks read the newest edition named on each publisher's page (gov.wales, simd.scot, NISRA).
  Licences recorded in `scripts/loaders/README.md`.
- Hand check of the four by-election postcodes against the publisher's own lookups (postcodes.io gives the area code):

| Postcode | Area | Loader: rank, decile | Publisher's own lookup |
|---|---|---|---|
| IV2 3BW (Highland) | S01010624, Inverness Central, Raigmore and Longman | 1,895 of 6,976; decile 3 | SIMD 2020v2 postcode lookup (gov.scot, updated 2025): rank 1895, decile 3 |
| FK8 1ET (Stirling) | S01013070, City Centre | 2,255; decile 4 | SIMD postcode lookup: rank 2255, decile 4 |
| AB10 1AB (Aberdeen City) | S01006646, George Street | 3,888; decile 6 | SIMD postcode lookup: rank 3888, decile 6 |
| CH4 0RE (Flintshire) | W01000255, Broughton North East | 1,464 of 1,917; decile 8 | DataMapWales WIMD 2025 layer (`geonode:wimd2025_overall`): rank 1464, decile 8, "50% least deprived" |

  All four agree. (Northern Ireland has no by-election on the list to check; BT1 5GS resolves to SOA 95GG39S1 in the table.)

## 4. WriteToThem link (built)

- `components/WriteToThem.tsx`: "Write to your councillor, MP or other representatives →" after the representatives on the
  area page and on `/place`; "Write to your councillors →" with `a=council` on every council page. No `pc`; always
  `fyr_extref=https://whatsittome.org`; nothing is sent through the site.
- Checked: `https://www.writetothem.com/?a=council&fyr_extref=…` opens with the heading "Write to your Councillors" (and a
  "Show all representatives" option); without `a` it opens "Get the right message to the right place" for councillor, MP,
  MSP, MS, MLA or London Assembly Member. The links render on the Highland area page, on `/place` and on the council pages.

## 5. Climate-emergency motion as a source (built, with a caveat for Barny and Romily)

- The check the brief asked for, run on 27 September against the declarations file (404 rows, 167 real links): 121 links
  are on the council's own domain (matched by the registrable domain of the register's resolved home page); of those, 34
  refuse automated readers (HTTP 403), 15 are gone (404), 1 redirects elsewhere, 4 could not be fetched, 16 no longer
  contain a sentence in which the council declares, and **20 pass**: 17 councils with a page plus three combined or
  strategic bodies that have none. More than a handful, so the section is built.
- `scripts/auto/climate_declarations.py` (runs after the register in `council-register.yml`; row on `/status` and in the
  weekly review) and table `council_lines` (in the same migration). For each own-domain lead it fetches the document, takes
  the first sentence that contains "climate emergency" **and** a form of words in which the council itself declares
  ("this Council resolves / declares / commits", "declares a climate emergency", "resolves to declare", "has been declared
  by", "decision to declare"), and is not about a petition, an amendment, another council, reported speech, a declaration
  of interest or the website's furniture; checks it word for word (`quote_found`); publishes it with the link, the
  document's own title and a date only where the document gives one near its top (14 of the 20 do; the rest say
  "undated"). Nothing from the dataset's own flags or dates is shown. The table's rows are replaced every run, so a document
  that disappears takes its line with it.
- Shown under Environment on register-only council pages only, as the council's own words with the link, plus "Beyond that
  document, we haven't read this council's own publications yet." The 29 hand-built pages are untouched.
- The 20 lines the dry run would publish (council, date from the document, opening of the sentence):

| Council | Date in document | Sentence (opening) |
|---|---|---|
| Charnwood | undated | "A climate emergency has been declared by Charnwood Borough Council." |
| Cherwell | 22 Jul 2019 | "Declare a 'Climate Emergency'; 2." |
| City of York | undated | "3 (iv) Declare a Climate Emergency (proposed by Councillor D'Agorne and seconded by Councillor Waller) …" |
| Cotswold | 3 Jul 2019 | "Council therefore commits to: ● Declare a 'Climate Emergency' that requires urgent and comprehensive action." |
| Derby | undated | "This Council therefore: Declares a Climate Emergency; …" |
| East Sussex | undated | "(ii) recognises and declares a Climate Emergency." |
| Harborough | 24 Jun 2019 | "HDC must therefore declare an immediate Climate Emergency and …" |
| Brent | 8 Jul 2019 | "Thus this Council resolves: To join our Labour Mayor Sadiq Khan in declaring a Global climate emergency." |
| Hackney | undated | "However, the public will rightly ask what the Council is doing today that is wasn't doing before we formally declared a climate emergency." |
| Havering | undated | "The decision to declare a climate emergency is the latest step in Havering's effort to combat climate change." |
| Redbridge | 20 Jun 2019 | "… This council resolves to declare a climate emergency." |
| Mansfield | 5 Mar 2019 | "… The Council in principle declares a climate emergency …" |
| Medway | 25 Apr 2019 | "… Councillor Maple, supported by Councillor Joy, proposed the following: Declaring a Climate Emergency …" |
| North Norfolk | 24 Apr 2019 | "Declare a Climate Emergency; 2." |
| Salford | undated | "Therefore, Salford City Council agrees: To declare a 'climate emergency'." |
| Shropshire | undated | "Therefore, this Council declares that there is a Climate Emergency and calls upon the Cabinet …" |
| South Kesteven | undated | "Climate Emergency - changes to Budget and Policy Framework The Cabinet Member … presented the recommendations …" |
| Stevenage | 12 Jun 2019 | "This Council declares a climate emergency and we: …" |
| West Midlands CA, Greater London Authority, Liverpool City Region | — | no council page; rows kept in the table only |

- **Caveat.** The rule is mechanical and the sentences are verbatim, but a few are the motion's heading or a news
  sentence rather than the resolution itself (South Kesteven, Medway, Hackney read that way), and every date is 2019–2023,
  so the line says what a document said then, not what the council does now. If that is not good enough for a council
  page, drop the second step from `council-register.yml` and the rendering block in the page; the data job is harmless on
  its own. Romily's call.

## Checks

- `npx tsc --noEmit` and `npx next build` pass (build with the two public `NEXT_PUBLIC_SUPABASE_*` variables, as on Netlify).
- Dry runs printed counts and samples for the register job (above) and the deprivation loader (`--sample`: ten rows per nation).
- Not deployed.
