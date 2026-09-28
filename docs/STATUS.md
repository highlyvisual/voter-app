# Status, 28 September 2026

Where everything stands after the 27 and 28 September build sessions (Claude in Cowork and Claude Code). Replace this file
rather than adding to it; history is in git, `CHANGELOG.md` and the decisions log in `docs/PROJECT.md`.

## Live on whatsittome.org

Deploy `6aba1ab178dff63ebf0434e2` (28 Sept, 07:44 UTC), code `217e7fd` on `main`: the release merge `cc1af60` of all three
branches (phase 1, open data, data items 1 to 7; merged and built by Claude Code as `release/2026-09-28`), plus a fix to
`scripts/deploy.sh`, which was deleting `scripts/sql/council_register.json` that the council pages now import. Search
indexing is on (`ALLOW_INDEXING=1` since 28 Sept). Checked live after the deploy: council pages for all 382 councils in
the sitemap, spending and "in numbers" panels, party accounts, the Learn recess strip and bill tracker, the former-MP
record; no console or CSP errors. Details of each part: `docs/automation/phase-1-dry-run.md`,
`docs/automation/open-data-results.md`, `docs/automation/data-1-7-results.md`.

Post-merge steps, 28 Sept (Claude in Cowork, on Barny's word):
- Open-data migration applied through the Supabase connection. Public reading of `council_register` was held off until
  the first load, so pages kept using the snapshot meanwhile, then granted.
- "Council register" ran (07:55 UTC): 397 current councils, 382 with pages, 45,119 GOV.UK service links ("Do it online"
  is live). Its climate-emergency step is paused in `council-register.yml` until Romily answers round eight q28;
  `council_lines` is empty.
- Deprivation for Wales, Scotland and NI loaded by the new "Deprivation" workflow: 1,917 + 6,976 + 890 = 9,783 areas.
- "Data files" ran successfully; figures unchanged, so no pull request.
- "Motion outcomes" first run in progress at 08:10 UTC; council motion results appear as it settles items.

Still for Barny: allow Actions to open pull requests (Settings, Actions, General) so weekly "Data files" changes arrive
as PRs.

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
- Allow Actions to open pull requests (Settings, Actions, General).
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
