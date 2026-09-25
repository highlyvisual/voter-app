# Technical audit of whatsittome.org

Date of every measurement: 25 September 2026 (roughly 17:30 to 21:40 UTC). Site: https://whatsittome.org. Auditor: Claude (Fable 5.1) working in a cloud shell. Tools: curl 8 (HTTP/2, brotli), Lighthouse 13.5.0 (mobile simulation, Chromium 1194), Playwright 1.56 with Chromium 1194, axe-core (latest npm release, run inside Playwright), a Python crawler using the requests library. User-Agent on every request: "What's It To Me? site audit". Raw outputs are in `/tmp/claude-0/-home-claude/8ed574a7-1dc4-522f-aae6-27c679f38abe/scratchpad/deepdive/work/` (Lighthouse JSON in `lh/`, Playwright results in `pw-results.json` and `interact-results.json`, crawl in `crawl-results.json`, external checks in `ext-results.json` and `ext-retry.json`). Screenshots are in `/tmp/claude-0/-home-claude/8ed574a7-1dc4-522f-aae6-27c679f38abe/scratchpad/deepdive/shots/` (191 files; named `<page>-desktop.png`, `<page>-mobile.png`, `<page>-320.png`, `<page>-zoom200.png`, `submit-<case>.png`, `nojs-<page>.png`, `home-dark.png`, `ballot-print.pdf`, `og-home.png`, `og-ballot.png`).

**One caveat that applies throughout.** All traffic from this shell goes through an outbound HTTPS proxy. Two consequences. First, every timing includes the proxy's overhead: a static file already sitting on Netlify's edge (`/apple-icon.png`, `/icon.png`) took 0.18 to 0.26 s to first byte, so treat roughly 0.2 s of every figure as the floor rather than the site's own cost. Second, the proxy intermittently returned its own `502` pages during the browser runs; where that happened (three desktop page loads and three mobile page loads reached 30 s because a chunk was cut off, and two mobile pages showed a proxy error instead of the site) I re-ran the page and report the clean run. Lighthouse's "Modern HTTP" warning (it saw HTTP/1.1) is a proxy artefact: curl confirms the site serves HTTP/2 with brotli compression.

Throughout, **Observed** means measured; **Judged** means my opinion. Ratings are strong / adequate / weak.

---

## 1. Performance

### 1.1 Time to first byte (TTFB) and full load

**Observed (curl, HTML only).** "Warm" is three consecutive hits one second apart. "Cold" is the first hit after a five-minute pause with no traffic from me, followed immediately by a second hit. All in seconds, code 200 throughout.

| Page | Warm TTFB (3 samples) | Warm total | Cold TTFB → next hit | HTML bytes (uncompressed) |
|---|---|---|---|---|
| `/` | 0.51, 0.72, 0.85 | 0.53–0.87 | 1.01 → 0.72 | 82,898 |
| `/ballot/parl.holborn-and-st-pancras.by.2026-10-08` | 1.38, 1.31, 1.47 | 1.38–1.88 | 2.04 → 1.81 | 1,227,357 |
| `…/candidate/1` | 0.93, 0.84, 0.92 | 0.88–0.95 | 0.59 → 0.78 | 135,491 |
| `/positions` | 1.16, 1.17, 1.05 | 1.07–1.23 | 0.98 → 0.81 | 388,157 |
| `/council/camden` | 0.44, 0.65, 0.40 | 0.42–0.74 | 0.74 → 0.44 | 71,944 |
| `/ledger` | 1.00, 0.67, 1.71 | 0.72–1.75 | 0.85 → 0.81 | 623,367 |
| `/status` | 0.55, 0.61, 0.58 | 0.50–0.61 | 0.71 → 0.49 | 39,385 |

Source: `work/timing-warm.txt`, `work/timing-cold.txt`. The very first hit of the session on the Holborn ballot page (before any warming) was 1.50 s TTFB and one attempt earlier in the session timed out at 120 s while the proxy was struggling; three later retries of `/status` and `…/topic/money_and_cost_of_living`, which had each timed out once at 30 s during the crawl, all returned in 0.49–0.82 s, so I treat those as transient.

Every HTML response carries `cache-control: private,no-cache,no-store,max-age=0,must-revalidate` and `cache-status: "Netlify Durable"; fwd=bypass` / `"Netlify Edge"; fwd=miss`. In other words no HTML page is ever served from Netlify's cache; every request, including the 1.2 MB Holborn page, is rendered by the origin function. The `age` header was 0 or 1 on every HTML hit.

**Observed (Lighthouse, mobile simulation, one run per page).**

| Page | Perf | FCP | LCP | TBT | CLS | Speed Index | TTI | Root document | Transfer | Requests |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | 78 | 2.0 s | 4.7 s | 170 ms | 0.018 | 3.6 s | 6.9 s | 690 ms | 1,279 KiB | 36 |
| Holborn ballot | 79 | 2.2 s | 3.0 s | 370 ms | 0.028 | 5.2 s | 6.0 s | 1,800 ms | 1,060 KiB | 38 |
| `…/candidate/1` | 97 | 1.8 s | 1.8 s | 80 ms | 0.055 | 2.8 s | 4.5 s | 780 ms | 552 KiB | 24 |
| `…/compare` | 94 | 2.0 s | 2.6 s | 80 ms | 0.003 | 3.0 s | 4.8 s | 780 ms | 747 KiB | 24 |
| `/positions` | 95 | 1.9 s | 1.9 s | 110 ms | 0.032 | 4.2 s | 4.6 s | 1,520 ms | 578 KiB | 19 |
| `/council/camden` | 89 | 1.6 s | 2.6 s | 60 ms | 0.165 | 2.3 s | 4.0 s | 560 ms | 539 KiB | 19 |
| `/ledger` | 84 | 1.9 s | 2.2 s | 530 ms | 0.009 | 2.8 s | 4.2 s | 710 ms | 581 KiB | 18 |
| `/status` | 89 | 2.7 s | 3.0 s | 40 ms | 0.001 | 3.2 s | 4.0 s | 710 ms | 494 KiB | 18 |

Accessibility, Best Practices: 100 on every page. SEO: 66 on every page (only failure: "Page is blocked from indexing", see §5). Source: `work/lh-summary.txt` and `work/lh/*.json`.

**Observed (Playwright, desktop 1280×800, real network through the proxy, clean runs).** `load` event: home 2.7 s, Holborn ballot 3.6 s (TTFB 2.0 s), candidate 1.9 s, compare 1.75 s, positions 1.7 s, council 1.4 s, status 1.2 s, embed 1.1 s. One ledger run had a TTFB of 8.1 s and load of 9.0 s; the curl samples for `/ledger` (0.67–1.71 s) suggest that was an outlier, but I could not rule out a slow origin query. Mobile (375×812) loads were similar except for the proxy stalls noted above.

**Judged: adequate for text pages, weak for the two pages that matter most (home and ballot).** The home page's LCP of 4.7 s on simulated mobile and the ballot page's 1.8–2.0 s server time are both above the "good" thresholds (2.5 s LCP; 0.8 s TTFB). The ballot page's server time is the single biggest cost, and it is paid on every single view because HTML is `no-store`.

**Fix.** (a) Let Netlify cache the HTML: set `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600` (or use Next.js ISR / Netlify Durable Cache with tag-based purges from the refresh jobs). The content changes at most daily, so a five-minute edge cache would remove almost all origin renders while keeping "Election data last refreshed" honest. Keep `private` only on pages that read browser-only state. (b) Move the household-profile logic that currently makes every page dynamic to the client, so the shell can be static.

### 1.2 Page weight, biggest assets, images

**Observed.** The heaviest items on the home page (Lighthouse transfer sizes): `/brand/lockup-light.png` 244 KiB and `/brand/lockup-dark.png` 240 KiB (both 633×514 PNG, displayed at 330×268 on desktop and 260×211 on mobile; only one is visible, the other has `display:none`, but both are `<link rel=preload as=image>` in `<head>`, so both download on every page); `Newsreader` woff2 130 KiB + 144 KiB and `Inter` 48 KiB; `/icon.png` 92 KiB (a 512×512 favicon fetched on every page); `27t_qfc-3_lzs.js` 68 KiB; `/brand/mark-light.png` 47 KiB and `mark-dark.png` 49 KiB (240×212 PNG shown at 45×40, again both preloaded on every page). Lighthouse's "Improve image delivery" estimates 284 KiB saveable on the home page and 295 KiB on the ballot page (the latter mostly OpenStreetMap tiles). Static images are served with `cache-control: public,max-age=0,must-revalidate` (ETag revalidation on every visit) whereas `/_next/static/*` correctly gets `max-age=31536000, immutable`.

The Holborn ballot HTML is 1,227,357 bytes uncompressed (134,438 bytes over the wire with brotli). 728,006 bytes (59 %) of it is the React Server Components "flight" payload (`self.__next_f.push(...)`) that repeats the rendered content as JSON; the DOM has about 6,360 element tags. `/positions` is 388 KB of which 85 % is flight JSON; `/ledger` is 623 KB (62 % flight); `…/compare` is 603 KB (58 %).

The JS bundle is nine chunks totalling 608,365 bytes uncompressed (`work/chunks/`), about 140–186 KiB transferred per page; Leaflet 1.9.4 (37 KiB) plus its CSS are added from cdnjs on pages with a map (home, ballot, area). Lighthouse flags 13 KiB of "legacy JavaScript" polyfills (`Array.prototype.at`, `flat`, …) and 24–48 KiB of unused JS per page.

**Judged: adequate, with two easy wins.** Nothing is grotesque, but the brand PNGs are the single largest avoidable cost (about 590 KiB on the home page, about 100 KiB on every other page) and they are the LCP element on the home page.

**Fix.** Replace the lockup and mark with SVG (or at least 2× WebP/AVIF at the displayed size) and stop preloading both themes; use `<picture>` with `media="(prefers-color-scheme: dark)"` or a CSS `mask`/`currentColor` SVG so only one downloads. Serve a 32×32/48×48 favicon and keep the 512 icon for the manifest only. Give `/brand/*` a long `max-age` with hashed filenames. Consider trimming the ballot page's payload by rendering the 15 collapsed candidate sections from a lighter client fetch, or by turning the flight duplication off for the static parts.

### 1.3 Render-blocking resources and fonts

**Observed.** Two render-blocking requests on every page: the Google Fonts stylesheet (`fonts.googleapis.com/css2?family=Newsreader…&family=Inter…&display=swap`, 1.7 KB, estimated 780–830 ms of blocking on mobile) and the main CSS chunk (`41798_545c2to.css`, 16.5–16.8 KiB, 218–393 ms). Fonts use `display=swap`, so text shows in Georgia/Times first and swaps (a flash of unstyled text rather than invisible text); `document.fonts` reported eight faces loaded on the ballot page (Inter 400/500/600, Newsreader 400/500/600, plus italics on some pages). Preconnect hints for both Google hosts are present.

**Judged: weak.** A third-party CSS request on the critical path is the largest remaining render delay after the server time, and it also leaks every visitor's IP to Google (see §6).

**Fix.** Self-host the two fonts as subsetted woff2 files (`next/font/google` does this at build time and inlines the `@font-face` CSS), keep `font-display: swap`, and preload only the two regular weights used above the fold.

---

## 2. Accessibility

### 2.1 axe-core

**Observed.** axe-core ran on all 37 page types at both 1280×800 and 375×812 (`work/pw-results.json`; the two mobile runs that hit a proxy error were re-run cleanly). Real violations found:

| Rule | Impact | Where | Selector |
|---|---|---|---|
| `page-has-heading-one` | moderate | `…/embed` (desktop and mobile) | `html` — the embed page has no `<h1>` |
| `scrollable-region-focusable` | serious | `/ledger` at 375 px | `.scroll:nth-child(4)` and `.scroll:nth-child(11)` — the two ledger tables scroll sideways but cannot be reached or scrolled with the keyboard |

Everything else passed: 0 violations on home, ballot, candidate, compare, quick, stakes, topic, area, office, notes, positions, parties, party, council, coverage, learn, how-to-vote, about (all six), who-we-are, ledger (desktop), data, status, share, candidates/submit, start, profile, journey (all three), place and the 404 page. axe left 876 colour-contrast checks as "needs review" (it could not resolve the background), so I ran my own contrast pass (below). Lighthouse's accessibility score was 100 on all eight pages it ran on; it additionally flagged `label-content-name-mismatch` on the ballot page for each candidate `<summary aria-label="Sagal Abdi-Wali, Labour Party, 30 positions">` (`body > main#main > details#c-1 > summary` through `#c-15`): the aria-label does not start with the visible text ("SA 1 Sagal Abdi-Wali…"), which breaks voice-control users who say "click Sagal Abdi-Wali".

### 2.2 Manual checks

**Colour contrast (observed).** A script computed WCAG ratios for every visible text element against its nearest opaque background on home, ballot, candidate, compare and council. The only failure was the Leaflet attribution link ("Leaflet", `rgb(0,120,168)` on `rgb(221,221,221)`, 12 px, ratio 3.64:1) — a third-party control. Body text is `rgb(0,0,0)`-ish on `rgb(255,255,255)`; the `.meta` secondary text is `rgb(95,89,82)` (about 5.6:1). Dark mode is pure black on pure white (`rgb(0,0,0)` / `rgb(255,255,255)`). The site also offers a "Display" menu (text size 100–150 %, high-contrast, light/auto/dark, low-data) stored in `localStorage` (`textsize`, `contrast`, `theme`, `lite`).

**Skip link, landmarks, headings (observed).** Every page has `<a class="skip" href="#main">Skip to content</a>` as the first tab stop; it becomes visible on focus (`shots/focus-skiplink.png`), the target `main#main` exists. Each page has exactly one `<main>`, one `<header>`, one `<footer>` and one or more `<nav>`. `html lang="en-GB"`. Exactly one `<h1>` per page except `/embed` (none). Heading order on the ballot page is h1 → h2 "Your Member of Parliament" → h3 → h2 "The ballot paper" → h3 (candidate) → h4 → h5 (topics), with no skipped levels. The compare, positions, parties, quick, stakes, notes, coverage, learn, share and profile pages have only an `<h1>` and no sub-headings even though `/positions` and `…/compare` are very long (the compare page is 57,431 px tall at 375 px wide; the ledger 81,845 px).

**Keyboard: postcode form (observed).** Tab order on the home page: skip link → wordmark → seven nav links → "Display" button → `#postcode` → "Find my election" → "Or build your profile first" → the "try a postcode" buttons. Focus is visible everywhere: a 3 px solid `rgb(214,0,111)` outline on links and buttons, a 3 px black outline on the input (`shots/focus-postcode.png`). The input has `<label for="postcode">Your postcode</label>`, `autocomplete="postal-code"`, `enterkeyhint="search"`, `required`. Enter submits. The horizon slider `#horizon` has a label, `aria-valuetext` ("in the next three months") and responds to arrow keys. On an invalid postcode the page reloads with `?error=…` and shows `<p class="notice small" role="alert">That doesn't look like a UK postcode.</p>`; the input is *not* marked `aria-invalid` or linked with `aria-describedby`, and focus is not returned to the field. An empty submit is stopped by the browser's native `required` message.

**Keyboard: candidate comparison (observed).** `…/compare` has one `<table>` with 25 `<th scope>` cells and no `<caption>`, 16 checkboxes (`name="c"`) to pick candidates, 48 radios for the household filter, two toggle buttons ("Summaries" / "Exact quotations", implemented with a class `on` rather than `aria-pressed`), a "Hide names and parties while I read" checkbox, and 242 `<details>` elements. Tab reaches everything in a sensible order (`work/interact-results.json`, `tab_sequence_compare`). Two horizontally scrolling containers (`nav.topic-tabs` and `div.scroll.compare-wrap`) have no `tabindex`, but they contain focusable children so axe does not flag them. Pressing Space on the first candidate checkbox did not change the visible text within 0.5 s (the selection appears to require the "Pick 2 to 4 to compare closely" control).

**200 % zoom and 320 px (observed).** At a 640 px-wide viewport with device scale 2 (equivalent to 200 % zoom on a 1280 window), no page had horizontal scroll (`document.documentElement.scrollWidth === innerWidth`) on home, ballot, candidate, compare, council or positions (`shots/*-zoom200.png`). At 320 px wide, likewise none scrolled sideways; elements wider than the viewport all sat inside `overflow:hidden`/`auto` containers (the home page ticker track is 1,738 px wide inside an `overflow:hidden` strip; topic tabs on ballot and compare overflow inside a scroll strip).

**Reduced motion (observed).** With `prefers-reduced-motion: reduce`, `document.getAnimations()` returned 0 and the CSS has a `prefers-reduced-motion` block. Without it, the home page runs a 38 s infinite CSS marquee (`.ticker-track`, animation `slide`: "26 elections open now · Next polling day 1 October · 109 candidates · 375 sourced positions…") with no pause button.

**Alt text and labels (observed).** No `<img>` without an `alt` attribute on any page. Brand marks use `alt=""` (decorative) and the lockup uses `alt="What's It To Me? Politics, in your context."`. Map tiles are `alt=""`. Candidate photos are proxied through `/_next/image` and carry `alt=""` (the name is in the adjacent `<h1>`). Every `input`, `select` and `textarea` had a label, `aria-label` or wrapping `<label>` on all pages checked. No buttons without an accessible name.

**Judged: strong overall; a handful of specific defects.** This is one of the cleaner sites I have run axe over. The defects that matter: the ledger's sideways-scrolling tables on phones (serious, and the ledger is a core trust feature); the candidate `<summary>` aria-labels that do not begin with the visible name; error messaging that is announced but not tied to the field; a marquee with no pause control (WCAG 2.2.2); and two very long pages with no headings to navigate by.

**Fix.** Add `tabindex="0"` and an `aria-label` to `.scroll` wrappers (or make the ledger table responsive by stacking rows below 600 px). Change the summary labels to begin with the visible name ("Sagal Abdi-Wali, 1 on the ballot paper, Labour Party, 30 positions") or drop the aria-label and let the visible text speak. On postcode error, set `aria-invalid="true"` and `aria-describedby` on the input and move focus to it. Add a pause button to the ticker or make it static. Add `<h2>` per topic on `/positions` and per row group on `…/compare`. Give the embed page an `<h1>` (visually hidden is fine).

---

## 3. Mobile

**Observed.** Screenshots at 375×812 and 1280×800 for every page type are in `shots/` (`<page>-mobile.png`, `<page>-desktop.png`, plus `-full.png` full-page captures). `scrollWidth > innerWidth` was false on every page at 375 px and at 320 px. Specific things seen:

- The floating round "?" help button (bottom right, about 44 px) sits over content on phones: on the home page it covers the end of "Or build your profile first →" (`shots/home-mobile.png`); on the candidate page it covers "Add your profile" (`shots/candidate-mobile-crop.png`); on the ledger it sits over table cells (`shots/ledger-mobile-crop.png`).
- `/ledger` at 375 px: the "Where things stand" table's numbers and the "Live claims" table's Source column are cut off on the right; the table scrolls sideways with no visible affordance (`shots/ledger-mobile-crop.png`).
- `…/compare` at 375 px stacks each candidate's cell under the topic heading; the page becomes 57,431 px tall (about 70 screens). In the stacked view a summary and its quotation run together with no space or punctuation, e.g. "…from 2028 to 2031.Asking everyone to contribute…" and "…VAT on green paint.We will remove VAT…" (`shots/compare-mobile-crop.png`). This is a markup gap (two inline elements with no separator), not a typo in the data.
- Desktop ballot page: the numbered candidate list flows inline, so at 1280 px lines 4/5, 8/9 and 10/11 show two candidates per line ("4 Tom Darwood · Independent  5 Clare Fischer · Climate Party"), which weakens the "ballot-paper order" reading (`shots/ballot-desktop.png`).
- Nothing overlapping or cut off was seen on home, start, profile, journey, place, ballot, quick, stakes, topic, candidate, area, office, notes, embed, positions, parties, party, council, coverage, learn, how-to-vote, about (all), who-we-are, data, status, share, candidates/submit or the 404 page at 375 px, beyond the help button.

**Judged: adequate.** No horizontal scroll anywhere is a real achievement for a data-heavy site. The help button collision and the ledger table are the two visible faults.

**Fix.** Add `padding-bottom: 72px` (or `scroll-padding`) to `main` on small screens, or dock the help button into the footer below 480 px. Make the two ledger tables stack or give them a visible "scroll →" hint plus keyboard focus. Insert a space or line break between summary and quotation in the compare cells. Force one candidate per line (`display:block`) in the ballot-paper list.

---

## 4. Links

### 4.1 Internal

**Observed.** The crawler started from the 91 sitemap URLs plus the 35 page-type URLs and followed every internal `href`, one request per second, stopping at 400 pages; 794 discovered URLs (mostly per-candidate and per-topic pages of the 25 smaller ballots) were left unvisited. Result: 398 × `200`, 0 × 4xx, 0 × 5xx; the two "errors" were 30 s read time-outs on `/status` and `…/topic/money_and_cost_of_living` which then returned `200` in under a second on three retries each (`work/crawl-results.json`). The page-type sweep separately confirmed: every listed route returns `200` except `/feedback`, which returns `404` ("Nothing here") and is not linked from any crawled page, although `robots.txt` disallows it. `/find` (disallowed in robots) returns `404` for every GET (the postcode form posts to a Next.js server action instead). `/review` returns `200`: a "Maintainer sign-in" page with a single passcode field.

Pages crawled by type: ballot 36, `/compare` 92 (including `?topic=` variants), `/topic/*` 72, `/candidate/*` 53, quick/stakes/area/office/notes 8 each, council 29, parties 14, coverage 8, `/api/data/*` 29, plus the static pages.

### 4.2 External

**Observed.** 1,142 distinct external links across the 400 crawled pages, to 162 hosts. Largest: `candidates.democracyclub.org.uk` 160, `get-information-schools.service.gov.uk` 93, `web.archive.org` 70, `electionleaflets.org` 56, `www.thegazette.co.uk` 30, `minutes-1.nwleics.gov.uk` 19, `moderngov.southkesteven.gov.uk` 19, `votes.parliament.uk` 17, `meetings.cotswold.gov.uk` 17, `moderngov.newcastle-staffs.gov.uk` 17, then 13–16 each for a dozen council ModernGov/CMS hosts, `www.gov.uk` 11, `greenparty.org.uk` 10, `www.restorebritain.org.uk` 10, `www.legislation.gov.uk` 9. Full table in `work/ext-results.json`.

Each was checked with HEAD then GET (15 s time-out), then every failure was retried with GET and a browser-like User-Agent (`work/ext-retry.json`). `web.archive.org` could not be reached at all from this shell (the proxy reset every connection), so its 70 links are **unverified**.

Confirmed broken on both attempts (13 links):

| Status | URL | Linked from |
|---|---|---|
| 500 | https://www.blackpool.gov.uk/Your-Council/Have-your-say/Consultations/Consultations-and-other-engagement.aspx | /council/blackpool |
| 404 | https://www.blackpool.gov.uk/Residents/Planning-environment-and-community/Planning/Planning-policy/Blackpool-local-plan/New-local-plan-to-2042/New-local-plan-to-2042.aspx | /council/blackpool |
| 404 | https://www.blackpool.gov.uk/Residents/Planning-environment-and-community/Climate-emergency/Net-Zero-council-2030.aspx | /council/blackpool |
| 404 | https://www.newcastle-staffs.gov.uk/downloads/download/131/newcastle-under-lyme-and-stoke-on-trent-core-spatial-strategy | /council/newcastle-under-lyme |
| 404 | https://www.stroud.gov.uk/media/2346197/rodborough.pdf | /ballot/local.stroud.rodborough.by.2026-10-13 |
| 404 | https://www.eastherts.gov.uk/new-district-plan | /council/east-hertfordshire |
| 404 | https://www.rbwm.gov.uk/news/full-council-votes-adopt-borough-local-plan-supporting-sustainable-development-until-2033 | /council/windsor-and-maidenhead |
| 404 then 500 | https://www.bassetlaw.gov.uk/council-and-democracy/elections-in-bassetlaw/local-elections-4-may-2023/declaration-of-results-of-poll-district/worksop-east/ | /ballot/local.bassetlaw.worksop-east.by.2026-10-29 |
| 404 | http://www.southkesteven.gov.uk/CHttpHandler.ashx?id=29304 (plain http) | /ballot/local.south-kesteven.grantham-st-wulframs.by.2026-10-22 |
| 404 | https://minutes.stirling.gov.uk/mgListCommittees.aspx | /council/stirling |
| 404 | https://www.bcpcouncil.gov.uk/…/Local-and-Parish-Council-elections-2023/Results/Wards/Penn-Hill.aspx | /ballot/local.bournemouth-christchurch-and-poole.penn-hill.by.2026-11-05 |
| 503 | https://www.zackpolanski.com/ | Holborn ballot page |
| 522 (Cloudflare origin down) | https://hbcnewsroom.co.uk/halton-council-local-elections-2026/ | /ballot/local.halton.beechwood-heath.by.2026-10-29 |

Blocked with `403` on both attempts (184 links on 29 hosts) — almost certainly bot protection against a datacentre IP rather than dead links, since whole hosts fail uniformly: `votes.parliament.uk` (17), four `*.moderngov.co.uk` hosts (16, 16, 15, 13, 10, 9), `www.camden.gov.uk` (12; the site's own council page notes "camden.gov.uk returns 403 to direct requests"), `www.restorebritain.org.uk` (10), `www.leicestershire.gov.uk` (10), `www.wiltshire.gov.uk` (8), `democracy.leeds.gov.uk` (7), `commonslibrary.parliament.uk` (6), `www.electoralcommission.org.uk` (4), `www.reformparty.uk` (4), `github.com` (2), `members.parliament.uk` (2), `hansard.parliament.uk`, `ifs.org.uk` and others. `www.stirling.gov.uk` gave 403 to the audit UA and 200 to the browser UA, which supports the bot-block reading. **These need a re-check from an ordinary UK connection.**

Unreachable from this shell (time-out, connection reset, TLS or proxy error; 29 links): `democracy.brighton-hove.gov.uk` (6), `councillors.halton.gov.uk` (5), `democracy.newark-sherwooddc.gov.uk` (3), `democracy.eastherts.gov.uk` (2), `www3.halton.gov.uk` (2, TLS error), `democracy.leics.gov.uk` (2), and one each for `www.middevon.gov.uk`, `democracy.middevon.gov.uk`, `committeemeetings.flintshire.gov.uk`, `scripts.rbwm.gov.uk`, `www.ukip-ashford.co.uk` (plain http), `www.andrewfeinstein.org`, `www.socialism2024.org.uk`, `andrewteale.me.uk` (200 on retry). Unverified.

Two "404s" are false positives: the crawler picked up the bare `https://fonts.googleapis.com` and `https://fonts.gstatic.com` from `<link rel=preconnect>`.

**Judged: strong internally, adequate externally.** Zero internal errors across 400 pages is good. Thirteen confirmed dead citations out of roughly 950 verifiable ones (1.4 %) is respectable for a site quoting council PDFs, but each dead source link undermines the "every claim links to its source" promise, and two links are plain `http://`. The site already stores `web.archive.org` copies for many claims; the broken ones above do not appear to have one.

**Fix.** Run a weekly link check inside the existing GitHub Actions jobs (from a UK residential or the same IP range you fetch from, with a browser UA) that flags 404/5xx and records an archive.org snapshot at ingest time for every source; show the archived link automatically when the live one fails. Upgrade the two `http://` links.

---

## 5. SEO and sharing

**Observed.**

- **Indexing.** Every HTML page, including the home page, carries `<meta name="robots" content="noindex, nofollow">` (`noindex` only on the 404 and journey pages). There is no `X-Robots-Tag` header. Yet `robots.txt` says `Allow: /` and publishes `Sitemap: https://whatsittome.org/sitemap.xml`, and the sitemap lists 91 URLs. Lighthouse SEO fails only on "Page is blocked from indexing" for all eight pages. Search engines will therefore index nothing, and links from indexed sites pass nothing.
- **robots.txt.** `User-Agent: *`, `Allow: / /ballot/ /about /how-to-vote /data /api/data/ /ledger`, `Disallow: /review /candidates/submit /find /feedback`. (`/find` and `/feedback` are 404 anyway.)
- **Sitemap.** 91 `<loc>` entries, no `<lastmod>`, no `<changefreq>`: home, `/how-to-vote`, `/about`, `/data`, 29 `/council/*`, and 29 ballots × (`/ballot/[id]` + `/compare`). Missing page types: `/positions`, `/parties`, `/parties/[ec]` (13 party pages found), `/learn`, `/who-we-are`, `/ledger`, `/status`, `/share`, `/start`, `/profile`, `/place`, `/coverage/[id]`, all `/about/*` sub-pages, every `/candidate/[cid]` page (134 candidates), every `/topic/[topic]`, `/quick`, `/stakes`, `/area`, `/office`, `/notes`. The sitemap includes two past elections (Holborn 2024-07-04 general election; Tunbridge Wells 2026-09-23) and one dated 2026-05-07.
- **Titles.** Good, distinct titles on static pages ("Accuracy checks · What's It To Me?", "Camden: what's happening where you live · …", "Is this up to date? · …") and on the ballot page ("Holborn and St Pancras, Thursday, 8 October 2026 · What's It To Me?"). Generic title "What's It To Me?" (no page name) on: home, `/about`, and every ballot sub-page — `/candidate/1` (should carry the candidate's name), `/compare`, `/quick`, `/stakes`, `/topic/*`, `/area`, `/office`, `/notes`, `/embed`, `/coverage/*`, and the 404.
- **Descriptions.** One 142-character default ("See who is on your ballot and what each candidate winning would change for a household like yours. Impartial, sourced, never a recommendation.") is reused on the home page and 21 other page types (22 in all, including the 404); ballot pages share one 159-character description across the ballot, candidate, compare, topic, etc.; only `/council/*`, `/place`, `/status` and `/who-we-are` have their own.
- **Canonical, hreflang, structured data.** No `<link rel="canonical">` on any page. No `hreflang` (the site is English-only, so none needed). No JSON-LD or other structured data on any page (no `Organization`, `WebSite`, `Event`, `Person` or `BreadcrumbList`).
- **Open Graph / Twitter.** Present on every page: `og:title`, `og:description`, `og:url`, `og:site_name`, `og:image` (1200×630 PNG, `og:image:alt`, width/height, type), `og:type=website`, `twitter:card=summary_large_image` plus title/description/image/alt. `/opengraph-image` is a 1200×630 PNG, 109,864 bytes (`shots/og-home.png`); the ballot page's generated `…/opengraph-image?65d4aaed6d492fa8` is 1200×630, 100,930 bytes (`shots/og-ballot.png`). `og:title` on the ballot page is the better "Holborn and St Pancras by-election, 8 October 2026". The candidate page's `og:title`/`og:image` are the ballot's, not the candidate's.
- **RSS.** `/feed.xml` is well-formed RSS 2.0 (parsed cleanly with Python's ElementTree), `content-type: application/rss+xml`, cached one hour, 26 items (one per election, each with title, link, `guid`, `pubDate` — all items share the same `pubDate`, Fri 25 Sep 2026 12:13:10 GMT, i.e. the last refresh). Missing: `<language>`, `<lastBuildDate>`, `<atom:link rel="self">`, per-item `<description>`. Pages advertise it with `<link rel="alternate" type="application/rss+xml">`.
- **Icons.** `/icon.png` 512×512 (93 KB) and `/apple-icon.png` 180×180 (20 KB) are linked and return 200. `/favicon.ico` returns 404 (legacy clients and some feed readers request it). No web app manifest (`/manifest.webmanifest`, `/site.webmanifest`, `/manifest.json` all 404), so no "Add to home screen" name/colour.

**Judged: weak — by far the biggest technical gap on the site.** If the `noindex, nofollow` is deliberate (a soft launch before 8 October), fine, but then the sitemap and robots `Allow` are contradictory and should be dated to flip together; if it is accidental, the site is invisible for its first live test. Beyond that: no canonical, generic titles on the pages people would share (a candidate's page titled "What's It To Me?"), and no structured data for an entity-rich site (elections, candidates, parties, places).

**Fix.** (1) Decide the launch date and remove `noindex, nofollow` sitewide on that date (keep it on `/review`, `/profile`, `/notes`, `/journey/*`, `/candidates/submit`). (2) Add `<link rel="canonical">` via `metadata.alternates.canonical`. (3) Give every route a specific `<title>` and description: "Sagal Abdi-Wali (Labour) — Holborn and St Pancras by-election, 8 October 2026". (4) Extend the sitemap to candidate, topic, party, positions, learn, ledger, status and coverage pages, add `<lastmod>` from the refresh job, drop past elections or mark them as archive. (5) Add JSON-LD: `Organization` + `WebSite` on home, `Event` (with `location` and `startDate`) on ballots, `Person` + `affiliation` on candidates, `BreadcrumbList` on sub-pages. (6) Add `favicon.ico`, a manifest with `theme_color`, and `<language>`, `<lastBuildDate>` and per-item descriptions to the feed.

---

## 6. Security headers, cookies and third parties

**Observed (curl `-D -`, HTML page `/`, `…/embed`, `/api/place-layers`, `/feed.xml`, static CSS).**

| Header | Value |
|---|---|
| `strict-transport-security` | `max-age=31536000` (no `includeSubDomains`, no `preload`) |
| `x-content-type-options` | `nosniff` |
| `content-security-policy` | **absent** on every route |
| `x-frame-options` | **absent** on every route (including the main ballot page, not just `/embed`) |
| `referrer-policy` | **absent** |
| `permissions-policy` | **absent** |
| `cross-origin-opener-policy` / `cross-origin-resource-policy` | absent |
| `x-powered-by` | `Next.js` (version fingerprint) |
| `set-cookie` | none, on any page or API |
| `access-control-allow-origin` on `/api/data/*` | absent |

The `/embed` route therefore *works* in a foreign iframe (Playwright loaded it inside a `data:` page and read 682 characters of content), but so does every other page: the main Holborn ballot page has no `frame-ancestors` and no `X-Frame-Options`, so any site can frame it (a clickjacking vector for a site that asks people to type postcodes and household details). My attempt to render the full ballot page inside a foreign iframe was cut short by the proxy, so this rests on the headers rather than a screenshot.

Cookies: none set anywhere (verified via Playwright `context.cookies()` after loading every page type). Browser storage used: `localStorage` keys `lite`, `textsize`, `contrast`, `theme`, `viewmode`, `topicsFirst`; `sessionStorage` key `fk` on ballot pages. The postcode is *not* persisted; after a lookup the URL keeps only the outward code and rounded coordinates (`/ballot/…/area?pc=WC1H&loc=` / `/place?pc=SW1A&loc=51.501,-0.142`).

Third-party requests observed in the browser (hosts per page, `work/pw-results.json`): `fonts.googleapis.com` (1) and `fonts.gstatic.com` (2–8) on every page; `cdnjs.cloudflare.com` (Leaflet JS + CSS, injected at runtime with no `integrity` attribute — verified in `work/chunks/0ssrbbp043-5q.js`) and `tile.openstreetmap.org` (8–15 tiles) on home, ballot and area pages; candidate photos are proxied through `/_next/image` so `candidates.democracyclub.org.uk` is not contacted by the browser. There are no advertising or analytics trackers, no Google Analytics, no social widgets. One first-party-configured beacon exists: every page loads `/.netlify/scripts/rum` (`<script async id="netlify-rum-container" data-netlify-cwv-token="…">`), Netlify's Real User Metrics collector, which posts Core Web Vitals to `https://ingesteer.services-prod.nsvcs.net/rum_collection` (endpoint read from the script; I did not observe the beacon fire during the automated runs). The `/about/data-use` page was not checked for whether it discloses this.

**Judged: weak.** HSTS and nosniff are the only hardening present. For a site whose whole pitch is trust and privacy, the missing CSP, frame protection and referrer policy, plus fonts served by Google and a library pulled from a CDN without integrity hashes, are gaps that are cheap to close. No cookies and no trackers is genuinely good.

**Fix.** In `netlify.toml` (or `next.config` `headers()`): `Content-Security-Policy: default-src 'self'; img-src 'self' data: https://tile.openstreetmap.org; script-src 'self' 'nonce-…'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' https://ingesteer.services-prod.nsvcs.net; frame-ancestors 'none'` for all routes except `/ballot/*/embed`, which gets `frame-ancestors *` (and keep `X-Frame-Options: DENY` elsewhere for old browsers). Add `Referrer-Policy: strict-origin-when-cross-origin` (so councils and party sites you link to do not see the visitor's full URL), `Permissions-Policy: geolocation=(), camera=(), microphone=()`, `Cross-Origin-Opener-Policy: same-origin`, HSTS `includeSubDomains; preload`, and `poweredByHeader: false`. Self-host fonts and Leaflet (npm package) so the CSP can be strict and no visitor IP goes to Google or Cloudflare. Add `Access-Control-Allow-Origin: *` to `/api/data/*` so the open data can actually be used from other sites' browsers. Rate-limit `/review` and consider moving it off the public origin.

---

## 7. Robustness

**Observed (form submissions through the real UI, `work/interact-results.json`, `shots/submit-*.png`).**

| Input | What happened |
|---|---|
| `WC1H 9JE` (Holborn) | 2.5 s → `…/ballot/parl.holborn-and-st-pancras.by.2026-10-08/area?pc=WC1H&loc=` ("This is where politics meets your life.") |
| empty | Browser-native "Please fill out this field." (`required`); no request sent |
| `ZZZ 999` | 1.7 s → `/?error=That doesn't look like a UK postcode.` shown as `role="alert"`; friendly |
| `P.O. Box 30001-00100` (Kenyan style) | same as above |
| 300 × `A` | same as above, 1.6 s |
| `SW1A 1AA` (no election) | 2.1 s → `/place?pc=SW1A&loc=51.501,-0.142`, "No election here right now — but plenty is happening", lists who represents you now |
| `BT1 1AA` and `BT1 5GS` (Northern Ireland) | → `/place?pc=BT1&loc=54.60,-5.92`, same "no election" page |
| `CF10 1AA` and `CF10 3NQ` (Wales) | → `/place?pc=CF10…`, same page |
| `EH1 1AA` (Scotland, but not a real postcode) | → `/?error=We couldn't look up that postcode just now. Please try again in a minute.` |
| `EH1 3EG` (Scotland, real) | → `/place?pc=EH1…`, no-election page |
| `G63 0QP` (Stirling, has a by-election) | → `/ballot/local.stirling.forth-and-endrick.by.2026-10-01/area?pc=G63…` |

So a well-formed but non-existent postcode ("EH1 1AA") produces a "try again in a minute" message that blames a temporary fault when the real cause is that the postcode does not exist; the message invites a pointless retry. Everything else degrades gracefully. Note that the "no election" copy ("Most of the UK has none until May 2027") is shown for Northern Ireland postcodes too; whether that is accurate for NI is a content question outside this audit.

**Observed (direct URLs, curl).** `/ballot/does-not-exist` → `404`; `…/candidate/99` and `…/candidate/abc` → `404`; `…/topic/nonsense` → `404`; `/council/nowhere`, `/parties/XYZ`, `/coverage/nonsense` → `404`; all render the friendly "Nothing here — That page doesn't exist, or the election it referred to isn't loaded. Go to the elections we cover" page with the full site chrome (`shots/404-ballot.png`). `/api/data/nonsense` and `/api/boundary?ballot=nonsense` → `404` with body `{"error":"unknown ballot"}`; `/api/boundary` with no parameter → `404` same body; `/api/place-layers?postcode='%3Bdrop` → `200 {"layers":[],"published":{}}`; `/api/place-layers` with a valid postcode also returns empty layers (the endpoint appears to be a stub). `/api/nonsense`, `/.env` → the HTML 404. `/_next/static/nonexistent.js` → `404` text/plain. A 5,000-character query string on `/` and on `/place?postcode=…` → `200`, the input is not echoed. `/candidates/submit?x=<script>alert(1)</script>` → `200`, not echoed. No stack traces, file paths, database errors, or environment details appeared in any response body or header. `/api/data/<ballot>` (338,711 bytes for Holborn) contains `licence`, `attribution`, `generated_at`, `ballot`, 15 `candidates`, 267 `claims`; no e-mail addresses, keys or tokens.

One robustness gap: the 404 for an unknown ballot is rendered client-side. With JavaScript disabled the response body is empty (0 characters, `shots/nojs-notfound.png`), while every normal page renders fully without JavaScript (home 8,088 characters of text, ballot 16,193, compare 73,711, council 7,497; `shots/nojs-*.png`).

**Judged: strong.** Error handling is friendly, consistent and leak-free. The one wrong message is the "try again in a minute" for a non-existent postcode.

**Fix.** Distinguish the postcode API's "not found" from a network/5xx failure and say "We can't find that postcode. Check it and try again." Serve the 404 shell server-side so it is not blank without JavaScript. If `/api/place-layers` is not yet live, return `501` or remove it from the data page until it is.

---

## 8. Caching and freshness

**Observed.** HTML: `private,no-cache,no-store,max-age=0,must-revalidate` on every page (never cached by Netlify or the browser; also disables the browser back/forward cache — Lighthouse "bf-cache: 2 failure reasons" on every page). `/api/data/*` and `/api/boundary`: `public,max-age=3600`, served from Netlify Durable cache (`hit; ttl=3503`). `/api/place-layers`: `public,max-age=604800`. `/feed.xml`: `public,max-age=3600`. `/_next/static/*`: `public,max-age=31536000,immutable`. Brand PNGs and icons: `public,max-age=0,must-revalidate` (ETag revalidation each visit). `/opengraph-image`: `max-age=0,must-revalidate` at the browser but cached on Netlify for a year. Next.js router prefetches (`?_rsc=`) for the nav and footer links fire on every page load and are also uncacheable (8 to 14 such requests were in flight per page load in the browser runs; 415 were aborted by navigation across the runs, which is harmless but wasteful), so each page view can cost the origin several renders.

Freshness is visibly dated. The footer of every page says "Election data last refreshed N hours ago. Is this up to date?" linking to `/status`, which lists "Every automatic job" with "Last run", "Result" and a timestamp for each ("Daily 05:17 UTC · 26 ballots, 109 candidacies; 0 withdrawn … 5 hours ago OK"; "GIAS extract 2026-09-25"; "Citizen Space: camden (2)…"; "Modern.gov Mondays · 13 councils read, 656 rows; not read: lambeth, brighton-and-hove, camden…"), and "last refreshed … 25 September 2026 at 12:13 UTC". Council pages label automatic sections "Updated automatically" and "refreshed daily", and each quotation shows a "Read 24 September 2026" date. `/api/data/*` carries `generated_at` and `retrieved_at`. The RSS `pubDate` matches the refresh time. Nothing on the pages uses a `<time datetime>` element, so the dates are text only.

**Judged: strong on freshness, weak on caching.** The status page is exemplary. The caching policy, though, sends every visitor to the origin for every page and prefetch, which is the root of the TTFB numbers in §1.

**Fix.** As §1.1: a short public `s-maxage` with `stale-while-revalidate`, purged by the refresh jobs (Netlify supports `Netlify-Cache-Tag` + purge API). Set `prefetch={false}` on footer/nav `<Link>`s or cache the RSC responses. Long-cache the brand assets with hashed names. Wrap the dates in `<time datetime="2026-09-25T12:13:00Z">` so machines (and the RSS `lastBuildDate`) can read them.

---

## 9. Other observations

- **Console and failed requests.** In clean runs there were no JavaScript errors and no failed first-party requests on any page. (All console errors recorded were the proxy's `502`/`text/plain` interruptions.) Map tile requests occasionally aborted on navigation.
- **JS bundle.** Nine chunks, 608 KB raw, about 140–186 KiB over the wire; total main-thread time 1.5–6.0 s on simulated mobile, worst on the ballot (6.0 s) and ledger (3.6 s, TBT 530 ms, "Max Potential FID" 420 ms). Lighthouse asks for source maps ("Missing source maps for large first-party JavaScript").
- **Fonts.** FOUT, not FOIT (`display=swap`); the fallback stack is Georgia/Times, close enough in metrics that CLS stays under 0.06 everywhere except `/council/camden` (0.165, "2 layout shifts found"), which needs checking against the consultation list loading in.
- **Dark mode.** Present (`prefers-color-scheme` CSS, manual override in the Display menu); body becomes `rgb(0,0,0)` / `rgb(255,255,255)`; the dark lockup and mark swap in (`shots/home-dark.png`, `shots/ballot-dark.png`). No `<meta name="color-scheme">` and no manifest `theme_color`, so the browser chrome does not follow.
- **Print.** A print stylesheet exists: header, footer and nav are hidden, background is forced white, link URLs are printed after link text. But the ballot page printed as 10 A4 pages with only 1 of 120 `<details>` open (`shots/ballot-print.pdf`), so the candidate positions do not print unless each is opened first.
- **Reduced motion** is honoured (0 running animations); the marquee is the only autoplaying motion.
- **No-JavaScript** rendering is complete for every content page (server-rendered), which also means the site is readable by text browsers and by search engines once indexing is allowed.
- **Leaked working notes in public copy.** `/council/camden` contains "Read via WebFetch; could not be re-verified by direct download", "Read via WebFetch." and "Read via WebFetch; camden.gov.uk returns 403 to direct requests" inside the sourced housing and council-tax sections, and `/ledger` shows the actor of 35 entries as "maintainer (Barny's build session)". These are internal tooling notes that have reached the published page.
- **`/review` maintainer console** is on the public origin with a single passcode field and no visible rate limiting (not tested, to avoid abuse).
- **`x-powered-by: Next.js`** is sent on every response.
- **Candidate photos** are served through `/_next/image` at 240×240 and displayed at 110×110 (fine).
- **Home page timeline initials** (`.tl-initials`, 100 instances) render at 10.4 px; decorative, but the smallest text on the site.

---

## Ranked list: the 15 most important technical weaknesses

1. **Every page is `noindex, nofollow`** — including the home page — while `robots.txt` allows all and a sitemap is published. Either the site is unintentionally invisible to search for its first live election, or the launch switch is missing. (§5)
2. **No HTML caching anywhere** (`no-store` on every page and every RSC prefetch): every view of the 1.2 MB ballot page is an origin render; TTFB 1.3–2.0 s on the ballot, back/forward cache disabled sitewide. (§1.1, §8)
3. **No Content-Security-Policy, no frame protection, no Referrer-Policy, no Permissions-Policy** on any route; the main ballot page can be framed by any site. (§6)
4. **Fonts from Google and Leaflet from cdnjs without integrity hashes** — a third-party CSS request on the critical path (about 0.8 s on mobile) and every visitor's IP sent to Google, on a privacy-led site. (§1.3, §6)
5. **Brand PNGs**: both light and dark lockups (244 + 240 KiB) and marks (47 + 49 KiB) preloaded on every page; the home page LCP (4.7 s mobile) is a 633×514 PNG shown at 330×268. (§1.2)
6. **Generic `<title>` "What's It To Me?"** on the home page and every ballot sub-page, including each candidate's page; one meta description shared by 22 page types; no canonical URL anywhere. (§5)
7. **Sitemap covers 91 URLs and omits** all 134 candidate pages, all topic pages, `/positions`, `/parties`, `/ledger`, `/status`, `/learn`, `/who-we-are`, `/coverage`, `/about/*`; no `<lastmod>`. (§5)
8. **Ledger tables on phones** are cut off and scroll sideways with no keyboard access (axe serious, `scrollable-region-focusable`) — on the page that carries the site's accountability promise. (§2.1, §3)
9. **Candidate `<summary>` aria-labels do not begin with the visible name** (Lighthouse `label-content-name-mismatch`, 15 instances on the ballot page), which breaks voice control. (§2.1)
10. **Thirteen confirmed dead source links** (404/500/503/522) on council and ballot pages, two of them plain `http://`, with no automatic fallback to the archived copy; plus 184 links on 29 hosts that could not be verified because of bot protection. (§4.2)
11. **Internal working notes published**: "Read via WebFetch; camden.gov.uk returns 403 to direct requests" on `/council/camden`; "maintainer (Barny's build session)" as the actor in the public ledger. (§9)
12. **Floating "?" help button overlaps content** at 375 px (home CTA link, candidate "Add your profile" link, ledger cells). (§3)
13. **Compare page on phones** runs summary and quotation together with no space ("2031.Asking everyone…") and grows to about 57,000 px with no sub-headings; `/positions` likewise has only an `<h1>`. (§2.2, §3)
14. **Wrong error for a non-existent but well-formed postcode** ("We couldn't look up that postcode just now. Please try again in a minute") and a client-only 404 for unknown ballots that is blank without JavaScript. (§7)
15. **No structured data, no `favicon.ico`, no web manifest, thin RSS** (no `language`, `lastBuildDate`, self link or item descriptions) and a home-page marquee with no pause control. (§2.2, §5)

## What the site does well technically

- **Zero internal broken links** across 400 crawled pages, and friendly, consistent 404 pages with no error leakage from any route or API.
- **Accessibility fundamentals are right**: skip link, single `<main>`, `lang="en-GB"`, one `<h1>` per page, labelled controls everywhere, visible 3 px focus rings, no images without `alt`, passing colour contrast, reduced-motion support, a built-in Display menu for text size, contrast and theme, and 100/100 Lighthouse accessibility on all eight pages tested.
- **No cookies, no trackers, no analytics beyond Netlify's Core Web Vitals beacon**; the postcode is never stored and the URL keeps only the outward code.
- **Fully server-rendered**: every content page is complete with JavaScript off, HTML is brotli-compressed over HTTP/2, static chunks are immutable-cached, images go through `next/image`.
- **No horizontal scroll at 375 px, 320 px or 200 % zoom on any page**; CLS is under 0.06 on all but one page.
- **Freshness is visible and honest**: the footer's "last refreshed N hours ago", the `/status` page listing every job with its last run and result, per-quotation "Read <date>" stamps, `generated_at` in the API, and a valid RSS feed.
- **Open Graph and Twitter cards are complete** on every page, with generated 1200×630 images per election.
- **Open data API** returns clean, licensed, attributed JSON with sensible one-hour caching.
