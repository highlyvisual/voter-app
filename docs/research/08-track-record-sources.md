# 8. Track records and local issues: data sources tested (24 Sep 2026)

Written for Romily's round-five questions (12, 17–19), before the seven-paper brief. Published at https://romily-app-questions.netlify.app/research/track-record/. Papers 02, 04 and 06 build on this.

## Verified data sources (all tested 24 Sep 2026)

- **Commons Votes API** (https://commonsvotes-api.parliament.uk/) — public, no key. `divisions.json/search`, `divisions.json/membervoting?queryParameters.memberId=N`, `division/{id}.json`. Per-member aye/no per division, with title, date, counts, party colour. Members API also exposes `/api/Members/{id}/Voting?house=1`. Only recorded divisions; no "meaning" of the vote.
- **TheyWorkForYou API** — all four UK legislatures. Key required; from £20/month, reduced/free for non-profits. Their policy vote summaries are mySociety's editorial grouping — adopting them means adopting a judgement.
- **Modern.gov web service** (`https://<council>/mgWebService.asmx`) — no key. Methods include GetMeetings (params `lCommitteeId`, `sFromDate`, `sToDate` in dd/mm/yyyy), GetMeeting (agenda items, attendees with party), GetCouncillorsByWard, GetCouncillorsByPostcode, GetCommittees, GetElectionResults. Verified on hastings.moderngov.co.uk and democracy.brighton-hove.gov.uk. Camden (403, Cloudflare) and Westminster (502) block automated access; sstaffs and cotswold timed out from the sandbox. No method for individual councillor votes.
- **ElectionLeaflets.org API** (`https://electionleaflets.org/api/leaflets/?format=json`) — 23,427 leaflets at check; each tagged to Democracy Club person id, party, ballot_paper_id, with image URLs. Leaflet `status` can be `draft`.
- **planning.data.gov.uk** `planning-application` dataset — England only, OGL v3, 100,627 entities at check; council coverage partial.

## Conclusions put to Romily

1. MPs: full record exists free. Councillors: votes mostly unrecorded by name; including them is unfair by omission.
2. The risky step is pairing a promise with a vote, not the votes. Options: record only / strict pairing (pledge names the measure, no verdict) / topic grouping (a judgement we'd own).
3. Empty-section problem: only office-holders have a record; must state "has not held this office before" in the same space.
4. Local issues without judgement: council agendas (Modern.gov), leaflets (ElectionLeaflets), planning applications (planning.data.gov.uk). Curated issues would sit on top, not replace.
