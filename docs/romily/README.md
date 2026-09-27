# Romily's question rounds

Every answer she has given, with its status against the site, is in [feedback-log.md](feedback-log.md).

Romily is the project owner. Each round of decisions is put to her as a page on https://romily-app-questions.netlify.app/ with a Netlify form for her answers. The source of that site is in [questions-site/](questions-site/) (rounds 2–6 and the research pages; round one is the site's home page). Her answers land in Netlify forms named `romily-answers-round-N`.

| Round | Page | Subject | Status (24 Sep 2026) |
|---|---|---|---|
| 1 | `/` | First questions | Answered |
| 2 | `/round-2/` | Questions for Romily | Answered |
| 3 | `/round-3/` | Decisions (party colours kept to party material, hero glow neutralised, place panel) | Answered |
| 4 | `/round-4/` | The About page and Who we are message | Answered; her message is published verbatim on whatsittome.org/who-we-are |
| 5 | `/round-5/` | Shaping the journey | Answered 24 Sep, 12:08 — below |
| 6 | `/round-6/` | What the research found: 17 questions in six sections | Answered 24 Sep, 14:39 UTC — see feedback-log.md |
| 7 | — | Inviting candidates | Settled on WhatsApp, 27 Sep: no invitations for now. Page never published; questions kept in candidate-invitations-questions.md |
| 8 | `/round-8/` | Check what's changed (tick or send back) and everything waiting on Romily, from her 27 Sep email | Published 27 Sep; answers to form `romily-answers-round-8` |

## Round five answers (24 Sep 2026, 12:08)

Source: Netlify form `romily-answers-round-5`. Her words kept where they matter.

1. **Before feedback:** ticked all seven changes. "I want them in progress, they can continue to be developed as it goes on."
2. **Feedback version:** after the new journey is built. "We will consider if the site will be ready closer to 8th October, however I am not against pushing our deadlines back."
3. **Personal questions first:** "maybe we owe a slight explanation beforehand so people know what they're getting into — consider the layers carefully… I still think building their profile, which includes the postcode, should be one of their first steps." Suggestions to go back to her via Dad.
4. **First step:** profile with postcode as step one, BUT "don't frame it as 'where do you live', it's a bit pushy". Also let people choose where to start; they can skip the profile to learn about the site first.
5. **Headline:** no pick. Her options: "Politics, translated into your life." / "Politics is Personal. See how." / "Every policy lands somewhere. Start with where you stand." / "Their policies. Your life. See where they meet." Wants Barny's view and deep research from historical comparisons of similar catchphrases. (Research paper 01 answers this; Barny decides.)
6. **Unfold:** not sure; wants to see both versions (steps vs one page opening up). Maybe steps on the app, opening page on the web. Wants layers plus the option of choosing where you want to be. (Both built: `/journey/steps` and `/journey/flow`.)
7. **No election:** both (next vote + representatives first, then the zoom). (Built: `/place`.)
8. **Photos:** name and party in list; photo only on candidate's own page. "BE CLEVER. maybe when a candidate is mentioned have a hyperlink which opens a photo and some info on them?" (Built.)
9. **No-photo candidates:** no photos in any list or comparison. On an app photos should exist but organised, not jumbled.
10. **Positions:** both, starting with topics.
11. **Topic order:** by profile, with the reason, in this layout: "Relevant to your profile — Housing, because you told us you rent; Education, because your household includes someone in education. Explore all topics: Housing · Cost of living · Health · Education · Environment · Immigration · Crime · Transport · Democracy…" (Built: `lib/topicOrder.ts`.)
12. **Local issues:** research first. (Paper 06.)
13. **Nothing-found wording:** fine for now; remind her to reconsider.
14. **Levels:** all five (who represents, what it decides, next election, issues, positions). "MAKE THIS MAP insane… you can decide what you want to see on the map at the time so it doesn't get crowded."
15. **Regional:** "I don't know." (Paper 05.)
16. **Global:** include. She means parties' positions on global issues, geopolitics, the EU relationship.
17. **Record:** open research, "I prefer the sound of number two [strict pairing, no verdict] so far". (Paper 02.)
18. **Empty record section:** not sure. (Paper 03.)
19. **Councillors:** decide after research. (Paper 04.)
- **Anything else:** likes the progression "Housing. What's it to me? Tax. What's it to me? The council. What's it to me? Climate policy. What's it to me? — then: What's it to my neighbourhood? My region? The country? Someone unlike me?" Include it cleverly; keep it impartial.

## Round six (published 24 Sep 2026)

- Live at https://romily-app-questions.netlify.app/round-6/ (home page "Latest" link updated).
- 17 questions in six sections, drawn from the verified research papers in [../research/](../research/). Order: council business on the Holborn and St Pancras page; candidates with no record; promises and votes; councillors; what "regional" means; the local-issues rule; the opening line (for information — Barny decides).
- The papers are published as pages: `/research/opening-line/`, `/research/promises-and-votes/`, `/research/empty-record/`, `/research/councillors/`, `/research/regional/`, `/research/local-issues/`, plus the earlier `/research/track-record/`. The running-costs paper (07) is not published.
- Answers arrive in the Netlify form `romily-answers-round-6`.
- Each publish of the questions site costs 15 credits on the shared Netlify team.
- Gotcha: HTML downloaded from the live site has lost its `data-netlify="true"` attribute (Netlify strips it), so a redeploy from downloaded pages silently drops form detection. Add `data-netlify="true" netlify-honeypot="bot-field"` to every `<form>` before deploying. The copies in `questions-site/` here have the attribute.
