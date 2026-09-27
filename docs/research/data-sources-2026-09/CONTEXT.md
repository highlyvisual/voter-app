# Context for data-source research (27 Sept 2026)

The site: What's It To Me? (whatsittome.org), an independent, non-partisan UK voter-information site. For each UK election it
covers (Westminster by-elections, council elections and by-elections; May 2027 locals next) it lists every candidate in
ballot-paper order with what each has published (verbatim quotes, sourced, dated), and what it could mean for a household
like yours (tax/benefit effects via PolicyEngine UK). Also: council pages ("what's happening where you live": housing,
transport, council tax, environment, education, councillors, motions and their results), area pages (local stats, who
represents you, "who makes decisions where you live" chain from parish to Parliament), Learn and How-to-vote guides.

HARD RULES (a source that breaks these is still worth noting, but mark it "rule risk"):
- Never rank, score, match or recommend candidates/parties/councils. Third-party scores/ratings/predictions can't be shown as fact.
- Every fact comes from a named, dated, linked source; official or primary sources strongly preferred over aggregators.
- Nothing typed by hand: data must be loadable by an automated job (API, bulk file, feed). Cheap/free matters: the project is
  self-funded, runs jobs on GitHub Actions, and keeps API spend near zero.
- Impartial: same treatment for every candidate/party. Avoid campaigning-group curation unless it's the only source and labelled.
- Privacy: no personal data about voters; full postcodes never stored or put in URLs.

ALREADY USED (don't re-research these except to note a better endpoint or a missed feature):
Democracy Club (elections, candidates, statements, photos, postcode lookup via developers API, ElectionLeaflets), UK
Parliament APIs (members, commonsvotes, interests, hansard search, petitions, research briefings), postcodes.io, ONS
boundaries/lookups (ward, LAD, wider bodies), MHCLG English Indices of Deprivation 2025, Police.uk crime (near a point),
UK HPI house prices (region), DWP/ONS claimant count, MHCLG council tax 2026-27 (England), Open Council Data (councillors,
council control), Electoral Commission donations register (party funding), DCLEAPIL ward history, planning.data.gov.uk
(local plans), DfE GIAS (school openings/closures), The Gazette (traffic orders), Citizen Space consultations, Modern.gov
web services (council meetings, minutes), Internet Archive (archiving), OpenStreetMap tiles, PolicyEngine UK, water-company
storm-overflow feed, mySociety datasets (UK local authorities list, WhatDoTheyKnow authorities; composite IMD rejected;
TheyWorkForYou API/Votes, MapIt, FixMyStreet, LIH, climate scorecards reviewed and deferred/rejected).
Considered and rejected before: DfT Street Manager, Commonplace, EngagementHQ, CAPE, Climate Emergency UK scorecards, UK100.

HOW TO RESEARCH
- Actually visit each source (WebFetch/WebSearch). For APIs, fetch the docs and, where possible, one real endpoint to
  prove it works without a key (or note that a key is needed). Do not rely on memory: mark anything you could not verify
  as UNVERIFIED. If a fetch is blocked, say so; do not try to get around it with other tools.
- Today is 27 Sept 2026. Note anything discontinued, frozen or stale (give the latest date seen in the data).
- Be exhaustive within your area: official bodies, regulators, devolved governments (Scotland, Wales, NI), democracy
  and civic-tech organisations, academic datasets, and anything else relevant. Aim for breadth first, then depth on the
  promising ones.

OUTPUT (return as your final message, markdown):
For each source, one block:
### <Name>
- URL(s): docs + a working endpoint/file
- What: the data, in one or two sentences
- Access: API / bulk file / feed; key needed? cost and limits
- Licence and attribution
- Coverage: nations; geography level; time span; update frequency; latest date seen
- Verified: yes (what you fetched) / partly / UNVERIFIED
- Use for us: which page or feature, concretely
- Rule risk: none / what
- Verdict: USE NOW / LATER / NO, with one line why
Then finish with a ranked top 10 for our site, and a list of sources you checked and dismissed in one line each.
