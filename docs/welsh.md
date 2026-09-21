# Welsh (Cymraeg) — handover for a translator

WP-B11 asks for a `cy` locale for fixed UI strings and the guides. Claims content is never machine-translated. This site should not ship a machine draft of Welsh; a Welsh speaker should translate the strings below and the two guide pages (`app/how-to-vote/page.tsx`, `app/about/page.tsx`).

Fixed UI strings to translate (current English): header navigation (How to vote, How this works, Public ledger; Light/Auto/Dark); home hero and stats; household picker labels and options (`lib/household.ts` FIELDS and OPTIONAL_FIELDS); topic names (`lib/data.ts` TOPICS); section navigation (Map, Key dates, Household, Candidates, Compare, Area, Sources); key-dates strip; coverage line; candidate row labels (Show/Hide, In their own words, Published positions, Where this information comes from); layer chips and legend (`lib/claims.ts` LAYERS, LEGEND); action block; feedback questions (fixed to Democracy Club wording; confirm their Welsh wording); footer imprint.

Mechanics once translated: introduce `lib/i18n.ts` with `t(key)` and a `?lang=cy` cookie; wrap the strings above. Welsh council ballots (GSS prefix W) should default to a bilingual header.
