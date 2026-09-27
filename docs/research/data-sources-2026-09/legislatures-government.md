# Legislatures, government and transparency data

Research notes, 27 September 2026. One of five parallel investigations behind `../11-data-sources.md`; the brief and rules each followed are in `CONTEXT.md`. Endpoints were fetched live on the day unless marked UNVERIFIED or partly verified. Re-check anything before building on it: sites change, and some blocked the research environment but may work from GitHub Actions.

I checked 52 sources and tested real endpoints for almost all of them. Nearly all the official legislature and government data is open, needs no key and costs nothing. Three things you'd want to know first:

- **Missed Modern.gov feature:** the Modern.gov web service we already use has a `GetElectionResults` method. For Brent it returned May 2026 borough results with votes for each candidate.
- **Wales:** the new StatsWales API holds each Welsh council's spending and budget by service.
- **Closed bodies:** ACOBA closed on 13 Oct 2025 and Oflog no longer exists.

Blocked, so not checked: the Parliament developer hub page (I got its API list another way), the APPG register, the lobbyist register, the Mayor's Questions pages, GitHub, and one of the Senedd's two web-service URLs.

---

## UK Parliament (all APIs are free, need no key, and come under the Open Parliament Licence)

### Bills API
- URL(s): https://bills-api.parliament.uk/ · `https://bills-api.parliament.uk/api/v1/Bills?Take=1&SortOrder=DateUpdatedDescending` · RSS feed: `/api/v1/Rss/publicbills.rss`, and one per bill at `/api/v1/Rss/Bills/{id}.rss`
- What: every bill with its current stage and house, the date of each stage, amendments, "ping-pong" between the houses, publications, and plain-English "what happens next" news items (`/Bills/{id}/NewsArticles`). There is also a list of stage types.
- Access: JSON API plus RSS. No key.
- Licence and attribution: Open Parliament Licence v3.0.
- Coverage: UK Parliament; national; roughly 4,055 bills; updated live; latest seen 25 Sep 2026.
- Verified: yes. The Representation of the People Bill (billId 4080) is at Lords committee stage. Its stages, 1st reading on 12 Feb 2026, the amendments list of 25 Sep 2026 and its news item all came back.
- Use for us: a live "how a bill becomes law" page in Learn, using the Representation of the People Bill as the running example. Also a "What Parliament is changing" panel that links to a bill's stages.
- Rule risk: none.
- Verdict: **USE NOW**. It is official and live, and the right real-world example is going through Parliament now.

### What's On (calendar) API
- URL(s): https://whatson-api.parliament.uk/ · `/calendar/events/nonsitting.json?queryParameters.startDate=2026-09-01&queryParameters.endDate=2026-12-31` · `/calendar/events/list.json?queryParameters.startDate=2026-10-12&queryParameters.endDate=2026-10-16`
- What: the business calendar for both Houses (chamber business, committee sessions, oral questions to each department), recess dates, sessions, and sitting-date helpers.
- Access: JSON API. No key. `events/list` returns a 400 error unless you give a date range.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK Parliament; sessions back to 1988; runs into the future; latest seen: Commons recess 16 Sep to 11 Oct 2026.
- Verified: yes. The recess list and the 12–16 Oct event list (117 KB) both came back.
- Use for us: a "Parliament is in recess until…" or "coming up this week" strip on Learn and on the MP panel of area pages.
- Rule risk: none.
- Verdict: **USE NOW**. It is cheap to add and gives accurate context.

### Members API: features we don't use yet
- URL(s): https://members-api.parliament.uk/ (swagger at `/swagger/v1/swagger.json`). Endpoints under `/api/Members/{id}/`: `Synopsis`, `Biography`, `Contact`, `Focus`, `Experience`, `ContributionSummary`, `Edms`, `WrittenQuestions`, `Voting?house=1`, `Staff`, `Portrait`, `Thumbnail`, `LatestElectionResult`. Constituency endpoints: `/api/Location/Constituency/{id}/ElectionResults`, `/Representations`, `/Geometry`, `/Synopsis`. Also `/api/Posts/GovernmentPosts`, `/OppositionPosts`, `/Spokespersons`, `/api/Parties/StateOfTheParties/1/{date}`, `/api/LordsInterests/Register`, `/api/Reference/PolicyInterests`.
- What:
  - A one-line official synopsis, and a biography listing seats held, parties and posts.
  - Office phone and email.
  - Self-declared interests ("Focus"), for example 172 → "Small businesses, education".
  - Debate contributions, EDMs signed, written questions asked, and votes cast.
  - Constituency result history, including electorate, turnout and majority.
  - The current ministerial and shadow posts.
- Access: JSON API. No key.
- Licence and attribution: Open Parliament Licence. I did not check the portrait licence (it is believed to be CC BY 3.0).
- Coverage: UK; MPs and peers; all history; live.
- Verified: yes. For 4514 (Starmer), `Synopsis` says he "left the Commons on 1 September 2026", `Representations` shows Holborn & St Pancras currently has no MP, and `ContributionSummary`, `Edms`, `Voting` and `WrittenQuestions` all returned data. `Contact` returned an office email for 172. `GovernmentPosts` and `StateOfTheParties` came back for 27 Sep 2026. `Staff` returned empty for both MPs I tried. `LatestElectionResult` returned 404 for a former member.
- Use for us:
  - For any candidate who is or was an MP: an official synopsis, "Their record in Parliament" (last N votes, EDMs, questions) and the official office contact.
  - For area pages: constituency result history and "who's the minister for X".
  - For the Holborn & St Pancras vacancy: the former MP's record.
- Rule risk: vote lists must be shown the same way for every MP-candidate, with no scoring or "rebel" labels.
- Verdict: **USE NOW**. This is the richest official record we can show for sitting or former MPs.

### Written Questions and Written Statements API
- URL(s): https://questions-statements-api.parliament.uk/ · `/api/writtenquestions/questions?take=1` · `/api/writtenstatements/statements?take=1` · `/api/dailyreports/dailyreports`
- What: every written question with its answer, the asking MP or peer and the answering department. Also every written ministerial statement.
- Access: JSON API. No key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK; about 696,094 questions and 18,029 statements; latest seen: a question tabled 10 Sep 2026 and a statement on 16 Sep 2026.
- Verified: yes.
- Use for us:
  - "Questions this MP-candidate has asked" (it filters by `askingMemberId`).
  - Council pages: ministerial statements that mention the council (search the text).
  - A "government statements this week" item for Learn.
- Rule risk: none, provided every MP-candidate is covered the same way.
- Verdict: **USE NOW**.

### Oral Questions and Early Day Motions API
- URL(s): https://oralquestionsandmotions-api.parliament.uk/ · `/EarlyDayMotions/list?parameters.take=1` · `/oralquestions/list?parameters.take=1` · `/oralquestiontimes/list` · `/EarlyDayMotion/{id}`
- What: EDMs with their primary sponsor, supporters and status; oral questions; and the rota of department question times.
- Access: JSON API. No key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK Commons; 61,185 EDMs (latest 15 Sep 2026); 43,660 oral questions, with the earliest records from 2017.
- Verified: yes.
- Use for us: in the MP-candidate record, "EDMs sponsored or signed" is verbatim text the member put their name to, which fits our verbatim-quote rule. The oral question rota can feed Learn.
- Rule risk: EDMs are position-taking, so show them all or none, and never pick out a subset.
- Verdict: **USE NOW** (for sitting or former MP candidates).

### Commons Votes API: grouped-by-party feature (we already use this API)
- URL(s): `https://commonsvotes-api.parliament.uk/data/divisions.json/groupedbyparty?queryParameters.take=1`, plus `/membervoting` and `/searchTotalResults`
- What: party totals per division (Ayes and Noes by party).
- Access, licence and coverage: as the API we already use. Latest seen: division 2395 on 1 Jul 2026.
- Verified: yes.
- Use for us: in Learn, "how the parties voted on bill X", with plain counts only.
- Rule risk: plain counts are fine; don't add "party split" commentary.
- Verdict: **USE NOW** (a small add-on).

### Lords Votes API
- URL(s): https://lordsvotes-api.parliament.uk/ · `/data/Divisions/search?take=1` · `/data/Divisions/groupedbyparty` · `/data/Divisions/membervoting`
- What: Lords divisions with Content and Not-Content counts, the amendment text, whether the government was whipped, and each peer's vote.
- Access: JSON API. No key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK Lords; latest seen 15 Sep 2026 (Financial Services and Markets Bill).
- Verified: yes.
- Use for us: showing Lords stages in the live bill tracker in Learn.
- Rule risk: none.
- Verdict: **LATER**. Lords votes don't affect our candidates directly.

### Register of Members' Interests API: features we don't use yet
- URL(s): https://interests-api.parliament.uk/ · `/api/v1/Interests/csv` (a ZIP of CSVs, one per category) · `/api/v1/Registers` · `/api/v1/Categories`. Register types are `Commons` and `CommonsStaff`.
- What: a bulk CSV of the whole register; a list of 51 published registers; and a separate register of interests for MPs' staff.
- Access: JSON, and CSV in a ZIP. No key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK Commons; latest register published 21 Sep 2026.
- Verified: yes. The CSV ZIP downloaded (317 KB).
- Use for us: one bulk pull in the nightly job instead of per-member calls.
- Rule risk: none.
- Verdict: **USE NOW** (a better endpoint for something we already do).

### Lords Register of Interests (in the Members API)
- URL(s): `https://members-api.parliament.uk/api/LordsInterests/Register?searchTerm=&page=1` and `/api/LordsInterests/Staff`
- What: peers' registered interests.
- Access: JSON. No key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK Lords; current.
- Verified: yes (60 KB page).
- Use for us: only needed if a peer is a candidate somewhere, which is rare.
- Rule risk: none.
- Verdict: **NO** for now; it doesn't fit our elections.

### Committees API
- URL(s): https://committees-api.parliament.uk/ · `/api/Committees`, `/api/Events`, `/api/Publications`, `/api/CommitteeBusiness?Status=Open`, `/api/WrittenEvidence`, `/api/OralEvidence`, `/api/Committees/{id}/Members`
- What: all select and joint committees, their members, inquiries with evidence-submission windows, meetings, reports, and written and oral evidence.
- Access: JSON. No key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK; live; latest publication September 2026.
- Verified: yes.
- Use for us:
  - MP-candidate record: committee memberships.
  - Learn: "Committees are asking for evidence on X, and you can respond" (open calls for evidence, which is civic participation, not campaigning).
- Rule risk: none.
- Verdict: **LATER**.

### Hansard API: beyond search
- URL(s): https://hansard-api.parliament.uk/ · `/overview/lastsittingdate.json?house=Commons` · `/timeline-stats.json?queryParameters.searchTerm=…` · `/debates/debate/{id}.json` · `/debates/speakerslist/{id}.json` · `/search/divisions.json` · `/overview/sectionsforday.json`
- What: the full text of debates, speaker lists, division records inside debates, and counts over time of how often a term was mentioned.
- Access: JSON. No key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK; 1800s to now; the last Commons sitting date returned was 2026-09-15.
- Verified: partly. `lastsittingdate` and `timeline-stats` worked. `/debates/memberdebatecontributions/{id}` returned 404 in the form I tried; use Members API `ContributionSummary` instead.
- Use for us: verbatim quotes from an MP-candidate's speeches, dated and linked to Hansard. This is exactly our quote format.
- Rule risk: choosing which quotes to show is a curation risk. Take the most recent N by date for every MP-candidate, never hand-picked ones.
- Verdict: **LATER**, once the Members API record is live.

### Treaties API
- URL(s): https://treaties-api.parliament.uk/api/Treaty?Take=1
- What: treaties laid before Parliament under the CRaG process, with laying dates and business items.
- Access: JSON. No key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK; latest laid 14 Sep 2026.
- Verified: yes.
- Use for us: at most a single Learn explainer.
- Rule risk: none.
- Verdict: **NO**. It is marginal for voters.

### Statutory Instruments API (v2)
- URL(s): https://statutoryinstruments-api.parliament.uk/api/v2/StatutoryInstrument?Take=1, plus `/Procedure` and `/ActOfParliament`
- What: SIs laid before Parliament, the procedure each follows (made negative, affirmative and so on), and their parliamentary business.
- Access: JSON. No key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK; latest SI 2026/1028, laid 16 Sep 2026.
- Verified: yes.
- Use for us: in Learn, "most law is made by ministers through SIs", with a live example. Pairs with legislation.gov.uk for local SIs.
- Rule risk: none.
- Verdict: **LATER**.

### Erskine May API
- URL(s): https://erskinemay-api.parliament.uk/api/Part, plus `/api/Search/ParagraphSearchResults/{term}`
- What: the parliamentary procedure manual, searchable by paragraph.
- Access: JSON. No key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK; the current edition.
- Verified: yes.
- Use for us: authoritative citations in Learn, for example on "Disqualification for membership" and "Elections" (Part 1, chapters 2 and 3).
- Rule risk: none.
- Verdict: **LATER**. Use it for citations only.

### Parliament Now (annunciator) API
- URL(s): `https://now-api.parliament.uk/api/Message/message/CommonsMain/current` and `/{annunciator}/{date}`
- What: the live chamber annunciator screen: who is speaking and what the business is.
- Access: JSON. No key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK; live only while the House sits. The last message was 15 Sep 2026, a blank slide during recess.
- Verified: yes.
- Use for us: a live "in the Commons right now" widget for Learn. We run static jobs, so it would need client-side fetching.
- Rule risk: none.
- Verdict: **NO**. It doesn't fit our batch-job model.

### Parliament Petitions API: features we don't use yet
- URL(s): `https://petition.parliament.uk/petitions.json?state=open` · `https://petition.parliament.uk/petitions/{id}.json` · `/archived/petitions.json`
- What: each petition's JSON includes `signatures_by_constituency` (name, ONS code, MP and count), `signatures_by_region`, `government_response` (with date), `debate` (with Hansard transcript, video and Commons Library debate-pack links), `departments`, `topics` and `other_parliamentary_business`.
- Access: JSON. No key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK; by constituency; live. For example, 762640 "Hold a referendum…water…" had 213,310 signatures, 385 of them in Aldershot, and was debated on 14 Sep 2026.
- Verified: yes.
- Use for us: area pages could show "Top petitions signed in your constituency", with counts only. We can link to the government response and the debate transcript.
- Rule risk: petitions are advocacy text. Show the top N by local signature count for every area, labelled "petition text written by the petitioner", and never hand-pick.
- Verdict: **USE NOW**.

### Commons Library research briefings (we use this): note on freshness and RSS
- URL(s): `https://lda.data.parliament.uk/researchbriefings.json?_pageSize=2&_sort=-date` (the linked-data API) · RSS at https://commonslibrary.parliament.uk/feed/. The WordPress JSON API (`/wp-json/`) returned 403.
- What: Commons Library briefings.
- Access: JSON and RSS. No key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK; latest seen 25 Sep 2026 (SN06924).
- Verified: yes. The old linked-data API is still live and current.
- Use for us: no change. The RSS feed is a simpler way to watch for new briefings.
- Rule risk: none.
- Verdict: USE (already in use; the feed is optional).

### UK Parliament Election Results (Commons Library)
- URL(s): https://electionresults.parliament.uk/ · `https://electionresults.parliament.uk/general-elections.csv` · `https://electionresults.parliament.uk/general-elections/7/candidacies.csv` · by-elections listed at `/parliament-periods/59` · a Datasette Lite link to `ukparliament/psephology-datasette` (psephology.db) on GitHub.
- What: official results for every general election and by-election since 2010, including notional results. It lists the by-elections in this Parliament: Runcorn & Helsby (1 May 2025), Gorton & Denton (26 Feb 2026), Aberdeen South, Arbroath & Broughty Ferry and Makerfield (18 Jun 2026), and Clacton (13 Aug 2026).
- Access: CSV and HTML, plus a SQLite database on GitHub. No key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK; constituency level; 2010 to now; the site says coverage is to March 2026, but it already lists by-elections up to August 2026.
- Verified: partly. The GE candidacies CSV (2.3 MB) downloaded. Per-by-election `.csv` returned 406 or 404, so by-election results come from the HTML or the SQLite file. I could not check the SQLite file because GitHub is blocked here.
- Use for us: "Previous results here" on Westminster by-election pages (official votes and shares), and the history on area pages.
- Rule risk: past results are factual. Don't turn them into "who can win" framing.
- Verdict: **USE NOW** (general elections by CSV; by-elections by SQLite once we can check it).

### Parliament linked-data SPARQL endpoint
- URL(s): `https://api.parliament.uk/sparql?query=…`
- What: RDF data about Parliament (members, procedures).
- Access: SPARQL. No key.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK. I did not check freshness.
- Verified: partly (a trivial query returned CSV).
- Use for us: nothing the REST APIs don't already do better.
- Rule risk: none.
- Verdict: **NO**. The REST APIs are better.

### Register of All-Party Parliamentary Groups
- URL(s): https://publications.parliament.uk/pa/cm/cmallparty/contents.htm
- What: registered APPGs, their officers and benefits received.
- Access: HTML only. It is not in the interests API, which has only the `Commons` and `CommonsStaff` register types.
- Licence and attribution: Open Parliament Licence.
- Coverage: UK. I could not see the latest date.
- Verified: **blocked** (403 Cloudflare challenge). UNVERIFIED.
- Use for us: APPG officer roles in the MP-candidate record.
- Rule risk: none.
- Verdict: **NO** for now. There is no API and the page is blocked.

### IPSA: MPs' business costs
- URL(s): https://www.theipsa.org.uk/mp-staffing-business-costs/annual-publications · `https://www.theipsa.org.uk/api/download?type=individualBusinessCosts&year=24_25` (also types `totalSpend` and `otherInfo`, and year `25_26`)
- What: every MP business-cost claim (accommodation, travel, office, staffing), with amounts claimed and paid, by MP and constituency.
- Access: CSV download. No key.
- Licence and attribution: IPSA publication. I did not check the exact licence.
- Coverage: UK MPs; 2010-11 onward; the 24_25 file has 105,874 rows; a 25_26 file (8.3 MB) is available.
- Verified: yes (downloaded 24_25, 21 MB).
- Use for us: an MP-candidate "Official costs" line, total paid by category, linked to IPSA.
- Rule risk: expenses tend to get framed as scandal. Show neutral totals for every MP-candidate with IPSA's context text. No comparisons or rankings.
- Verdict: **LATER**. It is useful but sensitive, and needs careful design.

---

## Devolved and regional legislatures

### Scottish Parliament open data (data.parliament.scot)
- URL(s): https://data.parliament.scot/ · catalogue: `https://data.parliament.scot/api/ApiList` (209 endpoints) · dataset list with last-updated dates: `/api/datasetjson`. Key endpoints: `/api/members`, `/api/votesmotion?year=2026`, `/api/motionsquestionsanswersquestions?year=2026`, `/api/motionsquestionsanswersmotions`, `/api/orsplenarymeeting?year=2026` (Official Report), `/api/registerofinterest`, `/api/petitions`, `/api/bills`, `/api/billstages`, `/api/constituencies`, `/api/regions`, `/api/membergovernmentroles`, `/api/crosspartygroups`, `/api/legislationdetails` (SSIs).
- What: MSPs (current and past), how each MSP voted in every division, parliamentary questions and answers, motions with supporters, full Official Report text, register of interests, public petitions, bills and stages, cross-party groups, and the Scottish Government ministers.
- Access: JSON and XML. No key. The site says a "reasonable use policy" applies. Some files are very large: 2026 votes are 26 MB and 2026 plenary Official Report is 77 MB.
- Licence and attribution: the SPCB copyright policy ("Policy on Use of SPCB Copyright Material"). I did not check its exact terms.
- Coverage: Scotland; constituency and region; 1999 to now; datasets updated 24–25 Sep 2026; 129 current MSPs (Session 7); Official Report up to 24 Sep 2026 (draft).
- Verified: yes (members, votes 2026, questions 2026, plenary Official Report 2026, register of interests, petitions).
- Use for us: area pages in Scotland ("who represents you": constituency and regional MSPs); records for candidates who are MSPs; Scottish petitions; a Holyrood bill tracker for Learn.
- Rule risk: the petitions records include petitioners' names, so don't republish them. Handle vote records the same way as for MPs.
- Verdict: **USE NOW** for Scottish area pages. It is comprehensive and current.

### Senedd (Welsh Parliament): business web service, Record XML and petitions
- URL(s):
  - Open data page: https://senedd.wales/help/open-data/
  - Members: `https://business.senedd.wales/mgwebservice.asmx/GetCouncillorsByWard` (a Modern.gov web service). **Use the lowercase path.** The mixed-case `mgWebService.asmx` and `calJson.aspx` return 403 from the Azure firewall.
  - RSS: `https://business.senedd.wales/mgRss.aspx`
  - Record of Proceedings XML: https://record.senedd.wales/XMLExport (`/XMLExport/Download?meetingID=…&xmlDownloadType=EnglishTranscript`)
  - Petitions: `https://petitions.senedd.wales/petitions.json` and `/petitions/{id}.json`
- What: all 96 MSs by constituency; plenary transcripts in English, Welsh or both; committee meetings and agendas; e-petitions with `signatures_by_constituency` using the new W09 Senedd constituency codes.
- Access: XML, JSON and RSS. No key. The members service is the same Modern.gov API we already have code for.
- Licence and attribution: OGL v3 (stated on the Senedd open data page).
- Coverage: Wales; the 16 new 2026 constituencies; latest Record 24 Sep 2026; latest petition 18 Sep 2026.
- Verified: yes. Members XML returned 96 members across 16 constituencies (Plaid 44, Reform 33, Con 7, Lab 9, Green 2, LD 1). Record XML listing, petitions JSON and RSS all worked.
- Use for us: Welsh area pages (who represents you in the Senedd), Senedd petitions by constituency, and transcripts for quotes from MS-candidates.
- Rule risk: as for Parliament petitions.
- Verdict: **USE NOW**. It reuses our Modern.gov client.

### Northern Ireland Assembly AIMS API (data.niassembly.gov.uk)
- URL(s): https://data.niassembly.gov.uk/ (services: `members.asmx`, `questions.asmx`, `plenary.asmx`, `hansard.asmx`, `organisations.asmx`). Examples: `/members.asmx/GetAllCurrentMembers_JSON` and `/questions.asmx/GetQuestionsForWrittenAnswer_TabledInRange_JSON?startDate=2026-09-01&endDate=2026-09-27`.
- What: MLAs by constituency, contact details and roles; written and oral questions; divisions and member votes (`GetDivisionMemberVoting`, `GetDivisionResult`, which needs a documentid); motions, including Petitions of Concern; Hansard components; committees and departments.
- Access: SOAP-style ASMX with `_JSON` variants. No key.
- Licence and attribution: not stated on the home page. UNVERIFIED; it is probably OGL.
- Coverage: NI; 18 constituencies; latest question tabled 1 Sep 2026 in the range I fetched.
- Verified: yes (current members, questions); partly (division methods need IDs).
- Use for us: NI area pages (who represents you at Stormont). Petitions of Concern would make a good Learn item.
- Rule risk: none.
- Verdict: **LATER**. We cover NI lightly for now.

### London Assembly / GLA
- URL(s): Modern.gov at `https://www.london.gov.uk/about-us/londonassembly/meetings/mgWebService.asmx/GetCommittees` · London Datastore CKAN API at `https://data.london.gov.uk/api/action/package_search` (1,303 datasets) · Mayor's Questions at https://www.london.gov.uk/who-we-are/what-london-assembly-does/questions-mayor/find-an-answer/mayors-question-answers
- What: Assembly committees, meetings and minutes (Modern.gov); London datasets; questions to the Mayor and their answers.
- Access: Modern.gov XML and CKAN JSON, no key. Mayor's Questions are HTML only.
- Licence and attribution: OGL (London Datastore, dataset by dataset).
- Coverage: London; current.
- Verified: partly. Modern.gov returned 119 committees and CKAN worked. **Mayor's Questions pages returned 403 (blocked).**
- Use for us: London area pages ("Mayor and Assembly: recent meetings"), using our existing Modern.gov code.
- Rule risk: none.
- Verdict: **LATER**. Modern.gov is easy; Mayor's Questions have no feed.

---

## UK government transparency

### GOV.UK Search API
- URL(s): `https://www.gov.uk/api/search.json?filter_content_store_document_type=open_consultation&order=-public_timestamp&count=20&fields=title,link,public_timestamp,organisations,end_date`. Other useful filters: `filter_content_store_document_type=policy_paper|closed_consultation|consultation_outcome|transparency|news_story|written_statement`, `filter_organisations=<slug>`, `q=`. The site finder also has Atom feeds, e.g. `https://www.gov.uk/search/policy-papers-and-consultations.atom?content_store_document_type[]=open_consultations`.
- What: every GOV.UK publication, filterable by type, organisation and topic. This answers the question asked: **yes, every new government consultation and policy paper is available as a feed**, by API or Atom.
- Access: JSON and Atom. No key. No published rate limit seen.
- Licence and attribution: OGL v3.
- Coverage: UK government and its agencies (England-heavy); live. At time of checking there were 47 open consultations (latest 23 Sep 2026) and 15,144 policy papers (latest 25 Sep 2026).
- Verified: yes.
- Use for us:
  - Council and area pages: "Government consultations open now that affect councils, transport, housing…" (filter by MHCLG, DfT and so on).
  - Council pages: official intervention and finance notices, such as "Exceptional Financial Support for local authorities for 2026-27" (18 Aug 2026) and "North East Lincolnshire Council: Local Plan intervention letter" (25 Sep 2026), found by search on the council name.
- Rule risk: news stories are government announcements. Label them "Government announcement" and prefer consultations and statistics.
- Verdict: **USE NOW**.

### GOV.UK Content API and organisation Atom feeds
- URL(s): `https://www.gov.uk/api/content/<path>` (for example `/api/content/government/publications/list-of-ministers-interests`) · `https://www.gov.uk/government/organisations/<slug>.atom`
- What: the full structured record for any GOV.UK page, including attachment URLs, content types and dates. It is how you get from a search hit to the CSV or ODS files.
- Access: JSON and Atom. No key.
- Licence and attribution: OGL v3.
- Coverage: UK; live.
- Verified: yes.
- Use for us: the second step for every GOV.UK data source below.
- Rule risk: none.
- Verdict: **USE NOW**.

### legislation.gov.uk API
- URL(s): `https://www.legislation.gov.uk/new/data.feed` · `/ukpga/2026/data.feed` · `/uksi/2026/data.feed?title=council+tax` · `/changes/affected/ukpga/2025/data.feed` · `/ukpga/2025/1/data.xml`
- What:
  - New legislation feeds: Acts, SIs, Scottish SSIs, Welsh WSIs and NI SRs.
  - The "Changes to legislation" effects feed.
  - Full XML of every item.
  - Title search, for example council tax SIs 2026.
- Access: Atom and XML. No key.
- Licence and attribution: OGL v3 (Crown copyright).
- Coverage: UK and devolved; latest feed update 26 Sep 2026.
- Verified: yes (new feed, a year feed, a title-filtered SI feed, the changes feed, XML).
- Use for us:
  - Council pages: "Laws made this year about your council", such as ward boundary "(Electoral Changes) Order" SIs and council tax regulations.
  - Learn: Acts receiving Royal Assent, linked to the Bills API.
- Rule risk: none.
- Verdict: **USE NOW** for a boundary-change and council-tax SI feed.

### Register of Ministers' Gifts and Hospitality, and departmental ministers' meetings and travel
- URL(s): collection at https://www.gov.uk/government/collections/register-of-ministers-gifts-and-hospitality · August 2026 edition at `/government/publications/register-of-ministers-gifts-and-hospitality-august-2026` (48 CSVs, gifts and hospitality per department, including No10) · quarterly meetings and travel per department, for example "MHCLG: ministerial travel and meetings, April to June 2026" and "NIO: Ministerial gifts, hospitality, travel and meetings, April to June 2026"
- What: monthly CSVs of gifts and hospitality received by each minister (minister, date, giver, type, value), plus quarterly departmental CSVs of ministers' external meetings and overseas travel.
- Access: CSV attachments, found through the Search and Content APIs. No key. Each department's CSV layout differs.
- Licence and attribution: OGL v3.
- Coverage: UK government ministers; monthly (gifts and hospitality) and quarterly (meetings); latest published 24 Sep 2026 (the August 2026 edition).
- Verified: yes (downloaded the Cabinet Office hospitality CSV).
- Use for us: in the record of a candidate who is or was a minister, "Declared ministerial gifts, hospitality and meetings", taken verbatim from the CSV.
- Rule risk: it can read as insinuation. Show the full list neutrally for every minister-candidate, with no commentary.
- Verdict: **LATER**. It only applies when a minister stands, which will be rare in council and by-elections.

### List of Ministers' Interests
- URL(s): https://www.gov.uk/government/publications/list-of-ministers-interests
- What: the Independent Adviser's list of ministers' relevant interests.
- Access: PDF and GOV.UK HTML pages, about three times a year (latest July 2026). There is no structured data.
- Licence and attribution: OGL v3.
- Coverage: UK ministers; latest 9 Jul 2026.
- Verified: yes (attachments listed).
- Use for us: minister-candidate record only.
- Rule risk: none.
- Verdict: **NO**. It isn't machine-readable and the Commons register covers most of it.

### ACOBA, now closed (successor: Independent Adviser on Ministerial Standards and Civil Service Commission)
- URL(s): https://www.gov.uk/government/news/closure-of-the-independent-advisory-committee-on-business-appointments-acoba · new advice at `https://www.gov.uk/api/search.json?filter_organisations=independent-adviser-on-ministers-interests`
- What: ACOBA **closed on 13 Oct 2025**. Business-appointment advice for former ministers is now published by the Independent Adviser (latest: Andrew Gwynne, 15 Sep 2026). Advice for Crown servants goes to the Civil Service Commission.
- Access: GOV.UK publications (HTML and PDF), found through the Search API.
- Licence and attribution: OGL v3.
- Coverage: UK; ACOBA advice to Oct 2025, the Independent Adviser's since then.
- Verified: yes.
- Use for us: a former minister's later jobs, in their record.
- Rule risk: none.
- Verdict: **NO**. It is rare and unstructured.

### Office of the Registrar of Consultant Lobbyists
- URL(s): https://registrarofconsultantlobbyists.org.uk/
- What: the statutory register of consultant lobbyists and their clients.
- Access: search pages. No download or API was found.
- Licence and attribution: I could not check.
- Coverage: UK. I could not check.
- Verified: **blocked** (403 to direct fetch). The page text I could read describes a search only. UNVERIFIED.
- Use for us: none.
- Rule risk: none.
- Verdict: **NO**.

### Transparency International UK "Open Access"
- URL(s): https://openaccess.transparency.org.uk/ and /about.php
- What: an aggregation of ministers' meetings with outside organisations since 2012, now including Holyrood, with a CSV download.
- Access: CSV download. No API. My direct fetch failed on the site's SSL certificate chain; the about page was read.
- Licence and attribution: mixed OGL, Open Parliament Licence and ODbL.
- Coverage: UK and Scotland; the about text mentions "2012" onward. I did not see the latest date.
- Verified: partly (the about page only).
- Use for us: none directly. The primary source is the departmental CSVs above.
- Rule risk: a campaigning organisation curates it, so it would need labelling. Prefer the primary source.
- Verdict: **NO**. Use the official CSVs instead.

### Institute for Government Ministers Database
- URL(s): https://www.instituteforgovernment.org.uk/ministers-database · the GitHub repo instituteforgov/ifg-ministers-database-public
- What: every ministerial appointment since 1979, with dates.
- Access: web, plus code and data on GitHub. GitHub was blocked in this session, so I could not inspect the data files.
- Licence and attribution: CC BY 4.0.
- Coverage: UK; 1979 to now; updated after reshuffles "with lag".
- Verified: partly (the licence page only).
- Use for us: past ministerial roles for candidates who were ministers. The Members API biography already lists posts.
- Rule risk: it is a secondary source.
- Verdict: **NO**. The Members API covers this from the primary source.

### Departmental spending over £25,000 (and over £500 for some bodies)
- URL(s): `https://www.gov.uk/api/search.json?q="spending over £25,000"&filter_content_store_document_type=transparency` (2,854 hits; latest 24 Sep 2026, e.g. "Cabinet Office: spend data over £25,000")
- What: monthly CSVs of each department's payments over £25k.
- Access: CSV via GOV.UK. No key. Layouts differ between departments.
- Licence and attribution: OGL v3.
- Coverage: central government; monthly.
- Verified: partly (search results; I did not parse a file).
- Use for us: little. These are departmental payments, not local.
- Rule risk: none.
- Verdict: **NO**.

### HM Treasury OSCAR II, PESA and Country and Regional Analysis
- URL(s): GOV.UK "OSCAR II – publishing data from the database: September 2026" (22 Sep 2026) · PESA 2026 (16 Jul 2026) · Country and Regional Analysis 2025 (19 Nov 2025)
- What: public spending by department and function. CRA splits it by English region and nation.
- Access: CSV and XLSX via GOV.UK.
- Licence and attribution: OGL v3.
- Coverage: UK; region and nation level.
- Verified: partly (publications found through the Search API; files not parsed).
- Use for us: in Learn, "What government spends where you live", using CRA per head by region.
- Rule risk: none.
- Verdict: **LATER**.

### Find a Tender Service (OCDS API): includes council and parish contracts
- URL(s): `https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages?updatedFrom=2026-09-25T00:00:00&limit=20` (cursor pagination through `links.next`)
- What: OCDS releases (planning, tender, award, contract) for all UK public procurement under the Procurement Act 2023. Buyers include councils and parishes, for example Wigan Council, Surrey County Council, Central Bedfordshire and Ingoldmells Parish Council.
- Access: JSON API. No key.
- Licence and attribution: OGL v3. I did not check the service's own notice.
- Coverage: UK; buyer level; live, with releases up to 27 Sep 2026.
- Verified: yes.
- Use for us: council pages, "Contracts your council has put out or awarded recently", matched on buyer name or ID. This is factual and official.
- Rule risk: none. Show contracts in date order only.
- Verdict: **USE NOW**. It is the most complete live source of council-contract data.

### Contracts Finder (OCDS search API)
- URL(s): `https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search?publishedFrom=2026-09-25&publishedTo=2026-09-26&size=1`
- What: England notices for lower-value contracts and older procurements, in OCDS form.
- Access: JSON. No key. It returns up to 100 per page, so the payload is large (590 KB).
- Licence and attribution: OGL v3.
- Coverage: England; still publishing (notices from 25 Sep 2026).
- Verified: yes.
- Use for us: adds smaller council contracts alongside Find a Tender.
- Rule risk: none.
- Verdict: **LATER**. Add it after Find a Tender; it needs de-duplicating against Find a Tender.

### data.gov.uk CKAN API (index of council "spend over £500" files)
- URL(s): `https://data.gov.uk/api/action/package_search?q=spending+over+500`, which now redirects to `ckan.publishing.service.gov.uk`
- What: an index of published datasets, including 1,748 hits for "spending over 500" (e.g. Hounslow, Camden, Data Mill North). Freshness varies; some entries are stale, e.g. Plymouth last updated 2018.
- Access: JSON. No key. It was **flaky**: one request returned a "technical difficulties" page and a later one succeeded.
- Licence and attribution: per dataset, usually OGL.
- Coverage: England; patchy by council.
- Verified: yes (with the flakiness noted).
- Use for us: nothing yet. A council "spend over £500" feature would have to deal with about 300 different CSV layouts.
- Rule risk: none.
- Verdict: **NO**. It is too patchy. Official RO outturn by service is the better council-spending source.

### Office for Local Government (Oflog) data explorer
- URL(s): https://oflog.data.gov.uk/, which now serves the closed-organisation page. GOV.UK status: `no_longer_exists`.
- What: **Oflog has closed.** The data explorer is gone.
- Verified: yes.
- Verdict: **NO**. It is discontinued.

### LG Inform API (LGA / esd)
- URL(s): `https://webservices.esd.org.uk/data.json?...` · https://help.esd.org.uk/api/
- What: metrics for every council.
- Access: needs an ApplicationKey. Usage is limited by a subscription allowance, with only a one-off trial allowance otherwise. It returned 401 without a key.
- Licence and attribution: not checked (varies by metric).
- Coverage: England and Wales councils.
- Verified: yes (401 confirmed; docs read).
- Use for us: none that we can't get from the primary publishers.
- Rule risk: some LG Inform views are league tables.
- Verdict: **NO**. It is gated and not free.

### MHCLG local authority revenue outturn (RO) and budget (RA): England
- URL(s): outturn at `https://www.gov.uk/government/statistics/local-authority-revenue-expenditure-and-financing-england-2025-to-2026-individual-local-authority-data-outturn` (RS, RSX, RG, RO1–RO6 and TSR ODS files, e.g. `…/RO2_LA_Data_2025-26_data_by_LA.ods`) · budget at `…-2026-to-2027-budget-individual-local-authority-data` (`RA_2026-27_data_Part_1.ods`, `Part_2.ods`)
- What: what each English council actually spent (outturn) and plans to spend (budget), broken down by service line: education, highways and transport, social care, housing, culture, environment and planning, and central services.
- Access: ODS files; parsed with pandas and odfpy. No key.
- Licence and attribution: OGL v3 (official statistics).
- Coverage: England; every council; annual. 2025-26 outturn was published 17 Sep 2026; the 2026-27 budget was published 11 Jun 2026. There is history back to 2011-12. Some councils submit late and appear with an "M" (missing) note.
- Verified: yes. RO2 2025-26 downloaded (372 KB) and parsed; its sheets include `RO2_LA_Data_202526`.
- Use for us: council pages, "How your council spends its money", by service, as budget vs. last year's outturn. It is official and neutral, as the brief said.
- Rule risk: no per-head league tables.
- Verdict: **USE NOW**.

### Scottish Local Government Finance Statistics (LFR returns)
- URL(s): https://www.gov.scot/publications/scottish-local-government-finance-statistics-2024-25/documents/ (council-level XLSX: "LA Level - Net Revenue Expenditure and Income by Service and Type", "…by Subservice", plus capital and reserves)
- What: each Scottish council's net revenue spending by service and subservice.
- Access: XLSX. No key. The URLs are long and versioned, so they need discovering each year.
- Licence and attribution: OGL v3.
- Coverage: Scotland; 32 councils; annual; 2024-25 was published 5 Feb 2026.
- Verified: partly (files listed; not parsed).
- Use for us: the Scottish version of "How your council spends its money".
- Rule risk: none.
- Verdict: **USE NOW**, together with MHCLG RO.

### StatsWales API (new platform): Welsh council revenue outturn, budgets and council tax
- URL(s): list at `https://api.stats.gov.wales/v1/?page_size=1000` (789 datasets) · docs at https://api.stats.gov.wales/docs · data at `https://api.stats.gov.wales/v1/{id}/view?page_size=5` (the page size must be between 5 and 10,000). Relevant datasets:
  - "Budgeted revenue expenditure by authority and service" (`88384d5e-…`, updated 4 Sep 2026)
  - "Revenue outturn expenditure by authority and service" (`213aeb99-…`, 16 Oct 2025)
  - "Council tax levels by billing authority and band" (`1988b6af-…`, 24 Mar 2026)
  - "Capital outturn expenditure…", "Council tax collection…"
  - Also the Welsh Index of Multiple Deprivation 2025 (WIMD 2025).
- What: official Welsh council finance data, as a structured cube API.
- Access: JSON API. No key. The old `open.statswales.gov.wales` OData endpoint did not respond.
- Licence and attribution: OGL v3. I did not check this on the API itself.
- Coverage: Wales; the 22 councils; annual.
- Verified: yes (dataset list and a data view).
- Use for us: the Welsh version of the council spending and council tax pages. It also fills our Wales gap for council tax (we only have England 2026-27).
- Rule risk: none.
- Verdict: **USE NOW**.

### Modern.gov web service: methods we don't use yet
- URL(s): `https://<council>/mgWebService.asmx/GetElectionResults?lElectionId={id}` (election IDs are linked from `mgManageElectionResults.aspx`) · `/GetParishCouncils` · `/GetWebCastMeetings` · `/GetCouncillorsByPostcode` · e-petitions pages at `mgEPetitionListDisplay.aspx`
- What:
  - `GetElectionResults` gives candidate-level votes per ward, with party, elected flag and declaration time. Brent's ID 52 returned 296 candidates for the May 2026 borough election.
  - `GetParishCouncils` lists parish councils (Brent has none).
  - Council e-petitions are **HTML only**, with no web-service method.
- Access: XML. No key. The same client we already run.
- Licence and attribution: per council, usually OGL.
- Coverage: England and Wales councils that use Modern.gov and fill in the election module (not all do).
- Verified: yes (Brent `GetElectionResults`, `GetParishCouncils`, the methods list, and an e-petitions HTML page).
- Use for us:
  - Ward pages: "Last election result here", official and straight from the council, a useful check against DCLEAPIL.
  - "Who makes decisions" chain: parish councils.
  - Council pages: e-petitions, by scraping.
- Rule risk: none.
- Verdict: **USE NOW** (`GetElectionResults`); e-petitions **LATER**, since it means scraping.

### CMIS (Astech) committee systems (e.g. Sunderland, Birmingham, Walsall, Luton, Cotswold, West Dunbartonshire)
- URL(s): e.g. https://committees.sunderland.gov.uk/committees/cmis5/Home.aspx · `…/cmis5/RSS.aspx`
- What: agendas and minutes in the councils that don't use Modern.gov.
- Access: HTML only. `RSS.aspx` exists but returned an empty channel (`<channel />`) on two councils. There is no public API.
- Licence and attribution: per council.
- Coverage: a minority of English and Scottish councils.
- Verified: yes (empty RSS; no feed links).
- Use for us: meetings for CMIS councils would need an HTML scraper written for each council.
- Rule risk: none.
- Verdict: **NO** for now. Revisit if coverage gaps matter.

### planning.data.gov.uk: datasets we don't use yet
- URL(s): https://www.planning.data.gov.uk/dataset.json, with entity counts per dataset
- What:
  - `developer-agreement`: 12,786 Section 106 agreements, with 39,272 contributions and 49,831 transactions.
  - `infrastructure-funding-statement`: 249.
  - `planning-application`: 100,627, from a subset of councils.
  - `tree-preservation-order`: 120,729.
  - `conservation-area`: 10,667.
  - `article-4-direction-area`: 7,512.
  - `brownfield-land`: 37,736.
- Access: JSON, CSV and GeoJSON. No key.
- Licence and attribution: OGL v3.
- Coverage: England; varies by planning authority.
- Verified: yes (dataset list with counts).
- Use for us: council pages, "Money developers have agreed to pay for local infrastructure (Section 106)", and "Conservation areas and brownfield sites near you".
- Rule risk: none.
- Verdict: **LATER** (S106 is the most interesting; coverage is partial).

### Local Government and Social Care Ombudsman complaints data
- URL(s): https://www.lgo.org.uk/information-centre/reports/annual-review-reports/local-government-complaint-reviews · `https://www.lgo.org.uk/assets/attach/6973/2-Complaints-Decided-25-26.csv` (also Received and Remedy-compliance CSVs)
- What: complaints received and decided about each council by outcome (upheld and so on), and whether the council complied with the remedy.
- Access: CSV and XLSX. No key. The layout has headers offset by several rows.
- Licence and attribution: I did not check.
- Coverage: England; per council; annual; 2025-26 is the latest.
- Verified: yes (CSV fetched).
- Use for us: council pages, "Complaints about your council to the Ombudsman", as the council's own counts.
- Rule risk: upheld rates slide easily into league tables. Show counts for the one council only, with no comparison.
- Verdict: **LATER**.

### Government consultations in the devolved nations
- URL(s): `https://consult.gov.scot/api/2.3/json_search_results?st=open` (Citizen Space) · https://www.gov.wales/consultations?status=open
- What: Scottish Government consultations (already reachable through our Citizen Space integration) and Welsh Government consultations.
- Access: Scotland is JSON from Citizen Space. For Wales no feed was found; `/consultations/rss.xml` and `sitemap.xml` returned 403, so it is HTML only.
- Licence and attribution: OGL.
- Coverage: Scotland and Wales; live (the Scottish consultation seen opened 14 Sep 2026).
- Verified: Scotland yes; Wales partly.
- Use for us: add `consult.gov.scot` as a Citizen Space instance if it isn't already one; Wales would need scraping.
- Rule risk: none.
- Verdict: Scotland **USE NOW** (configuration only); Wales **NO** for now.

### Scottish Lobbying Register
- URL(s): https://www.lobbying.scot/
- What: the statutory register of lobbying of MSPs and ministers.
- Access: a single-page JavaScript app; no export was visible.
- Licence and attribution: I could not check.
- Coverage: Scotland.
- Verified: partly (the site loads). Any export is UNVERIFIED.
- Use for us: none clear.
- Rule risk: none.
- Verdict: **NO**.

---

## Ranked top 10 for our site
1. **Members API extras** (synopsis, contact, EDMs, written questions, votes, ContributionSummary, constituency result history). This gives the official record for any MP or former-MP candidate, including the vacant Holborn & St Pancras seat.
2. **MHCLG RO/RA outturn and budget by service, plus StatsWales API, plus Scottish LGFS.** Official and neutral "How your council spends your money" data for all three nations.
3. **Modern.gov `GetElectionResults`.** Official ward results with votes per candidate, from the web service we already run.
4. **Bills API (plus RSS).** A live "how a bill becomes law" in Learn, using the Representation of the People Bill now at Lords committee.
5. **GOV.UK Search API and Content API.** A feed of every new consultation and policy paper, and council intervention and EFS notices.
6. **Find a Tender OCDS API.** Live council and parish contracts.
7. **Petitions `signatures_by_constituency`** (Parliament, Senedd and Scottish Parliament). Local petition counts plus the government response and debate links.
8. **Devolved legislatures:** Scottish Parliament data API, Senedd Modern.gov, Record and petitions, NI AIMS. These cover "who represents you" and records for devolved-member candidates.
9. **legislation.gov.uk feeds.** Boundary-change and council-tax SIs affecting your council, and Royal Assents for Learn.
10. **What's On API.** Recess and "coming up in Parliament" context. It is cheap to add.

Next in line: UK Parliament election results site; Written Statements; the interests CSV bulk endpoint; Committees API calls for evidence; IPSA; planning.data S106; LGSCO; ministers' gifts CSVs.

## Checked and dismissed
- **Oflog data explorer:** the organisation is closed and the URL now serves the GOV.UK "no longer exists" page.
- **ACOBA:** closed 13 Oct 2025; the successor's advice is only occasional PDF and HTML pages.
- **LG Inform API:** needs a key and a subscription allowance (it returned 401).
- **CIPFA:** paid; not tested.
- **Local Government Chronicle:** paid news, not data.
- **Spend Network:** a commercial aggregator (site loads; the product is paid).
- **OpenSpending:** a front-end that loads; no current UK council data was evident.
- **Hansard Society:** reports and commentary only, no data API. I did not fetch it.
- **Public appointments (Cabinet Office service):** job adverts, not relevant. I did not fetch it.
- **Commons Library "Constituency data: electorates" dashboard:** frozen ("no longer being updated"); replaced by the election results site.
- **Registrar of Consultant Lobbyists:** blocked (403) and search-only.
- **Register of APPGs:** blocked (Cloudflare 403) and not in any API.
- **Mayor's Questions (GLA):** blocked (403), and HTML only.
- **Parliament SPARQL:** works, but the REST APIs do everything we need.
- **Treaties API** and **Parliament Now:** work, but have no use for our batch pages.
- **TI UK Open Access** and **IfG Ministers Database:** secondary or curated; the primary sources are above. GitHub was blocked here, so I couldn't inspect the IfG data.
- **Scottish Parliament allowances datasets:** last updated 17 Apr 2023, so stale.
- **CMIS committee systems:** no API, and the RSS endpoint returns an empty channel.
- **Welsh Government consultations:** no feed (403 on rss and sitemap).
- **Departmental spend over £25k:** exists, but not local.
- **Council "spend over £500" via data.gov.uk:** patchy, stale in places, and the API was flaky.
- **Isle of Man and Channel Islands:** skipped, as agreed.
