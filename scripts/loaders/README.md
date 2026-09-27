# One-off data loaders (22–23 September 2026)

These datasets were fetched and loaded once from a working environment. Sources, licences and shapes:

| Table | Source | Licence | How loaded |
|---|---|---|---|
| councillors, council_control | opencouncildata.co.uk (`csv2.php?y=2026`, `history2016-26.csv`) | Public domain | CSV → REST insert |
| deprivation_2025 | MHCLG, English Indices of Deprivation 2025, File 2 (IoD2025 Domains sheet) | OGL v3 | xlsx → REST insert, 33,755 rows |
| deprivation_areas (Wales) | Welsh Government, Welsh Index of Multiple Deprivation 2025, "index and domain ranks by small area" ODS (published 27 Nov 2025) | OGL v3 | `deprivation_nations.py wales`: 1,917 LSOAs (2021), overall rank and decile as published, eight domain ranks with deciles computed from rank |
| deprivation_areas (Scotland) | Scottish Government, Scottish Index of Multiple Deprivation 2020v2 ranks xlsx (28 Jan 2020; SIMD 2026 expected late 2026) | OGL v3 | `deprivation_nations.py scotland`: 6,976 data zones (2011), overall and seven domain ranks, deciles computed from rank |
| deprivation_areas (Northern Ireland) | NISRA, Northern Ireland Multiple Deprivation Measure 2017, SOA-level CSV via OpenDataNI (23 Nov 2017) | OGL v3 | `deprivation_nations.py ni`: 890 Super Output Areas (2001), overall and seven domain ranks, deciles computed from rank |
| council_register | mySociety, UK Local Authorities (past, current and future) CSV, joined to the WhatDoTheyKnow authorities CSV on wdtk-id; ONS names-and-codes lists for a cross-check | CC BY 4.0 / CC BY-SA 4.0 / OGL v3 | weekly job `scripts/auto/council_register.py` (not a one-off) |
| party_funding | Electoral Commission register, Donations CSV export, political parties, accepted 1 Jul 2025 – 30 Jun 2026, excluding impermissible/unidentified | Public register | summarised per party (private vs public funds, top 5 donors) |
| ward_history | DCLEAPIL v1.0 (figshare 28920872), rows matched to current ballots by ward GSS code, then by council+ward name | CC BY 4.0 (figshare) / CC BY-SA 4.0 (author page) | filtered → REST insert, 652 rows |
| council_tax_2026 | MHCLG, Council Tax levels 2026-27, Tables 8a/8b/8c (own Band D) and Table 9 (area Band D) | OGL v3 | ods → REST insert, 319 rows |

Refresh cadence: councillors and control after each May election; deprivation when a new index is published (the weekly release watch names the newest edition each publisher shows; England's file is the MHCLG one above, the other three nations reload with `python scripts/loaders/deprivation_nations.py all`);
party funding quarterly (the register updates quarterly); ward history yearly; council tax each April.
The scripts that did the loading were ad hoc; re-implementations should write through the service role, insert in
batches of ≤2,000 rows, and never leave an `insert` policy open to `anon` afterwards.
