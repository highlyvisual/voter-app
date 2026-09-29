# High contrast at WCAG 2.2 AAA

Asked for by Barny on 29 September 2026: the Display panel's **High** contrast setting should meet WCAG 2.2 at level AAA.
Normal mode stays at AA (the site-wide target in /accessibility).

## What the setting does (all in `app/theme.css`, block "High contrast")

| Criterion | How |
|---|---|
| 1.4.6 Contrast (Enhanced), 7:1 / 4.5:1 large | Its own palette, light and dark. Light: ink #000 on #FFF, muted #1F1F1F, raspberry #8C0039 (9.7:1), rose #6E2433 (10.7:1), aubergine #3A1530. Dark: ink #FFF on #000, muted #E6E6E6, pink #FF9EC6 (11:1), rose #FFC2CB, aubergine #F0D3E6, with black text on the light fills. Party labels and initials become ink on paper inside a 3px border in the party colour: text on Labour red, Conservative blue, Green green and others can't reach 7:1 in black or white. Party tints behind text are removed. |
| 1.4.8 Visual presentation | Line height 1.5 in main text; 1em between consecutive paragraphs; main text no wider than 70ch; text-align start; colours chosen by the reader (the panel itself). |
| 2.3.3 Animation from interactions | All animation and transitions off (the map excepted, whose zoom is the reader's own action); the ticker stops. |
| 2.4.12 Focus not obscured (Enhanced) | scroll-padding keeps focus clear of the sticky header and the tab bar (and the candidate "Next" bar on phones); collapsed "Show more" lists are always open. |
| 2.4.13 Focus appearance | 3px solid ink outline, 2px paper gap: 21:1 against the page. |
| 2.5.5 Target size (Enhanced) | Buttons, fields, summaries and stand-alone links at least 44 by 44. Links inside sentences are exempt. A link that stands alone in its line is found by a small script in `components/Settings.tsx` (marks `data-hc-solo` while high contrast is on) because CSS can't tell. |

Links in text are always underlined in this mode.

## Not claimed

AAA criteria about the writing rather than the display apply to the whole site and aren't met by a switch: 3.1.5 reading
level, 2.4.9 link purpose from link text alone, 3.1.3 unusual words and 3.1.4 abbreviations (the glossary helps with
both), 2.4.10 section headings, 3.3.6 error prevention. The accessibility page says so.

## How it was checked (29 September 2026)

Scripts in the Cowork session's scratchpad (not in the repo): with `contrast=high` in localStorage, light and dark, at 390
and 1280px, on 31 pages (home, ballot, candidate, compare, topic, area, stakes, office, positions, parties, a party,
learn pages, Your politics, profile, start, the three journeys, feedback, about, privacy, contact, how to vote,
accessibility), with and without a saved profile:

- axe with the WCAG 2.0/2.1/2.2 A, AA and AAA tags including `color-contrast-enhanced`: 124 page checks, no violations.
- axe leaves text over pseudo-elements "incomplete", so every visible text element (about 63,000) was also checked by
  script against the first opaque background behind it: no failures.
- Every interactive element measured for 44 by 44 (sentence links exempt): none too small.
- 70 tab stops per page on six pages, both themes and widths (1,628 stops): every one has a ring of at least 2px and
  no part of the focused element is covered.

Found and fixed on the way, in every mode: the "Trying it out?" link on the home page carried `card-link`, whose
stretched overlay made the whole home panel a link to /feedback (live for about two hours on 29 Sept); the journey's
current step had white text on a light step in dark mode; keyboard focus could go into the clipped part of a "Show
more" list.
