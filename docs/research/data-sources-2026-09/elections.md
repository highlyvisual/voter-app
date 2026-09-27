# Elections and democracy data

Research notes, 27 September 2026. One of five parallel investigations behind `../11-data-sources.md`; the brief and rules each followed are in `CONTEXT.md`. Endpoints were fetched live on the day unless marked UNVERIFIED or partly verified. Re-check anything before building on it: sites change, and some blocked the research environment but may work from GitHub Actions.

I checked 45 sources for UK election and democracy data. Most were fetched live; a few, noted in each block, were blocked or not confirmed. The biggest gaps in what we use are all Democracy Club features we already have access to. It serves results with vote counts, publishes statutory deadlines for every ballot, and git-scrapes LGBCE boundary reviews with links to the new ward maps, including new wards that take effect for the May 2027 locals. The Electoral Commission registers API is also much richer than the donations register we use. Several things were blocked from here: the Electoral Commission main website and commonslibrary.parliament.uk sit behind a JavaScript challenge (403); GitHub listings were blocked, though raw file downloads worked; and andrewteale.me.uk reset the connection, so I read it via WebFetch instead.

---

### Democracy Club Candidates API: results (missed feature)
- URL(s): https://candidates.democracyclub.org.uk/api/docs/next/endpoints/ · https://candidates.democracyclub.org.uk/api/next/results/ · `/api/next/ballots/{ballot_paper_id}/` · `/api/next/candidates_elected/`
- What: Results for each ballot: votes per candidate, elected flag, turnout, spoilt ballots, total electorate and a source link. The ballot object also has `history` (when it was locked and when results were entered) and `results/{id}/versions` (corrections). There is a separate list of elected candidates.
- Access: API, no key. Filters include `election_date`, `election_type`, `has_sopn`, `last_updated`, `for_postcode`, `current`, `future`. Note that `has_results=1` is rejected and needs `true`.
- Licence and attribution: CC BY 4.0, credit "Democracy Club" with a link. Party emblems and candidate photos are excluded.
- Coverage: UK, ballot/ward level, 2010 to now. 37,885 results records; 57,883 elected candidates. 3,068 of 3,074 ballots on 7 May 2026 have results. The Queen's Park (Brighton) by-election of 24 Sep 2026 already has results: electorate 6,838, turnout 33.36%, 9 spoilt. Gaps: the 16 Senedd 2026 closed-list ballots have results objects but no vote counts; 73 of 81 Holyrood 2026 ballots have votes.
- Verified: yes (results list, ballot detail, counts by date and type).
- Use for us: a Result block on each election and by-election page the morning after the count (votes, turnout, spoilt, electorate, source link), and past results for the ward/council on area pages.
- Rule risk: none, if shown as neutral tables. Don't add "safe seat" or "marginal" labels.
- Verdict: **USE NOW**. Already integrated, free, and updated within a day.

### Democracy Club Candidates CSV export
- URL(s): https://candidates.democracyclub.org.uk/data/shortcuts · e.g. `https://candidates.democracyclub.org.uk/data/export_csv/?election_date=2026-09-24&format=csv&field_group=results&field_group=election&field_group=candidacy`
- What: A flat CSV of candidacies. Fields include `party_description_text`, SOPN names, `previous_party_affiliations`, `by_election_reason`, `votes_cast`, `rank`, `turnout_reported`, `spoilt_ballots`, `total_electorate`, `results_source` and GSS codes.
- Access: bulk file, no key, "updated every minute". Filters by election date, election ID regex, party, by-election flag and elected.
- Licence and attribution: CC BY 4.0.
- Coverage: UK, 2010 to now; ready-made shortcuts for 2022–2026 locals, GE2024, PCC 2024, all local and parliamentary by-elections.
- Verified: yes (downloaded the 24 Sep 2026 CSV with results columns).
- Use for us: one nightly GitHub Actions job to backfill results into our database, cheaper than paging the API.
- Rule risk: none.
- Verdict: **USE NOW**. A single file per date covers every candidate and result.

### Democracy Club party objects, ballot-paper descriptions and SOPNs
- URL(s): `/api/next/parties/{ec_id}/` (e.g. https://candidates.democracyclub.org.uk/api/next/parties/PP63/) · `/api/next/party_registers/` · the `sopn` field on each ballot
- What: For each party: registered name, Welsh name, register (GB/NI), nations, status, registration date, every approved ballot description with its approval date, and emblems with EC IDs. For each candidacy: the exact `party_description_text` printed on the ballot paper. For each ballot: the SOPN document (a copy on the DC server plus the council's `source_url`).
- Access: API, no key.
- Licence and attribution: CC BY 4.0, except emblems (Electoral Commission images, not covered).
- Coverage: UK, current. Party record modified 2026-09-27; the Queen's Park SOPN was uploaded 28 Aug 2026.
- Verified: yes.
- Use for us: show the exact ballot-paper wording and link the official SOPN on candidate lists, since the Statement of Persons Nominated is the primary source for ballot order. Party pages list registered descriptions.
- Rule risk: emblems need permission or can't be shown under CC BY.
- Verdict: **USE NOW**, except emblems.

### Democracy Club results Atom feed
- URL(s): https://candidates.democracyclub.org.uk/api/docs/atom/ · https://candidates.democracyclub.org.uk/results/all.atom
- What: A feed of newly entered results, with an extended version that has machine-readable elements.
- Access: feed, no key.
- Licence and attribution: CC BY 4.0.
- Coverage: UK, live.
- Verified: yes (HTTP 200, application/atom+xml, 22 KB).
- Use for us: triggers our "result declared" rebuild instead of polling.
- Rule risk: none.
- Verdict: **LATER**. A nice-to-have on top of `last_updated` polling.

### Democracy Club EveryElection API: timetables, geography, divisions (missed features)
- URL(s): https://elections.democracyclub.org.uk/api/ · e.g. https://elections.democracyclub.org.uk/api/elections/local.blackpool.claremont.by.2026-10-01/ · `.../geo/` · https://elections.democracyclub.org.uk/reference_definition/
- What: For each ballot, a `timetable` with the statutory deadlines: notice of election, close of nominations, SOPN publication, registration, postal vote, proxy vote, Voter Authority Certificate, and replacement pack start. Blackpool Claremont, for example, has a registration deadline of 2026-09-15 and a VAC deadline of 2026-09-23. It also carries `requires_voter_id`, `by_election_reason` (e.g. DEATH), cancellation and replacement details, the voting system, and a `division` with seats and a `divisionset` linking the legislation and the LGBCE consultation. `/geo/` returns the ward boundary as GeoJSON. Filters: `future=1`, `postcode=`, `coords=`, `election_id_regex=`.
- Access: API, no key.
- Licence and attribution: CC BY 4.0.
- Coverage: UK, 46,901 elections. 60 future elections up to 5 Nov 2026. **May 2027 is not loaded yet** (0 for 2027-05-06). Referendums are only council governance ones (5, e.g. `ref.plymouth.2025-07-17`).
- Verified: yes.
- Use for us: "Register by X / apply for a postal vote by Y / get a free voter ID by Z" in the How-to-vote guide and on each election page, plus ward maps without our own boundary processing.
- Rule risk: none.
- Verdict: **USE NOW**. These deadlines are exactly what voters need and cost nothing.

### Democracy Club developers API: polling stations and notifications (partly used)
- URL(s): https://developers.democracyclub.org.uk/api/v1/
- What: Besides ballots, the `/postcode` and `/address` responses include `polling_station` (known or not, address, location), `advance_voting_station`, `notifications` (cancelled election, voter ID), and electoral services and registration contacts.
- Access: API, key needed (we have one). WhereDoIVote's own API needs a separate token ("Not a valid token").
- Licence and attribution: DC terms.
- Coverage: UK, upcoming elections only; no results.
- Verified: partly (docs read; not called with our key).
- Use for us: "Where do I vote" and "your council's elections office" on the How-to-vote guide. The postcode is sent at request time and never stored.
- Rule risk: none, if the privacy rule is kept.
- Verdict: **USE NOW**. If we don't already show polling stations, it's the same call we already make.

### WhoCanIVoteFor API
- URL(s): https://whocanivotefor.co.uk/api/ · https://whocanivotefor.co.uk/api/candidates_for_ballots/?ballot_ids=local.blackpool.claremont.by.2026-10-01
- What: Candidates per ballot, with WhoCanIVoteFor links, photos, leaflets and previous party affiliations.
- Access: API, no key.
- Licence and attribution: DC, CC BY.
- Coverage: UK, current.
- Verified: yes.
- Use for us: a fallback or cross-check for the candidates API.
- Rule risk: none. It exposes some candidate emails; don't republish them.
- Verdict: **NO**. It duplicates the candidates API we already use.

### Democracy Club boundary-data (git-scrape of LGBCE reviews)
- URL(s): https://github.com/DemocracyClub/boundary-data · https://raw.githubusercontent.com/DemocracyClub/boundary-data/master/lgbce.json
- What: 481 boundary reviews (England and Scotland). For each: status (31 CURRENT), latest stage (e.g. "Initial consultation", "Making our recommendation into law"), consultation URL, legislation title and URL, the final recommendations shapefile zip (66 reviews have one, hosted on lgbce.org.uk), and the effective date. Three current reviews take effect on 2027-05-06; one confirmed example is The Cheshire East (Electoral Changes) Order 2026.
- Access: bulk JSON on GitHub raw (372 KB), no key. The GitHub API and web listing were blocked here; the raw file worked.
- Licence and attribution: not stated in the repo. DC data is normally CC BY 4.0; confirm with DC.
- Coverage: England (LGBCE) plus Scottish reviews, 2014–2026, updated by an automated scraper; latest record modified 2026-09-17.
- Verified: yes (downloaded and parsed; the Cheshire East zip returned HTTP 200, application/zip, 1.16 MB).
- Use for us: a "Your ward is changing" notice on council and area pages, the new ward map for the May 2027 locals, and current consultations (e.g. Sheffield, Warrington). ONS only publishes current wards, so this is the only machine-readable source for future ones.
- Rule risk: none.
- Verdict: **USE NOW**. It's the only automated route to future ward boundaries before May 2027.

### LGBCE (Local Government Boundary Commission for England) website and electoral data workbook
- URL(s): https://www.lgbce.org.uk/all-reviews · https://www.lgbce.org.uk/electoral-data · workbook https://www.lgbce.org.uk/sites/default/files/2025-07/spreadsheet_for_all_local_authorities_in_england_.xlsx_incompatible_with_mobile_devices_2024_25.xlsx
- What: Review pages with timelines and documents (HTML only, no API or feed). The workbook (26 MB xlsx) has electorate and councillor counts for every English district ward and county division by year, plus variance from the average.
- Access: HTML and a bulk xlsx, no key.
- Licence and attribution: not stated on the page (UNVERIFIED; probably OGL). The page says to do your own quality checks.
- Coverage: England; ward and division level; 2010 onwards, annual. The latest year collected in District Data is Dec 2023 (published July 2025, labelled "2024").
- Verified: yes (downloaded and parsed).
- Use for us: "About N electors per councillor in your ward" on area pages.
- Rule risk: none.
- Verdict: **LATER**. Useful but a year or two stale; use the git-scrape above for reviews.

### Electoral Commission registers search API (beyond donations)
- URL(s): https://search.electoralcommission.org.uk/ · e.g. `https://search.electoralcommission.org.uk/api/csv/Registrations?currentPage=1&rows=5000&sort=RegulatedEntityName&order=asc&et=pp&register=gb&regStatus=registered&getDescriptions=true` · `/api/search/Accounts?currentPage=1&rows=1&sort=PublishedDate&order=desc` · `/api/search/Loans?...&sort=StartDate&order=desc` · `/api/search/Spending?...&sort=DateIncurred&order=desc` · `/api/search/Registrations?...&et=tp`
- What:
  - **Registrations:** party officers, nations contested, approval dates, and a CSV of ballot descriptions and translations with approval dates. 368 registered GB parties; the descriptions CSV has 1,187 rows.
  - **Non-party campaigners:** 330.
  - **Statements of accounts:** 19,696, broken down by income and expenditure category, including local accounting units such as "Manchester Local Campaign Forum".
  - **Loans:** 1,184.
  - **Campaign spending returns:** 137,337 items.
- Access: undocumented JSON API and CSV export, no key. Paging needs `currentPage=`, and some sort keys are required (the wrong ones return `Total:-1`).
- Licence and attribution: not shown on the search site; the main EC site, which would state it, is blocked here (UNVERIFIED).
- Coverage: GB and NI registers, 2001 onwards, published as reports come in (latest donation published Sept 2026).
- Verified: yes (every endpoint above returned data).
- Use for us: party pages ("registered since…, contests England/Scotland/Wales, approved ballot descriptions", annual income and spending), and local party finances on council pages where a local accounting unit exists.
- Rule risk: impartiality. Show the same fields for every party; don't rank "richest party".
- Verdict: **USE NOW** for registrations and descriptions; **LATER** for accounts, loans and spending.

### Electoral Commission main website (results and turnout, post-poll electoral data, voter ID and VAC reports, candidate spending)
- URL(s): https://www.electoralcommission.org.uk/research-reports-and-data
- What: Per-election reports with xlsx data. The 2025 local elections report exists; the search snippets suggest rejected ballots and voter-ID refusal data, but the contents weren't seen.
- Access: blocked by a JavaScript/cookie challenge (403) for both curl and WebFetch, so it probably can't be fetched by a GitHub Actions job either.
- Licence and attribution: UNVERIFIED.
- Coverage: UNVERIFIED.
- Verified: **UNVERIFIED** (blocked).
- Use for us: turnout, spoilt ballots and "turned away for lack of ID" statistics on Learn pages.
- Rule risk: none.
- Verdict: **LATER**. Needs a manual download or an agreement with the EC.

### House of Commons Library election results site (Westminster)
- URL(s): https://electionresults.parliament.uk/ · https://electionresults.parliament.uk/general-elections/6/candidacies.csv · https://electionresults.parliament.uk/elections/4556/candidate-results.csv · data dictionary https://electionresults.parliament.uk/meta/data-dictionary · SQLite database https://raw.githubusercontent.com/ukparliament/psephology-datasette/main/psephology.db
- What: Verified results for every Westminster candidacy since 2010 (votes, share, change, majority, electorate, valid and invalid votes), notional 2019 results on 2024 boundaries, by-elections, and boundary legislation.
- Access: CSV per election, plus a 4.9 MB SQLite database, no key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK, constituency level, 2005 (notional) to now. The 59th Parliament's by-elections are listed through Clacton (13 Aug 2026). The roadmap's latest release is 31 Mar 2026.
- Verified: yes.
- Use for us: official previous results on Westminster by-election pages, e.g. Holborn and St Pancras on 8 Oct 2026. This is a primary source, preferable to the Democracy Club copy.
- Rule risk: none.
- Verdict: **USE NOW** for Westminster.

### UK Parliament Members API: latest election result (missed feature)
- URL(s): https://members-api.parliament.uk/api/Members/4359/LatestElectionResult · `/api/Location/Constituency/{id}/ElectionResults`
- What: The MP's latest result, with all candidates, votes, majority, electorate and turnout.
- Access: API, no key (we already use this API).
- Licence and attribution: Open Parliament Licence.
- Coverage: UK constituencies.
- Verified: yes.
- Use for us: the MP card on area pages ("elected 2024, majority 10,354").
- Rule risk: none.
- Verdict: **USE NOW**. It's one more call on an API we already use.

### Commons Library local elections handbooks and datasets
- URL(s): https://commonslibrary.parliament.uk/2025-local-elections-handbook-and-dataset/
- What: An xlsx of ward results (candidates, party, votes, turnout, seats) for each May locals.
- Access: bulk xlsx. The site is behind a JavaScript challenge; curl got 403, but WebFetch worked.
- Licence and attribution: Open Parliament Licence.
- Coverage: England. 2025 is confirmed (23 authorities plus 6 mayors). A 2026 edition was **not found**.
- Verified: partly.
- Use for us: a cross-check of Democracy Club results.
- Rule risk: none.
- Verdict: **LATER**. Blocked for automation and duplicates Democracy Club.

### British Election Study 2024 constituency results file
- URL(s): https://api.figshare.com/v2/articles/28430672 (DOI 10.48420/28430672.v1)
- What: GE2024 results for 632 GB constituencies, with census data and candidate data.
- Access: SPSS and Stata files on figshare, no login needed there (the BES website asks for one).
- Licence and attribution: CC BY 4.0.
- Coverage: GB, constituency level, published 2025-02-19.
- Verified: yes (figshare metadata).
- Use for us: little beyond what the Commons Library provides.
- Rule risk: none.
- Verdict: **NO**. It duplicates the Commons Library, and the formats are awkward.

### Local Elections Archive Project (Andrew Teale)
- URL(s): https://www.andrewteale.me.uk/leap/ · /leap/downloads
- What: Every GB local election result since 2002.
- Access: HTML, with CSV downloads for 2011–2022 only. The site covers 2025 in full and 2026 in progress, but only as HTML. Direct fetches got a connection reset here, so I read it via WebFetch.
- Licence and attribution: CC BY-SA 3.0 and GFDL. Share-alike would apply to derived data.
- Coverage: GB, ward level.
- Verified: partly.
- Use for us: already feeds DCLEAPIL.
- Rule risk: share-alike licence.
- Verdict: **NO**. Democracy Club and DCLEAPIL cover it.

### DCLEAPIL (update check)
- URL(s): https://api.figshare.com/v2/articles/28920872
- What: The combined British local election results dataset.
- Access: bulk file (132.8 MB CSV).
- Licence and attribution: CC BY 4.0.
- Coverage: GB, 2006–2024. **Still v1.0 (2025-05-05)**; there has been no newer version and it doesn't cover 2025 or 2026.
- Verified: yes.
- Use for us: we already use it for ward history. Fill 2025 onwards from Democracy Club results.
- Rule risk: none.
- Verdict: **USE NOW (existing)**. Plan the Democracy Club top-up.

### Electoral Management Board for Scotland
- URL(s): https://www.emb.scot/news/article/70/scottish-parliament-2026-results · https://www.emb.scot/downloads/file/1201/full-analysis-of-2026-results · https://www.emb.scot/elections/scottish-local-government-elections-2022
- What: A Holyrood 2026 results analysis by constituency and region (xlsx, 53 KB, published 11 May 2026), downloads and e-count bulletins for the 2022 council elections, and a by-election log that stops in 2021.
- Access: bulk files.
- Licence and attribution: UNVERIFIED.
- Coverage: Scotland.
- Verified: yes (xlsx downloaded).
- Use for us: official list-vote totals that Democracy Club lacks. Also the Scottish councils election in May 2027, which EMB lists.
- Rule risk: none.
- Verdict: **LATER**. Use it when we cover Scottish elections.

### Boundaries Scotland
- URL(s): https://www.boundaries.scot/
- What: Scottish Parliament and ward reviews (currently Highland and Argyll & Bute); PDF maps and a web map.
- Access: HTML and PDF.
- Licence and attribution: not checked.
- Coverage: Scotland.
- Verified: yes (site).
- Use for us: its reviews appear in the Democracy Club git-scrape.
- Rule risk: none.
- Verdict: **NO** directly.

### Electoral Office for Northern Ireland (EONI)
- URL(s): https://www.eoni.org.uk/results-data/ · e.g. https://www.eoni.org.uk/results-data/electorate-statistics/electorate-statistics-by-ward-2026/
- What: **Monthly ward electorates** (total, parliamentary, local government), latest 1 Sept 2026. Results per district electoral area for 2023 are a mix of xlsx and PDF count sheets. There is a polling-place consultation for the 6 May 2027 combined Assembly and council elections.
- Access: xls/xlsx and PDF files.
- Licence and attribution: UNVERIFIED.
- Coverage: NI, ward and district electoral area level.
- Verified: yes.
- Use for us: NI area pages ("N electors in your ward"), and the 2027 NI elections.
- Rule risk: none.
- Verdict: **LATER**. It's needed once we cover NI in 2027.

### Democracy and Boundary Commission Cymru; Westminster boundary commissions (England, Scotland, Wales, NI)
- URL(s): https://www.dbcc.gov.wales/ · https://boundarycommissionforengland.independent.gov.uk/ · https://www.bcomm-scotland.independent.gov.uk/ · https://www.bcomm-wales.gov.uk/ · https://www.boundarycommission.org.uk/
- What: DBCC started a 2030 review of Senedd constituencies on 9 Sep 2026 and publishes community Orders. The four Westminster commissions have been dormant since the 2023 review.
- Access: HTML and PDF.
- Licence and attribution: not checked.
- Coverage: Wales; UK.
- Verified: yes (sites).
- Use for us: a Learn note on reviews.
- Rule risk: none.
- Verdict: **NO** for now.

### ONS electoral registration statistics
- URL(s): https://www.ons.gov.uk/peoplepopulationandcommunity/elections/electoralregistration/datasets/electoralstatisticsforuk · Dec 2025 xlsx: `/file?uri=/peoplepopulationandcommunity/elections/electoralregistration/datasets/electoralstatisticsforuk/december2025/offsenelectoralregistrationstatistics2025.xlsx`
- What: Registered electors and attainers (people about to reach voting age) per Westminster constituency. UK total 47,518,488.
- Access: bulk xlsx, no key.
- Licence and attribution: OGL.
- Coverage: UK constituencies. Published 2 Apr 2026, corrected 8 Jul 2026. **The Dec 2025 edition leaves out local authority figures** because of data-quality problems after franchise changes; they are expected back in Dec 2026.
- Verified: yes (downloaded).
- Use for us: electorate on constituency pages.
- Rule risk: none.
- Verdict: **LATER**. Low value while the local authority figures are missing.

### ONS Open Geography: new 2026 electoral layers (already used)
- URL(s): https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services?f=json
- What: WD_MAY_2026 (wards), CED_MAY_2026 (county divisions), SENC_MAY_2026 (new Senedd constituencies), SPC_MAY_2026 (Scottish Parliament), PCON_DEC_2025, parishes May 2026.
- Access: ArcGIS services, no key.
- Licence and attribution: OGL.
- Coverage: UK.
- Verified: yes (service list).
- Use for us: make sure we're on the May 2026 editions. There are no future wards here, so use LGBCE for those.
- Rule risk: none.
- Verdict: **USE NOW (existing)**.

### OS Boundary-Line
- URL(s): https://api.os.uk/downloads/v1/products/BoundaryLine/downloads
- What: All GB administrative and electoral boundaries (wards, divisions, parishes, constituencies).
- Access: bulk files from the Downloads API, no key. Shapefile, GeoPackage, GML or vector tiles; the GB shapefile is 737 MB.
- Licence and attribution: OGL.
- Coverage: GB, version 2026-05.
- Verified: yes.
- Use for us: only if we move away from ONS.
- Rule risk: none.
- Verdict: **NO**. ONS already covers it.

### GOV.UK digital electoral services performance dashboards
- URL(s): https://www.registertovote.service.gov.uk/performance (and /applications_by_nation, /applications_by_age_group) · https://postal-vote.service.gov.uk/performance · https://proxy-vote.service.gov.uk/performance · https://voter-authority-certificate.service.gov.uk/performance · https://renew-your-overseas-voter-registration.service.gov.uk/performance · data.gov.uk record `digital-electoral-services-performance-data`
- What: Daily registration applications (online and paper, by nation and age band). 26 Sep 2026: 11,987 applications; VAC applications: 17. Similar figures for postal, proxy and overseas renewals.
- Access: HTML tables only, with a date-range form (no JSON or CSV found), so it would need scraping.
- Licence and attribution: data.gov.uk says "License not specified".
- Coverage: UK nations, daily, from June 2018.
- Verified: yes.
- Use for us: a Learn or How-to-vote snippet ("12,000 people registered yesterday"), and deadline-week context.
- Rule risk: none.
- Verdict: **LATER**. A nice extra that needs a scraper and has an unclear licence.

### Wikidata SPARQL
- URL(s): https://query.wikidata.org/sparql
- What: Elections as entities with dates and links, e.g. by-elections (Q7864918) in the UK.
- Access: API, no key.
- Licence and attribution: CC0.
- Coverage: UK. Returned the 2026 Holborn and St Pancras by-election (8 Oct 2026).
- Verified: yes.
- Use for us: cross-links and identifiers only.
- Rule risk: it's an aggregator, not primary.
- Verdict: **NO**. Only as a secondary cross-check.

### Meta Ad Library API; Google political ads bundle; Democracy Club Facebook adverts
- URL(s): https://graph.facebook.com/v21.0/ads_archive · https://storage.googleapis.com/political-csv/google-political-ads-transparency-bundle.zip · https://candidates.democracyclub.org.uk/api/next/facebook_adverts/
- What: Platform ad transparency data.
- Access: Meta needs a token and identity verification (it returned an OAuthException). Google's is a 307 MB zip updated daily (last modified 27 Sep 2026), but UK coverage is UNVERIFIED. Democracy Club's copy has 18,838 ads, but the newest I saw is **2019-12-29**, so it's frozen.
- Licence and attribution: not checked.
- Coverage: see Access.
- Verified: partly.
- Use for us: possibly "ads run by this candidate".
- Rule risk: needs careful impartiality.
- Verdict: **LATER** for Meta; **NO** for the Democracy Club copy.

### Election Maps UK; Electoral Calculus; Britain Elects; Polling Report UK; YouGov and Ipsos
- URL(s): https://electionmaps.uk/ · https://www.electoralcalculus.co.uk/ · britainelects.newstatesman.com · https://pollingreport.uk/
- What: Nowcasts, predictions, polls and council by-election tallies.
- Access: none open. Election Maps UK is a commercial monitoring service with no licence; Britain Elects was unreachable.
- Licence and attribution: none open.
- Coverage: GB.
- Verified: yes (reachable except Britain Elects).
- Use for us: none.
- Rule risk: **yes**. These are predictions and polls, and third-party scores can't be shown as fact.
- Verdict: **NO**.

---

## Top 10 for our site
1. **Democracy Club results** (API, plus the CSV export with the results field group): results, turnout, spoilt ballots and electorate on every election and by-election page, available the next morning.
2. **EveryElection timetable fields**: registration, postal, proxy and VAC deadlines on the How-to-vote guide and election pages.
3. **Democracy Club boundary-data plus LGBCE shapefile zips**: "your ward is changing" and new ward maps for May 2027.
4. **Democracy Club party objects and SOPN links**: exact ballot descriptions and the official nomination statement on candidate lists.
5. **Electoral Commission registrations and descriptions CSV**: official party register facts on party pages.
6. **Commons Library results CSVs**: official previous results for Westminster by-elections.
7. **Members API LatestElectionResult**: the MP's majority on area pages, from an API we already use.
8. **Democracy Club developers API polling-station and notification fields**: "where do I vote" and voter-ID notices.
9. **Electoral Commission statements of accounts, loans and spending**: party finance beyond donations, including local accounting units.
10. **EONI monthly ward electorates, LGBCE ward electorate workbook and ONS constituency electorates**: electorate figures on area pages.

## Checked and dismissed
- **Elections Centre** (electionscentre.co.uk): last posts 2015; now at Exeter; data comes via the Commons Library and DCLEAPIL.
- **electionsscotland.info**: now a spam site.
- **ARK NI elections** (ark.ac.uk/elections): HTML only; last updated for 2024.
- **Open Innovations**: winding down since May 2026. Hex maps (HexJSON) only, no election data.
- **Hansard Society Audit of Political Engagement**: national survey microdata via the UK Data Service, registration needed; no local value.
- **Institute for Government**: no election dataset found; the ministers database page showed no downloads.
- **Electoral Reform Society, Unlock Democracy, openDemocracy**: reports only, and campaigning groups. Involve returned 403; Democratic Audit was unreachable.
- **Who Targets Me**: ad data only for researchers on request.
- **fsargent/electionresults.uk**: an aggregator framed around "electoral distortion" (campaign framing), which is a rule risk.
- **London Datastore election datasets**: London only, and Democracy Club covers the GLA.
- **Zenodo, figshare and Kaggle searches**: nothing better than DCLEAPIL or BES (only a niche Merseyside 1945–2020 set).
- **planning.data.gov.uk**: no neighbourhood-plan referendum dataset (the neighbourhood-forum dataset is empty). Referendum results are only on individual council pages.
- **Parish polls and council tax referendums**: no national dataset found.
- **EveryElection referendums**: only 5 council governance referendums.
- **Modern.gov election results pages**: HTML only, and many are empty (York: "No published elections found").
- **National Records of Scotland electoral statistics**: the page returned 404.
- **Commons Library 2026 local elections handbook**: not found.
- **Senedd 2026 official list-vote totals**: Democracy Club has them without vote counts; the official source is probably Commons Library CBP-10838 (blocked) or regional returning officers (UNVERIFIED).
