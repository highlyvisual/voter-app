# Open data from mySociety: results (27 September 2026)

Pull request description for branch `automation/open-data`, built from `docs/automation/open-data-mysociety.md`. Kept here
because the build session's GitHub login cannot see the private repository, so Barny opens the PR from the compare page:
`https://github.com/highlyvisual/voter-app/compare/main...automation/open-data?expand=1`

**Depends on the phase-1 PR** (`automation/phase-1`, not merged when this was built): this branch was cut from it as the brief
says, and `origin/main` was merged in so the `llms.txt` route and the data page from main could be edited. Merge phase 1
first; this PR then shows only its own changes.

**Not deployed. Nothing written to the database.** One migration to apply,
`scripts/sql/migrations/2026-09-27-council-register.sql` (tables `council_register`, `council_service_links`,
`deprivation_areas` and `council_lines`), then run `python scripts/loaders/deprivation_nations.py all` once with the service
key and the `Council register` workflow by hand.

The addendum to the brief (later on 27 Sept: GOV.UK's local-authority API, the Local Links Manager export and the ONS Code
History Database) is folded into sections 1 and 2 below. Nothing from the wider catalogue in `docs/research/11-data-sources.md`
was started.

## 1. Council register (built, with the addendum folded in)

- `scripts/auto/council_register.py`, workflow `.github/workflows/council-register.yml` (Mondays 05:50 UTC, manual, on push
  of the script). Sources, joined by code:
  - mySociety's UK Local Authorities file (version 1.7.3, CC BY 4.0): names, types, powers, dates, cross-identifiers.
  - **GOV.UK's local-authority API** (OGL), per council: official home page, tier and parent. The slug is mySociety's
    `gov-uk-slug`; where that is missing or answers 404, a slug made from the name is tried and accepted only if GOV.UK's
    answer names the same council (exact match after stripping "council", "borough" and so on), so nothing is matched by
    guesswork. GOV.UK answered for all 382 councils with pages, 11 of them by that confirmed name match.
  - WhatDoTheyKnow authorities file (0.73.0, CC BY-SA 4.0), joined on `wdtk-id`: a second home page, the publication
    scheme and the disclosure log.
  - **ONS Code History Database** (newest edition on the Open Geography Portal, June 2026 today; OGL), the authority for
    council codes created or terminated since mySociety's file stops (May 2025). A terminated code whose ONS successor has
    the same name is a recode: the council stays current and `ons_gss_code` carries the new code. A terminated code with
    no same-named successor is an abolition: the row stays, marked not current, with ONS's end date and successor codes.
    A live ONS code no register row carries becomes a bare row with only what ONS gives (`in_mysociety = false`, name,
    entity type, date). Today: 495 council codes in the database; recoded 2 (Barnsley E08000016 → E08000038, Sheffield
    E08000019 → E08000039, both 1 April 2025); abolished 0; ONS-only 0. Combined authorities are not council entities in
    the database and are left as mySociety has them.
  - **GOV.UK Local Links Manager export** (OGL): every council's service pages, 45,276 rows for 385 councils, keyed by GSS
    code (45,119 after removing duplicate service/interaction pairs; 376 of our 382 councils have links). Loaded into
    `council_service_links` and replaced wholesale each run. Its `?postcode=` form is never used.
- Home page: GOV.UK's where it has one (382 councils), else WhatDoTheyKnow's (11 more bodies), redirects followed; the
  source is recorded in `home_page_source`. Versions and editions go in the `job_runs` note and in every row.
- A council that leaves mySociety's file is kept and marked not current (`ended_seen_at`), with the file's `end-date` and
  `replaced-by`; 48 ended rows carry a successor already.
- The job also writes `scripts/sql/council_register.json` (current rows, the fields the pages use), which the site uses
  when the table cannot be read, so every council page exists before the migration is applied.
- Dry run (no service key), from the downloaded files: 470 rows (397 current: England 332, Scotland 32, Wales 22,
  Northern Ireland 11; 382 councils with pages once the 14 combined authorities and the Greater London Authority are set
  aside); 434 register rows joined to a WhatDoTheyKnow body; 393 current rows with a home page; 160 with a publication
  scheme and 29 a disclosure log.
- Ten sample rows from the dry run:

| Code | Council | Slug | GSS | Nation | Type (mySociety) | Tier and parent (GOV.UK) | Website (source) |
|---|---|---|---|---|---|---|---|
| CLD | Calderdale | calderdale | E08000033 | England | Metropolitan district | unitary | https://www.calderdale.gov.uk/ (gov.uk) |
| SLK | South Lanarkshire | south-lanarkshire | S12000029 | Scotland | Scottish unitary authority | unitary | https://www.southlanarkshire.gov.uk/ (gov.uk) |
| BOT | Boston | boston | E07000136 | England | Non-metropolitan district | district, Lincolnshire County Council | https://www.boston.gov.uk/ (gov.uk) |
| GED | Gedling | gedling | E07000173 | England | Non-metropolitan district | district, Nottinghamshire County Council | https://www.gedling.gov.uk/ (gov.uk) |
| CHE | Cheshire East | cheshire-east | E06000049 | England | Unitary authority | unitary | https://www.cheshireeast.gov.uk/ (gov.uk) |
| RCC | Redcar and Cleveland | redcar-and-cleveland | E06000003 | England | Unitary authority | unitary | https://www.redcar-cleveland.gov.uk/ (gov.uk) |
| NSM | North Somerset | north-somerset | E06000024 | England | Unitary authority | unitary | https://www.n-somerset.gov.uk/ (gov.uk) |
| OLD | Oldham | oldham | E08000004 | England | Metropolitan district | unitary | https://www.oldham.gov.uk/ (gov.uk) |
| TOR | Torridge | torridge | E07000046 | England | Non-metropolitan district | district, Devon County Council | https://www.torridge.gov.uk/ (gov.uk) |
| MAS | Mansfield | mansfield | E07000174 | England | Non-metropolitan district | district, Nottinghamshire County Council | https://www.mansfield.gov.uk/ (gov.uk) |

  Ten sample service links: Flintshire "Adoption: Providing information"; Cheltenham "Registering for a council property:
  Applications for service"; Rossendale "Litter removal: Providing information"; Birmingham "Conservation area planning:
  Providing information"; South Derbyshire "Pest control: Applications for service"; Northumberland "Allotments:
  Applications for service"; Tewkesbury "Recycling bags and containers: Providing information"; Aberdeenshire "School
  closures: Providing information"; Nuneaton and Bedworth "Housing benefit new claim: Providing information"; Isle of Wight
  "Abandoned vehicles: Reporting".
- Note for the runner: from Barny's machine the mySociety files trickle from GitHub Pages at 2–3 KB/s (the 25 MB one came
  by a sparse `git clone` of `mysociety/wdtk_authorities_list`); GOV.UK, ONS and the other hosts are fast, and GitHub's own
  runners do not have this problem.

## 2. A page for every council (built, with the addendum folded in)

- `lib/councils.ts`: `councilBySlug`, `councilSlugFor` (now async) and the new `listAllCouncils` resolve the 29 hand-built
  councils first, then any current council in the register (combined and strategic authorities excluded). Slugs come from
  `nice-name` in the existing style; all 29 existing slugs derive identically, so nothing moved.
- `/council/[slug]` renders a register-only council with the same template: the register's official name, type and
  powers, nation and region, GOV.UK's tier and parent council (linked to the parent's own page), the council's website
  (GOV.UK's, plus WhatDoTheyKnow's publication scheme and disclosure log where listed), who runs it and the councillors
  (Open Council Data, by name), council tax (England), consultations, notices and schools where those tables have rows,
  and the phase-1 decisions block where the meetings reader covers it. Each of the five topics says "We haven't read this
  council's own publications yet." in the same place, with a link to the council's site.
- **"Do it online" on every council page** (the 29 too): GOV.UK's Local Links Manager links for this council, filtered to
  one fixed list of 23 everyday services in one fixed order (`EVERYDAY_SERVICES` in `lib/councils.ts`: household waste
  collection and missed collections, bulky and garden waste, recycling containers, fly-tipping, road maintenance, street
  lighting, noise, council tax notification, payment, discount and benefit, housing benefit, the electoral register
  (information and applications), primary and secondary school places, libraries, parking permits, planning decision
  notices, the councillors directory and the complaints procedure), each with the export's own wording as the link text.
  Nothing is chosen per council. Shown only once the table exists, so the 29 pages are otherwise unchanged apart from the
  attribution line and the WriteToThem link.
- `app/sitemap.ts` and `app/llms.txt/route.ts` list every council with a page: 382 today (29 before this branch).
- Attribution on every council page and on `/data`: "Council list: mySociety, UK Local Authorities (CC BY 4.0) and
  WhatDoTheyKnow authorities (CC BY-SA 4.0); council websites, tiers and service links: GOV.UK (Open Government Licence);
  codes: ONS Code History Database (Open Government Licence)."
- Checked on a local dev server (`next dev`, public key, snapshot fallback): register-only pages for Bolsover (England,
  district), Fife (Scotland), Torfaen (Wales), Belfast (Northern Ireland) and Hertfordshire (county) all render (HTTP 200)
  with the five "not read yet" lines; Aberdeen City and Wiltshire (hand-built) still show their facts and "Read on" line
  plus the attribution; an unknown slug gives 404; `/place` for a Fife postcode links "What Fife council is deciding".
  Screenshot of Fife (before the GOV.UK tier line and the "Do it online" block, which need the tables):
  `docs/automation/open-data-council-fife.jpg`.

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
