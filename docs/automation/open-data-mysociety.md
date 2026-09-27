# Brief: open data from mySociety (and the official deprivation indices)

Written 27 Sept 2026 for Claude Code, from a review of everything mySociety publishes. Every number below was
checked against the downloaded files on 27 Sept 2026; re-check before relying on it, because `latest` moves.

Read `CLAUDE.md` and `docs/PROJECT.md` first. The rules that never bend apply to all of this: nothing ranked or
scored, nothing typed in by hand, every fact sourced, a job publishes only what it can prove.

## 0. Before anything else: the git pull

Barny pushed one small commit (`b308c27`) onto `automation/phase-1` from another worktree after you finished:
the council page fallback line now reads "Result not yet read from the minutes." instead of "Minutes not yet
published." (the old wording was an unchecked claim for councils the reader hasn't reached, or whose servers refuse
the runner). Your local branch is one commit behind.

```
cd ~/code/voter-app
git status                      # expect a clean tree apart from the untracked tsconfig.tsbuildinfo
git checkout automation/phase-1
git pull --ff-only              # brings in b308c27; must fast-forward, never merge
git log --oneline -3            # b308c27, 4f6b98d, 3647125
```

Then check whether the phase-1 PR has been merged (`git fetch origin && git branch -r --contains 3647125`, or look
for the merge on `origin/main`).
- Merged: branch this work from `origin/main`.
- Not merged yet: branch from `automation/phase-1` (both touch `app/council/[slug]/page.tsx`), and say in the PR
  that it depends on the phase-1 PR.

Branch name: `automation/open-data`. Also already done, so don't redo them: the phase-1 migration
(`council_item_outcomes`, `outcome_queue`) was applied to Supabase on 27 Sept.

## What to build, in order

1. A register of every UK council, loaded weekly from two mySociety datasets.
2. A page for every council in that register, not just the 29 in `lib/councils.json`.
3. The deprivation line for Scotland, Wales and Northern Ireland, from each nation's own official index.
4. A "contact your representatives" link to WriteToThem (no data job; a small UI change).
5. Optional, last, and only if it passes its checks: each council's own climate-emergency motion as a linked source.

Out of scope here: TheyWorkForYou API, TheyWorkForYou Votes, MapIt, FixMyStreet, Local Intelligence Hub, the
climate scorecards, EveryPolitician. Reasons at the end.

---

## 1. Council register

### Sources (direct file URLs; the download pages put an optional survey in front, skip it)

**UK Local Authorities (past, current and future)**, mySociety, CC BY 4.0.
`https://pages.mysociety.org/uk_local_authority_names_and_codes/data/uk_la_future/latest/uk_local_authorities_future.csv`
- 470 rows, 397 with `current-authority` = True (England 332, Scotland 32, Wales 22, Northern Ireland 11; this
  includes combined authorities, which are not councils: filter on `local-authority-type`).
- Columns include `local-authority-code` (the 3-letter BS-6879 code), `official-name`, `nice-name`, `gss-code`,
  `start-date`, `end-date`, `replaced-by`, `nation`, `region`, `local-authority-type`,
  `local-authority-type-name`, `county-la`, `combined-authority`, `alt-names`, `former-gss-codes`, `powers`,
  `lower-or-unitary`, `gov-uk-slug`, `mapit-area-code`, `open-council-data-id`, `wdtk-id`, `pop-2020`, `lat`, `long`.
- Joins we need: `wdtk-id` is filled for 387 of the 397 current rows; `open-council-data-id` for 373 (Open Council
  Data already feeds our `councillors` and `council_control` tables); `gss-code` for our ballots and ONS data.
- Important gap: no row starts after 1 May 2025. Councils created by the current round of reorganisation are not in
  it. So the job must also check ONS's own register of codes (the Code History Database / ONS Postcode Directory,
  which the plan already brings in for phase 6) for current local-authority codes the mySociety file lacks, and
  record those as "in ONS, not yet in mySociety's list" rather than inventing names or types.

**WhatDoTheyKnow authorities**, mySociety, CC BY-SA 4.0 (same licence as our own content, so it fits).
`https://pages.mysociety.org/wdtk_authorities_list/data/whatdotheyknow_authorities_dataset/latest/authorities.csv`
- 46,950 bodies (every public body, not just councils; about 25 MB). Join on `internal-id` = the register's
  `wdtk-id` (the register stores it as a float, e.g. `54906.0`: cast to int).
- Columns: `internal-id`, `name`, `short-name`, `url-name`, `tags`, `home-page`, `publication-scheme`,
  `disclosure-log`, `notes`, `created-at`, `updated-at`, `defunct`, `categories`, `top-level-categories`.
- All 387 joined councils have a `home-page`; only 29 have a `disclosure-log`. Many home pages are old `http://`
  addresses: follow redirects, keep the final `https://` address, and let the weekly link check (`link_check.py`)
  catch dead ones. The home page is the council's own site, which is what every council page needs first.

### Build
- Migration `scripts/sql/migrations/2026-10-XX-council-register.sql`: table `council_register`, primary key the
  register's `local-authority-code`, holding the fields above that we use plus `home_page` (resolved),
  `publication_scheme`, `disclosure_log`, `source_versions` (the dataset versions read), `retrieved_at`. Public-read
  RLS, like every other table.
- Job `scripts/auto/council_register.py` using `common.py` (`fetch`, `write`, `job`, DRY mode): download both files,
  join, resolve home pages, upsert. Record the dataset versions in the `job_runs` note (the dataset pages show them:
  1.7.3 for the register and 0.73.0 for the authorities list on 27 Sept). Weekly workflow
  `.github/workflows/council-register.yml` + manual dispatch; add to `app/status/page.tsx` JOBS and
  `scripts/auto/weekly_review.py` EXPECTED.
- A council that disappears from the file is never deleted from our table: mark it ended, with the file's
  `end-date` and `replaced-by`.

## 2. A page for every council

Today `/council/[slug]` exists only for the 29 councils in `lib/councils.json`, which were built by hand.
- Keep `lib/councils.json` as it is for now: its hand-checked `facts` and `links` stay until phases 2 and 3 of the
  automation plan replace them.
- For any current council in `council_register` without an entry in `councils.json`, render the same page template
  with what the register and our existing automatic tables give: name, type, nation, what powers it has
  (`powers`), the council's own website, who runs it and the councillors (Open Council Data, by
  `open-council-data-id` or name), council tax (existing table), consultations, notices and schools where those
  tables have rows. Every line keeps its source link.
- The five topic lines (housing, transport, council tax, environment, education) say plainly "We haven't read this
  council's own publications yet" where there's no fact, in the same place and words for every council. Never
  fill a gap by hand or by guessing.
- Slugs: derive from `nice-name` in the same style as the current ones (lower case, hyphens, e.g. `brighton-and-hove`), and keep the 29 existing slugs
  unchanged. `councilSlugFor` and `councilBySlug` (lib/councils.ts) must then resolve against the register as well,
  so the area pages, `/explore/housing` and the "Who makes decisions where you live?" chain link to a council page
  wherever one now exists.
- Add every register council to `app/sitemap.ts` and to `app/llms.txt/route.ts` (the councils section).
- Attribution line on each council page and on `/data`: "Council list: mySociety, UK Local Authorities (CC BY 4.0)
  and WhatDoTheyKnow authorities (CC BY-SA 4.0)."

## 3. Deprivation for all four nations

Today `lib/area.ts` `deprivationAt()` returns data only for English neighbourhoods (codes starting `E01`, table
`deprivation_2025`, MHCLG English Indices of Deprivation 2025). The four by-elections in Highland, Stirling,
Aberdeen City and Flintshire get no deprivation line.

Do NOT use mySociety's composite UK index for this. Its files are titled "Composite 2020 UK Index of Multiple
Deprivation", built on older editions: we already use England's 2025 index, and Wales published WIMD 2025 on
27 Nov 2025. Its cross-nation scores are also modelled estimates, and our sentence says "official". Load each
nation's own index from its publisher instead:
- Wales: Welsh Index of Multiple Deprivation 2025 (Welsh Government; gov.wales / StatsWales), by LSOA (`W01...`).
- Scotland: the latest Scottish Index of Multiple Deprivation (Scottish Government, simd.scot). SIMD 2020 is the
  current edition unless a newer one has been published by the time you build: check, and use the newest.
- Northern Ireland: the latest Northern Ireland Multiple Deprivation Measure (NISRA), by Super Output Area.

Build:
- One table per nation or one table with a `nation` column (your call), holding code, name, overall rank and
  decile and the domain deciles each index publishes. Loader scripts in `scripts/loaders/` like the England one, and
  add each to `release_watch.py` so a new edition is noticed.
- `deprivationAt()`: pick the table from the postcode's area code prefix. Check which field postcodes.io returns for
  Scottish data zones and Northern Irish super output areas before relying on it.
- `components/AreaPanel.tsx`: the sentence names the nation's own index and edition, and takes the number of
  areas from the table (count the rows; don't hard-code "33,755"). Domains differ between nations: show only the
  domains that index publishes, under its own names. Never compare one nation's decile with another's.
- Licences: check and state each one (expected Open Government Licence) in `scripts/loaders/README.md`.

## 4. WriteToThem link

A plain link, the same for every area, after the representatives list on the area page
(`app/ballot/[id]/area/page.tsx`), on `/place` and on every council page: "Write to your councillor, MP or other
representatives" → WriteToThem.
- Supported query parameters (from writetothem.com/about-linktous, 27 Sept): `pc` (postcode), `a` (representative
  type: `council` = all their local councillors, `westminstermp`, `regionalmp` = MSP / MS / MLA / London Assembly,
  and finer codes), `message_type` (`casework`, `campaigning`, `other`), `fyr_extref` (the referring page).
- Do NOT pass `pc`. The site's rule is that a full postcode never goes into a URL, and we don't keep it after the
  lookup anyway. Link to `https://www.writetothem.com/` with `a=council` on council pages and no `a` elsewhere, and
  `fyr_extref=https://whatsittome.org` so they can see where people came from. Welsh-language version:
  `cy.writetothem.com`, for later.
- Their condition: no pre-written identical letters. We don't supply any text, so it doesn't apply to us.

## 5. Optional: the council's own climate-emergency motion

Dataset: Local authority climate emergency declarations, mySociety and Climate Emergency UK, CC BY 4.0.
`https://mysociety.github.io/la-plans-promises/data/local_authority_climate_emergency_declarations/latest/declarations.csv`

Its quality is poor for our purposes, so treat it only as a list of leads:
- 404 rows. `motion_url` holds a real link in 167 rows; 215 say "Loading...", 21 say "#ERROR!", 1 is blank
  (spreadsheet artefacts). `made_declaration` is free text in places ("Y*", "N - but made pledges", ...).
- It is old: of the dated rows, 310 are from 2019 and the latest from 2023. Whether a council later changed course
  isn't captured.

Use it only like this: for a row whose `motion_url` is a real link on the council's own website domain (from the
register's resolved home page), fetch it; publish the environment line only if the document is still there and
contains the words "climate emergency" (use `quote_found` from `common.py` on the sentence you show). The line
quotes that sentence and links the council's document, with the date from the document itself, never from the
dataset. Never show the dataset's own flags. Everything else: say nothing. If fewer than a handful pass, drop this
section and say so in the PR.

## Tests before the PR
- Dry run (no service key) of each job; print counts and ten sample rows.
- Council pages: open five that exist only in the register (one each from England, Scotland, Wales and Northern
  Ireland, plus a county council) and the 29 existing ones; the existing 29 must be unchanged apart from the
  attribution line. Screenshot a new one.
- Deprivation: check one postcode in each of Highland, Stirling, Aberdeen City and Flintshire against the
  publisher's own lookup, by hand, and put the four results in the PR.
- WriteToThem: open each link; the `a` value must land on the right choice.
- `npx tsc --noEmit` and `npx next build` pass. Open the PR from the compare page if `gh` still can't see the repo,
  with the description committed as `docs/automation/open-data-results.md`. Don't deploy; Barny batches deploys.

## Looked at and left out (27 Sept 2026)
- **TheyWorkForYou API.** Free for charities and unpaid non-profit projects up to 1,000 calls a month
  (attribution: "Data service provided by TheyWorkForYou"). For Westminster it duplicates the Parliament APIs we
  already use. Worth adding later for the Scottish Parliament, Senedd and Northern Ireland Assembly, when a sitting
  member of one of those stands in an election we cover. Needs a key, which Barny would set as a secret.
- **TheyWorkForYou Votes.** Commons, Lords, Scottish Parliament and Senedd votes, with a free API and bulk files.
  The raw votes may be useful for the devolved chambers later. Its "policies" score members, which paper 08 ruled
  out.
- **MapIt.** Postcode to every area; free for charitable or unpaid non-profit use up to 10,000 calls a month
  (50 a day without a key). postcodes.io and the ONS Postcode Directory plan already cover it.
- **FixMyStreet.** Residents' reports, not the council's own words, and no clear reuse licence for the report data.
- **Local Intelligence Hub.** A campaigning aggregator (paper 09).
- **Council climate scorecards.** They score councils.
- **EveryPolitician.** Not updated since 2019.
- **Composite UK deprivation index.** Older editions and modelled scores (see section 3).
