# Contributing

Read `docs/never-build.md` first; it is the list of things we will refuse. Then `docs/claims-style-guide.md` for anything that touches a claim. Every factual string about a candidate or party goes through the claims ledger with a source; UI copy about the app itself does not.

Tests: `npm test`. Build: `npm run build`. Changes to the ledger are append-only; migrations must not add UPDATE or DELETE paths to `claims`, `verifications` or `change_log`.
