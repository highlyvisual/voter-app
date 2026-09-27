"""Weekly: a register of every UK council, from two mySociety datasets (docs/automation/open-data-mysociety.md, section 1).

Sources (direct files; the download pages put an optional survey in front):
  UK Local Authorities (past, current and future), mySociety, CC BY 4.0
    https://pages.mysociety.org/uk_local_authority_names_and_codes/data/uk_la_future/latest/uk_local_authorities_future.csv
  WhatDoTheyKnow authorities, mySociety, CC BY-SA 4.0 (joined on wdtk-id for each council's own website)
    https://pages.mysociety.org/wdtk_authorities_list/data/whatdotheyknow_authorities_dataset/latest/authorities.csv
  ONS Local Authority Districts and County/Unitary Authority names and codes (Open Government Licence), found through the
    ONS Geography ArcGIS search as release_watch.py does, to notice councils ONS lists that mySociety's file does not yet.

Rules: a council never leaves the table (it is marked not current, with the file's end date and successor); a code that
only ONS knows is recorded with in_mysociety = false and nothing but what ONS gives; slugs come from nice-name in the
style of lib/councils.json, and the 29 hand-built slugs are unchanged. Nothing is typed in.

Usage: python scripts/auto/council_register.py [--sample] [--from DIR]
  (dry run without the service key; --sample prints ten rows and skips following home-page redirects; --from DIR reads the
  two CSVs already downloaded into DIR instead of fetching them, for local testing)
"""
import csv, datetime, io, json, os, re, sys, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from common import DRY, fetch, get_json, job, now_iso, select, write, BROWSER_UA

LA_CSV = "https://pages.mysociety.org/uk_local_authority_names_and_codes/data/uk_la_future/latest/uk_local_authorities_future.csv"
LA_PAGE = "https://pages.mysociety.org/uk_local_authority_names_and_codes/datasets/uk_la_future/latest"
WDTK_CSV = "https://pages.mysociety.org/wdtk_authorities_list/data/whatdotheyknow_authorities_dataset/latest/authorities.csv"
WDTK_PAGE = "https://pages.mysociety.org/wdtk_authorities_list/datasets/whatdotheyknow_authorities_dataset/latest"
ONS_LISTS = [("Local Authority Districts", "LAD"), ("County and Unitary Authority", "CTYUA")]   # title prefix, field prefix
NOT_COUNCILS = {"COMB", "SRA"}   # combined and strategic authorities are in the register but get no council page


def slugify(name: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", name.lower().replace("&", "and"))).strip("-")


def to_int(x: str | None):
    try: return int(float(x)) if x not in (None, "") else None
    except ValueError: return None


def to_float(x: str | None):
    try: return float(x) if x not in (None, "") else None
    except ValueError: return None


def download(url: str) -> str:
    status, body, _ = fetch(url, timeout=300, tries=3)
    if status != 200: raise RuntimeError(f"{url}: HTTP {status}")
    return body.decode("utf-8-sig", "replace")


def dataset_version(page: str) -> str | None:
    try:
        status, body, _ = fetch(page, timeout=60, tries=2)
        m = re.search(r"(?i)version[^0-9]{0,40}(\d+\.\d+\.\d+)", body.decode("utf-8", "replace"))
        return m.group(1) if m else None
    except Exception:
        return None


def resolve(url: str) -> str | None:
    """Follow redirects and keep the final address, so an old http:// home page becomes the site as it is now."""
    if not url: return None
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": BROWSER_UA, "Accept": "*/*"})
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.geturl()
    except Exception:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": BROWSER_UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.geturl()
        except Exception:
            return url   # unreachable today: keep what the list says; the weekly link check will catch a dead one


def ons_codes() -> dict[str, str]:
    """{gss code: name} from ONS's newest names-and-codes lists for districts and for counties/unitaries."""
    out = {}
    for title, prefix in ONS_LISTS:
        q = urllib.parse.urlencode({"q": f'title:"{title}" AND "Names and Codes" AND owner:ONSGeography_data', "f": "json", "num": 30, "sortField": "created", "sortOrder": "desc"})
        items = [i for i in get_json("https://www.arcgis.com/sharing/rest/search?" + q, timeout=60).get("results", [])
                 if i.get("type") == "Feature Service" and "Names and Codes" in i.get("title", "") and i["title"].startswith(title)]
        if not items: continue
        item = items[0]   # newest by creation
        info = get_json(f"https://www.arcgis.com/sharing/rest/content/items/{item['id']}?f=json", timeout=60)
        d = get_json(f"{info['url']}/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json&resultRecordCount=2000", timeout=120)
        fields = [f["name"] for f in d.get("fields", [])]
        cd = next((f for f in fields if re.fullmatch(prefix + r"\d\dCD", f)), None); nm = next((f for f in fields if re.fullmatch(prefix + r"\d\dNM", f)), None)
        if not cd or not nm: continue
        for f in d.get("features", []): out[f["attributes"][cd]] = f["attributes"][nm]
    return out


def build(la_text: str, wdtk_text: str, existing: dict, ons: dict[str, str], versions: str, stamp: str, resolve_pages: bool = True):
    la = list(csv.DictReader(io.StringIO(la_text)))
    wanted = {str(to_int(r["wdtk-id"])) for r in la if to_int(r["wdtk-id"]) is not None}
    wdtk = {}
    for row in csv.DictReader(io.StringIO(wdtk_text)):
        if row["internal-id"] in wanted: wdtk[row["internal-id"]] = row
    # Follow each home page's redirects once, eight at a time; a page already resolved last week is kept unless the list changed it.
    def homes():
        out = {}
        todo = []
        for r in la:
            w = wdtk.get(str(to_int(r["wdtk-id"]))) if r["wdtk-id"] else None
            raw = (w or {}).get("home-page") or None
            prev = existing.get(r["local-authority-code"])
            if prev and prev.get("home_page_raw") == raw and prev.get("home_page"): out[r["local-authority-code"]] = prev["home_page"]
            elif raw and resolve_pages: todo.append((r["local-authority-code"], raw))
            else: out[r["local-authority-code"]] = raw
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(8) as ex:
            for code, home in zip([c for c, _ in todo], ex.map(lambda t: resolve(t[1]), todo)): out[code] = home
        return out
    resolved = homes()
    rows, by_gss, by_name = [], {}, {}
    for r in la:
        w = wdtk.get(str(to_int(r["wdtk-id"]))) if r["wdtk-id"] else None
        current = r["current-authority"] == "True"
        prev = existing.get(r["local-authority-code"])
        raw_home = (w or {}).get("home-page") or None
        home = resolved.get(r["local-authority-code"])
        row = {"code": r["local-authority-code"], "official_name": r["official-name"], "nice_name": r["nice-name"], "slug": slugify(r["nice-name"]),
               "gss_code": r["gss-code"] or None, "former_gss_codes": r["former-gss-codes"] or None, "ons_gss_code": None,
               "nation": r["nation"] or None, "region": r["region"] or None, "la_type": r["local-authority-type"] or None, "la_type_name": r["local-authority-type-name"] or None,
               "powers": r["powers"] or None, "lower_or_unitary": r["lower-or-unitary"] == "True" if r["lower-or-unitary"] else None,
               "county_la": r["county-la"] or None, "combined_authority": r["combined-authority"] or None,
               "start_date": r["start-date"] or None, "end_date": r["end-date"] or None, "replaced_by": r["replaced-by"] or None, "current": current,
               "gov_uk_slug": r["gov-uk-slug"] or None, "open_council_data_id": to_int(r["open-council-data-id"]), "wdtk_id": to_int(r["wdtk-id"]),
               "pop_2020": to_int(r["pop-2020"]), "lat": to_float(r["lat"]), "long": to_float(r["long"]), "alt_names": r["alt-names"] or None,
               "home_page": home, "home_page_raw": raw_home, "publication_scheme": (w or {}).get("publication-scheme") or None,
               "disclosure_log": (w or {}).get("disclosure-log") or None, "wdtk_url_name": (w or {}).get("url-name") or None,
               "in_mysociety": True, "note": None, "source_versions": versions, "retrieved_at": stamp, "ended_seen_at": prev.get("ended_seen_at") if prev else None}
        rows.append(row)
        if current:
            by_gss[row["gss_code"]] = row; by_name[slugify(row["nice_name"])] = row
    # Councils in our table that the file no longer has at all: keep them, marked not current.
    seen = {r["code"] for r in rows}
    for code, prev in existing.items():
        if code in seen or not prev.get("in_mysociety", True): continue
        rows.append({**{k: prev.get(k) for k in rows[0].keys()}, "current": False, "ended_seen_at": prev.get("ended_seen_at") or stamp, "retrieved_at": stamp, "source_versions": versions,
                     "note": ((prev.get("note") or "") + " No longer in mySociety's register file.").strip()})
    # Codes ONS lists that the register does not carry: on the council of the same name if there is one, else a bare row.
    ons_only = []
    for gss, name in ons.items():
        if gss in by_gss: continue
        same = by_name.get(slugify(name))
        if same:
            same["ons_gss_code"] = gss; same["note"] = f"ONS lists this council under {gss}; mySociety's register has {same['gss_code']}."
        else:
            ons_only.append({**{k: None for k in rows[0].keys()}, "code": gss, "official_name": name, "nice_name": name, "slug": slugify(name), "gss_code": gss,
                             "nation": {"E": "England", "W": "Wales", "S": "Scotland", "N": "Northern Ireland"}.get(gss[:1]), "current": True, "in_mysociety": False,
                             "note": "Listed by ONS but not yet in mySociety's register; name and code as ONS gives them, type unknown.", "source_versions": versions, "retrieved_at": stamp})
    return rows + ons_only, len(wdtk)


def main():
    sample = "--sample" in sys.argv
    with job("council register") as st:
        stamp = now_iso()
        if "--from" in sys.argv:
            d = sys.argv[sys.argv.index("--from") + 1]
            la_text = open(os.path.join(d, "uk_local_authorities_future.csv"), encoding="utf-8-sig").read()
            wdtk_text = open(os.path.join(d, "authorities.csv"), encoding="utf-8-sig").read()
        else:
            la_text, wdtk_text = download(LA_CSV), download(WDTK_CSV)
        v1, v2 = dataset_version(LA_PAGE), dataset_version(WDTK_PAGE)
        versions = f"uk_la_future {v1 or 'unknown'}; wdtk authorities {v2 or 'unknown'}"
        try:
            existing = {r["code"]: r for r in select("/council_register?select=code,home_page,home_page_raw,ended_seen_at,in_mysociety,note")}
        except SystemExit as ex:
            if DRY and "Could not find the table" in str(ex): existing = {}
            else: raise
        try:
            ons = ons_codes()
        except Exception as ex:
            ons = {}; print(f"ONS lists not read ({ex}); continuing without the ONS check", flush=True)
        rows, joined = build(la_text, wdtk_text, existing, ons, versions, stamp, resolve_pages=not sample)
        cur = [r for r in rows if r["current"]]
        councils = [r for r in cur if r["la_type"] not in NOT_COUNCILS]
        print(f"{len(rows)} rows ({len(cur)} current, {len(councils)} councils with pages); {joined} joined to WhatDoTheyKnow; "
              f"{sum(1 for r in cur if r['home_page'])} current rows with a home page; ONS-only: {sum(1 for r in rows if not r['in_mysociety'])}, "
              f"ONS code differs: {sum(1 for r in rows if r['ons_gss_code'])}", flush=True)
        if sample:
            import random; random.seed(1)
            for r in random.sample(councils, 10):
                print(json.dumps({k: r[k] for k in ("code", "nice_name", "slug", "gss_code", "nation", "la_type_name", "powers", "home_page", "open_council_data_id", "wdtk_id")}, ensure_ascii=False))
        write("council_register", rows, "code")
        # A snapshot in git (like scripts/sql/council_meetings.json) so the site can still list every council when the
        # database is unreachable or the table has not been created yet. Only the fields the pages use, current rows only.
        keep = ("code", "official_name", "nice_name", "slug", "gss_code", "ons_gss_code", "nation", "region", "la_type", "la_type_name", "powers", "county_la", "combined_authority",
                "current", "gov_uk_slug", "open_council_data_id", "home_page", "publication_scheme", "disclosure_log", "in_mysociety", "note", "source_versions", "retrieved_at", "alt_names")
        snap = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "scripts", "sql", "council_register.json")
        json.dump({"retrieved_at": stamp, "source_versions": versions, "attribution": "mySociety, UK Local Authorities (CC BY 4.0) and WhatDoTheyKnow authorities (CC BY-SA 4.0); ONS names and codes (OGL)",
                   "rows": [{k: r[k] for k in keep} for r in cur]}, open(snap, "w"), indent=0, ensure_ascii=False)
        print(f"wrote {snap}", flush=True)
        st["rows"] = len(rows); st["note"] = f"{len(cur)} current; {versions}; ONS-only {sum(1 for r in rows if not r['in_mysociety'])}"


if __name__ == "__main__": main()
