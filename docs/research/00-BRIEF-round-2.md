# Research brief, round two — What's It To Me?

24 September 2026. For the research session. Same hard rules as the first brief (docs/research/00-BRIEF.md): no recommendation, ranking or score; every fact with its source; say "unverified" when you cannot verify; write for Romily.

## 8. Promises against records: every method, not just pairing

Romily's round-six answer: "I dont want to do this right now, as this will take a long time and we need to train the AI. We think it is possible but we need to be 100%, lets start looking at different ways of doing this. It doesn't have to be pairings necessarily but look at MP's policies and see what they followed through - we would have to state clearly why some parties or MP's don't have the data." And: "continue looking into promises and votes, be clever i know their is a way we can do this. It may take time but it will be good. Look into all options, it doesn't have to be pairs or word but calculations or lets look into ALL OPTIONS - take your time, make it good."

Paper 02 tested one method (strict pairing) and found 5 clean pairs in 50 pledges. Now survey every method that exists or could exist, and for each say what it would show, what judgement it needs, what data it needs, and where it would be attacked as biased:

1. Pledge-to-division pairing (paper 02), including looser variants with labels.
2. Government pledge trackers that use outcomes rather than votes: Full Fact's Government Tracker, the Institute for Government, the House of Commons Library's manifesto-implementation notes, academic pledge-fulfilment studies (Thomson et al., the Comparative Party Pledges Project). How do they define "delivered", who decides, and how often do they update?
3. Computed measures of a member's record without any pledge: agreement with own party (already shown as counts), attendance at divisions, number of divisions voted, rebellions counted by Parliament's own data, written questions, EDMs signed, bills sponsored. Which of these are facts and which become a score the moment they are summarised?
4. Legislative outcome tracking: for each manifesto commitment that became a Bill, the Bill's stages and Royal Assent date from Parliament's Bills API. This pairs a pledge with a law, not a vote. Test it on the 2024 Labour manifesto: how many commitments map to a Bill by title?
5. Money tracking: pledges with a number (spend, tax rate, threshold) against what was enacted or budgeted (OBR, HM Treasury). Which pledges are checkable this way?
6. Machine-assisted pairing: what would it take to have a model propose pairs and a person confirm, with the model's confidence and the person's decision both published? What error rates do published attempts report?
7. For every method: what is shown for a candidate or party where no data exists, and how is that stated so it reads as absence of data, not absence of action (her explicit requirement).

End with a comparison table and the judgements each method still needs. Do not pick.

## 9. The council as the main dataset

Romily's round-six answer: "Lets focus on Councils as the major data set - What's happening where you live: Housing (Your council plans to build X homes by 2030. Two major developments are currently being considered.) Transport (The council is consulting on X.) Council tax (The council approved X for 2026–27.) Environment (The council has committed to X target.) Education (X change is proposed for local schools.) Sources: council plan · budget · meeting papers - then introduce councillors."

For the eight councils in paper 06 (Brighton and Hove, Cotswold, Milton Keynes, South Staffordshire, Windsor and Maidenhead, Blackpool, Stirling, Camden), find for each of her five lines the published source that would fill it: the adopted Local Plan housing target and period; major applications under consideration (planning.data.gov.uk or the council's register); open consultations; the council tax decision for 2026–27 (we hold MHCLG's Band D figures; find the council's own decision record); the council's climate or environment target; proposed school changes. For each: URL, date, format (HTML, PDF, API), licence, and whether it could be collected by machine or needs a person. Note where the council's site blocks automated access. Then say which of the five lines can be filled for all eight councils today, which for some, and which for none.

## 10. Unelected bodies behind "Who else runs things here"

Romily (round six q11): elected bodies first, unelected ones (NHS integrated care boards, fire authorities, national parks, combined authorities without a mayor) behind a heading like "Who else runs things here". Paper 05 mapped what exists. Now find, for each type of body, the machine-readable list with boundaries or postcode lookup, its publisher and licence, so the layer can be built without a person deciding what exists where.
