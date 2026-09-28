# Data sources, items 1 to 7: results

Built 28 September 2026 by Claude (Cowork) on branch `automation/data-1-7`, cut from `automation/open-data` (c32c1b9),
so merge phase 1, then open data, then this. The list is the build order in `docs/research/11-data-sources.md`.
Nothing here needs a database migration: new data is either fetched live with a cache or read from JSON files in `lib/`
that a weekly workflow refreshes by pull request.

Every figure below was checked against its source after the build (the "Checks" section). No page ranks, scores or
compares councils, parties or candidates; each section uses the same template, in the same order, for every council or
party.

## 1. Election pages from Democracy Club

- Deadlines now come from Democracy Club's EveryElection timetable for the ballot (registration, postal, proxy and
  Voter Authority Certificate deadlines, and whether photo ID is required), falling back to the computed dates when
  the timetable is missing. `lib/democracyclub.ts` `electionTimetable()`, `components/Deadlines.tsx`.
- Results appear on the ballot page from polling day onwards (refreshed every 15 minutes for a fortnight after the
  poll, weekly after that), with registered electors and spoilt ballots. `components/LastTime.tsx`.
- Northern Ireland's voter ID link now points to the Electoral Office's electoral identity card page.
- Not done: ballot descriptions and polling stations were already shown; the SOPN link was already there.

## 2. "{Council} in numbers"

A panel on every council page with the same 14 official indicators, in the same order, from ONS Explore Local
Statistics (population, median age, household income, pay, child poverty, claimant count, house prices and
affordability, healthy life expectancy, emissions, gigabit broadband, EV chargers, active businesses). Each figure
carries its period and its producer. Indicators ONS doesn't publish for a nation are left out there.
`lib/localStats.ts`, `components/AreaNumbers.tsx`. Nomis ward-level figures and the devolved portals are not done.

## 3. Council budgets and council tax

- "What the council plans to spend, 2026–27" on every council page in England (317 with figures), Wales (22) and
  Scotland (32), in each government's own service headings and order:
  - England: MHCLG Revenue Account Budget 2026-27, net current expenditure by service (13 services and the total).
    Nine councils have no figures because their return arrived late (the table marks them "[x]"; the page says so in
    MHCLG's words): South Gloucestershire, Cumberland, Castle Point, Epping Forest, Guildford, Warwick, Coventry,
    Dudley, Greenwich.
  - Wales: StatsWales "Budgeted revenue expenditure by authority and service" (12 headings that add up to the total).
  - Scotland: Scottish Government POBE 2026 revenue workbook, 2026-27 budget estimates (10 headings and the total).
- Council tax for Wales (the council's part, police, average community council, the total, and every band A− to I) and
  Scotland (Band D and every band; excludes water and sewerage), on the council page and on the "about this office"
  page of a council ballot. England keeps its existing MHCLG figures.
- Loader: `scripts/loaders/council_finance.py` writes `lib/council_finance.json`; it refuses to write if any council's
  service lines don't add up to its published total. Housing tables are not done.

## 4. Party pages from the Electoral Commission

For every registered party (398, both registers), `scripts/loaders/party_register.py` writes `lib/party_register.json`,
and each party page now has:
- its register entry: registration date, registered officers (leader, treasurer, nominating officer, campaigns
  officer), where it stands candidates, and every ballot-paper description with its registered Welsh or English
  version;
- its latest central-party statement of accounts (360 parties): income and spending in the Commission's own headings,
  net assets, a link to the statement and the filed PDF;
- loans reported in the last four published quarters (Q3 2025 to Q2 2026), the five largest listed;
- national campaign spending at the 2024 general election, by the Commission's categories (60 parties).

Two traps found and handled: some Commission CSV exports ignore the register filter (the spending export returned the
same 108,000 rows for Great Britain and Northern Ireland, which doubled every total until rows were de-duplicated), and
several parties share a name across the two registers (the Conservatives and the Greens), so accounts are matched on
name and register. The Commission's front end stalls new connections after a burst, so the loader keeps one connection
open; a full run takes about 15 minutes.

## 5. The money layer

PolicyEngine was already run as a package (`scripts/compute_grid.py`), not through its web API; what was missing was a
pinned version and a check. Now:
- `scripts/money/requirements.txt` pins policyengine-uk 2.98.0, the version that computed every row in `receipt_grid`.
  Recomputing the baseline grid with 2.98.0 reproduces the committed `scripts/sql/grid_batch_*.sql` byte for byte.
- `scripts/auto/rates_watch.py` reads 15 official figures from GOV.UK each week (personal allowance, higher and
  additional rate thresholds, NI primary threshold, upper earnings limit and both employee rates, three UC standard
  allowances, both work allowances, the UC taper, both Child Benefit rates) and compares them with the last confirmed
  values (`scripts/money/official_rates.json`) and with the pinned model. Today all 15 agree, with 2.98.0 and with the
  latest release (2.102.2). The job fails, with a table in the run summary, when a figure changes at source or the model
  disagrees. The tax year rolls over by itself on 6 April.
- The "Money layer" workflow runs the watch weekly; its "compute" job (on demand) recomputes the grid and the reform sets
  with any PolicyEngine version, reports whether the figures changed, and attaches them. It never writes to the
  database.

## 6. Parliamentary records

For candidates with a confirmed UK Parliament member id (today, George Galloway in Holborn and St Pancras), the record
now also shows Parliament's own one-line summary, the early day motions they tabled or signed (the eight most recent, of
4,831), and their written questions (the six most recent, of 29) in their own words. The Members API cuts question text
at 255 characters, so any cut question is re-read in full from the Written Questions API, or left out.

MSPs, MSs and MLAs: no candidate on a current ballot is a current or former MSP (checked against the Scottish
Parliament's members list); there are no Northern Ireland ballots. Matching for the devolved legislatures is not built,
since there is no one to show yet; the Senedd's site refuses scripted requests, so it would need its Modern.gov service.

## 7. Learn

- "Parliament now": whether each House is sitting, and the next recess, from Parliament's What's On calendar.
- "Representation of the People Bill: where it has got to": every stage with its dates from the Bills API (now at Lords
  committee stage), the bill's long title in full, and the sponsoring department. Both cached for an hour.

## Workflows added

| Workflow | When | What |
|---|---|---|
| Data files | Tuesdays, and by hand | Runs both loaders; if figures changed, pushes a `data/files-<date>` branch and opens a pull request (never pushes to main, so no deploy is triggered). |
| Money layer | Mondays (watch), by hand (compute) | The rates watch; the grid recompute. |

The repository may not let Actions open pull requests (Settings, Actions, "Allow GitHub Actions to create and approve
pull requests"); if not, the run leaves a warning with the compare link.

## Checks

- tsc and `next build` clean. axe (WCAG 2.2 AA, AAA contrast, best practice) clean on Learn, the Highland, Cardiff and
  Camden council pages and two party pages, light and dark, 390 and 1280 px. No horizontal scroll at 390 px. No CSP
  errors. The React hydration warning seen locally on pages with images comes from the Netlify image URLs, which don't
  exist on a local server; the live site doesn't show it.
- England: 560 values for 40 random councils re-read from the RA file by line heading rather than by asset id: all
  match. Scotland: all 352 values re-read with a different library: all match. Wales: every service list adds up to
  the published total; Cardiff's £2,013.18 and Merthyr Tydfil's £2,593.60 match the Welsh Government's release (£2,013
  and £2,594). Highland's £1,633.99 matches the council's own budget statement already quoted on its page.
- Party figures: the Conservative, Labour, Reform UK, Lib Dem, Green, SNP and Plaid totals match the Commission's
  export; each party's income and spending lines add up to its totals. The 2024 general election totals (Labour
  £30.08m, Reform UK £5.46m) agree with published reporting of the Commission's data.
- Results: the Queen's Park (Brighton and Hove) result of 24 September matches Democracy Club exactly (votes, 33.4%
  turnout of 6,838 electors, 9 spoilt).
- Deadlines: Holborn and St Pancras and Wick and East Caithness match EveryElection's timetable.
