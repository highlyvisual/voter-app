# 30 test people: what they found

*Run on the live site, whatsittome.org, on 28 September 2026. All 30 people are made up; their postcodes are real. An automated browser answered the "Start with you" questions as each person would. The full detail for every person is in `persona-test-results-2026-09-28.xlsx`.*

## Who they were

The 30 people cover every age band from 16 upwards and every housing type. Incomes run from none to over £100,000. The group includes disabled people, carers, benefit claimants, veterans, a visa holder, an asylum seeker, students, and a trans apprentice. They live in England, Scotland, Wales and Northern Ireland: 23 at postcodes with an election (17 different ballots), 6 in places with none, and 1 who typed only half a postcode. Seven have a first language other than English. Each one also used the site in a different way: phone, slow mobile data, a small old phone, tablet, 200% zoom, keyboard only, screen reader checks, dark mode, a colour-blindness filter, or low confidence with computers.

Following the earlier advice, the people vary in first language, disability, device and digital confidence, not race, because the site doesn't use race.

## Test 1: does it work?

**Mostly, yes.** 29 of 30 reached the right place. Every ballot matched the postcode's ward or constituency. On all 17 ballots, the number of candidates matched Democracy Club. Every household summary the site showed matched the answers given. The same household always got the same money figures, whatever the postcode, which is what you want from a deterministic app.

The things to fix, most important first:

1. **Pressing Enter skips all the questions.** On a phone, pressing "Go" after typing your postcode takes you straight to results with no household. Most phone users will do exactly that.
2. **Typing too early freezes the postcode step.** If you type your postcode before the page has finished loading (likely on mobile data), "Next" stays greyed out forever with no message.
3. **Wrong postcodes are only caught at the very end.** A mistyped postcode gets through step 1. After nine questions, the person is sent back to the home page and all their answers are lost.
4. **Half a postcode gives no hint.** Typing only "NG31" greys out Next without saying why.
5. **"0 candidates are standing here"** appears where candidates just haven't been confirmed yet (Poole, Mid Argyll). Runcorn shows "1 candidates". It should say the list isn't confirmed yet.
6. **The money box ignores visas and student status.** A Graduate visa holder is shown £9,686 of Universal Credit, and a single full-time student £4,186. GOV.UK says Graduate visa holders can't claim most benefits, and it lists Universal Credit as one of those "public funds". It also says single full-time students without a child or partner generally can't claim Universal Credit.
7. Smaller issues:
   - The "Earnings" line shows −£180 for someone with no income.
   - A 16-year-old in England isn't told she can't vote in this election.
   - Skipping one question hides the household summary.
   - A Guernsey postcode is treated as UK.
   - Northern Ireland councillors are missing.
   - "See my election" occasionally needed a second click.

## Test 2: is it accessible to a wide range of people?

**The build quality is good.** The automated accessibility checker (axe-core, WCAG 2.2 AA) found almost nothing, in light or dark mode. No page scrolled sideways, even on the smallest phone. The whole journey worked by keyboard alone. The main pages read at roughly age 11–13.

What would stop real people:

1. **Screen-reader users.** After each answer, the focus drops to the page and nothing announces the next question. A blind user may not know the next question has appeared. This is the most important accessibility fix. It needs checking with real VoiceOver or NVDA.
2. **The money table on phones** scrolls sideways but can't be reached by keyboard.
3. **Where you live matters most.** Holborn has 266 sourced positions and a money box. The 16 council elections have about one position each on average, and six have none (two of them because candidates aren't confirmed yet). So every Scottish and Welsh tester, and most people in England, mostly saw "Nothing published yet". This isn't a bug, but it's the biggest difference in how well the site serves people.
4. **Less confident users land on a long map-and-planning page first.** The candidates are on step 4 of 4.

## What this test can't tell you

Fake people can't tell you what it feels like to use the site with dyslexia, a learning disability, a screen reader, or English as a second language. They also can't tell you whether people trust it or find it useful. For that, the next step is 5–10 real people from different backgrounds, ideally including at least one screen-reader user and one person who rarely goes online.

## Re-running it

The test scripts are in the `testing/persona-harness` folder next to this report. After a fix, `python3 run.py` runs all 30 people again (or `python3 run.py 4 8` for just some of them).
