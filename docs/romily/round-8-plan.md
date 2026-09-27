# Romily's email of 27 September: what we do, in what order

Written 27 September 2026, 11 days before the Holborn and St Pancras by-election. It merges her 18 points with the platform review of 25 September (`docs/bible/platform-review-2026-09.pdf`). Where the two disagree, Romily's direction wins; the one real conflict is noted below.

## First, why things she asked for didn't show up

The feedback log marked several of her instructions "Done" when they had been built somewhere, not where she would see them.

- Round five asked for the profile, with the postcode, as step one. We built that inside /start, but the home page still leads with "Find my election", and the profile is a small link under it.
- Round six asked for the whole site's copy to sound human. Four blocks were rewritten, the log said "Partly", and the rest waited on the opening line.
- Round six asked for "wider area" to be an interactive, layered mechanism rather than a table. /place still shows it as a list.
- Round six made the council the main local dataset. We built /council pages for 29 councils, but you only reach them by knowing they exist, not from your postcode.

On top of that, most of the last week's work went on things she didn't ask for: data automation, the technical bible and the review. That work is useful, but it pushed her experience asks back.

**From now on:**

- "Done" means Romily has seen it on the live site and ticked it. Nothing else counts.
- Every change comes with a link to where it shows. A short "what changed this week" note goes to her.
- Her email is logged item by item in `feedback-log.md` (round eight), with those statuses.
- The copy pass (her point 3) is not done by AI alone. An AI rewriting text so it sounds less AI is exactly her worry. Claude does the mechanical part: cutting repetition, shortening sentences, and pulling every piece of text into one file. Then Romily or Barny reads each page aloud and edits it. A page is only done once one of them has.

## The one conflict with the review

The review said to land people on the ballot straight after the postcode. Romily says the home page should lead with building your profile. These fit together:

- The home page leads with the profile, and the postcode is its first step.
- The profile ends on the ballot page, not the area-statistics page.
- Straight to the postcode stays available as a secondary route.

## The order

### Stage 0: today (half a day)

Small things she asked for that can be seen at once, plus a few fixes that make the site true:

1. **Her point 12:** a smaller Display icon.
2. **Her point 1, part:** "My profile" as an outlined button in the header, visible on every page, not just in the menu.
3. The review's quick truth fixes:
   - Remove /journey from the public site.
   - Remove the "Read via WebFetch" notes and "Barny's build session".
   - Write "closed 22 Sept" on the passed deadlines.
   - Stop the "never sent to us" claim being false: move the profile out of the page address.
4. Start a one-page tracker on the questions site that lists every one of her instructions, what state it's in, and a link to where it shows.

### Stage 1: before 8 October (the Holborn voter's path)

These are what a Holborn voter will actually touch, so they come first:

5. **Her point 1:** the home page leads with "Start with you", which builds the profile with the postcode as step one. The profile ends on the ballot.
6. **Her points 4 and 14:** "Simple first, evidence one click away" on Positions, the candidate page and the ballot. Each topic shows three layers:
   - What they say: one line.
   - What this could mean for you: shown only when the profile makes it relevant.
   - "See the exact words and source": opens the quote, the source and the method.

   This also fixes the review's finding that the big per-topic numbers read as scores: they go, and a "Published on: …" line replaces them.
7. **Her point 3, voter path first:** the copy pass, page by page, in the order people meet the pages: home, profile, ballot, candidate, Positions, How to vote. Claude cuts it down; Romily or Barny reads it aloud and edits.
8. **Her point 2:** three palette directions for her to choose from:
   - more contrast and personality;
   - no cream or beige;
   - no colour close to a UK party's.

   Each is shown on the real home, ballot and candidate pages. She picks one. Because colours are set in one place, switching takes about an hour.
9. Barny's switches from the review, done alongside and not blocking her work:
   - search indexing on the launch date;
   - edge caching;
   - security headers;
   - self-hosted fonts;
   - the postcode fallback for polling day;
   - a rehearsal on a phone.
10. **Round seven: settled on WhatsApp, 27 Sep.** No candidate invitations for now. The site's promise to invite has been removed, so round seven's page won't be published.

### Stage 2: October to November ("What is actually happening around me, and where do I fit?")

11. **Her point 7, first because the others depend on it:** "Who makes decisions where you live?"
    - For any postcode, show the actual chain, for example Camden Council, then Mayor of London and London Assembly, then UK Parliament. Glasgow gets Glasgow's chain.
    - Elected bodies come first, then "public bodies here you don't directly elect".
    - It's built as a stepped diagram you can tap through, not a table.
    - The data mostly exists already (ONS lookups and our list of wider bodies). Combined authorities and police and crime commissioners need our own tables (paper 05).
12. **Her points 5 and 6:** the council becomes the centre of the local section, and it's reached from the postcode.
    - Show what the council is discussing and deciding, its published priorities and targets, open consultations and big proposals, and what changed recently, grouped by her topics.
    - Every item is sourced, and all items get the same fixed rule, so we never choose which ones are "important".
    - Councillors sit inside this, with only the register-of-interests link (her round-six decision).
    - Extend from 29 councils towards every council voting in May 2027, using the automatic readers.
13. **Her point 8:** the scale explorer. Pick a topic (Housing first) and step through You, Your area (the council), Wider area (mayor or devolved government), Country. Each step shows:
    - what that level controls, sourced from legislation or government guidance;
    - what's published at that level;
    - where it touches your profile.

    It combines 11 and 12, so it comes after them.

### Stage 3: November to December (making it enjoyable to explore)

14. **Her points 9 and 10, built as one feature:** "What can I vote in next?"
    - A timeline you can move through.
    - It's filtered to your postcode by default, and you can widen it to the whole country.
    - Icons for each level of government, and a countdown to your next vote.
    - Tapping an election shows which body in your decision chain from 11 it elects.
15. **Her point 11:** visual Learn, in order of how much each reuses what already exists:
    1. Who controls what (reuses 11).
    2. First Past the Post, as a tiny mock election.
    3. What happens when you vote.
    4. Tap-to-define political vocabulary, used across the site.
    5. Proportional representation, votes into seats.
    6. How a bill becomes law.
    7. Where your council tax goes, from each council's published budget.
    8. How Parliament works.

### Stage 4: languages (decided by Barny, 27 September)

16. **Her point 13:** no translator, Welsh or Gaelic.
    - Anything a candidate or party publishes in Welsh or Gaelic is shown in that language, exactly as received, and labelled with its language. Nothing is ever translated.
    - The interface stays in English for now. Romily asked for a Welsh interface, so round eight (question 23) puts this decision to her.
    - Moving text into one file during the copy pass still leaves the door open if that changes.

### Stage 5: from now, in steps (the app)

17. **Her point 18:** the route is website, then a strong mobile site, then an installable web app, then the app stores.
    - **Now:** add a web manifest and icons (also on the review's list). Keep the site working fully on a phone and without JavaScript. Keep the data behind a clean API (it already is: /api/data).
    - **Next (weeks):** make it an installable web app. That means offline copies of your saved ballot and profile, an "add to home screen" prompt, and optional reminders before polling day. All the existing code carries across.
    - **Then:** store apps built by wrapping the same site (for example with Capacitor, or a Trusted Web Activity for Android), adding features a plain web page can't do well, such as election-day notifications and offline ballots. Apple can reject apps that are only a website in a shell, so the native features are what make it through review.
    - **Store submission:** after the May 2027 locals have been through the web version. The stores' rules for political content and developer accounts need checking at that point.
    - **Nothing we are building now blocks this.** The one thing to keep doing is to avoid features that only work on a desktop.

### Principles to protect throughout (her points 15, 16 and 17)

- Personalisation explains relevance ("shown first because you rent"); it never tells someone what should matter.
- Any page can start from "What do I want to understand?", not only from a politician.
- The same structure for every candidate, ballot order, exact quotes, sources, and "no published position found" all stay exactly as they are through the redesign.
- Impartial doesn't need to mean impersonal.

## What each person does

- **Romily:**
  - pick a palette (Stage 1, item 8);
  - read each page of the copy pass aloud and edit;
  - answer round seven;
  - tick items on the tracker.
- **Barny:**
  - the switches in item 9;
  - app-store accounts, when the time comes.
- **Claude (build sessions):**
  - everything else, in this order;
  - a "what changed" note to Romily each week.

## Progress, 27 September (evening)

Live, **for Romily to check** (the rule: only she marks anything done; nothing below needs more building first):

- Stage 0: "My profile" button, smaller "Aa", passed deadlines say "closed", /journey and internal notes gone, privacy wording true.
- Stage 1, item 5: the home page leads with "Start with you"; the quick postcode lookup is folded underneath.
- Stage 1, item 6: every claim in three layers on Positions, the candidate page and the ballot cards. The per-topic numbers stay until q9.
- Stage 1, item 9 (Barny's switches): edge caching, security headers, self-hosted fonts and map library, postcode fallback by ward and division, eve-of-poll archive copies. Search indexing stays off until Barny sets the date (ALLOW_INDEXING).
- Stage 2, item 11: the decision-chain data for any postcode, with no page yet (q16).
- The review's "make the site true" list: see PROJECT.md, 27 Sep.

Still blocked on her answers: palette (q10–12), the copy pass (q13–14), the council agenda rule (q15), how unelected bodies are shown (q16), replacing the per-topic numbers (q9), where the profile lands (q6).

## Progress, 27 September (later): everything not waiting on her answers

Also live, for Romily to check:

- Stage 2, item 11: "Who makes decisions where you live?" as a stepped chain on every area page, most local first, each step sourced.
- Stage 2, item 12 (part): the council reached from the postcode.
- Stage 2, item 13: the scale explorer for Housing, /explore/housing.
- Stage 5, "Next": the installable web app, with pages kept for use offline.
- Round five, q8: the photo pop-over on names in the ballot list (computers).
- From the review: leaflets on the candidate page, the rough monthly figure before the exact one, "not a voting guide" beside the figures, a polling-station finder, and the profile introduction folding away after step one.

Not built, and why:

- Waiting on her answers: palette (q10–12), copy pass (q13–14), which council agenda items to show (q15), transport (q17), election visuals (q18), which Learn visuals first (q19), journey shape (q20), where the profile lands (q6), the per-topic numbers (q9).
- Not waiting on anyone, but not small: automatic refreshing of the hand-gathered council facts, and the result of each council motion (minutes are not published in a form a program can read reliably). Both are for after 8 October.
