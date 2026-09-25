# What's It To Me? — project handbook

**Single place for everything about the project.** Code, research, Romily's decisions and the build log all live in this repository (`highlyvisual/voter-app`). If it isn't here, it isn't canonical.

Last consolidated: 24 September 2026.

## What the site is

A non-partisan UK voter-information site. Someone enters a postcode and a few household facts (bands only, nothing stored server-side); the site shows every candidate on their ballot, the same page for each, in ballot-paper order, with every published position quoted from a named, dated, linked source, and what each candidate winning would change for a household like theirs. It never ranks, scores, matches or recommends.

- **Live:** https://whatsittome.org (Netlify site `voter-app-uk`; hustings.org and thisshitmatters.org redirect here)
- **Founder and Product Lead:** Romily Johnson — the project owner; direction questions go to her
- **Technical Lead:** Barny Trevelyan-Johnson — builds, deploys, holds all secrets
- **Contact:** hello@whatsittome.org (forwarding)
- **Licence:** AGPL-3.0
- **First live test:** Holborn and St Pancras by-election, 8 October 2026; then the May 2027 local elections
- **Launch plan (Romily, 24 Sep):** send the site round for feedback after the weekend of 26–27 Sep, then start a social media account after the following weekend

## Where things are

| What | Where |
|---|---|
| Rules the code enforces, stack, how to run, add a ballot, ingest | [README.md](../README.md) |
| Build log, newest at the bottom | [CHANGELOG.md](../CHANGELOG.md) |
| Technical bible: internal edition and funders-and-partners edition (branded PDFs, with HTML source) | [docs/bible/](bible/) |
| Platform review, September 2026: strengths, weaknesses, sixty tools worldwide, the evidence and the law, and a 117-item improvements list | [docs/bible/platform-review-2026-09.pdf](bible/platform-review-2026-09.pdf); the eight underlying reports in [docs/research/deep-dive-2026-09/](research/deep-dive-2026-09/) |
| How every dataset stays current: schedules, jobs, what still needs a person, options considered | [docs/data-freshness.md](data-freshness.md) |
| Things we will refuse to build | [docs/never-build.md](never-build.md) |
| How to write a claim | [docs/claims-style-guide.md](claims-style-guide.md) |
| Parity audit, partners, Welsh handover | [docs/parity-audit.md](parity-audit.md), [docs/partners.md](partners.md), [docs/welsh.md](welsh.md) |
| Research briefs and the ten papers | [docs/research/](research/) — start at [INDEX.md](research/INDEX.md) |
| Romily's question rounds and her answers | [docs/romily/](romily/) — [README.md](romily/README.md); every answer with its status: [feedback-log.md](romily/feedback-log.md) |
| Source of the questions site (romily-app-questions.netlify.app) | [docs/romily/questions-site/](romily/questions-site/) |
| External datasets loaded once (sources, licences, refresh cadence) | [scripts/loaders/README.md](../scripts/loaders/README.md) |
| SQL for those tables | [scripts/sql/migrations/](../scripts/sql/migrations/) |
| Ledger snapshots before each polling day | [snapshots/](../snapshots/) |
| Ballot accuracy reports | [reports/ballot-checks/](../reports/ballot-checks/) |

The shared folder `/Volumes/BTJ_ONE/Projects/UKPolitcs` on Barny's Mac Studio is a working inbox for briefs and research; anything worth keeping is copied here. The Claude project "UK Politics App" holds only a pointer to this file.

## Infrastructure (no secrets here)

- **Hosting:** Netlify site `voter-app-uk` (https://voter-app-uk.netlify.app), Next.js App Router. Chosen so the build session can deploy directly. The site shares a Netlify credit pot with other sites; see research paper 07 for the cost problem and the options.
- **Domains and DNS:** whatsittome.org registered via Vercel, DNS at Vercel (A records, www CNAME, MX, SPF). hustings.org and thisshitmatters.org 301 to it with the path preserved.
- **Database:** Supabase project `voter-app` (ref `urufvcutpksjppbjxouc`, London / eu-west-2, free tier), Postgres + PostGIS. Append-only claims ledger enforced by trigger.
- **Repo:** https://github.com/highlyvisual/voter-app — private for now, AGPL. Working copy on the Mac Studio at `~/code/voter-app`; the clone's remote carries a fine-grained token so the build session can commit and push directly.
- **Nightly job:** `.github/workflows/ingest.yml` (05:17 UTC) — Democracy Club ballots and candidates, then the leaflet scan. Needs the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` repository secrets; `DEMOCRACY_CLUB_TOKEN` (candidates-API token) is optional and not yet issued.
- **Democracy Club developers API:** account "What's It To Me?" on developers.democracyclub.org.uk (created 24 Sep from Romily's login link), hobbyist plan: one key, 1,000 requests a day, `?auth_token=`. Held in Netlify as `DEMOCRACY_CLUB_DEVELOPERS_KEY`; used for postcode lookup. It is not accepted by the candidates API (tested). Peter Keeling (Democracy Club) offered a call: Monday 28 Sep 3–5pm UK, or 7–9 Oct; he also pointed at localintelligencehub.com (Climate Coalition / mySociety / Green Alliance) and dashboard.constituencies.org.uk as data sources.
- **Secrets held only by Barny:** `SUPABASE_SERVICE_ROLE_KEY`, `REVIEWERS`, `DEMOCRACY_CLUB_DEVELOPERS_KEY`, the GitHub token, Netlify and Vercel accounts.
- **Money layer:** precomputed PolicyEngine UK grid (`scripts/compute_grid.py`), assumptions listed on every calculation.

## Decisions log

Dates are when the decision was made or relayed. Newest last.

| Date | By | Decision |
|---|---|---|
| Sep 2026 | Romily | Hard requirements: completely impartial; every fact attributed to its source; no way for figures to be manipulated; no grounds to say the system prefers any candidate. Not-for-profit. Founders named. |
| Sep 2026 | Romily | Version-one scope: nine topics (see below), household questions in bands, no ranking. |
| 18 Sep | Romily | Reviewer / two-person approval dropped. Publication rests on good sources with every claim attributed (quote, publisher, date, link). `/review` becomes the maintainers' correction and withdrawal console. |
| 19 Sep | Barny | Topics expanded from five to nine: money and cost of living; housing; health and social care; education; environment and energy; immigration and borders; crime, policing and justice; defence, foreign affairs and the EU; equality and rights. Optional household questions for disabled family members. LGBTQ+ issues covered as a topic, not a personal question. |
| 19 Sep | Barny | Parties may be represented by their established colours, on party material only; site must be engaging and include maps of the postcode area and voting-area boundary. |
| 19 Sep | Barny | Candidate photos shown where Democracy Club has one (`NEXT_PUBLIC_PHOTOS_MODE=any`), departing from the all-or-none rule. Later superseded by round five (photos only on the candidate's own page). |
| 19 Sep | Barny | External further-reading links acceptable if non-partisan or labelled as biased. |
| 19 Sep | Both | One codebase and organisation for any future country; a .org.uk-style country domain is fine because the same name won't be reused abroad. |
| 21 Sep | Both | Published roles: Romily Johnson, Founder and Product Lead; Barny Trevelyan-Johnson, Technical Lead. Neither is a member of, works for, or is paid by any party or campaign. Self-funded. |
| 21 Sep | Barny | The app will go to the iOS App Store and Google Play; Barny will be the person who updates it. |
| 23 Sep | Romily | Name: What's It To Me? (after This Shit Matters, then Hustings). Domain whatsittome.org. |
| 23 Sep | Romily | Logo: at the time, the "five figures forming a star" option, question mark added to the name, no strapline. |
| 24 Sep | Barny | Logo now the profiles-and-question-mark emblem, home lockup "Politics, in your context." Never to be regressed. |
| 24 Sep | Barny | Map legend layer colours must be clearly different from each other and clearly not party colours; each legend item links to an explanation of what it means in context. |
| 24 Sep | Romily | Empty record section: option 4 from paper 03 — party positions for everyone, a candidate's own record as extra, with the same neutral factual line for anyone without a record. Built 24 Sep. |
| 24 Sep | Romily | Round six answers: no council business on a parliamentary by-election page, the council gets its own page ("What's happening where you live" by topic, sources, then councillors with a register-of-interests link; no attendance, no allowances); no-record line in her wording; promises and votes kept separate for now, research to continue on every method; "regional" becomes whatever exists between council and Westminster as a layered mechanism, elected bodies first; local-issues rule to be rethought; the whole site's copy to sound human, emotional yet factual, never AI. |
| 24 Sep | Romily | Round five answers (full text in [docs/romily/README.md](romily/README.md)): all seven journey changes in progress; feedback version after the new journey; profile with postcode as step one but not framed as "where do you live", with the option to skip; photos only on a candidate's own page, name and party everywhere else; topics ordered by profile with the reason shown, then "Explore all topics"; no-election postcodes get next vote and representatives, then the map; all five levels shown for each layer of government; global issues included; leans to strict pledge-to-vote pairing with no verdict; wants to see both journey shapes (steps vs one page). |

## Open decisions (waiting on a person)

From the research index and round six. Answers arrive in the Netlify form `romily-answers-round-6` on the questions site.

- **Barny:** which opening line (paper 01).
- **Barny:** what to do about the shared Netlify credit pot before 8 October — separate team or plan, fewer deploys, or another host (paper 07).
- **Romily:** what she wants rethought in the local-issues rule (round six q12).
- **Romily:** which journey shape — steps (`/journey/steps`) or one page opening up (`/journey/flow`); both are built, unlinked and noindex.
- **Romily:** reconsider the "nothing found" wording (she said fine for now).
- **From round six, still open:** council motions by proposing group; a refresh routine for the council facts in lib/councils.json; the rest of the copy pass once the opening line is chosen. Full detail in [docs/romily/feedback-log.md](romily/feedback-log.md).

## Handover items still needing a human

Carried from CHANGELOG handovers, still open on 24 Sep:

- Election notice URLs for each ballot beyond the SoPN (`election_dates`).
- Reform UK and Liberal Democrat primary sources for positions.
- Human confirmation of Democracy Club photo licences before any all-or-none rule could apply.
- Council pledges for Lambeth (primary minutes need a browser).
- Welsh translation (docs/welsh.md).
- Democracy Club call with Peter Keeling: Romily to pick Mon 28 Sep 3–5pm UK or 7–9 Oct. Ask: is a candidates-API token separate; rate limits for by-election-day traffic (hobbyist key is 1,000/day); candidate photo licences; scheduled 2027 elections before they are called.

## How the sessions work

- **Build session** works in `~/code/voter-app`, commits and pushes to `main`, deploys to Netlify. Every deploy costs Netlify credits; do not deploy casually.
- **Research session** works from `docs/research/00-BRIEF.md`, writes papers into the UKPolitcs folder, which are then copied into `docs/research/`.
- **Questions to Romily** go on romily-app-questions.netlify.app, one page per round, with a Netlify form for her answers. Source is in `docs/romily/questions-site/`. Gotcha: HTML downloaded from the live site loses `data-netlify="true"`; every `<form>` needs `data-netlify="true" netlify-honeypot="bot-field"` before a redeploy or form detection silently stops.
- **The 24 Sep incident:** a day's uncommitted work was overwritten by a deploy from the clone; it was recovered from Netlify's deploy source and committed. Lesson: commit and push before deploying, every time. The last three pieces that recovery missed (reflow CSS, UX second pass, migration SQL) were merged from the final zip on 24 Sep.
