# Phase 1 brief: the result of each council motion

## Goal
For every agenda item already listed on a council page (table `council_agenda_items`, filled weekly by
`scripts/fetch_council_meetings.py` from each council's Modern.gov web service), show the result once the minutes
are published: carried / lost / withdrawn / deferred / noted / agreed, the recorded vote counts if the minutes give
them, the exact sentence from the minutes, and a link. Never guess.

## What we know about the source (checked 27 Sept 2026)
- `mgWebService.asmx/GetMeeting?lMeetingId=N` returns, per meeting, `isminutepublished` / `minutepublished`, and
  per agenda item `minutesitemnumber` (+ `minutesitemsubnumber`), `isdecision`, `decisionpublished`, and
  `linkeddocuments` (each with a title and an `mgConvert2PDF.aspx?ID=...` url).
- A meeting's minutes PDF is usually attached to the "Minutes" item of the NEXT meeting of the same body (title
  like "Minutes , 15/07/2026 Council"), and sometimes to the meeting itself. Handle both.
- Some councils need a browser User-Agent (see BROWSER_UA and the per-council notes in the reader); some are slow
  (SLOW); some refuse automated access (Camden, Carmarthenshire). Keep their behaviour.
- `council_agenda_items` is replaced wholesale per council on every run (DELETE then INSERT), so outcomes must be
  keyed on (council_slug, meeting_id, item_id), not on row ids.

## Build
1. Migration `scripts/sql/migrations/2026-10-XX-council-item-outcomes.sql`: table `council_item_outcomes`
   (council_slug, meeting_id, item_id, outcome text check in a fixed list, votes_for int, votes_against int,
   abstentions int, sentence text, minutes_url text, minutes_published date, method text check in
   ('set-words','reader'), read_at timestamptz, primary key (council_slug, meeting_id, item_id)); public-read RLS.
   Plus `outcome_queue` for items the set-words pass can't settle (same key + passage text + status).
2. `scripts/auto/motion_outcomes.py` (uses `common.py`: `select`, `write`, `job`, DRY mode):
   - For past meetings in the window whose minutes are published and whose items have no outcome yet: find the
     minutes PDF, extract text (pdftotext / pypdf), cut it at the minute numbers so each item gets only its own
     passage.
   - Set-words pass, no AI: a fixed, public list of patterns (e.g. RESOLVED, "was carried", "was lost", "was not
     carried", "fell", "withdrawn", "deferred", "noted", "agreed", recorded votes "For: N ... Against: N ...
     Abstentions: N"). Record the sentence that matched. Keep the pattern list in the file, commented, like
     PROCEDURAL in the meetings reader.
   - Anything unsettled goes to `outcome_queue` with its passage. Do NOT call any AI from this script yet.
   - A separate verify step publishes queue answers only if the returned sentence appears in the passage word for
     word (normalise whitespace and quotes only) and the outcome is in the fixed list.
   - Log every new outcome in `change_log`.
3. Workflow `.github/workflows/motion-outcomes.yml`: Mondays after council-meetings (e.g. 06:20 UTC) + manual
   dispatch. Add the job to `app/status/page.tsx` JOBS and `scripts/auto/weekly_review.py` EXPECTED.
4. Council page (`app/council/[slug]/page.tsx`): under each agenda item show "Result: carried, 23 September 2026"
   + votes + the sentence in quotation marks + "Minutes" link; "Minutes not yet published" when not; "We couldn't
   read the result from the minutes" + link when the verify step rejected it. Same wording for every council.

## Test before anything goes live
- Dry run locally (no service key) against 3 councils with published minutes; print a table of item → outcome →
  sentence → method. Check 20 of them by hand against the PDFs and put the result in the PR description.
- `npx tsc --noEmit` and `npx next build` pass.
- Work on branch `automation/phase-1`; open a PR. No deploy before 8 October 2026.

## Out of scope for phase 1
Named votes by councillor (Romily: councillors appear only via their register of interests). Councils not on
Modern.gov. Any AI call (the reader that fills `outcome_queue` comes later: scheduled Cowork task first, API later).
