# Automatic council data

The plan (27 Sept 2026) is a Claude Doc: https://claude.ai/code/artifact/b79953ee-38f7-4db4-8c2b-b0fd7ae428ed
This folder holds the build briefs, one per phase. The short version of the plan:

1. **Motion results** (phase 1, next): read Full Council and Cabinet minutes and show each motion's result, with
   the exact sentence. Brief: `phase-1-motion-results.md`.
2. **Council facts from official data**: council tax (England, Wales, Scotland annual statistics), housing
   (planning.data.gov.uk, Housing Delivery Test), schools (GIAS), transport (Gazette + agendas).
3. **Council facts in the council's own words**: weekly check that each quotation is still at its source; find
   newer editions; Claude points to one sentence, the job checks it word for word before publishing.
4. **Council finder**: a new ballot for a council with no page builds the page (ONS code, GOV.UK local
   authority API, meeting-system detection), then phases 2-3 fill it.
5. **Positions reader and money-modelling job**, from the party-publications feed.
6. **Own postcode lookups** from the ONS Postcode Directory (quarterly), replacing postcodes.io at runtime.

The AI step starts as a queue that a scheduled Cowork task can fill
(no API spend); the GitHub job always does the word-for-word check and the publishing. It can switch to the
Claude API later by replacing only the reader.
