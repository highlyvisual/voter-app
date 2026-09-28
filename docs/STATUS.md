# Status, 28 September 2026

Where everything stands after the 27 and 28 September build sessions (Claude in Cowork and Claude Code). Replace this file
rather than adding to it; history is in git, `CHANGELOG.md` and the decisions log in `docs/PROJECT.md`.

## Live on whatsittome.org

Last deploy `6aba00a3` (28 Sept), the same code as 27 Sept (`6bf2060`) with `ALLOW_INDEXING=1` set in Netlify: search
engines may now index the site (robots meta "index, follow"; robots.txt lists the sitemap). Everything on `main` after
that is documentation only. Next step for search: submit https://whatsittome.org/sitemap.xml in Google Search Console
and Bing Webmaster Tools.

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

## Built, not merged (three pull requests to open)

The GitHub login on the Mac can't see the private repository, so the PRs are opened from the compare pages. Merge in
this order (each is cut from the one before); none is deployed.

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
3. **Data sources, items 1 to 7** — `automation/data-1-7`, head `28b55c3` (cut from open data).
   https://github.com/highlyvisual/voter-app/compare/automation/open-data...automation/data-1-7?expand=1
   Description: `docs/automation/data-1-7-results.md`. No migration.
   - Election pages: deadlines from Democracy Club's timetable; results with electors and spoilt ballots from polling
     day.
   - Council pages: "{Council} in numbers" (14 ONS indicators, the same for every council); "What the council plans to
     spend, 2026–27" for 371 councils in each government's own headings; council tax for Wales and Scotland.
   - Party pages: the Electoral Commission register entry, latest accounts, loans in the last four quarters and 2024
     general election spending, for all 398 registered parties.
   - Money layer: PolicyEngine pinned at 2.98.0 (reproduces the live grid exactly); a weekly check of 15 GOV.UK rates
     against the model (all agree today); an on-demand recompute job.
   - Candidate records: Parliament's own summary, early day motions and written questions for matched MPs.
   - Learn: "Parliament now" (recess) and the Representation of the People Bill's stages.
   Three of these (area numbers, council spending, the fuller parliamentary record) were on Romily's list of decisions;
   see "Decisions needed". After merging: run the "Data files" workflow once by hand, and allow Actions to open pull
   requests (Settings, Actions, General) or open its weekly branches by hand.

## Outstanding, not blocked (can be built next)

From `docs/research/11-data-sources.md`; items 1 to 7 are built (above). Still to do:
- Future wards for May 2027, once Democracy Club loads the May 2027 elections.
- Parts of items 1–7 left out: Nomis ward-level figures and the devolved statistics portals; council housing tables;
  matching candidates to MSPs, MSs and MLAs (none on current ballots; the Senedd's site refuses scripted requests, so it
  needs its Modern.gov service); Ofgem and Bank of England figures in the rates watch (the grid doesn't use them).

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
- Open the three pull requests and merge them; apply the open-data migration; run the loaders and workflows listed
  above. (Claude can apply the migration through the Supabase connection on your word.) Then one batched deploy.
- Submit the sitemap to Google Search Console and Bing Webmaster Tools (indexing has been on since 28 Sept).
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
- **Area statistics, council spending by service, the fuller parliamentary record (Romily).** Area statistics were asked
  on 25 Sept; all three are now built on `automation/data-1-7` at Barny's instruction, as official figures with their
  source and period and the same template everywhere. If Romily wants any held back, each is one line on the council
  page or candidate card to remove before merging.
- Local petitions by constituency, party-level ad spending (Romily).
