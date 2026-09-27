# Research index — What's It To Me?

**Date:** 24 September 2026
**Brief:** [00-BRIEF.md](00-BRIEF.md) (seven questions, in priority order); [00-BRIEF-round-2.md](00-BRIEF-round-2.md) (questions 8–10, from Romily's round six). Paper 08 is the earlier data-source test the first brief builds on.
**How this was done:** one researcher per question, then an independent fact-check of each file. The fact-check re-opened the sources, corrected errors and moved anything it couldn't confirm into that file's "Could not verify" list. No file recommends, ranks or scores any candidate or party, and none picks an option for Romily or Barny.

| # | File | One-line conclusion |
|---|---|---|
| 1 | [01-opening-line.md](01-opening-line.md) | Neutral election tools mostly open with a plain task ("Find out…", "Compare…"). Research finds that small wording changes rarely change what people do. "Politics is Personal" flips the 1969–70 feminist slogan, but no party use was found. "Where you stand" is already quiz-site wording. All four lines are compared; none is picked. |
| 2 | [02-promises-against-records.md](02-promises-against-records.md) | A pledge can be paired with a vote with no verdict only when Parliament's own wording for the vote names the same measure. Of 50 pledges from the 2024 manifestos (10 per party, chosen the same way): 5 clean pairs, 7 ambiguous, 38 never voted on. Every clean pair came from a vote the pledging party set up itself. |
| 3 | [03-empty-record-section.md](03-empty-record-section.md) | Other sites do one of three things: the same section for everyone with a neutral line (TheyWorkForYou, Ballotpedia), hiding an empty section (WhoCanIVoteFor), or asking everyone the same questions (Wahl-O-Mat, StemWijzer, smartvote). Almost no research tests an empty "record" box directly. Four layout options are set out; none is picked. |
| 4 | [04-councillors.md](04-councillors.md) | English councils must record names on budget and council tax votes (SI 2014/165, since 25 Feb 2014). Otherwise named votes depend on each council's own rules, and no similar rule was found in Wales, Scotland or NI. No dataset of council votes exists. Attendance and committee membership can be collected by machine; interests and allowances are mostly web pages or PDFs. |
| 5 | [05-regional-level.md](05-regional-level.md) | There is no single "regional" level. What sits between council and Westminster varies by postcode, and some of it is elected and some not. postcodes.io lacks combined authorities, and Democracy Club lists elections only once they are called, so the site needs its own tables and election calendar. Includes six worked postcodes. |
| 6 | [06-local-issues-rule.md](06-local-issues-rule.md) | Five of the eight councils run Modern.gov with an open web service. South Staffordshire uses CMIS, Stirling posts PDFs only, and Camden was blocked from our test environment. A code-ready draft rule was run on Queen's Park (Brighton and Hove). The only item tied to that ward was a pub licence. Every judgement the rule still needs is listed. |
| 7 | [07-running-costs.md](07-running-costs.md) | The site shares a $9/month, 1,000-credit Netlify pot with 27 other sites. It has run out every month since June, and all sites were suspended at 10:08 UTC on 24 Sep (the site was back by 10:22). Each production deploy costs 15 credits. Rough monthly costs for Netlify, Vercel, Cloudflare and Supabase are set out under stated assumptions; no vendor is picked. |
| 8 | [08-track-record-sources.md](08-track-record-sources.md) | Data sources tested 24 Sep before the brief: Commons Votes API (free, per-MP), TheyWorkForYou (paid key; topic summaries are mySociety's judgement), Modern.gov web service (no individual votes; some councils block), ElectionLeaflets.org API, planning.data.gov.uk (England only). |
| 9 | [09-sources-behind-lih-and-dashboard.md](09-sources-behind-lih-and-dashboard.md) | Local Intelligence Hub (Climate Coalition, mySociety, Green Alliance) and Open Innovations' Constituency Dashboards are aggregators, not sources. Underneath: around 60 official datasets we don't yet use, nearly all OGL or Open Parliament Licence, all by constituency. Biggest gaps they expose: crime, income and wages, GP access, school attainment and funding, fuel poverty. Campaign polling, TheyWorkForYou stances and movement data are separated out. |
| 10 | [10-promises-every-method.md](10-promises-every-method.md) | Six families of method for putting a promise next to what happened. Only two stay pure fact: a named Bill's Royal Assent date from Parliament's Bills API (18 of 25 Labour 2024 commitments checked have one; 3 still going through; 4 have no Bill) and a numbered money pledge checked against a Treasury or OBR document. Every other method needs a human judgement, and every tracker says so. All of them work only for the governing party; the published practice is to say why data is absent. |

## Decisions these papers put to Romily or Barny

- **Barny:** which opening line (file 1).
- **Barny:** what to do about the shared Netlify credit pot before the 8 October by-election, for example a separate team or plan, fewer deploys, or another host (file 7).
- **Romily:** whether to adopt the strict pairing rule, and whether to use the per-topic way of choosing pledges (file 2).
- **Romily:** which of the four "no record" layouts to use (file 3).
- **Romily:** what, if anything, to show for councillors where named votes don't exist (file 4).
- **Romily:** what "regional" means on the site, level by level (file 5).
- **Romily and Barny:** whether area statistics belong on the site beyond the current handful, which of the five gaps to fill first, and whether transport becomes a tenth topic (file 9).
- **Romily:** whether council business should appear on a parliamentary by-election page like Holborn and St Pancras at all, and the thresholds in the local-issues rule (file 6).

## Deep dive, 25 September 2026

A full review of the platform against sixty voter-information tools worldwide and the research evidence, with a 117-item improvements list: [docs/bible/platform-review-2026-09.pdf](../bible/platform-review-2026-09.pdf). The eight underlying reports and the verification pass are in [deep-dive-2026-09/](deep-dive-2026-09/).
## Public data sources, 27 September 2026

Every useful public data source we could find, about 250 checked across democracy organisations, Parliament and the devolved legislatures, government, regulators and the four statistics offices: what to build from each, what is excluded and why. [11-data-sources.md](11-data-sources.md), with notes per area in [data-sources-2026-09/](data-sources-2026-09/).
