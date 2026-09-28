# Persona test harness

30 fictional people run through whatsittome.org's "Start with you" journey in a headless browser.

Setup (once): `pip install playwright && playwright install chromium && npm install` (installs axe-core).
Run all: `python3 run.py` → results.json and screenshots in shots/. Run some: `python3 run.py 4 8 28`.
Edit people in personas.py; `expect` is the ballot id each postcode should reach (None = no election there).
The workbook is built by build_xlsx.py from merged results, findings.json (from findings.py), ballot_stats.json and dc_counts.json.
Note: every run adds to the site's anonymous daily page counts, so keep runs occasional.
Fix checks: `python3 verify_fixes.py https://whatsittome.org` (or a local build URL) runs 20 checks on the six fixes of 28 Sept.
