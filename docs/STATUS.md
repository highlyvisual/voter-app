# Status, 28 September 2026

Where everything stands after the 27 September build sessions (Claude in Cowork and Claude Code). Replace this file
rather than adding to it; history is in git, `CHANGELOG.md` and the decisions log in `docs/PROJECT.md`.

## Live on whatsittome.org

Last deploy `6ab92f78a04142ac5c1209d5` (27 Sept), code `6bf2060`. Everything on `main` after that is documentation only.

- Round eight, everything not waiting on Romily: three layers for every claim, the home page leading with the profile,
  "Who makes decisions where you live?", the housing scale explorer, the installable web app, and the rest listed in
  `docs/romily/feedback-log.md` as "Live – for Romily to check".
- Accessibility fixes from the Eye-Able scan (axe clean at WCAG 2.2 AA and AAA contrast).
- The Nova Insight audit work: a shorter home title, a canonical address and its own description on every page,
  structured data (organisation, elections as events with candidates in ballot-paper order, the same template for
  every candidate, FAQs, dataset), `/llms.txt`, named AI crawlers in robots.txt, a `/contact` page, a trust strip on
  the home page, 48px tap targets on phones, lighter fonts (252 KB to 149 KB on the home page) and an AVIF logo. The
  home page is cached for five minutes.
- Database: the phase-1 tables `council_item_outcomes` and `outcome_queue` were applied to Supabase on 27 Sept. They
  are empty until the phase-1 job runs.

## Built, not merged (two pull requests to open)

The GitHub login on the Mac can't see the private repository, so the PRs are opened from the compare pages. Merge in
this order; neither is deployed.

1. **Phase 1, council motion results** — `automation/phase-1`, head `b308c27`.
   https://github.com/highlyvisual/voter-app/compare/main...automation/phase-1?expand=1
   Description: `docs/automation/phase-1-dry-run.md`. Reads the published minutes and shows each item's result in the
   minutes' own words (fixed forms of words, no AI). Dry run on three councils: 129 items settled, 14 queued, 20
   checked by hand against the PDFs, all correct. After merging: run the "motion-outcomes" workflow once by hand.
2. **Open data** — `automation/open-data`, head `c32c1b9` (cut from phase 1, with main merged in).
   https://github.com/highlyvisual/voter-app/compare/main...automation/open-data?expand=1
   Description: `docs/automation/open-data-results.md`.
   - A register of every UK council (382 with pages, up from 29), from mySociety, GOV.UK, WhatDoTheyKnow and the ONS
     Code History Database, refreshed weekly. Every council gets a page with the same template, and every council
     page gets a "Do it online" list of 23 everyday services from GOV.UK.
   - Deprivation for Wales (WIMD 2025), Scotland (SIMD 2020v2) and Northern Ireland (NIMDM 2017), each from its
     official publisher, checked against the publishers' own lookups for the Highland, Stirling, Aberdeen City and
     Flintshire by-elections.
   - A "Write to your councillor, MP or other representatives" link to WriteToThem (no postcode passed).
   - Council climate-emergency motions as quoted sources: built, but see "Decisions needed" below.
   After merging: apply `scripts/sql/migrations/2026-09-27-council-register.sql`, run
   `python scripts/loaders/deprivation_nations.py all` once with the service key, and run the "Council register"
   workflow by hand. Until the migration is applied the pages fall back to `scripts/sql/council_register.json`, so
   nothing breaks.

## Outstanding, not blocked (can be built next)

From `docs/research/11-data-sources.md`, in the suggested order. None started.
1. Election pages from Democracy Club: results the morning after the count, the registration, postal, proxy and
   voter-ID deadlines, the official nomination statement, ballot descriptions, polling stations.
2. "Your area in numbers" for all four nations: ONS Explore Local Statistics, Nomis (ward level), StatsWales,
   data.gov.scot, NISRA.
3. Council pages: spending by service (England, Wales, Scotland), council tax for Scotland and Wales, housing tables.
4. Party pages: the Electoral Commission register, accounts, loans and spending.
5. The money layer: run PolicyEngine UK in GitHub Actions instead of calling its undocumented web backend; take
   displayed rates from GOV.UK, legislation.gov.uk, Ofgem and the Bank of England, never from PolicyEngine's
   parameters (its price cap is stale).
6. Records for candidates who are or were MPs, MSPs, MSs or MLAs.
7. Learn: a live bill tracker (the Representation of the People Bill) and a recess strip.
8. Future wards for May 2027, once Democracy Club loads the May 2027 elections.

Also outstanding, smaller: phase 1b (a reader for the motions the fixed words couldn't settle); the ballot pages are
heavy (about 1.5 MB of HTML for Holborn and St Pancras); the unknown-ballot 404 is blank without JavaScript.

## Blocked

**On Romily**
- Round eight questions: none of the 24 has been answered (the one form submission, 27 Sept 07:51 UTC, was blank).
  Fourteen of them hold up work: where the profile lands (q6); the per-topic numbers (q9); the palette (q10–12); who
  the copy is for and examples of AI-sounding text (q13–14), which the copy pass waits on; the council agenda rule
  (q15); unelected bodies (q16); transport (q17); how elections and Learn should look (q18–19), which the elections
  timeline, the "What can I vote in next?" tool and visual Learn wait on; the journey shape (q20); the app stores (q24).
  Form: https://romily-app-questions.netlify.app/ (round eight).
- The Democracy Club call with Peter Keeling: Romily declined the 28 Sept slot. The remaining offer is 7–9 Oct (the
  week of the Holborn and St Pancras by-election); she can take that or ask Peter for a later time.
- Older and still open: the local-issues rule (round six q12), which journey shape, the "nothing found" wording,
  whether new publications are drafted into claims automatically.

**On Barny**
- Open the two pull requests and merge them; apply the open-data migration; run the loaders and workflows listed above.
  (Claude can apply the migration through the Supabase connection on your word.)
- The search-engine launch date: set `ALLOW_INDEXING=1` in Netlify and redeploy. Until then none of the search work
  counts.
- The repository is private, so the "source code on GitHub" link in the footer and on /about is a dead end for the
  public, which undercuts the AGPL claim. Make it public (also gives unlimited Actions minutes) or change the wording.
- The opening line (paper 01) and the shared Netlify credit pot (paper 07).
- Keys and accounts, all free: a Democracy Club candidates-API token; DWP Stat-Xplore, Bus Open Data and the energy
  certificates register (for later items); Internet Archive keys. Whether to complete Meta's identity check for its
  Ad Library API.
- Ask the Electoral Commission about data access: its main website blocks automated readers (its search API works).

## Decisions needed

- **Climate-emergency lines (Romily).** 17 councils' pages would quote their own 2019–2023 motion. Some quotes are a
  heading or a news sentence rather than the resolution, and one names a party ("our Labour Mayor"). Only 17 of 382
  councils would have one. Recommendation: keep the data job but don't show it until Romily has looked; removing it is
  one step in `council-register.yml` and one block in the council page.
- **Area statistics (Romily)**, asked on 25 Sept: official figures that aren't the council's own words. Now available
  for all four nations.
- Local petitions by constituency, party-level ad spending, the parliamentary record for sitting or former members,
  council spending by service (Romily).
