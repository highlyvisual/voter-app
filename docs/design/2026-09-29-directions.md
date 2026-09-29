# Five app-feel directions and Romily's choices (29 September 2026)

Brief (Barny, 29 Sept): the site, especially on a phone, wasn't intuitive enough, it wasn't obvious what could be tapped,
and it should feel like an app rather than a web page. Five directions were drawn as a Claude Design canvas ("What's It To
Me? — five app-feel directions", in Barny's artifact gallery), each with a palette clear of party colours and a numbered
footnote on every element, plus a ten-row decision sheet for Romily. PNG contact sheets: the UKPolitcs folder,
`Claude outputs/design-2026-09-29/`. Summary: the project doc `claude/DESIGN-2026-09-29.md`.

- **A · Raspberry & paper**: the classic app (tab bar, chevron rows, one question per screen, accordions).
- **B · Midnight & lilac**: a dark-first feed of cards, a floating bar, swiped candidate cards.
- **C · Cocoa & rose-gold**: a conversation, name cards, a receipt of what applies, "Said where:" sources.
- **D · Chalk & ink**: black and white, the ballot drawn as the real paper, a ledger with numbered sources.
- **E · Aubergine & apricot**: the map first, panels over it, what's at stake by scale.

## Romily's choices (29 Sept, relayed by Barny) and where they are built

| Row | Her choice | Built |
|---|---|---|
| 1 Colours and type | C, with A's sand and raspberry and E's apricot and aubergine | `app/theme.css`: latte #F7EFE6, card #FFFBF6, cocoa #2B1B14, rose #9E3F4F (buttons), raspberry #B8004F (links, "Applies to you"), sand #F4F1EA, apricot #FBEADB, aubergine #3A1530; Fraunces and Public Sans, self-hosted (`public/fonts/fonts-v3.css`). Dark mode on a cocoa ground. E's aubergine as drawn (#6D2A73) was UKIP's purple to the eye (CIEDE2000 1.6 from #6D3177), so a deeper plum is used (16 apart). |
| 2 Navigation | A (five-tab bar) | `components/TabBar.tsx`: Home, You, Ballot, Coming up, Learn at the foot of the screen on phones and tablets; You and Ballot open the person's own page and ballot once the device knows them. |
| 3 First screen | E, with "Coming up near you" at the bottom right | `components/HomeApp.tsx` and `app/page.tsx`: the map first (the person's own area with its layers, or every election), a location pill, her headline and "Personalise my politics", four "Your politics" tiles, and Coming up (nearest first when the area is known) at the foot of the right-hand column. |
| 4 Questions | A; the extra, non-essential questions in C's format | `components/Onboarding.tsx`: step header, segmented progress, one question per screen as radio cards, Back and "Next: …" fixed at the foot; the optional questions as a conversation with editable answers and "Skip this one". |
| 5 Ballot | C | `components/NameCards.tsx`: name cards in ballot-paper order (number, party, name, a line of their own words, the topics they have published on or, with a profile, where something applies, "What's it to me? →"); the profile in use as a strip. The full list stays below as "Everyone on one page". |
| 6 Candidate page | E | `components/ScaleTabs.tsx` and the candidate page: what's at stake by scale (your council, your region, the UK, the world), saying plainly when an office doesn't decide a scale; "On the map" from topics with a map layer. |
| 7 Sources | C, "Sourced:" that opens to the full link | `components/ClaimLayers.tsx` and Positions, Your politics, party pages: "Sourced: [title], [date]"; one tap shows the exact words, the full citation and the address itself. |
| 8 "Applies to you" | A | A tag on the topic and a tick line with the reason, shown only where a statement's own condition matches the household (a statement for everyone is "Published", not "Applies to you"). |
| 9 Next candidate | C | A bar fixed at the foot of every candidate page: "Back to the paper" and "Next: No. 2, [name] →". |
| 10 Desktop | E ("I like the big map") | The home page splits: the map fills the left half and stays in place; everything else is in the right-hand column. |

Checked before release: axe (WCAG 2.2 AA) clean on 14 pages and 7 interactive states, light and dark, at 390 and 1280px;
no sideways scroll; every text colour 4.5:1 or better on every surface it sits on.
