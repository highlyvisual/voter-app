# Parties, candidates, campaigning and money

Research notes, 27 September 2026. One of five parallel investigations behind `../11-data-sources.md`; the brief and rules each followed are in `CONTEXT.md`. Endpoints were fetched live on the day unless marked UNVERIFIED or partly verified. Re-check anything before building on it: sites change, and some blocked the research environment but may work from GitHub Actions.

# Research: parties, candidates, campaigning, money and information about them (27 Sept 2026)

I checked about 45 sources, fetching each one directly where the proxy allowed it. Some sites block automated requests, including this environment's proxy: several parliament.uk HTML pages, commonslibrary.parliament.uk, the main Electoral Commission (EC) site, IPSO, Ofcom, the Meta Ad Library pages, web.archive.org's CDX index and several party websites. I have not tried to get around those blocks.

The most useful finding: the EC search site has an undocumented JSON/CSV API that we only use for donations. The same API also covers loans, campaign spending, party accounts and the party register (officers, descriptions, emblems, local accounting units).

---

## A. Political advertising

### Google Political Ads Transparency (bulk bundle / BigQuery)
- URL(s): https://storage.googleapis.com/political-csv/google-political-ads-transparency-bundle.zip ; BigQuery `bigquery-public-data.google_political_ads` ; per-ad pages on adstransparency.google.com
- What: Election ads on Google, YouTube and the display network. It has per-advertiser total spend in GBP, weekly spend per advertiser, and a per-ad file with spend and impression ranges, age/gender/geo targeting and a link to the ad.
- Access: bulk ZIP, no key, 307 MB. The per-ad file alone is 2.9 GB uncompressed. The smaller files can be pulled with HTTP range requests without downloading the whole ZIP (tested). BigQuery needs a free GCP account, with 1 TB of free queries a month.
- Licence and attribution: no licence is stated in the README. Treat as Google terms and attribute "Google Political Ads Transparency Report". UNVERIFIED licence.
- Coverage: UK included (GBP columns; `Regions` contains GB). UK spend is only broken down to country level, not by constituency. UK weekly data runs from 18 Aug 2019 to the week of 20 Sep 2026. The bundle is regenerated daily (seen 27 Sep 2026 06:39 PT). 142 GB advertisers, including The Labour Party (£3.68m total), Liberal Democrats, Conservative & Unionist Party, SNP, Reform UK and Scottish Labour. It also includes newspapers.
- Verified: yes. Fetched the README and the updated, advertiser-stats, geo-spend and weekly-spend files.
- Use for us: party pages and election pages could show "Ads this party ran on Google: £X since 2019, £Y in the last 4 weeks", linking to Google's page.
- Rule risk: low. Spend figures are ranges or totals as reported by Google. Candidates are rarely separate advertisers (they usually run under the party), so the result is uneven by candidate. Present it at party level only, with that caveat.
- Verdict: **USE NOW (party level)**. Official platform data, free, daily, covers the UK.

### Meta Ad Library API (ads_archive)
- URL(s): https://developers.facebook.com/docs/graph-api/reference/ads_archive/ ; endpoint `graph.facebook.com/vXX/ads_archive?ad_reached_countries=GB&ad_type=POLITICAL_AND_ISSUE_ADS`
- What: UK political and issue ads on Facebook and Instagram. Fields include page_name, bylines ("paid for by"), ad_creative_bodies, ad_snapshot_url, dates, spend and impressions as ranges, demographic_distribution, delivery_by_region, estimated_audience_size and target ages/gender/locations.
- Access: API. Needs a Meta developer app, a user token (long-lived tokens expire after about 60 days) and identity confirmation (government ID plus location; reported to take days). Rate limit is about 200 calls per hour. A call without a token returned an OAuthException.
- Licence and attribution: Meta Platform Terms, not an open licence.
- Coverage: UK political and issue ads are archived for 7 years. Region breakdown is UK nations/regions, not constituencies.
- Verified: partly. Fetched the docs; the endpoint was confirmed to exist but refused access without a token. I could not check whether a Kenya-based ID can be used for the verification.
- Use for us: "Ads this party/candidate page is running" on candidate pages, linking to ad_snapshot_url.
- Rule risk: medium on equal treatment. Matching Facebook pages to candidates depends on the Facebook URL held by Democracy Club (DC), which only 14% of May 2026 candidates have. Show it at party level, or "where we know the page".
- Verdict: **LATER**. It is the richest source, but it needs identity verification and token upkeep.

### Meta Ad Library Report (country CSV of spend by page)
- URL(s): facebook.com/ads/library/report/?country=GB ; download pattern `.../report/v2/download/?report_ds=…&country=GB&time_preset=…`
- What: Spend per page and disclaimer for UK political ads, over the last 1, 7, 30 or 90 days or all time.
- Access: a browser download only. A curl request received a JS challenge (403), and robots.txt disallows fetching.
- Licence and attribution: Meta terms.
- Coverage: UK.
- Verified: partly. The page exists but is blocked for automated jobs.
- Use for us: would be ideal for party spend totals.
- Rule risk: none on content. It cannot be loaded by an automated job (breaks the "nothing typed by hand" rule).
- Verdict: **NO** (not automatable). Use the API instead if we go ahead with Meta.

### Snapchat Political Ads Library
- URL(s): https://www.snap.com/political-ads ; https://storage.googleapis.com/ad-manager-political-ads-dump/political/2026/PoliticalAds.zip (also /2024/ and /2025/)
- What: A per-ad CSV with spend in the local currency, impressions, dates, paying advertiser, CandidateBallotInformation, and targeting down to postcode, electoral district, interests and so on.
- Access: bulk ZIP (1.4 MB for 2026), no key.
- Licence and attribution: no licence stated in the readme. UNVERIFIED.
- Coverage: 702 UK rows in the 2026 file. The latest UK ad started on 21 Sep 2026. Party spend is tiny (Scottish Labour £7.6k, Scottish Greens £585). The biggest UK advertiser is the Electoral Commission itself (£297k).
- Verified: yes. Downloaded and parsed the 2026 file.
- Use for us: an extra line in party ad totals.
- Rule risk: none.
- Verdict: **LATER**. Trivial to load, but very little UK party activity.

### TikTok
- URL(s): https://ads.tiktok.com/help/article/tiktok-ads-policy-politics-government-and-elections
- What: Policy: "We do not allow paid political advertising across any of our monetization features". Government and election bodies are only allowed procedural ads.
- Access: none. There is no political ads library because the ads are banned.
- Licence and attribution: n/a.
- Coverage: n/a.
- Verified: yes. Fetched the policy.
- Use for us: a line in the Learn guide: "TikTok doesn't allow paid political ads."
- Rule risk: none.
- Verdict: **NO** (nothing to load).

### X (Twitter) ads transparency
- URL(s): https://business.x.com/en/help/ads-policies/product-policies/ads-transparency
- What: A historical archive of political ads from May 2018 to Nov 2019, plus the EU DSA repository. There is no current UK political ads download.
- Access: the DSA API is EU only and needs a developer account.
- Licence and attribution: X terms.
- Coverage: nothing current for the UK.
- Verified: yes (doc).
- Use for us: none.
- Rule risk: n/a.
- Verdict: **NO**.

### LinkedIn and Microsoft Advertising
- URL(s): linkedin.com/legal/ads-policy (blocked by robots.txt; policy quoted via a secondary source); Microsoft Advertising policy (the help page 404'd)
- What: LinkedIn: "Ads advocating for or against a candidate, party or ballot proposition are prohibited." Microsoft Advertising is reported to ban political ads.
- Access: none.
- Licence and attribution: n/a.
- Coverage: n/a.
- Verified: partly (LinkedIn via a secondary source). Microsoft is UNVERIFIED.
- Use for us: a Learn guide note only.
- Rule risk: n/a.
- Verdict: **NO**.

### Who Targets Me (Trends)
- URL(s): https://trends.whotargets.me ; https://fulldisclosure.whotargets.me
- What: A tracker of political ad spend across platforms, built from the platform libraries plus a browser extension.
- Access: needs a free account, with paid tiers. No public API or bulk licence found.
- Licence and attribution: not stated.
- Coverage: global. They said they planned to cover the UK May 2026 elections.
- Verified: partly (blog).
- Use for us: none. It is an aggregator of the platform sources above.
- Rule risk: third-party curation from a campaigning-adjacent organisation.
- Verdict: **NO**. Use the primary platform sources.

### Electoral Commission digital imprint rules
- URL(s): https://www.electoralcommission.org.uk/statutory-guidance-digital-imprints
- What: Statutory guidance under the Elections Act 2022. Paid digital election material, and some organic material, must carry the promoter's name and address.
- Access: guidance text only, not data.
- Licence and attribution: n/a.
- Coverage: UK.
- Verified: partly (search result; the main EC site blocks curl).
- Use for us: a Learn/How-to-vote explainer on "how to tell who's behind an ad". It also means the Google declared-promoter and Meta byline fields are legally meaningful.
- Rule risk: none.
- Verdict: **USE NOW (Learn content)**.

## B. Candidates' own words and party publications

### Democracy Club person identifiers (better use of a source we already have)
- URL(s): https://candidates.democracyclub.org.uk/data/export_csv/?election_date=2026-05-07&extra_fields=blue_sky_url&extra_fields=party_ppc_page_url&… ; the API returns the same values in `identifiers`
- What: For each candidate, handles and links DC has checked: homepage_url, party_ppc_page_url, twitter_username, facebook_page_url, blue_sky_url, instagram_url, youtube_profile, threads_url, tiktok_url, mastodon_username, linkedin_url and wikidata_id.
- Access: CSV/API, no key.
- Licence and attribution: DC (CC BY-SA? We already use DC, so check our existing attribution).
- Coverage: across 26,854 candidacies on 7 May 2026, the share with each field was:
  - statement: 22.1%
  - party candidate page: 15.2%
  - Facebook: 14.2%
  - X: 13.4%
  - homepage: 5.0%
  - Instagram: 4.8%
  - Bluesky: 1.5%
  - YouTube: 0.7%
  - Threads: 0.1%
- Verified: yes. Downloaded the CSV (11 MB) and measured coverage.
- Use for us: a "Where this candidate publishes" links row, with official party candidate page first. This is the only safe way to match social accounts to candidates. A Bluesky search showed `keirstarmer.bsky.social` is a fan-club account, so matching by name is dangerous.
- Rule risk: low, as long as we show links only. Coverage is uneven, so never imply that a missing link means anything.
- Verdict: **USE NOW**. It is free and already in our pipeline.

### Bluesky public AppView API (AT Protocol)
- URL(s): https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=libdems.org.uk&filter=posts_no_replies ; getProfile
- What: Public posts (text, createdAt, URI) for any handle, with no authentication.
- Access: API, no key. `public.bsky.app` was denied by the proxy, but `public.api.bsky.app` works.
- Licence and attribution: Bluesky terms. Posts belong to their authors; quote and link.
- Coverage: parties with domain-verified handles (libdems.org.uk; latest post 27 Sep 2026). Only 1.5% of candidates have a Bluesky handle recorded in DC.
- Verified: yes (profile and feed fetched).
- Use for us: dated, sourced "latest posts" quotes for parties and for candidates with a DC-recorded handle.
- Rule risk: medium on equal treatment. Only a few candidates have one; show it only as "also said on Bluesky".
- Verdict: **LATER**. Free and clean, but coverage is too thin to feature.

### Mastodon public API
- URL(s): https://mastodon.social/api/v1/accounts/lookup?acct=… ; /api/v1/accounts/{id}/statuses
- What: Public posts, fetched from each account's home server.
- Access: API, no key.
- Licence and attribution: the author's.
- Coverage: 20 candidates (0.1%).
- Verified: yes (test account).
- Use for us: negligible.
- Rule risk: none.
- Verdict: **NO** (almost no uptake).

### YouTube channel RSS / YouTube Data API
- URL(s): https://www.youtube.com/feeds/videos.xml?channel_id=UC… (no key) ; YouTube Data API v3 (free key, 10k units/day)
- What: The latest videos (title, published date, link) for a channel.
- Access: RSS without a key, or the API with a free key. Tested: the RSS feed worked; the API refused a keyless call.
- Licence and attribution: YouTube terms.
- Coverage: 0.7% of candidates; parties have channels.
- Verified: yes (UK Parliament channel feed, latest 22 Sep 2026).
- Use for us: a party page "latest videos" link list.
- Rule risk: equal treatment is only possible at party level.
- Verdict: **LATER**.

### X API
- URL(s): developer.x.com
- What: Posts by user.
- Access: no free read tier since Feb 2026. Pay-per-use is about $0.005 per post read. Basic ($200/month) and Pro moved to pay-per-use in June and Sept 2026.
- Licence and attribution: X terms.
- Coverage: 13% of candidates.
- Verified: partly (pricing via a secondary source).
- Use for us: link the handle only.
- Rule risk: cost.
- Verdict: **NO** (paid).

### Threads API
- URL(s): developers.facebook.com/documentation/threads/threads-profiles
- What: Profile discovery for other users.
- Access: needs the `threads_profile_discovery` permission. Standard access can only look up Meta's own accounts; profiles need 100+ followers.
- Licence and attribution: Meta terms.
- Coverage: 0.1% of candidates.
- Verified: partly (docs).
- Use for us: none.
- Rule risk: n/a.
- Verdict: **NO**.

### Facebook Page posts and Instagram
- URL(s): developers.facebook.com/docs/features-reference/page-public-metadata-access/
- What: Reading other pages' posts needs the Page Public Content Access feature: app review plus business verification. Instagram has no API for reading other accounts.
- Access: gated.
- Licence and attribution: Meta terms.
- Coverage: n/a.
- Verified: partly (docs).
- Use for us: link only.
- Rule risk: n/a.
- Verdict: **NO**.

### Party website RSS feeds
- URL(s):
  - Working: greenparty.org.uk/feed/ (22 Sep 2026), snp.org/feed/ (25 Sep 2026), sinnfein.ie/rss (latest item 1 Jul 2026)
  - Gone (410): labour.org.uk feeds
  - Not found (404): conservatives.com and libdems.org.uk
  - Blocked (403) from here: reformparty.uk, plaid.cymru, allianceparty.org, uup.org, sdlp.ie, restorebritain
  - Empty: yourparty.uk
- What: Press releases and news.
- Access: RSS, where it exists.
- Licence and attribution: party copyright. Quote and link.
- Coverage: patchy.
- Verified: yes (all the URLs above probed).
- Use for us: not suitable as a primary source.
- Rule risk: **equal-treatment risk**. Only some parties could be covered.
- Verdict: **NO**. Rely on DC statements, ElectionLeaflets and party candidate page links. If needed later, archive the party manifesto pages via Wayback.

### GOV.UK Search/Content API and Atom feeds
- URL(s): https://www.gov.uk/api/search.json?filter_content_store_document_type=press_release&order=-public_timestamp ; https://www.gov.uk/search/news-and-communications.atom?organisations[]=…
- What: Government announcements. These are the government's, not the party's.
- Access: API, no key.
- Licence and attribution: OGL v3.
- Coverage: UK government; latest item 27 Sep 2026.
- Verified: yes.
- Use for us: "What the government has announced" on council and area topic pages only.
- Rule risk: must never be presented as the governing party's campaign material. Doing so would favour one party.
- Verdict: **LATER** (policy context, not candidates).

### Wayback Machine CDX (already used)
- URL(s): web.archive.org/cdx/search/cdx
- What: Archive index for captured pages.
- Access: API, no key.
- Licence and attribution: Internet Archive.
- Coverage: n/a.
- Verified: blocked from this environment (connection reset twice; archive.org/wayback/available answered). There is no better endpoint to report.
- Use for us: n/a (already used).
- Rule risk: n/a.
- Verdict: n/a (already used).

### Official PCC and mayoral candidate statement sites
- URL(s): choosemypcc.org.uk (run by MHCLG) ; londonelects.org.uk
- What: Official candidate statements for PCC and London mayoral elections.
- Access: HTML only; no feed found.
- Licence and attribution: Crown / GLA.
- Coverage: PCC elections of May 2024, plus a Norfolk PCC by-election on 16 Jul 2026. London mayor.
- Verified: partly (both sites respond).
- Use for us: link from those election pages. They are official, equal-treatment statements.
- Rule risk: none.
- Verdict: **LATER** (no scheduled PCC or London elections before May 2028).

### Parliament Written Questions and EDM APIs (possibly missed from Parliament APIs)
- URL(s): https://questions-statements-api.parliament.uk/api/writtenquestions/questions?askingMemberId=4514 ; https://oralquestionsandmotions-api.parliament.uk/EarlyDayMotions/list
- What: Written questions an MP asked, and the Early Day Motions (EDMs) they tabled or signed. These are primary records of the MP's own actions.
- Access: API, no key.
- Licence and attribution: Open Parliament Licence.
- Coverage: 61,185 EDMs, latest tabled 15 Sep 2026.
- Verified: yes.
- Use for us: when a sitting MP is a candidate (general elections, or an MP defending a seat), list "EDMs signed" and "questions asked", verbatim and dated.
- Rule risk: low, if listed without scoring.
- Verdict: **LATER**. Not relevant to by-elections without an incumbent.

## C. Money and interests

### Electoral Commission search API: Registrations (party register) **[new feature of a source we already use]**
- URL(s): `https://search.electoralcommission.org.uk/api/search/Registrations?start=0&rows=50&query=&sort=RegulatedEntityName&order=asc&et=pp&et=ppm&register=gb&regStatus=registered` ; `/api/csv/Registrations?…` ; emblem image `/api/Registrations/Emblems/{PartyEmblemId}` (JPEG)
- What: Every registered party with:
  - officers (Leader, Nominating Officer, Treasurer, Campaigns Officer)
  - registered descriptions with approval dates
  - emblems
  - accounting units, i.e. local branches with their treasurer and second officer (Lib Dems have 392)
  - which nations they field candidates in
  - address and minor-party flag
  The same query with `et=tp&register=none` gives the non-party campaigner register (28 registered).
- Access: undocumented JSON/CSV API, no key. The `register` and `regStatus` parameters are required, otherwise it returns `Total:-1`.
- Licence and attribution: EC (OGL-style; cite "Electoral Commission register").
- Coverage: GB 398 parties plus NI; live.
- Verified: yes.
- Use for us: party pages showing "Registered with the Electoral Commission since…", the leader, treasurer and nominating officer, and the exact ballot descriptions and emblems. This also explains why a ballot paper says "Green Party Councillor". Local branches appear on area pages.
- Rule risk: none. Officer names are official public register entries.
- Verdict: **USE NOW**.

### EC search API: Loans
- URL(s): `/api/search/Loans?start=0&rows=50&query=&sort=StartDate&order=desc&et=pp&et=rd&register=gb&register=ni&loanStatus=outstanding&loanStatus=ended`
- What: Loans and credit to parties and regulated donees: lender, value, rate, amount outstanding, status and accounting unit.
- Access: API, no key.
- Licence and attribution: EC.
- Coverage: 1,173 records; latest period Q2 2026.
- Verified: yes.
- Use for us: party funding panel, next to donations.
- Rule risk: none.
- Verdict: **USE NOW**.

### EC search API: Spending (party and non-party campaign expenditure)
- URL(s): `/api/search/Spending?…&et=pp&et=tp&register=gb&register=ni` ; `/api/ReportingPeriods/Spending` lists the election periods
- What: Itemised national campaign spending by parties and non-party campaigners: supplier, category (for example "Unsolicited material to electors"), amounts by nation, and a redacted invoice ID.
- Access: API, no key.
- Licence and attribution: EC.
- Coverage: 117,673 items. UKPGE 2024 was published in July 2025. Periods for the Senedd and Scottish Parliament elections of 7 May 2026 exist, but their data may not be published yet. National elections only; there is no party spending for local elections.
- Verified: yes.
- Use for us: a party page "What it spent at the last general election, by category"; a Learn page on spending limits.
- Rule risk: none.
- Verdict: **USE NOW**.

### EC search API: Accounts (party statements of accounts)
- URL(s): `/api/search/Accounts?…&et=pp&year=2025&register=gb&register=ni&register=none&regStatus=registered&rptBy=centralparty&rptBy=accountingunits`
- What: Annual income and spending by category (membership, donations, staff, campaigning and so on) for central parties and local accounting units.
- Access: API, no key. The `year` and `rptBy` parameters are required.
- Licence and attribution: EC.
- Coverage: 768 statements for 2025.
- Verified: yes.
- Use for us: party page "Where the money comes from" using the official accounts, for example membership income against donations.
- Rule risk: none.
- Verdict: **USE NOW**.

### EC regulated donee donations (a filter we may not be using)
- URL(s): `/api/csv/Donations?…&et=rd…`
- What: Donations to individual MPs, MSPs, MLAs, Senedd members, mayors, councillors, PCCs, leadership candidates and members' associations. Includes company registration numbers of donors.
- Access: API/CSV, no key.
- Licence and attribution: EC.
- Coverage: 752 in 2025–26, of which 634 are to MPs and only 7 to councillors. Latest reporting period is Sept 2026.
- Verified: yes.
- Use for us: donations received by the sitting MP or mayor on area pages.
- Rule risk: none.
- Verdict: **USE NOW** (if not already).

### EC candidate spending: 2024 UK general election spreadsheet
- URL(s): https://www.electoralcommission.org.uk/sites/default/files/2025-04/2024%20UKPGE%20candidate%20spending%20spreadsheet.xlsx
- What: For all 4,526 candidates: constituency (GSS ID), party ID, vote share, spending limit, total reported spending, and spending by category (advertising, unsolicited material, transport, meetings, staff, accommodation, personal), plus total donations accepted and rejected.
- Access: bulk XLSX (1.8 MB), one-off. Contains formulas.
- Licence and attribution: EC.
- Coverage: UK, by constituency; July 2024 election; published April 2025.
- Verified: yes (downloaded and parsed).
- Use for us: a Westminster by-election page could show "At the 2024 general election here, candidates reported spending…". Also a Learn page on local spending limits.
- Rule risk: none, as long as there is no "spent per vote" style ranking.
- Verdict: **LATER**. There is no central equivalent for council elections: those returns are held by each Returning Officer for 2 years and not published centrally.

### EC enforcement: concluded investigations and sanctions
- URL(s): https://www.electoralcommission.org.uk/political-registration-and-regulation/our-enforcement-work/investigations
- What: Monthly tables of closed investigations: who was investigated, what for, the outcome, and any fine.
- Access: HTML tables only. Returns 403 to curl even with a browser user agent; readable only via WebFetch.
- Licence and attribution: EC.
- Coverage: April 2020 onwards; last updated 15 Sep 2026.
- Verified: partly (content via WebFetch; automated access blocked).
- Use for us: party pages showing "Fines from the Electoral Commission" with the date and link.
- Rule risk: none (official).
- Verdict: **LATER**. It would need a scraper that the EC site currently blocks. Ask the EC for CSV or API access.

### IPSA MPs' staffing and business costs **[undocumented CSV endpoint]**
- URL(s): `https://www.theipsa.org.uk/api/mp/expenses?mpId={Parliament member ID}` (CSV) ; https://www.theipsa.org.uk/mp-staffing-business-costs ; other payments as XLSX at assets.ctfassets.net
- What: Every claim for an MP: date, category, cost type, description, supplier details, amount claimed, paid and not paid, status. Keyed by the Parliament member ID we already hold.
- Access: CSV endpoint, no key (it backs the "Download all claim data" link).
- Licence and attribution: OGL v3.
- Coverage: MPs, 2015/16 onwards; latest claim date seen 20 Apr 2026. Published every two months, 4–5 months in arrears.
- Verified: yes (4514: 821 claims).
- Use for us: area page "Your MP's office costs", showing category totals linked to IPSA.
- Rule risk: low. Show totals by category, no rankings. The endpoint is undocumented and could change.
- Verdict: **LATER** (sitting MPs only).

### Councillor allowances
- URL(s): per-council schemes and annual statements; LGA survey (latest 2008); Scotland sets pay nationally (gov.scot / Scottish Local Authorities Remuneration Committee); Wales: Democracy and Boundary Commission Cymru Annual Remuneration Report 2026-27 (dbcc.gov.wales)
- What: England has no aggregator; each council publishes its own scheme and annual payments, in varied formats. Wales and Scotland set basic pay nationally.
- Access: scattered files.
- Licence and attribution: varies by council.
- Coverage: patchy for England.
- Verified: partly (searches, LGA page).
- Use for us: Learn page facts for Wales and Scotland ("A councillor in Wales is paid £X basic").
- Rule risk: none.
- Verdict: **LATER** for Wales and Scotland Learn facts. **NO** for per-councillor pay in England (not loadable).

### Councillors' registers of interests (Modern.gov)
- URL(s): `{council modern.gov}/mgRegisterOfInterests.aspx?UID=…`
- What: Declared interests per councillor, usually as HTML or scanned PDF. The Modern.gov web service has councillor methods (tested GetCouncillorsByWard at Kent), but I found none for interests.
- Access: HTML/PDF, per council.
- Licence and attribution: varies by council.
- Coverage: varies by council.
- Verified: partly (Kent web service worked; Leeds returned 403).
- Use for us: link to the page only.
- Rule risk: none if linked only.
- Verdict: **LATER (link only)**.

### NI Assembly register of interests API
- URL(s): https://data.niassembly.gov.uk/register.asmx/GetAllRegisteredInterests_JSON
- What: All MLAs' registered interests by category.
- Access: API, no key.
- Licence and attribution: Open Government Licence (UNVERIFIED).
- Coverage: NI MLAs; live.
- Verified: yes.
- Use for us: NI area pages.
- Rule risk: none.
- Verdict: **LATER** (we do not cover NI elections yet).

### House of Lords interests (Members API)
- URL(s): https://members-api.parliament.uk/api/Members/{id}/RegisteredInterests
- What: Registered interests of peers.
- Access: API, no key.
- Licence and attribution: Open Parliament Licence.
- Coverage: 816 current peers.
- Verified: yes.
- Use for us: minor. Peers are not elected.
- Rule risk: none.
- Verdict: **NO** (low value).

### Register of Ministers' Gifts and Hospitality (GOV.UK, monthly)
- URL(s): https://www.gov.uk/government/collections/register-of-ministers-gifts-and-hospitality ; attachments found via `https://www.gov.uk/api/content/government/publications/register-of-ministers-gifts-and-hospitality-august-2026`
- What: CSVs per department of gifts and hospitality received by ministers.
- Access: bulk CSV, discoverable through the Content API. No key.
- Licence and attribution: OGL.
- Coverage: monthly; latest is August 2026, published 24 Sep 2026.
- Verified: yes (attachments listed).
- Use for us: when a minister is a candidate or is our MP.
- Rule risk: low.
- Verdict: **LATER**.

### List of Ministers' Interests; ACOBA advice
- URL(s): gov.uk/government/publications/list-of-ministers-interests ; ACOBA organisation on GOV.UK
- What: The ministers' interests list, and ACOBA advice letters on ex-ministers' new jobs.
- Access: GOV.UK publication and letters (list latest 9 Jul 2026; ACOBA latest seen 12 Oct 2025, possibly stale).
- Licence and attribution: OGL.
- Coverage: ministers and ex-ministers only.
- Verified: yes (via the GOV.UK Search API).
- Use for us: few of our candidates are ministers.
- Rule risk: none.
- Verdict: **NO for now**.

### Companies House API
- URL(s): https://api.company-information.service.gov.uk (free key; returned 401 without one)
- What: Company profiles, officers and people with significant control (PSCs).
- Access: API, free key.
- Licence and attribution: public register.
- Coverage: UK companies.
- Verified: partly.
- Use for us: link EC donor company numbers (already in the EC data) to the donor **company's** record. That use is fine.
- Rule risk: **high** if we use it to list candidates' directorships. Matching by name gives false positives; officer records include month and year of birth; and it amounts to profiling private individuals standing for council.
- Verdict: **LATER for donor companies only. NO for candidates.**

### Charity Commission (register API and bulk extract)
- URL(s): api.charitycommission.gov.uk (subscription key; returned 401 without one) ; bulk ZIP at ccewuksprdoneregsadata1.blob.core.windows.net (range request 206, no key)
- What: The register of charities in England and Wales.
- Access: API with key, or bulk file without.
- Licence and attribution: OGL (UNVERIFIED).
- Coverage: England and Wales.
- Verified: partly.
- Use for us: little. Candidates' trusteeships raise the same privacy concern as directorships.
- Rule risk: privacy, as above.
- Verdict: **NO**.

### Register of Consultant Lobbyists
- URL(s): registrarofconsultantlobbyists.org.uk ; search at orcl.my.site.com/CLR_Search (Salesforce)
- What: Lobbying firms and their clients by quarter.
- Access: interactive search only.
- Licence and attribution: not checked.
- Coverage: n/a.
- Verified: the connection was reset or timed out, so I could not check it. UNVERIFIED.
- Use for us: not about candidates.
- Rule risk: n/a.
- Verdict: **NO**.

## D. Fact-checking and scrutiny

### Parliament Committees API: Committee on Standards reports
- URL(s): https://committees-api.parliament.uk/api/Publications?CommitteeId=290&SortOrder=PublicationDateDescending
- What: Committee reports on individual MPs (for example "2nd Report – Andrew Gwynne", 14 Jul 2026), with document links. 228 publications.
- Access: API, no key. Reports are named by MP but carry no member ID, so they must be matched by name.
- Licence and attribution: Open Parliament Licence.
- Coverage: Commons; latest 14 Jul 2026.
- Verified: yes.
- Use for us: "Official standards findings about this MP", on area pages or for sitting-MP candidates.
- Rule risk: low. These are official findings; show them verbatim and dated.
- Verdict: **LATER**.

### Parliamentary Commissioner for Standards (rectifications, investigations) and Independent Expert Panel
- URL(s): parliament.uk …/rectifications-2026/ (14 MPs, latest 1 Sep 2026; PDFs)
- What: Rectifications (minor breaches put right) and current investigations.
- Access: HTML/PDF. curl got 403 from here, and the current-investigations URL I tried returned 404.
- Licence and attribution: Open Parliament Licence.
- Coverage: Commons.
- Verified: partly (via WebFetch).
- Use for us: same as the Standards Committee reports above.
- Rule risk: low (official).
- Verdict: **LATER**. It is only scrapable, and scraping is blocked from here.

### Standards Commission for Scotland
- URL(s): https://www.standardscommissionscotland.org.uk/cases/case-list
- What: Hearing decisions and "no action" decisions about councillors, listed by case reference (for example LA/EL/4546). Each case page names the councillor and council.
- Access: HTML scrape.
- Licence and attribution: not checked.
- Coverage: Scottish councillors.
- Verified: yes (list fetched).
- Use for us: official councillor conduct decisions on Scottish council pages.
- Rule risk: low (official).
- Verdict: **LATER** (Scotland only; needs a scraper).

### Public Services Ombudsman for Wales (code of conduct) and Adjudication Panel for Wales
- URL(s): ombudsman.wales (the casebook URLs I tried returned 404) ; adjudicationpanel.gov.wales (proxy failed)
- What: Code of conduct decisions about Welsh councillors.
- Access: no route found.
- Licence and attribution: n/a.
- Coverage: Wales.
- Verified: UNVERIFIED.
- Use for us: none yet.
- Rule risk: n/a.
- Verdict: **NO for now**.

### NI Local Government Commissioner for Standards (NIPSO)
- URL(s): https://www.nipso.org.uk/nilgcs/latest/adjudication-decision
- What: Adjudication decisions about NI councillors, as HTML and PDF.
- Access: HTML/PDF.
- Licence and attribution: not checked.
- Coverage: NI.
- Verified: partly.
- Use for us: none while NI is out of scope.
- Rule risk: low.
- Verdict: **NO (NI out of scope)**.

### Full Fact
- URL(s): https://fullfact.org/feed/ (RSS, latest 25 Sep 2026) ; articles carry schema.org ClaimReview JSON-LD
- What: Fact checks, some naming politicians (for example "max-wilkinson-brexit-small-boats").
- Access: RSS plus markup, no key.
- Licence and attribution: "© Copyright 2010-2026 Full Fact", not openly licensed.
- Coverage: UK; latest 25 Sep 2026.
- Verified: yes.
- Use for us: at most a link out.
- Rule risk: **yes**. Verdicts are third-party judgements, coverage of candidates is uneven, and the content is copyright.
- Verdict: **NO** (at most a generic "fact-checkers" link in Learn).

### Google Fact Check Tools API and Data Commons ClaimReview feed
- URL(s): factchecktools.googleapis.com/v1alpha1/claims:search (key needed; returned 403 without one) ; https://storage.googleapis.com/datacommons-feeds/claimreview/latest/data.json (200 MB, no key, dated 25 Sep 2026)
- What: Aggregated ClaimReview fact checks from many publishers.
- Access: API with a free key, or the bulk feed.
- Licence and attribution: per publisher.
- Coverage: global, mixed.
- Verified: yes (both endpoints).
- Use for us: none.
- Rule risk: **yes**. Third-party verdicts, uneven coverage, and name matching.
- Verdict: **NO**.

### BBC Verify, Ofcom and IPSO rulings
- URL(s): BBC news RSS works (politics feed latest 27 Sep 2026) ; ipso.co.uk/rulings and ofcom.org.uk bulletins both returned 403
- What: BBC Verify is journalism, not data. Ofcom and IPSO rulings are about broadcasters and newspapers, not candidates.
- Access: RSS / blocked HTML.
- Licence and attribution: n/a.
- Coverage: n/a.
- Verified: partly.
- Use for us: none.
- Rule risk: n/a.
- Verdict: **NO**.

### Recall petitions
- URL(s): Commons Library briefing SN05089 (5 Feb 2026)
- What: Briefing on recall petitions. There is no dataset or API.
- Access: briefing only.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK.
- Verified: partly (search).
- Use for us: a Learn page explainer only.
- Rule risk: none.
- Verdict: **LATER (Learn)**.

## E. Knowledge bases

### Wikidata SPARQL
- URL(s): https://query.wikidata.org/sparql
- What: People and parties linked by ID: P6465 Democracy Club candidate ID (15,191 people), P4217 UK Electoral Commission ID (597 parties), P6213 UK Parliament ID, P2171 TheyWorkForYou ID; positions held (P39) and more.
- Access: SPARQL endpoint, no key.
- Licence and attribution: CC0.
- Coverage: UK politicians and parties; live.
- Verified: yes (counts above).
- Use for us: a crosswalk between DC, EC and Parliament IDs, and party founding dates and logos.
- Rule risk: community-edited. Use it for linking IDs only, never as the source of a displayed fact.
- Verdict: **USE NOW (ID crosswalk only)**.

### Wikipedia API
- URL(s): en.wikipedia.org/w/api.php
- What: Article text. The live intro for Reform UK calls it "right-wing populist and far-right".
- Access: API, no key.
- Licence and attribution: CC BY-SA.
- Coverage: global.
- Verified: yes.
- Use for us: none.
- Rule risk: **yes**. Editable, and uses contested labels.
- Verdict: **NO**.

### OpenSanctions
- URL(s): data.opensanctions.org/datasets/latest/gb_commons (4,541 entities, 21 Sep 2026), gb_lords, gb_coh_disqualified
- What: Repackaged UK Parliament Members API data, framed as "politically exposed persons" for sanctions screening.
- Access: bulk files, no key.
- Licence and attribution: CC BY-NC 4.0. Non-commercial use is free, but whether our site qualifies is unclear.
- Coverage: UK MPs and peers.
- Verified: yes.
- Use for us: none. We already use the primary Parliament source.
- Rule risk: the "PEP" framing, and the licence.
- Verdict: **NO**.

### EveryPolitician
- URL(s): github everypolitician-data
- What: Legislature membership data.
- Access: GitHub.
- Licence and attribution: n/a.
- Coverage: frozen; last update May 2019.
- Verified: yes.
- Use for us: none.
- Rule risk: n/a.
- Verdict: **NO**.

### Manifesto Project API
- URL(s): manifesto-project.wzb.eu/api/v1 (responds; key needed for data)
- What: Coded national manifestos.
- Access: API, free key.
- Licence and attribution: not checked.
- Coverage: general elections only.
- Verified: partly.
- Use for us: none.
- Rule risk: academic coding amounts to third-party positioning.
- Verdict: **NO**.

### History of Parliament; historic Hansard / Rush database
- URL(s): historyofparliamentonline.org (401 from here)
- What: Historical biographies. No API found.
- Access: none found.
- Licence and attribution: n/a.
- Coverage: historical.
- Verified: UNVERIFIED.
- Use for us: none.
- Rule risk: n/a.
- Verdict: **NO**.

## F. Party structures

### EC registered party details
- Covered under the Registrations API in section C: officers, local branches (accounting units) and descriptions.
- Verdict: **USE NOW**.

### Party membership figures (Commons Library SN05125)
- URL(s): commonslibrary.parliament.uk/research-briefings/sn05125/ (updated 8 Jul 2026; has an XLSX)
- What: Membership figures that parties themselves report.
- Access: briefing with an XLSX attachment. Direct fetches returned 403 from here.
- Licence and attribution: Open Parliament Licence.
- Coverage: major GB parties; figures are self-reported and dated differently for each party.
- Verified: partly (via WebFetch; its summary may have shown old figures).
- Use for us: party pages ("Party reports N members as of date").
- Rule risk: low if each figure is dated and attributed as the party's own claim. Figures are not like-for-like across parties.
- Verdict: **LATER**. Consider using the membership income in EC Accounts instead, which is official for every party.

---

## Ranked top 10 for our site
1. **EC Registrations API**: party officers, registered ballot descriptions, emblems and local branches for every party on every ballot. Official, free, equal for all.
2. **EC Accounts API**: official income and spending breakdown for every party, central and local.
3. **EC Loans API**: fills the gap next to the donations we already show.
4. **EC Spending API**: party and non-party campaign spending by category at national elections.
5. **DC person identifiers** (party candidate page, homepage, social links): the only safe way to link candidates' own channels. Treat as links, not content.
6. **Google Political Ads bundle**: party-level UK ad spend, updated daily, free.
7. **EC regulated donee donations** (MPs, mayors, councillors) on area pages, if we don't already use them.
8. **Wikidata** as a CC0 crosswalk between DC, EC and Parliament IDs. Not for display.
9. **IPSA per-MP CSV endpoint**: official office costs for sitting MPs.
10. **Meta Ad Library API**: the most detailed ad data, but only after identity verification. Party level first.

Worth adding later: the EC 2024 candidate spending XLSX, Committee on Standards reports via the committees API, Snapchat political ads, the Standards Commission for Scotland, the ministers' gifts register, and EDMs and written questions.

## Checked and dismissed (one line each)
- Meta Ad Library Report CSV: blocked by a JS challenge and robots.txt, so it can't be automated.
- TikTok: political ads are banned, so there is nothing to show.
- X ads transparency: no current UK data; the archive stops in 2019.
- X API: no free tier; reads cost about $0.005 per post.
- LinkedIn and Microsoft Advertising: political ads are banned.
- Who Targets Me: needs an account, aggregates the platform data, and is campaigning-adjacent.
- Threads API: can't look up other users at standard access.
- Facebook page posts and Instagram: Page Public Content Access needs app review and business verification.
- Mastodon: works, but 0.1% of candidates use it.
- Party RSS feeds: only Greens, SNP and Sinn Féin work, so using them would be unequal.
- Full Fact: copyright, and its verdicts are third-party judgements.
- Google Fact Check API and Data Commons ClaimReview: third-party verdicts with uneven coverage.
- BBC Verify, Ofcom and IPSO: not candidate data, and Ofcom/IPSO block curl.
- OpenSanctions: repackages the Parliament data we already use, frames MPs as "PEPs", and is CC BY-NC.
- EveryPolitician: frozen in 2019.
- Wikipedia: editable and uses contested labels.
- Manifesto Project: third-party coding, general elections only.
- History of Parliament: no API.
- Companies House (for candidates): privacy and name-matching risk. Donor companies only, later.
- Charity Commission: same privacy concern, little value.
- Register of Consultant Lobbyists: interactive search only, not about candidates.
- Lords interests: peers aren't elected.
- ACOBA: stale since Oct 2025, ministers only.
- Councillor allowances in England: no aggregator; the latest LGA survey is from 2008.
- PSOW and Adjudication Panel for Wales: no data route found.
- NIPSO standards and NI Assembly interests: NI is out of scope for now.
- Local candidate spending returns: held locally by Returning Officers, not published centrally.

**Worth noting:**
- The main electoralcommission.org.uk site, parliament.uk HTML pages and commonslibrary.parliament.uk returned 403 to scripted requests from here. The API subdomains and file downloads worked. Test from GitHub Actions before relying on any scraper.
- The GBP figures in Google's data include newspapers' "election ads", not just parties'.
