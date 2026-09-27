# 11. Every useful public data source, September 2026

**Written 27 September 2026.** A search of UK public data for anything the site could load automatically: democracy
organisations, Parliament and the devolved legislatures, every relevant government department and regulator, the
statistics offices of all four nations, and the ad-transparency libraries. Five investigations ran in parallel and
checked about 250 sources, fetching real endpoints rather than trusting documentation. Their full notes, one block per
source with URL, access, licence, coverage, freshness, verification and verdict, are in
`data-sources-2026-09/` (elections, legislatures-government, area-statistics, household-effects,
parties-candidates-money). The brief they worked to is `data-sources-2026-09/CONTEXT.md`.

Fourteen of the most important endpoints were then re-fetched independently the same evening (marked ✔ below). Everything
else is as the investigations found it; re-check before building.

The site's rules decide what is usable: nothing that ranks, scores or rates candidates, parties or councils; official or
primary sources over aggregators; loadable by a job (no hand work); free or close to it; the same treatment for everyone;
no voter personal data and no full postcodes in URLs.

---

## The ten biggest finds

1. **ONS Explore Local Statistics has a data API** ✔. One keyless call returns 50 to 95 official indicators for any UK
   council (Leeds 94, Glasgow 61, Cardiff 64, an NI council 52): population, pay, household income, child and fuel
   poverty, house prices, school results, health, emissions, broadband, EV chargers and more, each with its period.
   `https://www.ons.gov.uk/explore-local-statistics/api/v1/data.csv?geo=E08000035&time=latest`. Undocumented, so
   snapshot the bulk file too.
2. **Democracy Club already has what our election pages lack**: results with votes, turnout and spoilt ballots ✔
   (Queen's Park, Brighton, 24 Sept: turnout 33.36%, 9 spoilt), the statutory **deadlines** for every ballot ✔
   (registration, postal, proxy, voter-ID certificate), the exact ballot-paper descriptions, the official nomination
   statement (SOPN) link, and polling stations. All CC BY 4.0, no key.
3. **Future ward boundaries for May 2027** ✔. Democracy Club scrapes every Boundary Commission review into one JSON file
   (481 reviews, with the final-recommendation shapefiles). ONS only publishes current wards, so this is the only
   automatic route to "your ward is changing".
4. **The Electoral Commission register is an API, not just donations** ✔. Party officers, every registered ballot
   description and emblem, local branches, annual accounts, loans, campaign spending, and donations to individual MPs
   and councillors. Keyless JSON and CSV (undocumented).
5. **The Modern.gov service we already call has `GetElectionResults`** ✔ (Brent: 296 candidates, May 2026). Official
   ward results straight from the council.
6. **GOV.UK's Local Links Manager export** ✔: a daily CSV of every UK council's service pages (bin collection, council
   tax, register to vote, potholes, libraries...), 45,276 rows, 385 councils, with GSS codes. Plus a council-tier API.
7. **How each council spends its money, in all three GB nations**: MHCLG revenue outturn and budget by service
   (England), the new StatsWales API (Wales) and the Scottish local government finance statistics.
8. **Parliament's APIs go far beyond what we use**: a sitting or former MP's official synopsis ✔, votes, EDMs, written
   questions, committee roles and constituency results; bills with every stage (the Representation of the People Bill
   is at Lords committee now, a live example for Learn); petitions with signatures by constituency ✔ (650
   constituencies per petition, with the government response).
9. **Devolved parity is now possible**: the Scottish Parliament data API (209 endpoints), the Senedd (a Modern.gov
   service we can already read, plus petitions), the NI Assembly API; and the statistics portals StatsWales (new API ✔,
   WIMD 2025), data.gov.scot (replacing statistics.gov.scot) and the NISRA Data Portal.
10. **The money layer needs one change**: run PolicyEngine UK as a package in GitHub Actions instead of calling
    `api.policyengine.org`, which is the web app's undocumented backend and runs an older model (v2.90.2 against
    v2.102.2). And never show PolicyEngine's parameter values as today's rates: its energy price cap is stale and it holds
    extrapolated values to 2039. Take displayed rates from GOV.UK, legislation.gov.uk, Ofgem and the Bank of England.

---

## By feature: what to build and where it comes from

### Election pages
| What | Source | Notes |
|---|---|---|
| Result the morning after: votes, elected, turnout, spoilt, electorate, source | Democracy Club results API ✔ and CSV export (`field_group=results`) | CC BY 4.0. Results Atom feed can trigger rebuilds. |
| Official ward results from the council | Modern.gov `GetElectionResults` ✔ | Where the council fills in its election module. A cross-check on Democracy Club. |
| Previous Westminster results | Commons Library election results site: CSV per general election, SQLite for by-elections | Open Parliament Licence. Primary source for Holborn & St Pancras. |
| Deadlines: register, postal, proxy, voter-ID certificate | Democracy Club EveryElection `timetable` ✔ | Also `requires_voter_id`, `by_election_reason`, voting system, ward GeoJSON. May 2027 not loaded yet. |
| Ballot-paper descriptions and the SOPN | Democracy Club ballots and parties | Emblems are Electoral Commission images, not CC BY: don't show without permission. |
| Where do I vote | Democracy Club developers API (the key we have): `polling_station`, `notifications`, electoral services contacts | Postcode sent at request time only, never stored. |
| Your ward is changing | Democracy Club `boundary-data/lgbce.json` ✔ + LGBCE shapefile zips | Licence not stated in the repo: confirm with Democracy Club. |
| Electors | ONS electoral statistics (constituency; council figures return Dec 2026); EONI monthly ward electorates (NI) | |

### Candidates who are or were MPs, MSPs, MSs or MLAs
Same template for every such candidate; take the most recent N items by date, never a hand-picked selection; no
"rebel" or loyalty labels.
- Members API ✔: `Synopsis`, `Biography`, `Contact`, `Focus`, `ContributionSummary`, `Edms`, `WrittenQuestions`,
  `Voting`, `LatestElectionResult`, constituency result history.
- Written Questions and Statements API; Oral Questions and EDMs API; Hansard API (speeches, verbatim and dated);
  Committees API (memberships).
- Devolved: Scottish Parliament API (votes, questions, motions, Official Report, interests), Senedd Record XML, NI
  Assembly AIMS API.
- Later and sensitive: IPSA office costs ✔ (keyless CSV by member ID; category totals only, no comparisons); ministers'
  gifts and hospitality CSVs; Committee on Standards reports (official findings).

### Party pages
- Electoral Commission Registrations ✔: registered since, leader, treasurer, nominating officer, nations contested,
  every ballot description with its approval date, local branches (accounting units).
- Electoral Commission Accounts, Loans, Spending, regulated-donee donations: the same fields for every party; no
  "richest party" ordering.
- Google Political Ads Transparency bundle ✔ (307 MB zip, updated daily; UK included): ad spend on Google and YouTube
  at party level only, with the caveat that candidates usually advertise under their party. Meta's Ad Library API is
  richer but needs identity verification and token upkeep: later.
- Democracy Club person identifiers: a "where this candidate publishes" row of links (party candidate page, website,
  social accounts), which is the only safe way to match accounts to candidates (name matching found a fan account).
  Links only; coverage is uneven, so never imply anything from a missing link.
- Wikidata (CC0) as an ID crosswalk between Democracy Club, Electoral Commission and Parliament IDs. Never as the
  source of a displayed fact.

### Council pages
| Panel | Source |
|---|---|
| The list of councils, with change history | ONS Code History Database and Register of Geographic Codes (June 2026) as the authority; mySociety's list for names, types, powers and cross-IDs (it stops at May 2025). See `docs/automation/open-data-mysociety.md`. |
| Do it online: bins, council tax, register to vote, potholes | GOV.UK Local Links Manager export ✔ (daily) and `/api/local-authority/{slug}` for tier and parent |
| Where the money goes | MHCLG revenue outturn (2025-26, published 17 Sep 2026) and budget (2026-27) by service; StatsWales budget and outturn; Scottish LFR by service |
| Council tax, all of GB | England (have); Scotland gov.scot xlsx (all bands); Wales StatsWales API; VOA stock of properties 2026 (homes in each band by LSOA) |
| Housing | MHCLG live tables: net additional homes, affordable homes, homelessness (H-CLIC), waiting lists; Scottish and Welsh equivalents on data.gov.scot and StatsWales |
| Education | DfE Explore Education Statistics API (free school meals, class sizes, attendance, SEND plans; council and constituency). Not school league tables. |
| Environment | DEFRA recycling rates; planning.data.gov.uk designations (conservation areas, listed buildings, flood zones, AQMAs, tree preservation orders); EA flood warning areas; DESNZ emissions (via ELS) |
| Transport | DfT bus statistics by council; STATS19 injury collisions (aggregated); road condition percentages (not the DfT RAG ratings) |
| Contracts | Find a Tender OCDS API (councils and parishes, live); Contracts Finder later |
| Government notices about the council | GOV.UK Search API (e.g. intervention letters, exceptional financial support); legislation.gov.uk feeds (Electoral Changes Orders, council tax SIs) |
| Later | Local Government Ombudsman complaint counts (this council only, no comparison); planning.data S106 agreements; Sport England Active Places (council leisure centres, CC BY 4.0) |

### Area pages ("what's happening where you live")
- ONS ELS API ✔ as the backbone, council level, all four nations.
- Nomis API for ward level: Census 2021 (tenure, household size, economic activity), claimant count, business counts.
- Deprivation for all four nations: WIMD 2025 via StatsWales ✔, SIMD 2020 via data.gov.scot, NIMDM 2017 via NISRA
  (label its date clearly).
- Council-level UK HPI (the same API we use, with the council slug) and ONS private rents (PIPR) by council.
- Police.uk neighbourhood endpoints: the local team, its published priorities and its next public meeting.
- Parliament, Senedd and Scottish Parliament petitions with signature counts for the constituency, top N by local
  count for every area, labelled as the petitioner's words, with the government response and debate links.
- ONS parish-to-ward-to-council lookup (May 2026) for the parish step of "who makes decisions where you live".
- Later: OHID Fingertips health indicators (values only, without its better/worse colours); NHS ODS GP practices CSV;
  DWP Stat-Xplore (free key) for Universal Credit by ward.

### "What it could mean for you"
- PolicyEngine UK as a package in GitHub Actions (see find 10).
- Today's rates, from the official page, with a content hash to detect changes: GOV.UK Content API (HMRC rates and
  thresholds collection, DWP benefit rates 2026-27, minimum wage, Scottish income tax, student finance, childcare).
  Note that its `public_updated_at` date is unreliable.
- legislation.gov.uk feeds as the tie-breaker when sources disagree (fuel duty is a live three-way conflict between
  HMRC's page, Budget 2025 Table 4.1 and PolicyEngine).
- OBR policy measures database (every tax measure since 1970, every spending measure since 2010, with costings) and
  Budget Table 4.1: the official costing when a pledge echoes an existing or past measure. The OBR download needs the
  token from its page.
- Ofgem price cap (£1,723 a year for Oct to Dec 2026), Bank of England Bank Rate and quoted mortgage rates, ONS CPI.
- Context for "£X for the NHS" pledges: HM Treasury Country and Regional Analysis, PESA, council core spending power.

### Learn
- Bills API: a live "how a bill becomes law", following the Representation of the People Bill.
- What's On API: "Parliament is in recess until…" and "coming up this week"; Statutory Instruments API: "most law is made by ministers";
  Erskine May API for citations; Commons votes grouped by party as plain counts.
- Political ads: TikTok, LinkedIn and Microsoft don't allow paid political ads; the digital imprint rules explain who is
  behind an ad.

---

## Not used, and why
- **Scores and ratings** (the no-ranking rule): Ofsted grades, CQC ratings, HMICFRS PEEL, DfT road maintenance RAG
  ratings, Climate Emergency UK scorecards, TheyWorkForYou "policy" scores, Manifesto Project coding, Fingertips
  better/worse colours, fact-check verdicts (Full Fact, Google Fact Check Tools), polls and predictions (Electoral
  Calculus, Britain Elects, YouGov, Ipsos).
- **Aggregators or campaigning curation where a primary source exists**: LG Inform, Local Intelligence Hub,
  Transparency International's Open Access, Who Targets Me, OpenSanctions (also CC BY-NC), Trussell food bank data,
  Institute for Government ministers database.
- **Closed, frozen or stale**: Oflog (closed), ACOBA (closed 13 Oct 2025), National Chargepoint Registry
  (decommissioned), EveryPolitician (2019), Democracy Club's Facebook adverts copy (2019), the ONS beta private rents
  dataset (2024), statistics.gov.scot and StatsWales OData (replaced), Elections Centre.
- **Not automatable**: Meta's Ad Library report CSV (JS challenge, robots.txt), Mayor's Questions, the APPG register,
  the consultant lobbyists register, council "spend over £500" files (hundreds of layouts), CMIS committee systems (no
  API), Welsh Government consultations (no feed).
- **Privacy or fairness**: Companies House and the Charity Commission for candidates' directorships and trusteeships
  (name-matching errors and profiling private people standing for council; donor companies only, later); party RSS
  feeds (only three parties have working ones); X API (paid), Threads, Facebook and Instagram (gated); Bluesky and
  Mastodon (free, but 1.5% and 0.1% of candidates).
- **Covered better elsewhere**: MapIt, OS Names API, Overpass and Nominatim, TheyWorkForYou (for Westminster), BES
  results file, Andrew Teale's archive, UKMOD.

---

## Warnings before building
- **Blocked from the research environment, may work from GitHub Actions**: the main Electoral Commission site,
  commonslibrary.parliament.uk, digital.nhs.uk and england.nhs.uk (bot checks), Ofcom, opendata.nhs.scot,
  OpenDataNI, the EA bathing-water API. Test each from a workflow before relying on it.
- **Undocumented endpoints** (ELS API, the Electoral Commission search API, IPSA's CSV, PolicyEngine's backend) can
  change without notice: snapshot the data, and make each job fail loudly on a schema change.
- **Two corrections to earlier advice**: mySociety's council list stops at May 2025, so the ONS Code History Database
  is the authority for new councils; and mySociety's composite deprivation index uses older editions, so each nation's
  own index is loaded instead.

## Decisions needed
- **Romily**: whether to add area statistics beyond the council's own words (asked on 25 Sept; now far more are
  available, from official sources, for all four nations); showing local petitions; party-level ad spend; the
  "record in Parliament" block for sitting or former MPs; council spending by service.
- **Barny**: free keys (DWP Stat-Xplore, Bus Open Data, the EPC register); whether to do Meta's identity verification
  for its Ad Library API; asking the Electoral Commission for data access (its main site blocks automated readers);
  confirming the licence of Democracy Club's boundary-data file. Still open from before: making the repository public,
  a Democracy Club candidates-API token.

## Suggested build order (after the open-data phase now under way)
1. Election pages from Democracy Club: results, deadlines, SOPN link, ballot descriptions, polling station.
2. ONS ELS + Nomis + the devolved portals: "your area in numbers" for all four nations.
3. Council pages: Local Links Manager service links, spending by service (three nations), council tax (three nations),
   housing live tables.
4. Electoral Commission party register, accounts, loans and spending on party pages.
5. The money layer: PolicyEngine self-run; official rates baseline with change detection; OBR and Budget costings.
6. Candidate records for sitting or former members (Parliament and devolved APIs).
7. Learn: live bill tracker, recess strip.
8. Future wards for May 2027 (boundary-data), once Democracy Club loads the May 2027 elections.
