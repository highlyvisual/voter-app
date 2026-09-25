# Shared context for the deep dive (25 Sep 2026)

## The site
What's It To Me? — https://whatsittome.org — a non-partisan UK voter-information site by Romily Johnson (Founder and Product Lead, a student) and Barny Trevelyan-Johnson (Technical Lead). Enter a postcode (and optional household facts in bands, kept in the browser only) and it shows every candidate on your ballot, in ballot-paper order, each on an identical page, with every published position quoted word for word from a named, dated, linked source, plus what each candidate winning would change for a household like yours (a precomputed PolicyEngine UK grid). It never ranks, scores, matches or recommends. Append-only public ledger of every claim (/ledger). Data from Democracy Club (ballots, candidates, statements, photos), ElectionLeaflets, Parliament APIs, Electoral Commission (party funding), ONS, councils (29 council pages, 13 with meeting agendas), planning.data.gov.uk, GIAS schools, Citizen Space consultations, The Gazette. Automatic refresh jobs run daily/weekly on GitHub Actions. Stack: Next.js on Netlify, Supabase Postgres.
First live test: Holborn and St Pancras parliamentary by-election, 8 October 2026 (15 candidates). Then the May 2027 local elections. 26 elections currently listed (1 Oct–5 Nov 2026), 134 candidates.
Pages: / (home), /start, /profile, /journey (/journey/steps, /journey/flow), /place (no-election postcodes), /ballot/[id] (+ /compare, /quick, /stakes, /topic/[topic], /candidate/[cid], /area, /office, /notes, /embed), /positions, /parties, /parties/[ec], /council/[slug], /coverage/[id], /learn, /how-to-vote, /about (+ /accuracy, /data-use, /impact, /moderation, /parties-standing), /who-we-are, /ledger, /data, /status, /share, /candidates/submit, /feedback.
Holborn and St Pancras ballot: https://whatsittome.org/ballot/parl.holborn-and-st-pancras.by.2026-10-08  Example postcodes in the constituency: WC1H 9JE, NW1 2DB, N7 0AA (check), WC1N 3XX; a postcode with no election: SW1A 1AA, or a Kenyan-style invalid one to test errors.

## Hard rules for everything you write
- Every fact carries its source (publisher, page title, URL, date accessed = today). Check numbers against the source before writing them. If you cannot verify something, write "unverified". Never invent a statistic.
- Separate what you OBSERVED (with evidence) from what you JUDGE (opinion). Label them.
- Plain English, UK spelling, short sentences. No jargon without a gloss. No bullet-point soup: write findings as short paragraphs or a compact table.
- The site must never rank, score or recommend candidates; do not propose features that would.
- Write your full findings to the file named in your task (markdown). Return a concise summary (under 600 words) at the end, plus the path of the file.
