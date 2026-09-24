# 6. Local issues: which councils we can read, and a mechanical rule

**Date:** 24 September 2026 (all tests run on this date from our cloud test environment)

**Question:** Can we automatically get local council business for each by-election council, and what exact rule would pick which items to show, so that no person chooses?

## Summary

1. Five of the eight councils (Brighton and Hove, Cotswold, Milton Keynes, Windsor and Maidenhead, Blackpool) run Modern.gov and their open web service worked today. South Staffordshire runs a different system (CMIS), Stirling posts agendas only as PDFs, and Camden was blocked from our test environment.
2. We drafted a rule that code can apply: meetings of Full Council and Cabinet, key decisions, and items that name the voter's ward, within a fixed time window. Procedural items, private items and duplicates are removed, and the rule stops at a fixed number of items. Every step that still needs a human choice is listed, with the name of the person or body who makes that choice.
3. We ran the rule on Queen's Park ward (Brighton and Hove). It worked. It also showed real problems. The only item tied to the ward was a pub licence. Party motions appear with the party's own wording as the title. Private "twin" items and monthly budget reports repeat. Section headings show up as if they were items.

---

## Part 0: Which by-elections are actually coming up

Source: Democracy Club Every Election API, https://elections.democracyclub.org.uk/api/elections/?future=1&limit=200 (HTTP 200, 66 records, tested 24 Sep 2026).

| Council in the brief | By-election listed by Democracy Club | Poll date |
|---|---|---|
| Brighton and Hove | Queen's Park (`local.brighton-and-hove.queens-park.by.2026-09-24`) | 24 Sep 2026 (today) |
| Cotswold | Blockley | 24 Sep 2026 (today) |
| Milton Keynes | New Bradwell | 24 Sep 2026 (today) |
| South Staffordshire | Wombourne North | 24 Sep 2026 (today) |
| Windsor and Maidenhead | Bray | 24 Sep 2026 (today) |
| Blackpool | Claremont | 1 Oct 2026 |
| Stirling | Forth and Endrick | 1 Oct 2026 |
| Camden | **No Camden council by-election listed.** Camden is only relevant because of the UK Parliament by-election in Holborn and St Pancras (`parl.holborn-and-st-pancras.by.2026-10-08`). | 8 Oct 2026 |

Five of the brief's by-elections are polling **today**. They will be over before the site goes live.

**Other upcoming by-elections in the same list (not tested in this question):** Northumberland (Hirst; Amble) 1 Oct; Highland (Wick and East Caithness) 1 Oct; North West Leicestershire (Long Whatton & Diseworth) 1 Oct; Aberdeen City (Midstocket/Rosemount) 8 Oct; Lambeth (Myatt's Fields) 8 Oct; Amber Valley (Kilburn, Denby, Holbrook & Horsley) 8 Oct; Newcastle-under-Lyme (Town) 8 Oct; Stroud (Rodborough) 13 Oct; Leicestershire (Shepshed) 15 Oct; Wiltshire (Salisbury Milford) 15 Oct; Mid Devon (Bradninch) 15 Oct; Flintshire (Higher Kinnerton) 15 Oct; Leeds (Calverley & Farsley) 22 Oct; East Hertfordshire (Hertford Kingsmead) 22 Oct; South Kesteven (Grantham St Wulfram's) 22 Oct; Carmarthenshire (Saron) 22 Oct; Halton (Beechwood & Heath) 29 Oct; Nottinghamshire (Southwell) 29 Oct; Bassetlaw (Worksop East) 29 Oct; Newark and Sherwood (Dover Beck) 29 Oct; Argyll and Bute (Mid Argyll) 29 Oct. (Same source.)

---

## Part (a): What each council publishes

All tests were made with `curl --max-time 25` and a plain User-Agent. "Blocked" means blocked from our test environment. It does not mean the page is down for everyone.

| Council | Meetings system | Web service (GetCommittees / GetMeetings) | Agenda item titles: real example from a recent meeting | Key decisions / Forward Plan | Consultations in a structured form |
|---|---|---|---|---|---|
| **Brighton and Hove** | Modern.gov, https://democracy.brighton-hove.gov.uk | **Open.** GetCommittees → HTTP 200, 178 committees (20 active). GetMeetings for Council (id 117) and Cabinet (id 1110), 24/03–24/12/2026 → HTTP 200, 6 and 8 meetings. GetAllMeetingsByDate (needs `lCommitteeId=0` and `bIsAscendingDateOrder=true`) → HTTP 200, 86 meetings. | Cabinet, 17 Sep 2026 (GetMeeting `lMeetingId=12298`, HTTP 200): "Hackney Carriage Fare Review"; "Encampments"; "Seafront Lease: Brighton Wheel Proposal (Exempt Category 3)". Each item has an `isrestricted` flag. | **Yes, but only on HTML pages.** Forward Plan September 2026 (`mgListPlanItems.aspx?PlanId=1133&RP=1130`, HTTP 200, 7 items). It has a working ward filter (`&WardId=12719` for Queen's Park, 5 items). Issue pages show "Decision type: Key" and "Wards affected". The decisions list with `K=1` (key decisions only) → HTTP 200, 33 key decisions out of 67 in 6 months. | Citizen Space at https://consultations.brighton-hove.gov.uk (found by web search). **Blocked from our test environment** (proxy returned 502 on connect). WebFetch also failed. Not verified. |
| **Cotswold** | Modern.gov, https://meetings.cotswold.gov.uk | **Open today** (it timed out in the earlier test). GetCommittees → HTTP 200, 63 committees. GetMeetings for Council (1154) → 5 meetings; for Cabinet (1136) → 7 meetings. | Cabinet, 10 Sep 2026 (GetMeeting 2615, HTTP 200): "Suitable Alternative Natural Greenspace Spending 2026"; "Establishing a Voluntary Joint Committee - Local Government Reorganisation"; "Private Sector Housing Civil Penalty Policy". | Decisions list `K=1` → HTTP 200, 9 key decisions in 6 months (`K=0` gives 125). Forward plan pages exist (`mgPlansHome.aspx`, HTTP 200). | Go Vocal platform at https://your.cotswold.gov.uk. Its public JSON (`/web_api/v1/projects?publication_statuses[]=published`) → HTTP 200, 29 projects, 5 marked "active", e.g. "Bourton Tourism Levy Consultation 2026/7". Linked from https://www.cotswold.gov.uk/about-the-council/having-your-say/consultations/ (HTTP 200). |
| **Milton Keynes** | Modern.gov, https://milton-keynes.moderngov.co.uk | **Open.** GetCommittees → HTTP 200, 318 committees. GetMeetings for Council (138) and Cabinet (139) → HTTP 200. | Cabinet, 8 Sep 2026 (GetMeeting 7812, HTTP 200): "Statement of Community Involvement"; "Medium Term Financial Outlook 2027/28 to 2030/31"; "Updated Strategic Risk Register". | **Blocked from our test environment.** HTML pages (Forward Plan, decisions list, meeting pages) return HTTP 403 with a Cloudflare "Just a moment..." page. The web service still works. | https://www.milton-keynes.gov.uk/consultations → HTTP 200, a plain HTML list. One open consultation: "Homelessness and Rough Sleeping Strategy Consultation" (7 Sep–26 Oct 2026). Email sign-up only. No RSS or API found. |
| **South Staffordshire** | **CMIS (Civica)**, https://southstaffs.cmis.uk.com, linked from https://www.sstaffs.gov.uk/our-council/council-meetings-and-decision-making (HTTP 200). No Modern.gov. `sstaffs.moderngov.co.uk` → HTTP 522. So the earlier timeout was probably just the wrong address (our inference). | No Modern.gov web service. We found no public CMIS API. The meetings page is a JavaScript calendar (HTTP 200). A guessed meeting URL failed ("critical error"). | From the Decisions page (`/Decisions.aspx`, HTTP 200, 72 decisions): "Crisis Resilience Fund Policy"; "Proposed Community Safety Partnership Plan 2026-2029"; "Application for the grant of a new premises licence for The Bourne Grill, 1 Gravel Hill, Wombourne, WV5 9HA". The page has filters for Ward, Key Decision and Is Exempt. | The Forward Plans page (HTTP 200) lists editions only up to **February 2025**. It says to use the Decisions page with status "Decision Proposed" instead. Key-decision threshold stated: over £300,000 or a significant effect on two or more wards. | Go Vocal at https://engage.sstaffs.gov.uk. JSON → HTTP 200, 17 projects, 2 "active", e.g. "Local Plan - Main Modifications consultation". A separate planning-policy portal at https://sstaffs.oc2.uk was **blocked from our test environment** (502). |
| **Windsor and Maidenhead** | Modern.gov, https://rbwm.moderngov.co.uk | **Open.** GetCommittees → HTTP 200, 266 committees. GetMeetings for Council (134) and Cabinet (132) → HTTP 200. The method list page (`mgWebService.asmx`) is public here: 21 methods, but **none for forward plans or decisions**. | Full Council, 22 Sep 2026 (GetMeeting 10271, HTTP 200): "Request for Capital Budget - Forest Bridge School"; "Youth Justice Plan 2026-27"; "Motions on Notice". | **Blocked from our test environment** (HTML pages return HTTP 403, Cloudflare). | EngagementHQ (Granicus) at https://rbwmtogether.rbwm.gov.uk (HTTP 200, but the page is built by JavaScript, so we could not list projects). `/projects.rss` → HTTP 302. No feed found. The planning portal https://rbwm.objective.co.uk/portal → HTTP 403. |
| **Blackpool** | Modern.gov, https://democracy.blackpool.gov.uk | **Open.** GetCommittees → HTTP 200, 83 committees. GetMeetings for Council (134) and Executive (135) → HTTP 200. | Executive, 14 Sep 2026 (GetMeeting 8511, HTTP 200): "Local Transport Plan Programme 2026/27"; "BLACKPOOL CENTRAL - NEXT STEPS ON PROCUREMENT"; "ASSET DISPOSALS PROGRAMME". Items 9–10 are flagged `isrestricted=True`, but their titles do not say "exempt". | Decisions list `K=1` → HTTP 200, 7 key decisions in 6 months (`K=0` gives 235). | https://www.blackpool.gov.uk/Your-Council/Have-your-say/Consultations/Consultations-and-other-engagement.aspx → **HTTP 500** twice by curl. WebFetch got a version that says "There are no current consultations open", but it mentions a consultation that closed in Feb 2024, so it may be stale. No RSS, CSV or platform found. |
| **Stirling** | **Its own website (not Modern.gov or CMIS)** at https://minutes.stirling.gov.uk (HTTP 200). Files sit under `/media/`, so the site is probably built on a general website system (our inference). | No web service. An agenda list page exists: `/current-committees-and-panels/agendas/` (HTTP 200, 2 pages). | **Titles are only inside the PDF.** The HTML page for Finance, Economy and Corporate Support Committee, 10 Sep 2026, has one 198-page PDF (HTTP 200, 5.2 MB). The PDF's own cover page calls the meeting the "Finance, Economy and Culture Committee", so names can differ between the web page and the papers. Titles read with pdftotext: "GENERAL FUND REVENUE BUDGET PROJECTED OUTTURN 2026/27"; "WHISTLEBLOWING POLICY REVIEW"; "ARTIFICIAL INTELLIGENCE POLICY". | No Forward Plan or key-decision list found. (Key-decision rules come from English regulations. We did not test whether a Scottish equivalent exists: unverified.) | Go Vocal at https://engage.stirling.gov.uk. JSON → HTTP 200, 87 projects, 48 "active". "Active" is not reliable: the list includes "Staff Travel Survey 2024" and "FAQs". There is a project called "Ward 2 - Forth & Endrick" (status ended). `www.stirling.gov.uk` pages → HTTP 403; `content.stirling.gov.uk` → blocked (502). |
| **Camden** | Modern.gov, https://democracy.camden.gov.uk (from the brief) | **Blocked from our test environment** (HTTP 403, Cloudflare "Just a moment..."). | Not tested: blocked. | Not tested: blocked. | Citizen Space at https://consultations.wearecamden.org. **Open JSON API:** `/api/2.4/json_search_results?st=open` → HTTP 200, 8 "open" items with title, start and end dates, and URL. 6 of the 8 are long-running pages rather than consultations (e.g. "Camden Apprenticeships registration", open 2019–2030). Real ones include "Gambling Policy Consultation" (3 Aug–25 Oct 2026). One earlier call to the HTML finder was cut off (connection reset). |

**What we learned about the Modern.gov web service (tested on Brighton and Hove and Windsor and Maidenhead):**
- `GetMeeting` gives each agenda item's number, title, agenda text, `isrestricted`, linked documents and the committee. It does **not** say whether an item is a key decision, and it does **not** give wards.
- The public method list (https://rbwm.moderngov.co.uk/mgWebService.asmx, HTTP 200) has 21 methods, including GetAllMeetingsByDate, GetCommittees, GetMeeting, GetMeetings, GetCouncillorsByPostcode and GetCouncillorsByWard. There is **no method for Forward Plans or decisions**. We tried GetForwardPlanItems, GetDecisions, GetIssues and GetWards on Brighton: all said "Web Service method name is not valid".
- So key decisions and "Wards affected" come only from HTML pages: `mgListPlanItems.aspx`, `mgDelegatedDecisions.aspx?K=1`, `mgIssueHistoryHome.aspx` and `ieDecisionDetails.aspx`. These pages were readable at Brighton, Cotswold and Blackpool. At Milton Keynes and Windsor and Maidenhead, Cloudflare blocked them from our test environment.
- Titles come back HTML-encoded twice (e.g. `Chair&amp;#39;s Communications`). Code must decode them twice.

---

## Part (b): Draft mechanical rule (version 0.2)

*This is a draft for Romily to decide on. Every choice in it is marked as a judgement; none is final.*

### Inputs
- **The voter's ward and council.** These come from the postcode lookup elsewhere on the site. Postcode-to-ward was not tested in this question.
- **Today's date** (T).

### Step 1: Time window
- **Recently:** meetings or decisions dated from T − 183 days to T − 1.
- **Coming up:** meetings or decisions dated from T to T + 92 days.
- For Brighton on 24 Sep 2026: 25 Mar 2026 to 23 Sep 2026, and 24 Sep 2026 to 24 Dec 2026.

### Step 2: Where items come from (3 streams)

**Stream A: Full Council and the executive.** Every agenda item at meetings of the council's **core bodies**. A committee is a core body if its title, after normalising (see Step 5), is exactly one of: `council`, `full council`, `city council`, `county council`, `borough council`, `district council`, `cabinet`, `executive`. Titles such as "Cabinet sitting as Trustees" (Windsor and Maidenhead) do not match.
- *Committee-system councils* (no Cabinet, for example Stirling): the core bodies are Full Council plus a list of main policy committees. We write that list down once for each council and publish it. **Judgement: which committees count. Made by the site team (Romily, Product Lead) once per council.**

**Stream B: Key decisions.**
- *Recently:* decisions in the council's decisions list with the key-decision flag on (Modern.gov: `mgDelegatedDecisions.aspx?...&K=1`, or "Is Key decision?: Yes" on `ieDecisionDetails.aspx`; CMIS: the "Key Decision: Yes" filter).
- *Coming up:* items in the **current** Forward Plan whose "Decision type" starts with `Key` and whose "Decision due" date is in the window. The current Forward Plan is the edition with the latest start date that covers T. We also include any "General Exception" or "Special Urgency" notice published in the window.
- A key decision counts only if the council itself labels it so. **Judgement: made by council officers, not by us.**

**Stream C: Items about the voter's ward (from any committee).**
- *Structured match:* the item's "Wards affected" list contains the ward name exactly. "(All Wards)" does **not** count as a ward match. Such an item can still come in through Stream B.
- *Title match:* the item's title, after normalising, contains the ward name, after normalising, as whole words.
- "Wards affected" is filled in by council officers. **Judgement: theirs.**

### Step 3: What to remove (in this order)
1. **Section headings:** items numbered `0` or with an empty title. Brighton uses these for headings such as "Reports for Decision", "Notices of Motion" and "Major Applications".
2. **Procedural items:** after normalising, the title exactly matches one of:
   `procedural business; apologies; apologies for absence; apologies and substitutions; apologies for absence and substitutions; declarations of interest; declarations of interests; disclosures of interest; minutes; minutes of the previous meeting; minutes of the last meeting; minutes and actions of the previous meeting; part two minutes of the previous meeting; chairs communications; chairs communication; chairs announcements; mayors communications; mayors announcements; leader and portfolio holders announcements; welcome and introductions; welcome introductions and apologies; to appoint a chair for the meeting; election of chair; appointment of chair; appointment of vice chair; call over; callover; call over for reports of committees; public involvement; member involvement; public questions; written questions from members of the public; written questions from councillors; oral questions from councillors; deputations from members of the public; to receive petitions and e petitions; petitions for debate; petition s for debate; issues raised by members; matters referred to the executive; representations from opposition members; items referred for council; reports for decision; reports for information; reports referred for information; for information; urgent business; urgent items; any other business; items for the next meeting; work programme; forward work programme; exclusion of the press and public; exclusion of press and public; part two proceedings; part two; part 2; break; close of meeting; date of next meeting; notices of motion; major applications; minor applications; information items`
   Or the title matches one of these patterns: `^\d.*refreshment break$`, `^residents? questions`, `^minutes of .*meeting`, `^co chair election`.
   We built this list from the 639 real Brighton titles in the window. Other councils will need more entries (e.g. Blackpool's "EXCLUSION OF PUBLIC AND PRESS", Milton Keynes's "Councillors' Items"). **Judgement: what counts as "procedural". Site team. Keep the list public and add to it over time.**
3. **Civic housekeeping (proposed):** after normalising, the title starts with `appointment of`, `appointments to`, `election of the mayor`, `review of political balance`, `review of the councils constitution`, `mayoral report`, `mayors thanks`, `declaration of office` or `council appointments`. **Judgement: site team.**
4. **Private (exempt) items:** `isrestricted = True`, or the title contains `(exempt`, `exempt category`, `part two`, `part 2` or `confidential`. See the tweak in Part (c).
5. **Duplicates:** two items are the same if their titles match after normalising and removing any "(Exempt …)" text. Keep one, in this order of preference: key-decision record, then forward-plan entry, then agenda item. The other meetings go on a line saying "also discussed at …".

### Step 4: Order and cut-off
- Two lists: **Coming up** (soonest first) and **Recently** (newest first).
- Ward-matched items (Stream C) go to the top of each list. Everything else is in strict date order. Items at the same meeting follow the agenda order.
- **Show at most 8 per list.** Then show "N more items" with a link to the council's own full list, so nothing is hidden by us.
- **Judgement: the windows (183 and 92 days), the limit of 8, and putting ward items first. Site team, fixed in advance and published.**

### Step 5: Normalising text (so code can match it)
Lower-case. Change `&` to ` and `. Remove apostrophes (`'` `’` `‘`). Replace every other non-letter or non-digit with a space. Collapse repeated spaces. Decode HTML entities twice first. Example: "Queen's Park" → `queens park`. "Chair&#39;s Communications" → `chairs communications`.

### Step 6: Labels on every item shown (no summaries written by us)
The title is quoted as the council wrote it. Each item also shows the body (Council, Cabinet …), the date, the source type ("key decision", "Forward Plan", "agenda item", "motion"), and a link to the council page.

### Where human judgement remains, and whose it is

| Judgement | Who makes it |
|---|---|
| Which items are "key decisions" | Council officers (under the council's constitution) |
| Which wards an item "affects" | Council officers (the "Wards affected" field) |
| Which committees are core in committee-system councils | Site team, once per council, published |
| Procedural and housekeeping lists | Site team, published, added to over time |
| Time windows, the limit of 8, ward-first order | Site team, fixed before launch |
| Whether to show motions, licensing items and private items (see Part c) | Site team |
| Wording of motion titles | The party group that proposed the motion |
| Whether council items belong on a **parliamentary** by-election page (Holborn and St Pancras): an MP does not decide council business | Site team (Romily). This affects the first live test. |

---

## Part (c): Running the rule on Queen's Park ward, Brighton and Hove

**What we pulled (24 Sep 2026):**
- 86 meetings, 24/03–24/12/2026, via GetAllMeetingsByDate, plus 86 GetMeeting calls. All HTTP 200. **639 agenda items** in total.
- 67 decisions from `mgDelegatedDecisions.aspx` (range 24/03–24/09/2026), with each decision's page and linked issue page (all HTTP 200). This gave the key flag and "Wards affected".
- The Forward Plan September 2026 (PlanId 1133): 7 items with issue pages.

**What the filters removed (version 0.2):** 274 procedural, 46 section headings, 15 civic housekeeping, 20 private, 216 from non-core bodies with no ward match, 32 duplicates merged, 2 repeats of the same monthly report collapsed, 9 outside the window.

*Fact-check re-run (24 Sep 2026):* 86 meetings and 639 agenda items were confirmed. Re-applying steps 3.1–3.4 independently gave 46 headings (same), 15 housekeeping (same), 283 procedural (not 274) and 22 private (not 20). The small differences probably come from how the code was written. Treat the filter counts as approximate.

**Output: "Coming up" (11 candidates, first 8 shown):**
1. 1 Oct 2026 · Council · motion · "Dignity and Trauma-Informed Audit of Housing and Homelessness Services" (the motion document names the Green Group)
2. 1 Oct 2026 · Council · motion · "Disability-Friendly City" (Conservative Group)
3. 1 Oct 2026 · Council · motion · "Building a Care System That Works" (Labour Group)
4. 1 Oct 2026 · Council · motion · "Transparency of External Findings" (no document linked yet)
5. 15 Oct 2026 · Cabinet · Forward Plan key decision · "Streetlighting Contract Extension"
6. 15 Oct 2026 · Cabinet · Forward Plan key decision · "Flood Risk Strategy"
7. 15 Oct 2026 · Cabinet · Forward Plan key decision · "Black rock - meanwhile use and long term vision"
8. 15 Oct 2026 · Cabinet · Forward Plan key decision · "Advertising and Sponsorship"
…and 3 more (Royal Pavilion Gardens restoration; Brighton Marina to River Adur flood scheme; Targeted Budget Management Month 5).

The Council meeting on 1 Oct is shown in GetMeetings as "Confirmed; Rescheduled from 24 September 2026". Motion proposers were read from the motion PDFs (e.g. https://democracy.brighton-hove.gov.uk/mgConvert2PDF.aspx?ID=217525, HTTP 200).

**Output: "Recently" (54 candidates, first 8 shown):**
1. **[Ward]** 5 Jun 2026 · Licensing Panel · "Camelford Arms - Licensing Act 2003 Functions" (Wards affected: Queen's Park)
2. to 8. 17 Sep 2026 · Cabinet · key decisions: "Raising Professional Standards for Housing Staff & Tenants"; "Housing in Brighton and Hove Annual Report"; "Improving Outcomes in Adult Social Care"; "DFT - Structures Bid - King Arches Phases 6 & 7"; "Hackney Carriage Fare Review"; "Encampments"; "WorkWell Programme"
…and 46 more.

**Ward matching in practice:** None of the 639 agenda titles contained "Queen's Park". One agenda text did contain "Queens Park" without the apostrophe: the Islingword Local licensing panel (29 Apr 2026) mentions a business called "Queens Park Wines". A normalised text match would count that as a ward match when it is not. (The rule as drafted matches titles only.) Of the 67 decisions, 52 say "(All Wards)", 12 name specific wards and 3 are blank. Only one names Queen's Park: the pub licence above. The Forward Plan's own ward filter (`WardId=12719`) returns 5 items, but it counts "(All Wards)" items as matches.

### Odd results and possible tweaks (each tweak is a judgement and an option for Romily, not a decision)

| Odd result (seen in the real data) | Possible tweak (option) | Judgement? |
|---|---|---|
| **Licensing panels.** The only ward-specific item was a single pub's licence. Licensing Panel meetings made up 22 of the 86 Brighton meetings. Titles name only the premises, e.g. "Lebanese Grill - Licensing Panel (Licensing Act 2003 Functions)". | Option 1: keep them, labelled "Licensing decision about one premises", and do not put them at the top. Option 2: leave licensing committees out of Stream C. | Yes. Site team. |
| **Pension fund, trustee, shareholder, religious-education (SACRE) and fire authority bodies.** Brighton has none active. Windsor and Maidenhead has "Berkshire Pension Fund Committee" and "Cabinet sitting as Trustees". Blackpool has "Shareholder Committee" and "SACRE". Milton Keynes lists "BMKFA - Executive Committee" (a fire authority). We saw no museum or twinning committees. | The exact-title rule for core bodies already leaves these out unless a title names the ward. Keep a published list of committees never shown (`pension`, `trustees`, `shareholder`, `sacre`, `religious education`, `twinning`, `museum`, `appeals`, `appointments`, `standards`, `chief officer`). | Yes. Site team. |
| **Private (exempt) items.** 27 agenda items in the window are flagged `isrestricted`; about 20 remain after the procedural and housekeeping steps (some flagged items are things like "Part Two minutes"). Brighton adds a private "twin" with the same title, e.g. "Asset Strategy (Exempt Category 3)". Blackpool flags items as restricted without saying so in the title (e.g. "WINTER GARDENS CONFERENCE CENTRE - CONTRACTOR DISPUTE"). | Drop the private twin when a public item with the same title exists. Where there is no public twin, show the title with the label "Discussed in private; papers not published". Hiding it completely would hide a real decision. | Yes. Site team. |
| **Titles that are mainly a reference number.** Planning items look like "BH2025/02723 - The Hippodrome, 51 - 52 Middle Street, Brighton - Full Planning". Housing panels use short codes like "EDB AP Report" and "EIB Report". | Planning: match the address or postcode to a ward using a planning dataset (planning.data.gov.uk) instead of the title. That is mechanical, but coverage is partial. Short-code titles: leave out titles with fewer than 3 words that are not in the Forward Plan. | Yes. Site team. |
| **Duplicates across meetings.** 32 merged: private twins, agenda item plus decision record, and the same item listed twice at one meeting ("Call-in of Update on the Housing Management for the Brickfields Development", twice at People Overview & Scrutiny, 2 Jun 2026). But "Asset Strategy" was decided twice (23 Apr and 16 Jul, different decisions), and merging by title alone joins them. | Merge only when titles match **and** the dates are within 31 days. Otherwise show both. | Yes (the 31 days). Site team. |
| **Repeating reports.** "Targeted Budget Management (TBM) 2026/27 Month 2 (May)", "…Month 4 (July)", "…Provisional Outturn 2025/26". | Collapse a series (same title once dates, month names and "Month N" are removed) to the newest item, with "earlier versions" linked. | Yes. Site team. |
| **Party motions at Full Council.** Titles are the proposing party's own words, e.g. "Resisting Hostile Immigration Policies" (23 Jul) and "Post-Budget Changes to the Toilet Tax" (26 Mar). | Show **all** motions or **none**. Never pick some. Always label each one with the proposing group, taken mechanically from the motion document ("Proposer:" line and group heading), and later with the result from the minutes. This matters for our neutrality. | Yes. Site team (Romily). |
| **Section headings shown as items** ("Reports for Decision", "Notices of Motion", "Major Applications", empty titles), all numbered 0. | Already handled in version 0.2: remove items numbered 0 or with an empty title. | Low: it is a mechanical fix. |
| **Civic housekeeping** at the top of lists (e.g. "Appointment of an Honorary Recorder", "Review of Political Balance October 2026", "Election of the Mayor…"). | Already in version 0.2 as the housekeeping list. | Yes. Site team. |
| **An old ward item jumps above newer ones.** A June pub licence is ranked above September Cabinet decisions. | Put ward items first only if they are in the last 90 days. Otherwise sort them by date with everything else. | Yes. Site team. |
| **A date outside the requested range.** The decisions list for 24/03–24/09/2026 also returned a planning decision dated 04/03/2026. | Always check dates ourselves after fetching. | No. |
| **"Open" consultations that are not open.** Camden's API lists "Camden Apprenticeships registration" (2019–2030). Stirling's platform marks "Staff Travel Survey 2024" and "FAQs" as "active". | Show a consultation only if its end date is on or after today **and** its start date is within the last 12 months. | Yes (the 12 months). Site team. |

---

## What this means for the site

- **The rule can run fully automatically where Modern.gov HTML is reachable.** On 24 Sep 2026 that was Brighton and Hove, Cotswold and Blackpool. At Milton Keynes and Windsor and Maidenhead, only agenda items come through: the key-decision and ward fields sit behind a Cloudflare check that blocked us. From there the rule reduces to "Full Council and Cabinet agenda items".
- **South Staffordshire (CMIS) and Stirling (PDF agendas) need separate code.** Stirling would need PDF text extraction, which is more fragile.
- **Camden, the first live test, was blocked from our test environment.** Its consultations API works. Separately, Romily needs to decide whether council business belongs on a parliamentary by-election page at all.
- **The ward link is thin.** At Brighton it produced one item, a pub licence. Most local content arrives as city-wide key decisions. One option is for the page to say that items are "decisions by [council]", not "issues in your street" (a choice for Romily).
- **The biggest neutrality risk is Council motions.** They carry party wording. Whatever Romily decides, treating every motion the same way and labelling who proposed each one avoids the site picking between parties' wording.
- **Every threshold (183/92 days, 8 items, the procedural list) could be published on the site's method page,** so anyone can check that no person picked the items. Whether and how to do this is for Romily and Barny.

## Could not verify

- Brighton and Hove consultations (Citizen Space at consultations.brighton-hove.gov.uk): blocked from our test environment. We do not know whether its API is open.
- Camden democracy site (democracy.camden.gov.uk): blocked (403, Cloudflare). No agenda titles, key decisions or web-service results.
- Milton Keynes and Windsor and Maidenhead Forward Plans and decision pages: blocked (403, Cloudflare). We do not know whether key-decision and ward fields are filled in there.
- Blackpool consultations page: HTTP 500 by curl. The WebFetch copy may be stale. Current consultations unverified.
- Windsor and Maidenhead "RBWM Together" (EngagementHQ): the page is built by JavaScript, so we could not list projects. Any API or feed unverified.
- South Staffordshire meeting-level agendas on CMIS: could not open a single meeting page. Item titles came from the Decisions list instead. Whether CMIS has a public API is unverified.
- South Staffordshire planning portal (sstaffs.oc2.uk) and Stirling's `www.stirling.gov.uk` and `content.stirling.gov.uk`: blocked from our test environment.
- Whether Scottish councils (Stirling) have anything like the English Forward Plan or key-decision rules: unverified.
- Why Brighton's Full Council was moved from 24 September to 1 October 2026: the status field says "Rescheduled"; no reason given.
- Postcode-to-ward lookup (e.g. GetCouncillorsByPostcode): not tested in this question.
- The exact filter counts in Part (c): an independent re-run gave 283 procedural and 22 private items, against 274 and 20 in the original run. The other counts (86 meetings, 639 items, 46 headings, 15 housekeeping, 67 decisions, 33 key decisions) matched.
- The rule has been run on one ward only (Queen's Park). It has not been tested on Cotswold or Blackpool data.
