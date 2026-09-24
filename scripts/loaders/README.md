# One-off data loaders (22–23 September 2026)

These datasets were fetched and loaded once from a working environment. Sources, licences and shapes:

| Table | Source | Licence | How loaded |
|---|---|---|---|
| councillors, council_control | opencouncildata.co.uk (`csv2.php?y=2026`, `history2016-26.csv`) | Public domain | CSV → REST insert |
| deprivation_2025 | MHCLG, English Indices of Deprivation 2025, File 2 (IoD2025 Domains sheet) | OGL v3 | xlsx → REST insert, 33,755 rows |
| party_funding | Electoral Commission register, Donations CSV export, political parties, accepted 1 Jul 2025 – 30 Jun 2026, excluding impermissible/unidentified | Public register | summarised per party (private vs public funds, top 5 donors) |
| ward_history | DCLEAPIL v1.0 (figshare 28920872), rows matched to current ballots by ward GSS code, then by council+ward name | CC BY 4.0 (figshare) / CC BY-SA 4.0 (author page) | filtered → REST insert, 652 rows |
| council_tax_2026 | MHCLG, Council Tax levels 2026-27, Tables 8a/8b/8c (own Band D) and Table 9 (area Band D) | OGL v3 | ods → REST insert, 319 rows |

Refresh cadence: councillors and control after each May election; deprivation when a new index is published;
party funding quarterly (the register updates quarterly); ward history yearly; council tax each April.
The scripts that did the loading were ad hoc; re-implementations should write through the service role, insert in
batches of ≤2,000 rows, and never leave an `insert` policy open to `anon` afterwards.
