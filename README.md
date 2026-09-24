# What's It To Me (whatsittome.org)

See who is on your ballot, and what each candidate winning would change for a household like yours. Impartial, sourced, never a recommendation.

Name and domain are set in `lib/site.ts` (override with `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_TAGLINE`). Decision by Barny, 19 Sept 2026; Romily to confirm.

Owner: Romily. Build: Barny. Licence: AGPL-3.0.

Everything about the project — where things live, infrastructure, the decisions log, open decisions, research and Romily's answers — is in [docs/PROJECT.md](docs/PROJECT.md).

## Rules built into the code

- No ranking, scoring, matching or recommending. Consequences are shown; the user judges.
- Every candidate gets the identical template, in ballot-paper order (alphabetical by surname).
- Every claim is a quotation from a named, dated, linked source; a short summary (drafted with AI assistance) sits beneath it as a reading aid. Publication rests on the source, not on a reviewer (decision by Romily, 18 Sept 2026).
- Claims live in an append-only ledger (`claims`); rows are only ever superseded, never edited or deleted (enforced by a Postgres trigger).
- Corrections and withdrawals are made through `/review` by a named maintainer and are logged publicly with the reason.
- Households are described in bands only; nothing personal is stored. The postcode is used once, to find the constituency, via postcodes.io.
- Tax and benefit figures come from a precomputed grid produced by `scripts/compute_grid.py` with PolicyEngine UK; assumptions are listed on every calculation.
- Colour: neutral greys only. A party's colour may appear only on that party's own panel, and only if set in `parties.colour_hex`.

## Stack

Next.js (App Router) on Netlify · Supabase Postgres + PostGIS · PolicyEngine UK (offline) · postcodes.io.

## Environment

See `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` and `REVIEWERS` (`Name:passcode,Name:passcode`) are secrets set only in the host's dashboard.

## Develop

    npm install
    npm run dev      # needs the NEXT_PUBLIC_* variables
    npm test         # unit tests for the applies-if matcher and grid key
    npm run build

## Adding a ballot

Insert `ballots` (set `previous_ballot_paper_id` to the last contest for the same seat, and `archived=true` for past elections), `parties` (with `parent_party_ec_id` for joint registrations), and `candidates` (statement verbatim). For a past election, compute the grid for that year: `GRID_YEAR=2024 python scripts/compute_grid.py` writes `scripts/sql-2024/` with `reform_set_id = baseline-2024`.

## Ingesting every current election

`python scripts/ingest_ballots.py` pulls every current UK ballot from Democracy Club (ballots, parties, candidates with verbatim statements, previous contest for the same ward, ONS centroid and GSS code) and writes `scripts/sql/ingest.json` plus SQL. Load with the service role (or a temporary scoped policy over REST, dropped afterwards). It is idempotent and safe to run daily; a scheduled runner needs a secret the maintainers hold, so it is not yet automated.

## Data

- `scripts/compute_grid.py` recomputes the receipt grid. Run it whenever the PolicyEngine version changes or a party reform set is added; load `scripts/sql/` output and record the checksum.
- `/ledger/snapshot` returns the full public ledger with a SHA-256. Commit that file to `snapshots/` before every polling day.

## Public ledger

`/ledger` shows every live claim and every change. `/review` is the maintainers' correction and withdrawal console.
