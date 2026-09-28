"""Load the official deprivation index of Wales, Scotland and Northern Ireland into deprivation_areas, each from its own
publisher (docs/automation/open-data-mysociety.md, section 3). England stays in deprivation_2025 (MHCLG, 2025).

  Wales:            Welsh Index of Multiple Deprivation 2025, Welsh Government, published 27 November 2025 (OGL v3).
                    1,917 LSOAs (2021 boundaries). Overall rank and decile as published; eight domain ranks.
  Scotland:         Scottish Index of Multiple Deprivation 2020v2, Scottish Government, 28 January 2020 (OGL v3).
                    6,976 data zones (2011 boundaries). Overall rank and seven domain ranks. SIMD 2026 is expected
                    towards the end of 2026; release_watch.py watches for it.
  Northern Ireland: Northern Ireland Multiple Deprivation Measure 2017, NISRA, 23 November 2017 (OGL v3), via OpenDataNI.
                    890 Super Output Areas (2001 boundaries). Overall rank and seven domain ranks.

Deciles the publisher does not give are computed from the rank as each index defines them: ten equal groups of areas,
decile 1 the most deprived. Nothing else is derived. Every row records its index, edition, publisher and source file.

Usage: python scripts/loaders/deprivation_nations.py [wales|scotland|ni|all] [--sample]   (dry run without the service key)
"""
import csv, html, io, math, os, re, sys, zipfile
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "auto"))
from common import fetch, now_iso, write

SOURCES = {
    "wales": {"nation": "Wales", "index": "Welsh Index of Multiple Deprivation", "edition": "2025", "publisher": "Welsh Government",
              "url": "https://www.gov.wales/sites/default/files/statistics-and-research/2025-11/wimd-2025-index-and-domain-ranks-by-small-area.ods"},
    "scotland": {"nation": "Scotland", "index": "Scottish Index of Multiple Deprivation", "edition": "2020v2", "publisher": "Scottish Government",
                 "url": "https://www.gov.scot/binaries/content/documents/govscot/publications/statistics/2020/01/scottish-index-of-multiple-deprivation-2020-ranks-and-domain-ranks/documents/scottish-index-of-multiple-deprivation-2020-ranks-and-domain-ranks/scottish-index-of-multiple-deprivation-2020-ranks-and-domain-ranks/govscot%3Adocument/SIMD%2B2020v2%2B-%2Branks.xlsx"},
    "ni": {"nation": "Northern Ireland", "index": "Northern Ireland Multiple Deprivation Measure", "edition": "2017", "publisher": "Northern Ireland Statistics and Research Agency",
           "url": "https://admin.opendatani.gov.uk/dataset/e202fde9-7f0b-4d88-8711-e18a8817cff8/resource/60f31f62-53e7-424c-8fb5-d3b1c66ea277/download/nimdm2017-soa.csv"},
}


# ---------- minimal spreadsheet readers (no third-party packages: zip + XML) ----------
def read_xlsx(body: bytes, sheet_index: int) -> list[list[str]]:
    z = zipfile.ZipFile(io.BytesIO(body))
    strings = [html.unescape(re.sub(r"<[^>]+>", "", s)) for s in re.findall(r"<si>(.*?)</si>", z.read("xl/sharedStrings.xml").decode("utf-8"), re.S)]
    sheet = z.read(f"xl/worksheets/sheet{sheet_index}.xml").decode("utf-8")
    out = []
    for row in re.findall(r"<row [^>]*>(.*?)</row>", sheet, re.S):
        cells = {}
        for col, t, v in re.findall(r'<c r="([A-Z]+)\d+"(?: [^>]*?t="(\w+)")?[^>]*>(?:<v>(.*?)</v>)?', row):
            cells[col] = strings[int(v)] if t == "s" and v else (v or "")
        width = max((sum((ord(ch) - 64) * 26 ** i for i, ch in enumerate(reversed(c))) for c in cells), default=0)
        out.append([cells.get(_col(i), "") for i in range(1, width + 1)])
    return out


def _col(i: int) -> str:
    s = ""
    while i: i, r = divmod(i - 1, 26); s = chr(65 + r) + s
    return s


def read_ods(body: bytes, sheet_name: str) -> list[list[str]]:
    x = zipfile.ZipFile(io.BytesIO(body)).read("content.xml").decode("utf-8")
    m = re.search(rf'<table:table table:name="{re.escape(sheet_name)}"(.*?)</table:table>', x, re.S)
    if not m: raise RuntimeError(f"sheet {sheet_name} not found")
    out = []
    for row in re.findall(r"<table:table-row[^>]*>(.*?)</table:table-row>", m.group(1), re.S):
        vals = []
        for a, inner, b in re.findall(r"<table:table-cell([^>]*)>(.*?)</table:table-cell>|<table:table-cell([^>]*)/>", row, re.S):
            rep = re.search(r'number-columns-repeated="(\d+)"', a or b); n = int(rep.group(1)) if rep else 1
            vals += [html.unescape(re.sub(r"<[^>]+>", "", inner)) if inner else ""] * min(n, 50)
        out.append(vals)
    return out


def decile(rank: int, total: int) -> int:
    return min(10, max(1, math.ceil(rank * 10 / total)))


def num(x) -> int | None:
    try: return int(float(x))
    except (TypeError, ValueError): return None


# ---------- one parser per index ----------
def parse_wales(body: bytes, src: dict) -> list[dict]:
    ranks = read_ods(body, "WIMD_2025_ranks"); dec = read_ods(body, "Deciles_quintiles_quartiles")
    hi = next(i for i, r in enumerate(ranks) if r and r[0] == "LSOA code"); hdr = ranks[hi]
    di = next(i for i, r in enumerate(dec) if r and r[0] == "LSOA code")
    deciles = {r[0]: num(r[4]) for r in dec[di + 1:] if r and r[0].startswith("W01")}
    rows = [r for r in ranks[hi + 1:] if r and r[0].startswith("W01")]
    total = len(rows); overall = hdr.index("WIMD 2025")
    domains = [(h, i) for i, h in enumerate(hdr) if i > overall and h]
    return [{"area_code": r[0], "nation": src["nation"], "index_name": src["index"], "edition": src["edition"], "publisher": src["publisher"], "area_name": r[1], "council": r[2],
             "overall_rank": num(r[overall]), "overall_decile": deciles.get(r[0]) or decile(num(r[overall]), total),
             "domains": [{"name": h, "rank": num(r[i]), "decile": decile(num(r[i]), total)} for h, i in domains if num(r[i]) is not None],
             "source_url": src["url"], "loaded_at": now_iso()} for r in rows]


def parse_scotland(body: bytes, src: dict) -> list[dict]:
    sheet = read_xlsx(body, 2); hdr = sheet[0]
    rows = [r for r in sheet[1:] if r and r[0].startswith("S01")]
    total = len(rows); overall = hdr.index("SIMD2020v2_Rank")
    domains = [(re.sub(r"^SIMD2020(?:v2)?_(\w+?)_Domain_Rank$", r"\1", h), i) for i, h in enumerate(hdr) if h.endswith("_Domain_Rank")]
    return [{"area_code": r[0], "nation": src["nation"], "index_name": src["index"], "edition": src["edition"], "publisher": src["publisher"], "area_name": r[1], "council": r[2],
             "overall_rank": num(r[overall]), "overall_decile": decile(num(r[overall]), total),
             "domains": [{"name": h, "rank": num(r[i]), "decile": decile(num(r[i]), total)} for h, i in domains if num(r[i]) is not None],
             "source_url": src["url"], "loaded_at": now_iso()} for r in rows]


NI_DOMAINS = [("D1_Income_rank", "Income"), ("D2_Empl_rank", "Employment"), ("D3_Health_rank", "Health Deprivation and Disability"), ("P4_Education_rank", "Education, Skills and Training"),
              ("P5_Access_rank", "Access to Services"), ("D6_LivEnv_rank", "Living Environment"), ("D7_CD_rank", "Crime and Disorder")]   # names as NISRA's variable list gives them


def parse_ni(body: bytes, src: dict) -> list[dict]:
    rows = list(csv.DictReader(io.StringIO(body.decode("utf-8-sig"))))
    total = len(rows)
    return [{"area_code": r["SOA2001"], "nation": src["nation"], "index_name": src["index"], "edition": src["edition"], "publisher": src["publisher"], "area_name": r["SOA2001name"], "council": r["LGD2014name"],
             "overall_rank": num(r["MDM_rank"]), "overall_decile": decile(num(r["MDM_rank"]), total),
             "domains": [{"name": name, "rank": num(r[col]), "decile": decile(num(r[col]), total)} for col, name in NI_DOMAINS if num(r.get(col)) is not None],
             "source_url": src["url"], "loaded_at": now_iso()} for r in rows]


PARSERS = {"wales": parse_wales, "scotland": parse_scotland, "ni": parse_ni}


def main():
    which = [a for a in sys.argv[1:] if not a.startswith("--")] or ["all"]
    keys = list(SOURCES) if "all" in which else which
    for k in keys:
        src = SOURCES[k]
        status, body, _ = fetch(src["url"], browser=True, timeout=300, tries=3)
        if status != 200: raise SystemExit(f"{src['url']}: HTTP {status}")
        rows = PARSERS[k](body, src)
        ranks = [r["overall_rank"] for r in rows]
        assert len(rows) == max(ranks) == len(set(ranks)), f"{k}: {len(rows)} rows but ranks run to {max(ranks)} with {len(set(ranks))} distinct"
        print(f"{src['nation']}: {len(rows)} areas, {src['index']} {src['edition']} ({src['publisher']}); domains: {[d['name'] for d in rows[0]['domains']]}", flush=True)
        if "--sample" in sys.argv:
            import json, random; random.seed(2)
            for r in random.sample(rows, 10): print("  ", json.dumps({kk: r[kk] for kk in ("area_code", "area_name", "council", "overall_rank", "overall_decile")}, ensure_ascii=False), [(d["name"], d["decile"]) for d in r["domains"]])
        write("deprivation_areas", rows, "area_code")


if __name__ == "__main__": main()
