# Keeping the data current

**Written 25 September 2026.** Every dataset the site shows, where it comes from, how it is kept up to date, and what still needs a person. The rule behind all of it: a machine may refresh anything that comes from an official register or API, and may *notice* anything else changing, but it never rewrites a quotation. A claim is only corrected by a person, as a new superseding row.

Every job records each run in `job_runs`. `/status` shows the latest run of each job and flags anything failed or overdue. A failed run also makes the GitHub workflow fail, so GitHub emails the maintainer. Every Monday, the **weekly review** opens one GitHub issue (labelled `data-review`) listing everything a person needs to act on.

## Schedule

| When | Workflow | Jobs |
|---|---|---|
| Daily, 05:17 UTC | `ingest.yml` | ballot ingest (elections, candidates, statements, withdrawals, archiving) · leaflets · photos · schools (DfE) · consultations |
| Mondays, 05:40 UTC | `council-meetings.yml` | council meetings (Modern.gov agendas and motions) |
| Mondays, 05:50 UTC | `council-register.yml` | council register (every UK council from mySociety; official website, tier and parent from GOV.UK; ONS Code History Database for new and ended codes; every council's service links from GOV.UK's Local Links Manager) · climate declarations |
| Mondays, 06:20 UTC | `motion-outcomes.yml` | motion outcomes (the result of each agenda item from the published minutes; fixed forms of words, no AI) |
| Mondays, 06:30 UTC | `waste-sites.yml` | waste sites (the Environment Agency's register of permitted waste operations in England, for the map layer) |
| Mondays, 06:10 UTC | `weekly-refresh.yml` | Gazette notices · local plans · party publications · new editions of datasets · party funding · source watch · weekly review |

**Minutes budget.** In September the daily ingest alone was using 35 to 60 minutes a run: it re-read every candidate from Democracy Club each night, at 10 requests a minute. It now reads only what it doesn't already hold, re-reading everyone on Mondays. Its first run under the new code took about 16 minutes, still limited by the 10-a-minute cap, and a candidates-API token would cut that to a few minutes. The estimated total across all jobs is about 900 minutes a month, within the 2,000 free minutes a private repository gets. Making the repository public, which the AGPL licence already allows, would remove the limit.

## Every dataset

| Data | Source | How it stays current | Still needs a person |
|---|---|---|---|
| Elections and ballots | Democracy Club elections and candidates APIs | Daily. New ballots appear as soon as Democracy Club lists them. Ballots are archived the day after polling. | Nothing, once a candidates-API token is issued (without one the job is slow) |
| Candidates, statements, withdrawals | Democracy Club | Daily for new or changed candidacies; everyone again on Mondays. Withdrawn candidacies are marked (`withdrawn_at`) and hidden; a candidacy that reappears is restored. | Statements that refer to another election are flagged in the weekly review |
| Photos | Democracy Club | Daily for candidates without a photo; everyone on Mondays | Photo licences (a one-off check) |
| Leaflets | ElectionLeaflets.org | Daily | — |
| Election deadlines | Computed from the statutory working-day rules | Automatic | Official notice links per ballot |
| MPs, votes, interests, petitions | UK Parliament APIs | Live on every page view | — |
| Party positions (claims) | Parties' own publications | **Party publications** job (weekly) lists every new item from party sites and GOV.UK. **Source watch** (weekly) checks every quotation is still at its source. | Reading new publications and drafting claims; acting on quotations no longer found |
| Candidate statement claims | Democracy Club statements | New statements appear automatically on candidate cards. Claims drawn from them are drafted by hand. | Drafting |
| Council facts (five topics, 29 councils) | Councils' own documents (`lib/councils.json`) | Source watch re-reads every fact's link weekly and checks the quotation is still there | Re-checking facts older than 90 days (listed weekly); adding new councils |
| Council housing: local plans | MHCLG planning data platform | Weekly, automatic | — |
| Council transport: traffic orders | The Gazette (codes 1501 and 1503) | Weekly, automatic | London boroughs publish here; most other councils use local newspapers, so their lists are often empty |
| Council education: school openings and closures | DfE Get Information about Schools, daily file | Daily, automatic (England) | Scotland and Wales have no equivalent daily register |
| Council consultations | Councils' Citizen Space sites | Daily, automatic (Camden, Northumberland and Nottinghamshire today). Any council that moves to Citizen Space is picked up automatically. | Other platforms (EngagementHQ has no dates; Commonplace blocks readers) |
| Council register (every UK council: name, codes, type, nation, website, tier, parent) | mySociety, UK Local Authorities (CC BY 4.0); GOV.UK local-authority API (OGL) for the official home page, tier and parent; WhatDoTheyKnow authorities list (CC BY-SA 4.0) for a second home page, publication scheme and disclosure log; ONS Code History Database (OGL) as the authority for codes created or terminated since May 2025 | Weekly, automatic. A council that leaves the file, or whose code ONS terminates without a same-named successor, is marked ended, never deleted; a recode keeps the council and records the new code; a live ONS code mySociety lacks becomes a bare row. Also written to `scripts/sql/council_register.json` as the site's fallback. | — |
| Map layers: bus stops and stations; permitted waste sites | DfT NaPTAN (England via planning.data.gov.uk, Scotland and Wales via the NaPTAN API's area files and `lib/atco_areas.json`); Environment Agency register (`waste_sites`, weekly) and landfill boundaries (WFS), Natural Resources Wales and SEPA (live) | Live on each map view, cached a week per point; the England register weekly | Northern Ireland has no open source for either |
| Council service links ("Do it online") | GOV.UK Local Links Manager daily export (OGL), 45,276 links for 385 councils, by GSS code | Weekly with the register, replaced wholesale; the page shows a fixed list of everyday services | — |
| Council meetings and motions | Councils' Modern.gov web services | Weekly, automatic (14 councils) | Councils that block readers or run other systems |
| Results of council items and motions | The published minutes, via the same web services (each item's own minute text) | Weekly, automatic: a result is recorded only when one of a fixed list of forms of words ("the motion was CARRIED", "RESOLVED", "the report was noted", a recorded vote) appears in that item's minute text, with the exact sentence and a link to the printed minutes. Anything else waits in `outcome_queue`. | Answering the queue (a reader step, phase 1b); the job publishes an answer only after checking the sentence is in the minutes word for word |
| Council tax (England) | MHCLG, annual | **Release watch** flags the new edition each spring | Reloading (once a year; the file name changes each year) |
| Councillors and council control | Open Council Data | Release watch flags a new file | Reload after each May; by-election changes are only on its web pages (ask the owner about their live feed) |
| Party funding | Electoral Commission register | Weekly check; rebuilt automatically when a new quarter is published. Individual donors are grouped by name with titles removed, because the register sometimes holds one person under two records; organisations are grouped by donor ID. | — |
| Deprivation, England | MHCLG English Indices of Deprivation 2025 | Release watch flags a new edition | Reload (every few years) |
| Deprivation, Wales, Scotland and Northern Ireland | Welsh Government WIMD 2025; Scottish Government SIMD 2020v2; NISRA NIMDM 2017 (via OpenDataNI), all OGL | Release watch names the newest edition on each publisher's page (SIMD 2026 is expected late 2026) | Reload with `scripts/loaders/deprivation_nations.py` when an edition changes |
| Wider bodies (combined authorities, fire, NHS boards) | ONS lookups | Release watch flags a new edition | Regenerate `lib/widerBodies.json` |
| Ward history | DCLEAPIL (figshare) | Yearly | Reload |
| Archived copies of sources | Internet Archive | Source watch reuses a recent capture where one exists, otherwise saves one (up to 15 new captures a week). The copy is linked beside each quoted position ("Archived copy"). | — |

## What the source watch does

For each of the roughly 230 sources the site quotes (party and candidate publications behind live claims, and council facts), the source watch:

1. fetches the page or PDF;
2. checks each quotation taken from it is still present word for word, ignoring case, punctuation and line breaks;
3. records a fingerprint (SHA-256) of the readable text, so a change of wording shows up even when the quotations survive;
4. records an Internet Archive copy: a capture the Archive already holds from the last six months if there is one, otherwise a new capture. It makes new captures the first time a source is seen and again when its text changes, up to 15 a run, 25 seconds apart, because the anonymous service refuses bursts. Free Internet Archive keys would allow more.

Spreadsheets are fingerprinted but their quotations are not checked. Sites that block automated readers are listed for a manual check. Results are stored in `source_checks`.

## Options considered and not used

- **DfT Street Manager (roadworks).** The open archive stopped in January 2025, each month is about 1 GB, and live data needs registration. Roadworks are also operational rather than political.
- **Commonplace consultations.** Every request meets a bot challenge.
- **EngagementHQ consultations.** Its `projects.json` endpoint is undocumented, gives no dates, and works on only some councils.
- **mySociety CAPE (council climate targets).** A third party with curation errors; usable only as a pointer to a council's own document.
- **Climate Emergency UK scorecards and UK100.** They score and rank councils, which breaks the no-ranking rule.
- **Scheduling on Netlify.** Netlify scheduled functions draw on the same credit pot that suspended the site on 24 September. Supabase cron and Cloudflare Workers were considered; GitHub Actions is kept because the jobs, logs and secrets are already there.
- **Parsing The Gazette for every council.** Outside London, traffic orders are mostly published in local newspapers, which have no open feed.

## Options that need a decision

- **Romily:** should new party publications and new candidate statements be drafted into claims automatically, with every quotation checked against the source by code, and published for a person to review afterwards? Or should they stay as a list for a person to draft from (today's practice)? The code can check a quotation is word for word; only a person can judge whether the summary is fair.
- **Romily:** whether to add area statistics that are now easy to automate:
  - council area emissions (DESNZ, annual, UK-wide);
  - Housing Delivery Test results and net additional homes (MHCLG, annual);
  - council housing waiting lists (LAHS).

  All are official and neutral, but they are not the council's own words.
- **Romily:** automatic tracking of named Bills' Royal Assent from Parliament's Bills API, for promises (paper 10). It only works for the governing party.
- **Barny:**
  - make the repository public (unlimited Actions minutes) or pay for GitHub Pro;
  - request a Democracy Club candidates-API token, and free Internet Archive keys (a more reliable archiving API);
  - ask Open Council Data about its live feed.
- **Build next, no decision needed:**
  - loaders for council tax in Scotland and Wales, so their council pages get the Band D line automatically;
  - a check of Scotland's school list each January;
