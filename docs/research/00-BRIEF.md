# Research brief — What's It To Me? (whatsittome.org)

For a separate Cowork session dedicated to research. The build session works in `~/code/voter-app`; this session does not touch code. Write everything you produce into this folder (`/Volumes/BTJ_ONE/Projects/UKPolitcs/research/`), one Markdown file per question below, plus a short `research/INDEX.md` listing each file and its one-line conclusion.

## What the site is
A non-partisan UK voter-information site by Romily Johnson (Founder and Product Lead, a student) and Barny Trevelyan-Johnson (Technical Lead). Someone enters a postcode and household details; the site shows every candidate on their ballot, the same page for each, in ballot-paper order, with every published position quoted from a named, dated, linked source. Nine topics: money and cost of living; housing; health and social care; education; environment and energy; immigration and borders; crime, policing and justice; defence, foreign affairs and the EU; equality and rights. Data from Democracy Club; money layer from PolicyEngine UK. First live test: Holborn and St Pancras by-election, 8 October 2026; then the May 2027 local elections.

## Hard rules for every finding
- No recommendation, ranking or score of any candidate or party, ever. Where a method would need our judgement, say so explicitly and describe the judgement.
- Every fact you state must carry its source (publisher, date, link). Check numbers against the source before writing them. If you cannot verify something, say "unverified".
- Prefer official and non-partisan sources (Parliament, Electoral Commission, ONS, councils, Democracy Club, mySociety, Full Fact, academic work). Label anything from a party or campaign as such.
- Write for Romily: plain English, short, no jargon. She decides; you inform.

## Already done (do not repeat, build on it)
- Track records and local-issue data sources, tested 24 Sep 2026: https://romily-app-questions.netlify.app/research/track-record/ — Commons Votes API (free, per-MP votes by name), TheyWorkForYou (paid key; its topic summaries are mySociety's judgement), Modern.gov council feed (meetings, agendas, councillors by ward; no individual votes; some councils block access), ElectionLeaflets.org API (23,427 leaflets tagged to candidate and ballot), planning.data.gov.uk (England only, partial coverage).
- Romily's decisions so far are on https://romily-app-questions.netlify.app/ (rounds 1–5). Her round-five answers in brief: research first on local issues, councillors and the empty-record problem; she leans towards "pair a pledge with a vote only where the pledge names the exact measure, never a kept/broken verdict".

## Research questions, in priority order

### 1. The opening line (for Barny to decide)
Romily's four candidates: "Politics, translated into your life." / "Politics is Personal. See how." / "Every policy lands somewhere. Start with where you stand." / "Their policies. Your life. See where they meet." She asked for "deep research from historical comparisons of similar catchphrases". Find how comparable civic and public-information campaigns (UK and elsewhere: electoral commissions' registration drives, Full Fact, Democracy Club, Vote Compass, Rock the Vote, the Australian Electoral Commission, and any others you find) have opened, what evidence exists about which kinds of lines drew people in, and any research on trust and perceived neutrality in civic messaging. End with a one-page comparison of the four lines against that evidence, and note anything a line might unintentionally signal (for example, "Politics is Personal" has a history as a slogan; check it). Do not pick; give Barny what he needs to pick.

### 2. Promises against records: a method that adds no verdict
Starting from her lean (strict pairing, no verdict): what would the rule be for when a pledge "names the measure"? Test it on real cases: take the 2024 Labour, Conservative, Liberal Democrat, Green and Reform UK manifestos, pick ten concrete pledges each, and see for each whether a Commons division exists that unambiguously tests it. Report how many pair cleanly, how many are ambiguous, and the kinds of ambiguity (rebel votes against a "weak" bill, amendments, free votes, pledges never put to a vote). Also: how do Full Fact, the Institute for Government, TheyWorkForYou and any academic "pledge tracker" handle this, and where have they been accused of bias?

### 3. The empty record section
Only office-holders have a record. Look for research or precedent on how comparable sites present incumbents versus challengers without advantaging either (Ballotpedia, Vote Smart, TheyWorkForYou, Democracy Club's candidate pages, any German or Dutch Wahl-O-Mat-style sites). Report what wording and layout they use for "no record", and any evidence on how voters read an empty section.

### 4. Councillors
How many English, Scottish, Welsh and NI councils record named votes as a matter of course, and under what rules (the Local Authorities (Standing Orders) (England) (Amendment) Regulations 2014 require recorded votes on budget decisions — verify and explain). Is there any dataset of recorded council votes? What could fairly be shown for a councillor if named votes are missing (attendance, committee membership, register of interests, motions proposed), and which of those are published in a machine-readable form?

### 5. "Regional" for every postcode
Romily answered "I don't know" to what the regional level should be. Map it: for each part of the UK, what sits between the council and Westminster (combined authorities and metro mayors, the GLA, the Scottish Parliament, the Senedd, the NI Assembly, police and crime commissioners, integrated care boards, national parks), what each actually decides, and which are elected. Produce a table by nation and by combined-authority area, and list five real postcodes that show the variety (for example one in Greater Manchester, one in rural Lincolnshire, one in Glasgow, one in Cardiff, one in Belfast) with what each would see at every level.

### 6. Local issues: coverage and a mechanical rule
Extend the 24 Sep test. For the six current by-election councils (Brighton and Hove, Cotswold, Milton Keynes, South Staffordshire, Windsor and Maidenhead, Blackpool, plus Stirling and Camden) check: does the council run Modern.gov, is the web service open, are agendas published with item titles, do they publish open consultations in any structured form? Then draft the mechanical rule Romily asked for: which items would be shown, in what order, with what cut-off, so that no human chooses. Note where the rule would produce odd results (a licensing panel, a museum committee).

### 7. Netlify and other running costs
The Netlify team is at 75% of its monthly credit allowance (email 23 Sep). Find what a build and a deploy cost in credits on the current plan, what the next plan costs, and whether Vercel or Cloudflare Pages would be cheaper for a Next.js site with a nightly data job. Barny's stack is Next.js and Supabase; the site is on Netlify because the build session can deploy there directly.

## Format of each answer file
Title; date; the question in one line; a three-line summary at the top; findings with sources inline; "What this means for the site" at the end; a list of everything you could not verify.
