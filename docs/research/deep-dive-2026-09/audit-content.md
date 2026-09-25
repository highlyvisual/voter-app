# Content and voter-journey audit: whatsittome.org

Audit date: 25 September 2026. Method: Playwright (Chromium 1194, iPhone-size viewport 390×844) driving the live site from a cloud shell; page text extracted from the rendered DOM and from the HTML (including collapsed `<details>` sections); external facts checked against gov.uk, the UK Parliament Members API, Democracy Club's API and Camden's official notice. Screenshots and page captures are in `shots-content/` (sub-folders `static/`, `static2/`, `holborn/`, `candidates/`, `profile/`, `journeyA/`, `journeyB/`, `journeyC/`). Every fact below is either OBSERVED (with the page it came from) or JUDGED (my opinion), and labelled.

Verdict scale: strong / adequate / weak.

---

## 1. The journey, three times

### 1a. Holborn and St Pancras, entering WC1H 9JE on the home page

**Observed.** The home page (`/`, captured `static/home.txt`, `journeyA/A-01-home-viewport.png`) opens with the logo, the strapline "Politics, in your context.", the heading "Politics affects your life. Understanding it shouldn't be difficult.", one paragraph ("Someone is asking for your vote. Here is who they are, what they have actually put in writing, and what it could mean for a home like yours."), a postcode box labelled "Your postcode" (placeholder "e.g. WC1H 9JE") and a button "Find my election". Under the box: "Used once to find the elections at that address, via Democracy Club. Never kept by us. Or build your profile first →". Immediately below: "We will never tell you who to vote for, and we never score anyone. Every candidate gets the same page, in the order they appear on the ballot paper, and every statement links to where they said it. The judgement stays with you." The whole of this fits in the first screen on a phone.

Typing the postcode and pressing the button made one browser-side request to `https://api.postcodes.io/outcodes/WC1H` and then landed on `/ballot/parl.holborn-and-st-pancras.by.2026-10-08/area?pc=WC1H&loc=51.529,-0.125` (`journeyA/A-log.txt`). The full postcode was stored in the browser's sessionStorage (`"pc":"WC1H 9JE"`); no cookies were set.

That landing page is step 1 of a four-step trail ("1 Your area · 2 What you're voting for · 3 What's at stake · 4 Meet the candidates"). Its heading is "This is where politics meets your life." and it promises "what the official record says about the ground around your postcode, WC1H — housing sites, schools, protected areas, air quality — and who represents you now." What it actually shows (`journeyA/A-03-after-submit.txt`): a map of the outcode centre, "Who represents you now" (seat vacant), a four-row table of who represents WC1H (Parliament, Camden council King's Cross ward councillors, policing, GLA), the planning record from planning.data.gov.uk, five Parliament petitions, the claimant count, deprivation deciles for "Camden 029C" in seven domains, Camden house prices, and recorded crime within a mile. There is no schools section and no air-quality section on this page. The election's name appears as a small grey label "Holborn and St Pancras"; the words "by-election", "8 October" and "candidates" do not appear until the bottom links "Next: What you're voting for →" and "Skip to the candidates".

Clicks to the ballot: postcode + "Find my election" (1) → "Skip to the candidates" (2). Following the trail instead: 1 + Next, Next, Next = 4. Step 2 (`/office`) explains what an MP does and does not decide and shows "Key dates". Step 3 (`/stakes`) shows nine topic cards with counts. Step 4 is the ballot page.

The ballot page (`holborn/ballot.txt`, `holborn/ballot-crop0.png`) says: "UK Parliament by-election · Thursday, 8 October 2026 / Holborn and St Pancras / 15 candidates. The same page for each of them, in the order you will see on the ballot paper. Read them all, or start with the one you have heard of." Then four figures (15 candidates for one seat · 267 sourced positions · 14 with something published · 63 named sources), the numbered list of candidates with party names and coloured dots, a box "At the general election, 4 July 2024, this seat was won by 11,572 votes (30% of votes cast). Past results describe the past; each election is a new contest.", a button "See the 15 candidates", a link "In a hurry? Two-minute guide →", the map, "Key dates", a household form ("Describe a household. Yours, a friend's, a neighbour's… 0 of 7 chosen"), topic links, the office explainer again, then "The ballot paper" with each candidate as a card showing nine topic chips with counts and "N in total".

The past-result figure checks out: the UK Parliament Members API (constituency 4105, election results) gives majority 11,572 on 38,602 valid votes = 30.0 % (members-api.parliament.uk/api/Location/Constituency/4105/ElectionResults, accessed 25 Sep 2026). The API also confirms the seat currently has no representation.

The compare page (`/compare`) says "Candidates across, the nine topics down. Each cell is the short version; open a topic for the exact quotations and sources." and "No winner, no score, no match. Switch topics and decide for yourself which differences matter." It offers "Summaries / Exact quotations" and "Hide names and parties while I read". A candidate page (see section 2) shows photo, name, party chip, "Standing for Parliament in Holborn and St Pancras, polling day 8 October 2026. Has stood 2 times before.", "In their own words", then "What could their policies mean for you?" with nine collapsed cards each showing a large numeral. A topic page (`/topic/money_and_cost_of_living`) lists every candidate in ballot order with their summaries and sources; the first request for `/topic/housing_and_property` returned HTTP 502 and another page load returned the bare text "upstream request failed" (`profile/ballot-profile-expanded.html`, first attempt); both worked on retry.

**Judged.** The first screen of the home page is strong: the promise, the privacy line and the single action are all above the fold, in plain words. The step after the postcode is the weakest moment in the journey. A first-time voter who typed a postcode to find out "who is on my ballot" gets a page of deprivation deciles, crime counts and house prices before any candidate, headed by a promise (schools, air quality) the page does not keep. The election is not named as an election on that page. "Skip to the candidates" is a small grey link at the very bottom of a long page. The candidate-count chips and "N in total" on the ballot page, and the big numerals on candidate pages, read as scores at a glance even though the caption says they are not (see section 2). **Weak** for the post-postcode step; **adequate** for the ballot page; **strong** for compare.

Fix: land on the ballot page (step 4) with the election name and date as the headline, and offer "Your area", "What you're voting for" and "What's at stake" as three cards beneath the candidate list. Either remove "schools, protected areas, air quality" from the area intro or add those sections. Make "Skip to the candidates" a full-width button at the top of steps 1–3, not a footnote.

### 1b. A postcode with no election: SW1A 1AA

**Observed** (`journeyB/B-03-after-submit.txt`). Landed on `/place?pc=SW1A&loc=51.501,-0.142`, headed "Your area · SW1A / No election here right now — but plenty is happening". It gives "When you next get a vote": "On or before 15 August 2029 — UK general election — Parliament dissolves automatically on 9 July 2029 unless the Prime Minister calls an election sooner; polling day must follow within 25 working days" and "2 May 2030 — Westminster council". It then shows the same area material (map, planning record, who represents SW1A: "Cities of London and Westminster — Rachel Blake (Labour (Co-op))", St James's ward councillors) and three example elections to open. It ends: "Not registered, or not sure? Register to vote takes about five minutes, and you need photo ID at a polling station in Great Britain. How voting works · Is this data up to date?"

The unparameterised `/place` (no postcode) says the next vote is "Thursday 6 May 2027 — Local elections across the UK — Every council in Scotland, Wales and Northern Ireland, and 216 councils in England" (unverified; I did not check the 216 figure).

**Judged. Strong.** This is the best page for a first-time voter: it names the next date, explains why it might move, shows who represents them now, and points to registration. Two small fixes: 2 May 2030 is shown in a different date format from "Thursday 6 May 2027" and "On or before 15 August 2029"; and the registration nudge is at the very bottom, after the crime table — it would serve a first-time voter better at the top.

### 1c. A council by-election: Lambeth, Myatt's Fields ward (SW9 7BD)

**Observed** (`journeyC/`). Same flow: landed on `/ballot/local.lambeth.myatts-fields.by.2026-10-08/area?pc=SW9…`. The ballot page says "Council by-election · Thursday, 8 October 2026 / Lambeth: Myatt's Fields ward / 7 candidates … 2 sourced positions · 1 with something published · 1 named sources" and "At the election of Thursday, 7 May 2026, this seat was won by 88 votes (1.5% of votes cast)" (unverified). It carries a good paragraph: "This is a council seat. A councillor's win changes what the council decides: council tax, housing repairs and allocations, planning, social care, schools admissions, parking, bins, libraries. It does not change national tax, benefits or NHS policy, so this page shows only positions published for this council election, and no national party pledges are implied." Yet the same page offers the nine national topics including "Immigration and borders" and "Defence, foreign affairs and the EU", and the stakes page shows nine cards, seven of them "0 published positions". Six of the seven candidate pages (e.g. `journeyC/cand16.html`, Yemi Awolola; `cand18.html`, Molly Hartill; `cand21.html`, Mark Mckee) consist of "No statement to voters supplied." followed by nine cards each saying "Nothing published that we could source on … That means nothing found, not nothing to say." The candidate URLs are numbered 16–22, so `/candidate/1` returned 502 and `/candidate/2` returned 404 for this ballot.

**Judged. Weak.** For most council by-elections the site currently delivers names and parties and nothing else, wrapped in nine empty national-topic cards that the page itself says do not apply. A first-time voter would reasonably conclude the site is broken or that the candidates have said nothing. Fix: for council ballots, show council-relevant headings (council tax, housing, planning, transport, environment, schools) drawn from `/council/<slug>`, hide the six national topics with zero content, and put the council page's "what the council has decided" material on the ballot page. Where nothing is published for any candidate, say so once, at the top, with the date the site last looked and a link to the council page, rather than 63 times across seven pages.

### The profile ("Build your profile", `/start`)

**Observed** (`profile/log.txt`, `profile/profile-step*.png`). Intro on every step: "Let's make politics relevant to you / A few questions. No quiz, no score. / Each answer decides which published policies apply to a household like yours … Skip anything. We never ask who you support or how you voted, and we never will. Nothing you enter is sent to us; if you choose, your answers are kept in this browser only, so you don't have to answer again." Then "Step 1 of 9 · we never ask who you support or how you voted". The nine steps, each with a "Why are we asking this?" expander:

| Step | Question | Options | "Why are we asking this?" |
|---|---|---|---|
| 1 | "Which elections can you vote in?" | postcode box; Next is disabled until a postcode is typed (cannot be skipped) | "A postcode finds them. It is never sent to us or kept on our side" |
| 2 | Age | 16 to 17 … 65 or over | "Some published policies name an age: a pension rise, a youth bus fare, a training guarantee." |
| 3 | Adults in the household | One adult / A couple / Other adults sharing / Housemates, or student halls | "Tax and benefit figures depend on whether an income is shared." |
| 4 | Children or dependants | None / Youngest under 5 / School age (5 to 17) / Adult dependant | "Child benefit, the two-child limit, school and childcare policies all depend on it." |
| 5 | Housing | Rent privately … Other (living with family, temporary, none) | "Renting, owning with a mortgage and owning outright are affected by completely different policies." |
| 6 | Household income before tax, per year | six bands | "Tax and benefit figures cannot be calculated without a band. We use bands, never a figure." |
| 7 | Work | seven options | "National Insurance, Universal Credit conditions and pension policies differ by work status." |
| 8 | Studying | Not a student / At school or college / At university | "Fees, loans and maintenance policies apply only to students." |
| 9 | "Anything else that applies?" | six Yes/No pairs: disabled or long-term condition; unpaid carer; on a UK visa, or seeking asylum; means-tested benefit; drives; served in the armed forces | one line each, e.g. "Immigration policies refer to visa and asylum status." |

Picking an option advances automatically. Step 9 has a checkbox "Keep this as my profile on this device … Stored only in this browser — never sent to us" and a button "See my election". Pressing it navigated to `/ballot/parl.holborn-and-st-pancras.by.2026-10-08/area?pc=WC1H&loc=51.529,-0.125&age_band=25_34&household=couple&children=under_5&tenure=private_rent&income_band=25k_40k&employment=employed&student=no&disability=no&carer=no&visa=no&benefits=no&drives=no&veteran=no`. The answers, including the full postcode, were written to localStorage under `tsm-profile`.

**Judged.** The questions are few, banded and each has a plain reason — that part is **strong**, and "we never ask who you support" repeated on every step is reassuring rather than pushy. Three problems. (1) The wording "Nothing you enter is sent to us" and "It is never sent to us" is not literally true: every answer, and the outcode, is put in the URL's query string, and that URL is requested from the site's own server (Netlify). The site's host will see it in request logs whether or not the site "keeps" it; and anyone who copies the link shares their household with it. (2) "Skip anything" is contradicted by step 1, which cannot be skipped. (3) The intro paragraph is repeated in full on every step, so on a phone the question sits below the fold each time (`profile/step02-top.png`). Step 9 also asks about visa/asylum status and disability; the reasons given are adequate, but a first-time voter may still find "on a UK visa, or seeking asylum" intrusive on a site that just said it keeps nothing — one sentence explaining that the answer only switches which quotations are shown, and is never transmitted, would help, once the transmission claim is made true. **Weak** on the privacy wording; **adequate** overall.

Fix: carry the profile in the URL fragment (`#…`) or in localStorage only, so nothing leaves the browser, then keep the "never sent to us" wording; or change the wording to "sent only as part of the page address, never stored". Allow step 1 to be skipped ("Just describe a household").

### Number of household questions — the site disagrees with itself

**Observed.** Home page: "Seven quick questions." Ballot page form: "0 of 7 chosen … Choose 7 more". `/about`: "Eight questions are asked of every household, in bands. A few more are optional". `/start`: "Step 1 of 9". **Judged.** Pick one number and use it everywhere (seven household questions plus the optional extras is the truthful description).

---

## 2. Every candidate page on the Holborn ballot

**Observed** from `candidates/cand01–15.html` (all collapsed cards expanded by parsing the HTML). Layers are the chips shown on each claim. "Own words" is the number of claims sourced to the candidate's own Democracy Club statement; each of those appears twice on the page (once under its topic, again under a card headed "Your area · in their own words"), so the page total is larger than the ballot-page total.

| # | Candidate | Party label on candidate page | Photo | Own statement | Claims on page (unique) | Layers | Ballot-page total | Empty topic slots (of 9) | Leaflets | Parliamentary record |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Sagal Abdi-Wali | Labour Party | yes, "the candidate's own profile photo" | 789 chars | 30 | Manifesto 22, Public record 8 | 30 | 0 | none | none |
| 2 | Barmy Brunch | Official Monster Raving Loony Party | yes | 279 chars | 15 | Manifesto 15 | 15 | 1 (Housing) | none | none |
| 3 | Ewan Cameron | The Conservative Party Candidate | yes | 1,255 chars | 31 (37 with repeats) | Manifesto 25, Own words 6 | 31 | 0 | none | none |
| 4 | Tom Darwood | Independent | yes | "No statement to voters supplied." | 0 | — | 0 | 9 | none | none |
| 5 | Clare Fischer | Climate Party | yes | 1,116 chars | 5 | Manifesto 5 | 5 | 5 | none | none |
| 6 | George Galloway | Workers Party | yes | 1,505 chars | 18 (23) | Manifesto 13, Own words 5 | 18 | 0 | none | none (a former MP; nothing shown) |
| 7 | Tyler Kurtis Johnson | Restore Britain | yes | 1,280 chars | 18 (20) | Manifesto 16, Own words 2 | 18 | 0 | none | none |
| 8 | Briony Anne Lonbay Kapoor | Rejoin EU | yes | 852 chars | 14 (15) | Manifesto 13, Own words 1 | 14 | 1 (Housing) | none | none |
| 9 | Peter Newman | Reform UK | yes | 797 chars | 36 (38) | Manifesto 33, Own words 2, Third-party report 1 | 36 | 0 | none | none |
| 10 | Ketankumar Pipaliya | UK VOICE safer and stronger UK | yes | "No statement to voters supplied." | 7 | Manifesto 7 | 7 | 3 | none | none |
| 11 | Zack Polanski | The Green Party | yes | 1,362 chars | 25 (28) | Manifesto 22, Own words 3 | 25 | 0 | none | none |
| 12 | Jonathan Silberman | Communist League | yes | 1,926 chars | 2 (4) | Own words 2 | 2 | 7 | none | none |
| 13 | Helen Spiby-Vann | Christian Peoples Alliance | yes | 1,580 chars | 18 (21) | Manifesto 15, Own words 3 | 18 | 0 | none | none |
| 14 | Patrick Thomas Stillman | Liberal Democrats | yes | 671 chars | 29 (30) | Manifesto 28, Own words 1 | 29 | 0 | none | none |
| 15 | Ben Walker | UKIP - NO to Illegal Immigration | yes | "No statement to voters supplied." | 19 (20) | Manifesto 18, "Public record" 1 (his ballot description) | 19 | 0 | none | none |

Other observations from the same pages:

- No candidate page has a leaflets section, although `/status` says leaflets are fetched from ElectionLeaflets, and no page has a parliamentary record section, although `/about` says "we show seats held and how they voted". George Galloway was MP for Rochdale in 2024 and his page says only "Previous candidacies: Scottish Parliament, Glasgow; UK Parliament, Rochdale; UK Parliament, Rochdale (by-election)" while the header says "Has stood 11 times before" — the two statements do not match.
- Ben Walker's ballot-paper description "UKIP - NO to Illegal Immigration" is entered as a claim ("Public record · published 2026-09-11 … The candidate's chosen ballot-paper description is …") and counted under Immigration and under "Your area". No other candidate's description is treated as a claim (e.g. "UK VOICE safer and stronger UK", "The Conservative Party Candidate"). This adds two to his counts and to nobody else's.
- Every "Candidate's own words" claim is shown twice on the page. The second copy sits under "Your area · N in their own words", which for Galloway includes "Greens and Labour support sending endless £billions to Ukraine." — not a local position.
- The party label differs between the top list on the ballot page (registered name: "Conservative and Unionist Party", "Workers Party of Britain", "UK Voice", "Green Party", "UK Independence Party (UKIP)", "Communist League Election Campaign") and the candidate pages, ballot-paper cards, quick guide, notes and embed (ballot description: "The Conservative Party Candidate", "Workers Party", "UK VOICE safer and stronger UK", "The Green Party", "UKIP - NO to Illegal Immigration", "Communist League"). Neither is labelled as which it is. Camden's official notice (camden.gov.uk/holborn-and-st-pancras-by-election-statement-of-persons-nominated-and-notice-of-poll, accessed 25 Sep 2026) confirms the descriptions and the 15 names; Democracy Club's API confirms 15 candidacies, locked.
- Photo credits come in three forms: "Photo: Democracy Club." / "Photo: Democracy Club, the candidate's own profile photo." / (Lambeth) "Photo: Democracy Club, public domain." The difference is not explained.
- "Has stood N times before" is present for 13 candidates and simply absent for Fischer and Johnson; there is no "Standing for the first time".
- Labour's page carries a "Public record" layer (Budget 2025, Renters' Rights Act) that no other party has. `/about` explains this ("for a governing party, enacted policy is added as a separate dated source"). The summaries for these are in the past tense and factual ("In government, Labour's Budget 2025 removed the two-child limit … "), whereas every other party's are "pledged" or "says it would".
- Reform UK's "Our Policies" web page is chipped "Manifesto"; the "Third-party report" chip (a PA report of a conference speech) is used once, only for Reform UK.
- Clare Fischer's own statement, reproduced unedited, includes "I am only a 'paper candidate' … (Of course, either Labour or the Greens will win this seat in any case.)". Tyler Kurtis Johnson's includes "Entirely because of mass immigration, this is not a seat a party promising deportations of any kind can win." Both are the candidates' words, correctly labelled "Statement supplied by the candidate to Democracy Club, reproduced unedited."

Nothing on any candidate page ranks, scores or recommends in words. The wording of the slots is identical for all fifteen ("Nothing published that we could source on money and cost of living. That means nothing found, not nothing to say.").

**Judged.** Structurally the pages are identical, which is the site's core promise and it is kept. Visually they are not equal: Tom Darwood's page is a column of nine large "0"s (`candidates/cand04-top.png`); Reform UK's is a column of 4, 8, 2, 5, 3 … The numerals are the most prominent element on the page and a reader who never opens a card sees only them — a league table by another name, and one that rewards parties with long policy websites and punishes independents and small parties. The counts on the ballot page ("36 in total" against "0 in total") do the same. The duplication of own-words claims and the UKIP ballot-description claim are small but they are exactly the kind of inconsistency an activist would count. **Adequate** on wording, **weak** on the visual message of the counts.

Fix: replace the big numerals with a short list of the topics the candidate has published on (as the two-minute guide already does: "Published on: Money…, Housing…") and put counts in small type inside the open card. Show "Standing for the first time" for parity. Stop counting ballot descriptions as positions. Show own-words claims once, and rename "Your area" to "About this election, in their own words" or drop it. Add the promised leaflets and voting-record sections or remove those sentences from `/about` and `/status` until they exist.

---

## 3. About, sub-pages and the site's claims about itself

**Observed.** `/about` (title tag is just "What's It To Me?", not "How this works") opens: "The rules below are not aspirations. They are built into the code, which is public." Then "What this site never does" (never recommends, ranks, scores or matches; never asks who you support; never publishes a position without its source), and "The test we hold ourselves to: if you can tell from this site which way we would vote, we have failed." It explains "Every candidate, the same page", "Two kinds of statement" (Computed / Documented), the party-position layer, how the calculated figures are produced ("For each cell we compute a representative household once, offline, with PolicyEngine UK … The assumptions (band midpoints, representative ages and rents, which benefits are claimed) are listed under every calculation"), why the nine topics, the household questions, "Sources, not referees" ("Summaries are drafted with AI assistance and are checked against their quotation by the people who run this site"), the ledger, data sources, who runs it ("started by Romily Johnson (Founder and Product Lead), with Barny Trevelyan-Johnson (Technical Lead), and is self-funded for now. Neither is a member of, works for, or is paid by any political party or campaign"), complaints, code (AGPL-3.0, github.com/highlyvisual/voter-app) and "What this site can't tell you" (eight honest limits, e.g. "An absence is not a position", "Many Commons votes are whipped").

`/who-we-are` is Romily's essay ("And yet, when I became old enough to vote, I didn't feel equipped to make one … I don't want What's It To Me to tell people what to think. I want it to give people a reason to think, the confidence to question, and the information to decide for themselves.") signed "Romily Johnson, Founder and Product Lead · student", then "Who is behind it", "Declaration of interests", and the "Contact" heading twice in a row with slightly different text.

Sub-pages: `/about/accuracy` publishes a script report: 20 sampled postcodes all resolved to the Holborn ballot, then "## Candidate list vs Statement of Persons Nominated — No SoPN text supplied; candidate comparison skipped." and a bare heading "local.brighton-and-hove.queens-park.by.2026-09-24-2026-09-19" with no content. `/about/impact`: "Found what they were looking for 0 yes · 0 no … Ballot page views (daily counts) 3001 … Page-view counts include the developers' own testing during September 2026; treat them as an upper bound until launch." `/about/moderation`: what is refused, edited ("Spelling only"), held. `/about/parties-standing`: how nominations work and "What you can do if nobody you'd choose is standing … Each is a legitimate choice; none is recommended here." `/about/data-use`: "What we log: Anonymous daily page counts per election and aggregate bot traffic. No IP addresses, no cookies for tracking, no per-visitor records of any kind." `/candidates/submit`: "Submission needs an invitation link, which we send to every nominated candidate for whom we can find a contact address."

The "what a win would mean for you" numbers: with a profile set (couple, 25–34, child under 5, private rent, £25–40k, employed) the ballot page shows "A household like this one, under current law — Per year, for a representative household in these bands, calculated with PolicyEngine UK 2.98.0. The starting point each candidate's pledges are measured against. Income tax paid £1,472 · National Insurance paid £589 · Universal Credit received £9,620 · Child Benefit received £1,407 · Net income after tax and benefits £44,838", a comparison with 2024 law (£43,636), "What this model can and cannot turn into a number" and "Assumptions behind this calculation" (midpoint of the band, 60/40 split, one representative age per band, rent £21,600 for a couple with children in London, UC and Child Benefit claimed where entitled, "Every figure is reproducible from the open-source code and model version shown"). No candidate page, topic page, the compare page, `/positions` (375 positions) or `/ledger` contains a single claim chipped "Computed"; the only chips in use are Manifesto (231 on the Holborn pages), Candidate's own words (19), Public record (9) and Third-party report (1).

Arithmetic on the baseline: £32,500 (band midpoint) − £1,472 − £589 + £9,620 + £1,407 = £41,466, not the £44,838 shown; the income tax and NI lines are consistent with a 60/40 split of £32,500 (£1,386 + £86; £554 + £34), so the gap of £3,372 must be something not listed.

**Judged.**

*Is the promise explained early and clearly?* **Strong.** It is on the first screen of the home page, restated in the footer of every page ("An independent, non-partisan voter-information project. It does not recommend, rank or score any candidate or party."), and expanded in `/about` in plain English. The "What this site can't tell you" list is unusually honest.

*Are the pounds figures explained honestly?* The baseline is well caveated and the assumptions are visible, which is **strong** as far as it goes. But the headline promise — home page: "what it could mean for a home like yours"; `/about`: "Computed: a tax and benefit figure for a household in your bands, calculated with PolicyEngine UK … from a party's published pledges" — is not delivered for any candidate in any election today. A voter who fills in a profile expecting "what a Lib Dem/Reform win would change for me in pounds" gets a baseline and no deltas, even for pledges the site's own note says it can model (a personal-allowance change; both Reform UK and the Liberal Democrats pledge £15,000). The net-income line does not reconcile with the lines above it. **Weak** until either the computed layer ships or the promise is reworded to "we show you where you stand under current law; candidate-by-candidate figures will follow". Add the missing line(s) so the five figures sum, or say what else is in "net income".

*Claims about itself that are not (yet) true.* Observed and listed for fixing:
1. "Two kinds of statement, both labelled … Computed" (home, `/about`) — no computed claims exist.
2. "Nothing you enter is sent to us" / "It is never sent to us" (`/start`) — answers travel in the URL to the site's server (section 1).
3. "we show seats held and how they voted" (`/about`) — no voting-record section on any page, including a former MP's.
4. "Skip anything" (`/start`) — step 1 cannot be skipped.
5. Area page intro promises "schools … air quality" — not on the page.
6. "Before an election, we sample twenty postcodes … and compare our candidate list against the official Statement of Persons Nominated" (`/about/accuracy`) — the report says the comparison was skipped. (I did the comparison: the 15 names and descriptions match Camden's notice.)
7. "Submission needs an invitation link, which we send to every nominated candidate for whom we can find a contact address" (`/candidates/submit`) — no record of any invitation in the ledger or on any page; no claim on the site carries the "Candidate statement" label that submitted statements would carry. Unverifiable from outside, which is the problem: publish the invitation log per ballot (date, candidate, channel) so the claim can be checked.
8. "No … per-visitor records of any kind" (`/about/data-use`) — the host's request logs will contain the profile query strings; say so or remove them from the URL.
9. `/status`: "31 elections currently listed"; home page and job log: 26. `/positions`: "375 sourced positions across 29 elections". `/parties` says "Labour Party 52 published positions"; `/parties/PP53` says "30 published positions".

*Tone.* Mostly human and plain. Good examples: "That means nothing found, not nothing to say."; "Candidates often campaign on things their office cannot change. That is not dishonest in itself"; "The phrase can sound like a brush-off — 'what's it to you?' — and that is part of the point." Machine-written or internal-process leakage: council pages carry "Read via WebFetch; could not be re-verified by direct download." and "camden.gov.uk returns 403 to direct requests" (`/council/camden`); the ledger's "By" column reads "maintainer (Barny's build session)"; the ledger's "Applies if" column shows raw JSON such as `{"_published_by_source_rule":true}`; `/positions` lists archived elections by internal ID ("local.brighton-and-hove.queens-park.by.2026-09-24"); `/journey` is a public page headed "For Romily · not linked from the site … Answer on the round-five page ('Anything else' is fine) or tell Dad."; `/about/accuracy` publishes a script's markdown verbatim including "## Candidate list vs …". **Adequate**: the voter-facing copy is good; the back-room pages leak.

---

## 4. Copy quality

**Observed.**

*Site name.* Across all captured pages: "What's It To Me?" (curly apostrophe, with question mark) 281 times; "What's It To Me" (straight apostrophe, no question mark) 11 times (`/about` "Who runs this", `/who-we-are` throughout, `/data` "Please attribute 'What's It To Me'", embed footer); "What's it to me?" lower-case 6 times (used deliberately as the question). The `<title>` of `/about`, `/compare`, `/office`, `/stakes`, `/quick`, `/notes`, every candidate page, every topic page and both party pages is just "What's It To Me?" with no page name.

*Topic names.* The nine topics appear in at least seven spellings, sometimes on the same page:

| Where | Wording |
|---|---|
| `/about` "Why these nine topics" | money and cost of living; housing; healthcare and social care; education; environment and energy; immigration and borders; crime, policing and justice; defence, foreign affairs and the EU; equality and rights |
| Ballot page "Or one topic at a time", topic pages, quick guide | Money and cost of living; Housing and property; Healthcare and social care; Education and universities; Environment, climate and energy; Immigration and borders; Crime, policing and justice; Defence, foreign affairs and the EU; Equality and rights |
| Ballot page "Explore by topic" | Money · Housing · Healthcare · Education · Environment · Immigration · Crime · Defence · Equality and rights |
| Ballot-paper cards | Money, Housing, Health, Education, Environment, Immigration, Crime, Defence & EU, Equality |
| Candidate page cards | Money, Housing, Health, Education, Climate, Your area, then "Other topics": the long names |
| Stakes page | YOUR MONEY; YOUR HOME; YOUR HEALTH AND CARE; EDUCATION; CLIMATE, ENERGY AND THE LOCAL ENVIRONMENT; IMMIGRATION; CRIME AND SAFETY; DEFENCE, THE WORLD AND THE EU; EQUALITY AND RIGHTS |
| Compare page filter | Money; Housing and property; Healthcare and social care; Education and universities; Environment; Immigration and borders; Crime; Defence; Equality and rights |
| Ledger | money & cost of living; housing & property; environment climate & energy (no comma); defence foreign affairs & eu (lower-case EU); crime policing & justice |

*Dates.* Formats in use on voter-facing pages: "Thursday, 8 October 2026" (ballot header), "Thursday 8 October" (office page, quick guide), "8 October 2026" (candidate page), "2026-10-08" (embed, source lines, petitions "2026-09-25"), "Tue 22 Sept" / "Wed 30 Sept" (key dates; "Sept" against "Sep" elsewhere), "25 September 2026 at 12:13 UTC" (status), "2 May 2030" and "On or before 15 August 2029" (place), "Wed, 23 July 2026" style in the archive. Source lines mix "published 2025-11-26" with "undated".

*Updated stamps.* Footer: "Election data last refreshed N hours ago" read "2 hours ago" on some pages and "5 hours ago" or "6 hours ago" on others captured within the same half-hour (cached pages). `/status` says elections were refreshed "25 September 2026 at 12:13 UTC" but the job "runs every morning at 05:17 UTC". Council pages say "Read on 24 September 2026". Candidate pages carry no "last checked" date at all; party pages do ("last checked 2026-09-18").

*Empty sections and placeholders.* `/about/accuracy` bare heading with no body (above). `/about/impact` all-zero table. `/journey` internal prototype page. Ledger duplicates: claims 493/496 (LD GP appointment) and 494/495 (LD free school meals) are word-for-word duplicates created by the 25 September re-sourcing, so the Liberal Democrat candidate's counts include two pledges twice. Reform UK's `/parties/PP7931` page shows "Our Policies (Reform UK policy page)" with no date where every other line has one.

*Spelling and typos.* No doubled words and no misspellings found in the site's own copy. "Manicfesto" is the Monster Raving Loony Party's own spelling, and the ledger notes the party's "footware" — both correctly preserved, but a reader may take them for the site's errors; a "[sic]" or the existing note on the claim would help. `/status` job note: "Q3 2025, Q4 2025, Q1 2026, Q2 2026 (2025-07-01 to 2026-06-30)" — fine. `/who-we-are`: "Contact" heading appears twice in succession.

*Layout.* On a 390-px phone the ballot number "12" for Jonathan Silberman wraps onto two lines and reads as "1 / 2" (`holborn/ballot-crop1.png`). The floating "?" help button overlaps the "Or build your profile first →" link on the home page and the numerals on candidate cards (`candidates/cand04-top.png`).

**Judged. Weak** on consistency, adequate on spelling. Fix: one canonical list of nine topic names (short and long form) in one file, used everywhere including the ledger; one site-name string; one date format for voter-facing dates (e.g. "Thursday 8 October 2026") and ISO only in source lines; page names in every `<title>`; a "Last checked" date on candidate pages; de-duplicate ledger rows 493–496; remove or password-protect `/journey`; strip tool names and internal notes from council pages.

---

## 5. Trust signals

**Observed.** Every page's footer: "An independent, non-partisan voter-information project … Candidate and election data from Democracy Club (CC BY 4.0). Tax and benefit calculations use the open-source PolicyEngine UK model. Code is open source under AGPL-3.0 at github.com/highlyvisual/voter-app … Election data last refreshed N hours ago. Is this up to date? … Who we are · contact, corrections and complaints: hello@whatsittome.org · How we handle complaints." "How we handle complaints" links to `/about#contact`; the `/about` page has no element with `id="contact"` (checked in the HTML), so the link lands at the top of a long page. The menu (☰) has: How to vote, Learn, How this works, Who we are, Positions, Parties, My profile. Funding: "self-funded for now. It takes no advertising and sells no data" (`/about`, `/who-we-are`). Data kept: "Nothing stored about you" (`/about`); "What we log: Anonymous daily page counts…" (`/about/data-use`). Licence: `/data` says "Everything on this site is reusable under CC BY-SA 4.0 (candidate and election data from Democracy Club is CC BY 4.0; boundaries and statistics are Open Government Licence)". There is no `/privacy` page (404) and no cookie or privacy notice as such; `/feedback` is 404 (nothing links to it). The ledger's change log shows 26 corrections on 25 September, all by "maintainer (Barny's build session)"; "Withdrawn 1"; no complaints logged. Source health: `/status` reports "233 sources; 46 unreadable; 0 quotations not found".

**Judged. Adequate.** Who runs it, how it is funded, how to complain and the licence are all there, and the footer puts contact and complaints one tap from every ballot page — that is better than most. Three gaps. The complaints link is broken in effect (no anchor). There is no privacy notice in the form people and regulators expect (a page named Privacy that says what is stored in the browser, what the host logs, and how to delete the profile — `/profile` covers deletion but is not linked as privacy). "46 unreadable" sources out of 233 is a fifth of the evidence base that cannot currently be re-verified automatically; the status page says so, but the ballot page does not flag which claims those are. Fix: add `id="contact"` (or point the link at `/about/moderation`), add `/privacy`, and mark claims whose source could not be re-read on the last check.

---

## 6. Neutral-language check (40 claims, 14 parties)

**Observed.** Every claim on every candidate page uses the same three or four labels in the same order: "Their position" (the verbatim quotation) → "What that means" (summary) → optionally "Who it applies to" ("Applies if: …") → "The source" (title — publisher. Retrieved date). Across 260 unique claims on the Holborn pages the label sets were exactly two: [position, means, source] 204 times and [position, means, applies, source] 56 times. The chip before each claim is one of Manifesto / Candidate's own words / Public record / Third-party report. The framing text is therefore structurally identical for every party.

Forty sampled summaries (the "What that means" line), three per candidate where available (source page in brackets):

1. Labour (public record): "In government, Labour's Budget 2025 froze personal tax thresholds from 2028 to 2031 (enacted policy, not a manifesto pledge)."
2. Labour: "Labour's 2024 manifesto pledged 1.5 million new homes in England over the parliament."
3. Labour: "The government says the Renters' Rights legislation ends Section 21 no-fault evictions for new and existing tenancies (relevant to private renters)."
4. OMRLP: "The Official Monster Raving Loony Party pledged to remove VAT on green paint."
5. OMRLP: "The Official Monster Raving Loony Party pledged to reduce hospital waiting lists by using a smaller font."
6. Conservative: "The Conservative Party's current plan says it would abolish VAT on household energy bills for three years."
7. Conservative: "The Conservative Party says it would pay for its New Deal for Young People by ending funding for university degrees it describes as wasteful and as not improving job prospects or career earnings."
8. Conservative: "The Conservative Party pledged to repeal what it calls the 'Education Tax'."
9. Conservative (own words): "Says the constituency needs an MP focused on cutting the cost of living."
10. Climate Party: "The Climate Party says its programme is about rebuilding key infrastructure, regaining energy independence, reducing the cost of living and creating new jobs, without giving figures."
11. Climate Party: "The Climate Party says air quality will improve dramatically as petrol and diesel vehicles are phased out, without giving a date or target."
12. Workers Party: "Workers Party of Britain pledged a one-off 5% wealth tax on all estates valued at over £10 million."
13. Workers Party: "Workers Party of Britain pledged to overhaul what it calls liberal laws that weaken police protection of the vulnerable, increase police capacity in high-crime areas and increase funding for operations against organised crime."
14. Workers Party (own words): "Criticises the Greens and Labour for supporting continued financial support to Ukraine."
15. Restore Britain: "Restore Britain states it would freeze working-age benefits, as part of a plan to claw back £178 billion of what it describes as excess spending accumulated since 2019."
16. Restore Britain: "Restore Britain states that university staff it describes as pushing anti-British ideology should hold no position in a publicly funded British university, and that courses it describes as brainwashing students should be shut down."
17. Restore Britain: "Restore Britain pledged, under the heading 'Ban the Burqa', to ban the burqa and the niqab, which it describes as having no place on British high streets."
18. Rejoin EU: "Rejoin EU pledged to restore EU freedom of movement in the UK, which it describes as a labour mobility rather than migration policy."
19. Rejoin EU: "Rejoin EU says re-joining the EU would raise GDP and tax revenue to fund the NHS and increase staffing through access to skilled EU workers."
20. Rejoin EU: "Rejoin EU pledged to re-join the EU single market and customs union and eventually join the euro when it says economic circumstances make it advantageous."
21. Reform UK: "Reform UK says it would present a Budget within its first 100 days in office raising the tax-free personal allowance to £15,000, effective from the start of the next tax year."
22. Reform UK: "Reform UK's 2024 contract states that social housing allocation would prioritise local people and those who have paid into the system, with foreign nationals placed at the back of the queue."
23. Reform UK: "Reform UK says it would reduce the size of the university sector and use the savings to fund apprenticeships."
24. Reform UK (own words): "Says police stations are closing and criticises the government and the Mayor over Londoners' safety." (quotation: "Labour don't care and our Mayor continues to gaslight Londoners")
25. UK Voice: "UK Voice says it would raise taxes on large multinationals rather than small businesses, without giving rates."
26. UK Voice: "UK Voice says Britain's diversity is a strength and that the immigration system must be efficient, fair and publicly trusted, without giving numbers."
27. UK Voice: "UK Voice says it supports lower university tuition fees, without giving a figure."
28. Green: "The Green Party's 2024 manifesto pledged a wealth tax of 1% a year on assets above £10 million and 2% above £1 billion."
29. Green: "The Green Party's 2024 manifesto pledged to reform eligibility tests such as PIP and end what it calls the unfair targeting of carers and disabled people on benefits (relevant to households with a disabled member or a carer)."
30. Green (own words): "Says he will campaign for much more affordable housing and for rent controls."
31. Communist League (own words): "Says fighting Jew-hatred, defending Israel's existence, pushing back attacks on immigrants and international workers' solidarity are decisive for the working class."
32. Communist League (own words): "Says working people face a march by rival capitalist powers towards world war alongside attacks on living standards."
33. CPA: "Christian Peoples Alliance pledged to revert the NHS to the 1990s GP fundholding system."
34. CPA: "Christian Peoples Alliance says schools and employers must not be able to take action against teachers or individuals who support what it calls real marriage."
35. CPA: "Christian Peoples Alliance pledged to make gender reassignment treatment or surgery for under-18s illegal and to stop the NHS funding such treatment for adults."
36. Lib Dem: "The Liberal Democrats say they would raise the tax-free personal allowance and the national insurance threshold to £15,000, which they state would take 2.5 million people out of income tax and give most people a £680 tax cut."
37. Lib Dem: "The Liberal Democrats pledged to introduce free personal care in England, based on the model introduced in Scotland in 2002, so that provision is based on need rather than ability to pay."
38. Lib Dem: "The Liberal Democrats' 2024 manifesto pledged not to increase income tax, National Insurance or VAT."
39. UKIP: "UKIP pledged that foreign nationals will be charged for using the NHS, with non-payment resulting in deportation and seizure of assets."
40. UKIP: "UKIP states it opposes the ban on no-fault evictions."

Verb counts per candidate across all their summaries (unique claims): Labour "pledged" 18; Greens "pledged" 21; Lib Dems "pledged" 25; UKIP "pledged" 16; CPA "pledged" 14; Restore "pledged" 14; OMRLP "pledged" 14; Workers "pledged" 10; Conservative "pledged" 10 and "says … would" 15; Rejoin EU "says" 11, "pledged" 4; **Reform UK "pledged" 0, "says/states … would" 35 of 35**; Climate Party and UK Voice "says" with "without giving figures/rates/a date/numbers" on 6 of their 12 claims; no other party's summary carries a "without giving …" hedge. The distancing phrases "what it calls" / "it describes as" appear on Conservative (2), Workers (3), Restore (4), Rejoin (1), Green (1), CPA (1) claims — each attached to a loaded word in the quotation ("wasteful", "liberal laws", "anti-British", "labour mobility", "unfair targeting", "real marriage").

**Judged.** The structure is identical and the distancing hedges are applied even-handedly to loaded words from left and right; that is **strong**. Two patterns lean, whether or not by design. First, the attribution verb tracks the source type rather than the party, so Reform UK is never "pledged" but always "says it would", while parties whose source is a document titled "manifesto" are "pledged"; a reader can take "pledged" as a firmer commitment (or "says" as a weaker one), and the rule is nowhere stated. Second, "without giving figures" is applied only to the two smallest parties, whose sources are one-line policy pages; a large party's one-line pledge with no figure (e.g. "push for a nationwide ban on smartphones in schools") gets no such note. Both are defensible on the facts, but both are attackable. Fix: state the verb rule in `/about` ("'pledged' means the words come from a document the party calls its manifesto or contract; 'says it would' means any other party publication"), or use one verb for all; apply "without giving a figure" by a written rule (any pledge whose quotation contains no number, for every party) or not at all.

---

## 7. First-time voter: registration, deadlines, ID, postal, hours

**Observed.** `/how-to-vote` ("Plain guide / How voting works"): an eligibility checker (citizenship, age on polling day, where you live; "Answered in your browser; nothing is sent"); "You must be registered to vote. It takes about five minutes online. Students can register at both home and term-time addresses (but vote only once in the same election)"; "5 min to register online at gov.uk, and you must do it before the deadline on your ballot page"; three ways to vote: "In person at your polling station, 7am to 10pm on polling day. You need accepted photo ID; a passport, driving licence or older person's bus pass all count. No ID? Apply for a free Voter Authority Certificate."; "By post: apply online. Your ballot is posted to you; return it before polling day or hand it in at a polling station."; "By proxy: someone you trust votes on your behalf … This is the option people know least about; it is entirely normal and secure."; "Every polling station must offer large-print ballot papers, a tactile voting device and a seat"; a "Deadlines for the elections we cover" list of 26 lines each reading "…: the key dates are at the top of that page"; "On the day: Take your ID … put one cross in one box". `/learn` adds "Photo ID is required at UK Parliament elections and English council elections, not at Scottish or Welsh council elections."

Key dates on the Holborn ballot and office pages: "Polling day in 13 days · proxy vote deadline in 5 days / Register by Tue 22 Sept / Postal vote by Wed 23 Sept 5pm / Proxy vote by Wed 30 Sept 5pm / Free voter ID by Wed 30 Sept 5pm / Polls 7am to 10pm · photo ID needed / about these dates: Calculated from the statutory election timetable (working days before polling day). Confirm against the council's official notice." In the HTML the two passed deadlines carry `class="past"` and are shown struck through (`holborn/ballot-crop1.png`); there is no text saying "passed" or "closed", and nothing tells an unregistered reader what to do now.

Checks against official sources (all accessed 25 September 2026):
- Polling hours "7am to 10pm": gov.uk, "How to vote: Voting in person" — "Polling stations will be open from 7am to 10pm on the day of an election" (gov.uk/how-to-vote/voting-in-person). Correct.
- Photo ID: gov.uk, "Photo ID you'll need" — required for "UK parliamentary elections, including general elections and by-elections … local elections in England"; accepted list includes "an older person's bus pass" and "a Voter Authority Certificate" (gov.uk/how-to-vote/photo-id-youll-need). Correct.
- Proxy deadline "6 working days before, 5pm" → Wed 30 Sept: gov.uk, "Voting by proxy" — "You must apply by: 5pm, 6 working days before election day in England, Scotland or Wales" (gov.uk/how-to-vote/voting-by-proxy). Correct.
- Postal deadline "11 working days before, 5pm" → Wed 23 Sept: gov.uk, "Apply for a postal vote" — "no later than 11 working days before the election and by 5pm on that day" (gov.uk/apply-postal-vote). Correct.
- Registration "12 working days before" → Tue 22 Sept, and Voter Authority Certificate "5pm, 6 working days before" → Wed 30 Sept: consistent with the statutory timetable the Electoral Commission publishes; the Commission's pages returned HTTP 403 to my requests today, so these two are verified by calculation only, not re-read from the Commission. Camden's official notice (camden.gov.uk/…statement-of-persons-nominated-and-notice-of-poll) confirms "Thursday 8 October 2026 between 7am and 10pm" but lists no deadlines.
- Returning a postal vote: gov.uk says take it "to your polling station by 10pm on election day" (gov.uk/how-to-vote/postal-voting); the site's "return it before polling day or hand it in at a polling station" is slightly stricter than the rule but not wrong; since 2024 a form must be completed when handing in, which the site does not mention.
- "Every polling station must offer large-print ballot papers, a tactile voting device": gov.uk says "Every polling station must provide at least one large print display version of the ballot paper" and "any specific equipment you need"; the tactile device is Electoral Commission guidance rather than a stated "must". Minor overstatement.

**Judged.** The content is accurate on every point I could check, and the eligibility checker and "This is the option people know least about" line are exactly right for a first-time voter — **strong** on accuracy. **Weak** on the one thing that matters today: the registration deadline for 8 October passed on 22 September, and the site's only signal is a strikethrough. A 19-year-old who finds the site this week needs one sentence: "Registration for this election closed on 22 September. If you were not registered by then you cannot vote on 8 October — but register now (five minutes) and you will be on the roll for May 2027." The same for postal votes ("closed 23 September; you can still apply for a proxy vote until 5pm on 30 September, or vote in person with photo ID"). The `/how-to-vote` deadline section, 26 identical lines saying "the key dates are at the top of that page", tells the reader nothing. Fix: replace `class="past"` styling with words ("closed 22 Sept"), add the "what now" sentence, and print the actual dates in the `/how-to-vote` list.

---

## 8. What a journalist or activist would attack

1. **"You favour the big parties — look at the numbers."** Reform UK 36, Labour 30, Conservative 31 against an independent's 0 and the Climate Party's 5, in large type on every page. Answered in words ("A count measures how much has been published, not how good or how important anything is"; `/coverage/<ballot>` "How much sourced material we found") but not in design. Partly answered.
2. **"Your 'summaries' are AI-written spin."** `/about` admits "Summaries are drafted with AI assistance and are checked against their quotation by the people who run this site", and every quotation is shown verbatim beside the summary with a "Summaries / Exact quotations" toggle. Well answered — but the verb asymmetry in section 6 ("pledged" v "says it would") is the concrete example a hostile reader would use.
3. **"You show Labour's record as achievement and everyone else's as promises."** The Public record layer exists only for the governing party, and its summaries are in the factual past tense ("froze", "removed", "received Royal Assent"). `/about` explains why. Partly answered; the fix is to label the layer on the card as "Government record (Labour is in government)" and to add the equivalent for any party running a council in a council election.
4. **"You harvest household data while saying you keep nothing."** The profile is in the URL and in localStorage with the full postcode. Answered in intent, not in fact (section 1). Not answered.
5. **"Your 'what it means for you in pounds' does not exist / your numbers don't add up."** No computed claims; baseline net income does not reconcile. Not answered.

Also likely: "you invited every candidate — prove it" (section 3, item 7), and "a fifth of your sources can't be re-read" (`/status`: 46 of 233 unreadable), which the site discloses but does not surface on the pages that use those sources.

---

## Ranked list: the 20 most important content and journey weaknesses

1. The headline promise of per-candidate pounds figures ("what it could mean for a home like yours"; "Computed … from a party's published pledges") is not delivered for any candidate in any election; only a baseline is shown, and its five lines do not sum to the net figure shown.
2. Profile answers and the postcode outcode are sent to the server in the URL, while `/start` says "Nothing you enter is sent to us" and `/about/data-use` says "no per-visitor records of any kind".
3. Large numerals per topic on candidate pages and "N in total" on ballot cards read as a score; an independent's page is a column of nine zeros.
4. Postcode entry lands on an area-statistics page rather than the ballot; the election is not named as an election there; "Skip to the candidates" is a footnote.
5. Passed deadlines (registration 22 Sept, postal 23 Sept) are only struck through; no "closed" wording and no "what now" for the unregistered first-time voter.
6. Council by-election candidate pages are nine empty national-topic cards for six of seven candidates, contradicting the page's own statement that national pledges do not apply.
7. Nine topic names in seven spellings across ballot, stakes, compare, candidate, ledger and about pages.
8. Attribution verb differs by party ("pledged" for manifesto documents, never for Reform UK's policy page) and "without giving figures" appears only on the two smallest parties, with no stated rule.
9. Own-words claims are shown twice per candidate page under a misleading "Your area" heading; UKIP's ballot description is counted as a position and nobody else's is.
10. `/about` and `/status` promise leaflets and Commons voting records; no candidate page has either, including a former MP's.
11. `/candidates/submit` says every nominated candidate with a findable address is invited; nothing on the site records an invitation.
12. Party name shown differently on the same ballot page (registered name at the top, ballot description in the cards) with no label saying which is which.
13. Internal material public: `/journey` ("For Romily · not linked from the site … tell Dad"), "Read via WebFetch", "Barny's build session", raw JSON in the ledger, internal election IDs on `/positions`.
14. Counts disagree: 26 v 31 elections; 375 positions "across 29 elections"; Labour 52 v 30 positions; "Seven quick questions" v "Eight questions" v "Step 1 of 9".
15. "How we handle complaints" links to `/about#contact`, an anchor that does not exist; no `/privacy` page; `/feedback` 404.
16. Ledger duplicates (493/496, 494/495) inflate the Liberal Democrat count by two; `/about/accuracy` records the SoPN comparison as skipped and shows an empty heading.
17. "Skip anything" but step 1 cannot be skipped; the intro paragraph repeats on all nine steps, pushing the question below the fold on a phone.
18. Area page promises "schools … air quality" that it does not show.
19. `<title>` is "What's It To Me?" alone on most pages (compare, office, stakes, candidate, topic, party, about); date formats mixed ("Sept"/"Sep", ISO, long); "last refreshed" stamp differs page to page.
20. Layout: ballot number "12" wraps to "1 / 2" on a phone; the floating "?" covers links and numerals; occasional 502 / "upstream request failed" on topic and candidate pages.

## What the site does well

- The first screen: one sentence of purpose, one action, and "We will never tell you who to vote for, and we never score anyone" before anything else.
- Identical page structure for all fifteen candidates, in ballot-paper order, with the same "Nothing published that we could source … not nothing to say" wording for everyone; verbatim quotation always beside the summary; "Hide names and parties while I read".
- Distancing hedges ("what it calls", "it describes as") applied to loaded words from left and right alike.
- The office explainer ("What this office decides / What it does not") and its honest line about campaigning on things the office cannot change.
- The no-election page: next dates, why they might move, who represents you, and the registration nudge.
- Accurate voting mechanics: hours, ID list, proxy and postal rules all match gov.uk; the eligibility checker runs in the browser.
- An unusually frank "What this site can't tell you" list, a public change log with reasons, published accuracy reports even when they say "skipped", and an impact page that reports zeros.
- Sources are named, dated and linked on every claim; the whole ledger is downloadable with a hash; the code is public.
- Plain, human copy in the voter-facing pages ("This is the option people know least about; it is entirely normal and secure").

---

### Sources consulted outside the site (all accessed 25 September 2026)
- UK Parliament Members API, constituency 4105 election results: https://members-api.parliament.uk/api/Location/Constituency/4105/ElectionResults (majority 11,572; 38,602 valid votes; no current representation).
- London Borough of Camden, "Holborn and St Pancras by-election: statement of persons nominated and notice of poll": https://www.camden.gov.uk/holborn-and-st-pancras-by-election-statement-of-persons-nominated-and-notice-of-poll (15 candidates, descriptions, 7am–10pm).
- Democracy Club candidates API, ballot parl.holborn-and-st-pancras.by.2026-10-08: https://candidates.democracyclub.org.uk/api/next/ballots/parl.holborn-and-st-pancras.by.2026-10-08/ (15 candidacies, candidates_locked true).
- GOV.UK, "How to vote: Voting in person": https://www.gov.uk/how-to-vote/voting-in-person.
- GOV.UK, "How to vote: Voting by proxy": https://www.gov.uk/how-to-vote/voting-by-proxy.
- GOV.UK, "How to vote: Postal voting": https://www.gov.uk/how-to-vote/postal-voting.
- GOV.UK, "Apply for a postal vote": https://www.gov.uk/apply-postal-vote.
- GOV.UK, "How to vote: Photo ID you'll need": https://www.gov.uk/how-to-vote/photo-id-youll-need.
- Electoral Commission pages (voter ID, timetable) returned HTTP 403 to automated requests today; registration (12 working days) and Voter Authority Certificate (6 working days, 5pm) deadlines are therefore marked "verified by calculation only".
- Unverified today: the Lambeth May 2026 "88 votes" margin; "216 councils in England" on 6 May 2027; "Immigration has been the public's most-mentioned concern throughout 2026" (Ipsos Issues Index).
