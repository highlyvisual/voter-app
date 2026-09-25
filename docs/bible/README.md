# Technical bible

Two branded editions, built from HTML with the site's own type (Newsreader, Inter) and the emblem's colours.

- `technical-bible-internal.pdf` — for Romily, Barny and future helpers (architecture, data, rules, runbooks).
- `how-the-platform-works-funders.pdf` — for funders and partners (sources, safeguards, privacy, status).

To update: edit `internal.html` or `funders.html` (shared styles in `brand.css`), then

    python3 render.py internal.html technical-bible-internal.pdf
    python3 render.py funders.html how-the-platform-works-funders.pdf

`render.py` needs Playwright with Chromium and pdfplumber; it renders twice so the contents page carries page numbers.
Every figure was read from the live database or the repository on 25 September 2026; re-read them before a new version.
