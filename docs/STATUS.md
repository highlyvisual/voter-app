# Status, 29 September 2026

Where everything stands after the 27–29 September build sessions (Claude in Cowork and Claude Code). Replace this file
rather than adding to it; history is in git, `CHANGELOG.md` and the decisions log in `docs/PROJECT.md`.

## Live on whatsittome.org

Deploy `6abb7df49d942740b4394972` (29 Sept, about 09:00 UTC), code `e8ac5e5` on `main`, built by Claude in Cowork:
Romily's WhatsApp notes of 29 Sept (header on one line with "More", "My profile" readable on hover, home slogan about
40% smaller on a laptop, introduction cut to 25 words for her to edit, teal and coral as interface colours, party
colours on everything that belongs to a party; `lib/partyColour.ts`). Details and her words: `docs/romily/feedback-log.md`
(last section) and `CHANGELOG.md`. Checked before release: axe clean (WCAG 2.2 AA) on ten pages in light and dark at 390
and 1280px, no sideways scroll, header one line from 360 to 1512px and at 150% text.

Before it: deploy `6abb687912a7813e38351574` (29 Sept, 07:29 UTC), code `6d764a9` (Your politics, /you); the round-eight
release, deploy `6abb5ea71096fa10a3eb62c2`, code `c25b0af`. Both carry Claude Code's persona-test fixes (`c88b046`,
`de3ff1e`) and the Positions explorer (`185418a`).

Round eight (Romily's answers of 29 Sept, `docs/romily/round-8-answers.md`), everything not waiting on a decision:
- Home: her wording (q14), "Personalise my politics" (q5), four examples for the widest range of people.
- Display panel restyled (q2); "Polls are open today" / "Result pending" on ballot pages (q4).
- No counts anywhere a topic is shown (q9): candidate pages and cards, journeys, "What's at stake".
- Unelected bodies alongside the elected ones in the "Who makes decisions" chain, marked "Not elected" (q16).
- Council figures renamed "Life in [council]: the official facts", every figure with an everyday name and meaning (q25),
  with a switch to the region, nation or UK (q7; also fixes Northern Ireland councils, which the old code skipped).
- Transport and roads is the tenth topic (q17). Database: `topic` enum gained `transport`
  (`scripts/sql/migrations/2026-09-29-topic-transport.sql`, applied through the Supabase connection). 37 verbatim
  positions loaded by "Load drafted claims" run 5: 26 for 13 of the 14 parties on the Holborn and St Pancras ballot (no
  transport wording found for the Communist League) and 11 from council candidates' own statements. Positions already
  filed under another topic stay there; the transport rows sit alongside. One statement was left out on purpose: Craig
  Griffiths (Carmarthenshire, Saron) has a Democracy Club statement written for a different ward and a June by-election.
- "What can I vote in next?" at /next: countdown, calendar, map and a list by date (q18); "Coming up" in the menu.
- Learn: who decides what, first past the post, what happens when you vote, election words, where your council tax
  goes (q19), each on its own page and linked from /learn.
- The journey prototypes switch between steps and one page (q20).
- Three colour directions to try at /looks (q10–12), stored in the visitor's browser only; not indexed.
- Where the profile lands (q6), built after Barny and Romily's decisions of 29 Sept: /you, "Your politics". What you're
  voting for; your area (map with recorded crime from data.police.uk added, official figures); who decides; and what's
  at stake by scale (your council, your nation or region, the UK, the world) in each party's own words, topics that touch
  the household first. Optional questions about the person (ethnic group, religion, sex, gender, sexual orientation, ONS
  Census categories) are stored in the browser only, never in an address or sent to us; answering puts Equality and
  rights first and gathers every party's positions whose own words mention that group. /about and the privacy page say so.
- Code links now point to github.com/highlyvisual/whatsittome, a new public repository (see Blocked: it is still empty).
  The code-only copy waiting to be pushed matches `6d764a9`.

## Outstanding, not blocked (can be built next)

Next batch (Barny, 29 Sept): waste and transport layers on the Your politics map.

From `docs/research/11-data-sources.md`; items 1 to 7 are built (above). Still to do:
- Future wards for May 2027, once Democracy Club loads the May 2027 elections.
- Parts of items 1–7 left out: Nomis ward-level figures and the devolved statistics portals; council housing tables;
  matching candidates to MSPs, MSs and MLAs (none on current ballots; the Senedd's site refuses scripted requests, so it
  needs its Modern.gov service); Ofgem and Bank of England figures in the rates watch (the grid doesn't use them).

Also outstanding, smaller: phase 1b (a reader for the motions the fixed words couldn't settle); the ballot pages are
heavy (about 1.5 MB of HTML for Holborn and St Pancras); the unknown-ballot 404 is blank without JavaScript.

## Blocked

**On Romily**
- Round eight, still open: the council agenda order (q15, note 2), Welsh (q23: reverses the 27 Sept decision; needs Barny too), and her
  choice of colour direction at /looks.
- Five app-feel design directions (29 Sept), each element numbered, with a decision sheet: the Claude Design canvas
  "What's It To Me? — five app-feel directions" (Barny shares it from its Share menu) and PNG contact sheets in the
  UKPolitcs folder, `Claude outputs/design-2026-09-29/`. Her picks decide the app-like rebuild (bottom bar, one look
  per job). The new introduction on the home page is also hers to edit.
- The Democracy Club call: she wrote "Thurs 8th October", which is polling day for Holborn and St Pancras. Peter's
  offer was 7 to 9 October; 7 or 9 October avoids the clash.
- Older and still open: the local-issues rule (round six q12), whether new publications are drafted into claims
  automatically.

**On Barny**
- Submit the sitemap to Google Search Console and Bing Webmaster Tools (indexing has been on since 28 Sept).
- The public code copy: github.com/highlyvisual/whatsittome exists (public, created 29 Sept) and the site links to it,
  but it is empty. A code-only copy with fresh history (no docs/romily, research or internal notes; AGPL licence text
  added) is committed at `~/code/voter-app/.sync/public-copy`. The token the Mac uses can only write to voter-app, so the
  push was refused: either run `git push https://github.com/highlyvisual/whatsittome.git main` from that folder and sign
  in, or give the token access to the new repository.
- The git remote in `.sync/wt-main` has an access token written into its URL, where any tool that lists remotes prints
  it. Move it to the macOS keychain (or a credential helper) and consider rotating it.
- The opening line (paper 01) and the shared Netlify credit pot (paper 07).
- Keys and accounts, all free: a Democracy Club candidates-API token; DWP Stat-Xplore, Bus Open Data and the energy
  certificates register (for later items); Internet Archive keys. Whether to complete Meta's identity check for its
  Ad Library API.
- Ask the Electoral Commission about data access: its main website blocks automated readers (its search API works).

## Decisions needed

- **Climate-emergency lines (Romily).** 17 councils' pages would quote their own 2019–2023 motion. Some quotes are a
  heading or a news sentence rather than the resolution, and one names a party ("our Labour Mayor"). Only 17 of 382
  councils would have one. Recommendation: keep the data job but don't show it until Romily has looked; removing it is
  one step in `council-register.yml` and one block in the council page.
- **Area statistics, council spending by service, the fuller parliamentary record (Romily).** Area statistics were asked
  on 25 Sept; all three are now built on `automation/data-1-7` at Barny's instruction, as official figures with their
  source and period and the same template everywhere. If Romily wants any held back, each is one line on the council
  page or candidate card to remove before merging.
- Local petitions by constituency, party-level ad spending (Romily).
