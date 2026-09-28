#!/usr/bin/env python3
"""Council budgets by service, and council tax for Wales and Scotland, from each government's own official statistics.

Writes lib/council_finance.json, keyed by ONS (GSS) code. The site reads that file directly, so no database table or
migration is needed; the "Data files" workflow reruns this weekly and opens a pull request when a figure changes.

Sources (all Open Government Licence v3.0):
  England   MHCLG, "Local authority revenue expenditure and financing England: 2026 to 2027 budget individual local
            authority data", Revenue Account Budget (RA) part 1: net current expenditure by service, £ thousand.
  Wales     Welsh Government (StatsWales), "Budgeted revenue expenditure by authority and service", £ thousand;
            "Composition of average band D council tax by billing authority"; "Council tax levels by billing authority
            and band".
  Scotland  Scottish Government, "Local Government 2025-26 Provisional Outturn and 2026-27 Budget Estimates", revenue
            workbook: net revenue expenditure by service, £ thousand; "Council Tax by band 2026-27" (Council Tax
            Assumptions return).

Every council in a nation gets the same list of services, in the publisher's own order and own headings, including
services it does not run (shown as none budgeted). Nothing is ranked, compared or turned into a per-head figure.
Northern Ireland's district councils publish no comparable budget-by-service statistic and pay no council tax
(households pay domestic rates), so they are not included.

Usage: python scripts/loaders/council_finance.py            (writes lib/council_finance.json)
       python scripts/loaders/council_finance.py --check    (fails if any total doesn't add up; no write)
"""
from __future__ import annotations

import io
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "lib" / "council_finance.json"
UA = {"User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)"}
YEAR = "2026-27"


def get(url: str) -> bytes:
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
        return r.read()


# ---------------------------------------------------------------- England
RA_PAGE = "https://www.gov.uk/government/statistics/local-authority-revenue-expenditure-and-financing-england-2026-to-2027-budget-individual-local-authority-data"
# Asset id -> heading, in the RA form's own order (lines 190 to 698); the words are the form's own, in sentence case.
RA_LINES = [
    ("edutot", "Education services"),
    ("transtot", "Highways and transport services"),
    ("csctot", "Children's social care"),
    ("asctot", "Adult social care"),
    ("phtot", "Public health"),
    ("housgfcftot", "Housing services (general fund only)"),
    ("cultot", "Cultural and related services"),
    ("envtot", "Environmental and regulatory services"),
    ("plantot", "Planning and development services"),
    ("poltot", "Police services"),
    ("frstot", "Fire and rescue services"),
    ("centot", "Central services"),
    ("othtot", "Other services"),
]
RA_TOTAL = ("servicetot", "Total service expenditure")


def england() -> tuple[dict, dict]:
    meta = json.loads(get("https://www.gov.uk/api/content" + RA_PAGE.removeprefix("https://www.gov.uk")))
    att = next(a for a in meta["details"]["attachments"] if re.search(r"RA\)? data 2026-27 \(part 1\)", a.get("title", ""), re.I))
    raw = get(att["url"])
    df = pd.read_excel(io.BytesIO(raw), sheet_name=f"RA_LA_Data_{YEAR}", header=None, engine="odf")
    ids = [str(x).strip() for x in df.iloc[6].tolist()]
    updated = next((str(x) for x in df.iloc[:6, 0] if str(x).startswith("Last updated")), "")
    col = {a: ids.index(a) for a, _ in RA_LINES + [RA_TOTAL]}
    out: dict = {}
    for _, row in df.iloc[10:].iterrows():
        gss = str(row.iloc[1]).strip()
        cls = str(row.iloc[3]).strip()
        # Councils only: shire districts, shire counties, unitaries, metropolitan districts, London boroughs (and the
        # City of London and Isles of Scilly, which are classed as UA/LB). Police, fire, national parks, the GLA and
        # combined authorities ('O', 'GLA', 'CA') are left out.
        if not re.fullmatch(r"E0[6-9]\d{6}|E10\d{6}", gss) or cls not in {"SD", "SC", "UA", "MD", "LB"}:
            continue
        cells = [str(row.iloc[col[a]]).strip() for a, _ in RA_LINES + [RA_TOTAL]]
        if any(x == "[x]" for x in cells):
            # "[x]": no figures in the table (the council's return wasn't included). Kept so the page can say so.
            out[gss] = {"nation": "England", "source_name": str(row.iloc[2]).strip(), "spend": None}
            continue
        lines = [[label, int(round(float(row.iloc[col[a]])))] for a, label in RA_LINES]
        total = int(round(float(row.iloc[col[RA_TOTAL[0]]])))
        out[gss] = {"nation": "England", "source_name": str(row.iloc[2]).strip(), "spend": {"source": "england", "lines": lines, "total": [RA_TOTAL[1], total]}}
    src = {
        "publisher": "Ministry of Housing, Communities and Local Government",
        "title": "Revenue Account Budget 2026 to 2027, individual local authority data (part 1)",
        "page": RA_PAGE, "file": att["url"], "updated": updated.replace("Last updated:", "").strip(),
        "measure": "Net current expenditure budgeted for 2026 to 2027, by service",
    }
    return out, src


# ---------------------------------------------------------------- Wales
WALES_GSS = {
    "Isle of Anglesey": "W06000001", "Gwynedd": "W06000002", "Conwy": "W06000003", "Denbighshire": "W06000004",
    "Flintshire": "W06000005", "Wrexham": "W06000006", "Ceredigion": "W06000008", "Pembrokeshire": "W06000009",
    "Carmarthenshire": "W06000010", "Swansea": "W06000011", "Neath Port Talbot": "W06000012", "Bridgend": "W06000013",
    "Vale of Glamorgan": "W06000014", "Cardiff": "W06000015", "Rhondda Cynon Taf": "W06000016", "Caerphilly": "W06000018",
    "Blaenau Gwent": "W06000019", "Torfaen": "W06000020", "Monmouthshire": "W06000021", "Newport": "W06000022",
    "Powys": "W06000023", "Merthyr Tydfil": "W06000024",
}
SW = "https://api.stats.gov.wales/v1/{id}/download/csv"
SW_PAGE = "https://stats.gov.wales/en-GB/{id}"
SW_BUDGET = "88384d5e-1a50-4496-849c-7195ddd4185f"
SW_BAND_D = "3ca971eb-7d9b-4b79-89fa-6d7f77431aad"
SW_BANDS = "1988b6af-2a9c-43b6-8939-83e6cceb3903"
# The top-level headings of the Welsh budget return, in its order; together they add up to "Revenue expenditure".
WALES_LINES = [
    "Education", "Social Services", "Council fund housing", "Local environmental services", "Roads and transport",
    "Libraries, culture, heritage, sport and recreation", "Planning, economic and community development",
    "Local tax collection", "Debt financing costs", "Law, order and protective services", "Central administration",
    "Other revenue expenditure",
]
WALES_TOTAL = "Revenue expenditure"


def wales() -> tuple[dict, dict, dict, dict]:
    bud = pd.read_csv(io.BytesIO(get(SW.format(id=SW_BUDGET))))
    bud = bud[(bud["Year"] == YEAR) & (bud["Data description"] == "£ thousand")]
    comp = pd.read_csv(io.BytesIO(get(SW.format(id=SW_BAND_D))))
    comp = comp[(comp["Year"] == YEAR) & (comp["Data description"] == "£ per band D")]
    bands = pd.read_csv(io.BytesIO(get(SW.format(id=SW_BANDS))))
    bands = bands[bands["Year"] == YEAR]
    out: dict = {}
    for name, gss in WALES_GSS.items():
        b = bud[bud["Authority"] == name].set_index("Service")["Data values"]
        c = comp[comp["Authority"] == name].set_index("Row")["Data values"]
        k = bands[bands["Authority"] == name].set_index("Band")["Data values"]
        if b.empty or c.empty or k.empty:
            raise SystemExit(f"Wales: no {YEAR} figures for {name}")
        lines = [[s[0] + s[1:].lower(), int(round(float(b[s])))] for s in WALES_LINES]
        out[gss] = {
            "nation": "Wales", "source_name": name,
            "spend": {"source": "wales", "lines": lines, "total": [WALES_TOTAL, int(round(float(b[WALES_TOTAL])))]},
            "band_d": {
                "source": "wales",
                "council": round(float(c["County council CT (exc. community councils)"]), 2),
                "community": round(float(c["Community council CT"]), 2),
                "police": round(float(c["Police council tax within county area"]), 2),
                "total": round(float(c["Total CT for billing authority area"]), 2),
            },
            "bands": [[band, round(float(k[band]), 2)] for band in ["A-", "A", "B", "C", "D", "E", "F", "G", "H", "I"]],
        }
    budget_src = {"publisher": "Welsh Government", "title": "Budgeted revenue expenditure by authority and service", "page": SW_PAGE.format(id=SW_BUDGET), "file": SW.format(id=SW_BUDGET), "measure": "Revenue expenditure budgeted for 2026-27, by service"}
    band_d_src = {"publisher": "Welsh Government", "title": "Composition of average band D council tax by billing authority", "page": SW_PAGE.format(id=SW_BAND_D), "file": SW.format(id=SW_BAND_D)}
    bands_src = {"publisher": "Welsh Government", "title": "Council tax levels by billing authority and band", "page": SW_PAGE.format(id=SW_BANDS), "file": SW.format(id=SW_BANDS)}
    return out, budget_src, band_d_src, bands_src


# ---------------------------------------------------------------- Scotland
SCOT_GSS = {
    "Aberdeen City": "S12000033", "Aberdeenshire": "S12000034", "Angus": "S12000041", "Argyll & Bute": "S12000035",
    "City of Edinburgh": "S12000036", "Clackmannanshire": "S12000005", "Dumfries & Galloway": "S12000006",
    "Dundee City": "S12000042", "East Ayrshire": "S12000008", "East Dunbartonshire": "S12000045",
    "East Lothian": "S12000010", "East Renfrewshire": "S12000011", "Falkirk": "S12000014", "Fife": "S12000047",
    "Glasgow City": "S12000049", "Highland": "S12000017", "Inverclyde": "S12000018", "Midlothian": "S12000019",
    "Moray": "S12000020", "Na h-Eileanan Siar": "S12000013", "North Ayrshire": "S12000021",
    "North Lanarkshire": "S12000050", "Orkney Islands": "S12000023", "Perth & Kinross": "S12000048",
    "Renfrewshire": "S12000038", "Scottish Borders": "S12000026", "Shetland Islands": "S12000027",
    "South Ayrshire": "S12000028", "South Lanarkshire": "S12000029", "Stirling": "S12000030",
    "West Dunbartonshire": "S12000039", "West Lothian": "S12000040",
}
POBE_PAGE = "https://www.gov.scot/publications/local-government-2025-26-provisional-outturn-and-2026-27-budget-estimates/documents/"
CTAX_PAGE = "https://www.gov.scot/publications/council-tax-datasets/"
SCOT_LINES = [
    "Education", "Culture and Related Services", "Social Work", "Roads & Transport", "Road Bridges",
    "Environmental Services", "Building, Planning & Development", "Central Services", "Non-HRA Housing",
    "Trading Services",
]
SCOT_TOTAL = "Total Net Revenue Expenditure"
# The workbook's headings in sentence case; "Non-HRA" is the housing revenue account, so kept as an abbreviation.
SCOT_LABEL = {"Roads & Transport": "Roads and transport", "Building, Planning & Development": "Building, planning and development", "Non-HRA Housing": "Housing (outside the housing revenue account)"}


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", str(s)).strip()


def link_on(page: str, pattern: str) -> str:
    html = get(page).decode("utf-8", "replace")
    hrefs = [h.replace("&amp;", "&") for h in re.findall(r'href="(/binaries/[^"]+)"', html)]
    hit = next((h for h in hrefs if re.search(pattern, h, re.I)), None)
    if not hit:
        raise SystemExit(f"No link matching {pattern} on {page}")
    return "https://www.gov.scot" + hit


def scotland() -> tuple[dict, dict, dict]:
    pobe_url = link_on(POBE_PAGE, r"Revenue.*Work")
    ctax_url = link_on(CTAX_PAGE, r"Council%2BTax%2Bby%2BBand%2B-%2B2026-27")
    pobe = pd.read_excel(io.BytesIO(get(pobe_url)), sheet_name=None, header=None)
    ct = pd.read_excel(io.BytesIO(get(ctax_url)), header=None)
    if norm(ct.iloc[0, 0]) != f"COUNCIL TAX BY BAND {YEAR}":
        raise SystemExit(f"Scotland council tax: unexpected title {ct.iloc[0, 0]!r}")
    bands_row = [norm(x) for x in ct.iloc[4].tolist()]
    band_cols = {b.replace("Band ", ""): i for i, b in enumerate(bands_row) if b.startswith("Band ")}
    ct_rows = {norm(r.iloc[0]): r for _, r in ct.iloc[7:].iterrows() if isinstance(r.iloc[0], str)}
    out: dict = {}
    for name, gss in SCOT_GSS.items():
        sheet = pobe.get(name)
        if sheet is None:
            raise SystemExit(f"Scotland: no sheet for {name}")
        hdr = next(i for i in range(len(sheet)) if any(f"{YEAR}\nBudget Estimate" == str(x).strip() for x in sheet.iloc[i]))
        ycol = next(j for j, x in enumerate(sheet.iloc[hdr]) if str(x).strip() == f"{YEAR}\nBudget Estimate")
        # Part 1 only: the first occurrence of each heading, before "Part 2: Service Breakdown".
        part1 = sheet.iloc[hdr: next(i for i in range(len(sheet)) if norm(sheet.iloc[i, 1]).startswith("Part 2"))]
        val = {norm(r.iloc[1]): r.iloc[ycol] for _, r in part1.iterrows()}
        lines = [[SCOT_LABEL.get(s, s[0] + s[1:].lower()), int(round(float(val[s])))] for s in SCOT_LINES]
        r = ct_rows.get(name)
        if r is None:
            raise SystemExit(f"Scotland council tax: no row for {name}")
        out[gss] = {
            "nation": "Scotland", "source_name": name,
            "spend": {"source": "scotland", "lines": lines, "total": ["Total net revenue expenditure", int(round(float(val[SCOT_TOTAL])))]},
            "band_d": {"source": "scotland", "council": round(float(r.iloc[band_cols["D"]]), 2), "total": round(float(r.iloc[band_cols["D"]]), 2)},
            "bands": [[b, round(float(r.iloc[i]), 2)] for b, i in band_cols.items()],
        }
    budget_src = {"publisher": "Scottish Government", "title": "Local Government 2025-26 Provisional Outturn and 2026-27 Budget Estimates: revenue workbook", "page": POBE_PAGE, "file": pobe_url, "measure": "Net revenue expenditure budgeted for 2026-27, by service"}
    ctax_src = {"publisher": "Scottish Government", "title": "Council Tax by band 2026-27", "page": CTAX_PAGE, "file": ctax_url, "note": "Excludes water and sewerage charges"}
    return out, budget_src, ctax_src


def check(councils: dict) -> list[str]:
    """Each nation's service headings must add up to its published total (to within rounding)."""
    bad = []
    for gss, c in councils.items():
        if not c["spend"]:
            continue
        s = sum(v for _, v in c["spend"]["lines"])
        if abs(s - c["spend"]["total"][1]) > len(c["spend"]["lines"]):
            bad.append(f"{gss} {c['source_name']}: lines {s} vs total {c['spend']['total'][1]}")
    return bad


def main() -> None:
    eng, eng_src = england()
    wal, wal_bud, wal_d, wal_bands = wales()
    sco, sco_bud, sco_ct = scotland()
    councils = {**eng, **wal, **sco}
    bad = check(councils)
    if bad:
        raise SystemExit("Totals don't add up:\n" + "\n".join(bad))
    print(f"England {len(eng)}, Wales {len(wal)}, Scotland {len(sco)}; all totals add up")
    if "--check" in sys.argv:
        return
    doc = {
        "year": YEAR,
        "retrieved_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "licence": "Open Government Licence v3.0",
        "sources": {"england": eng_src, "wales": wal_bud, "wales_band_d": wal_d, "wales_bands": wal_bands, "scotland": sco_bud, "scotland_ctax": sco_ct},
        "councils": dict(sorted(councils.items())),
    }
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n")
    print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
