"""Weekly: a register of every UK council (docs/automation/open-data-mysociety.md, section 1 and its addendum), plus every
council's service links for the "Do it online" list (section 2).

Sources, all read whole and joined by code:
  UK Local Authorities (past, current and future), mySociety, CC BY 4.0: names, types, powers, dates, cross-identifiers.
    https://pages.mysociety.org/uk_local_authority_names_and_codes/data/uk_la_future/latest/uk_local_authorities_future.csv
  GOV.UK local-authority API, Open Government Licence: the official home page, tier and parent council, by GOV.UK slug.
    https://www.gov.uk/api/local-authority/{slug}
  WhatDoTheyKnow authorities, mySociety, CC BY-SA 4.0: a second home page, the publication scheme and disclosure log.
    https://pages.mysociety.org/wdtk_authorities_list/data/whatdotheyknow_authorities_dataset/latest/authorities.csv
  ONS Code History Database (newest edition on the Open Geography Portal), OGL: the authority for council codes created or
    terminated since mySociety's file stops (May 2025).
  GOV.UK Local Links Manager export, OGL: every council's service pages, keyed by GSS code, replaced wholesale each run.
    https://local-links-manager.publishing.service.gov.uk/data/links_to_services_provided_by_local_authorities.csv

Rules: a council never leaves the table (marked not current, with end date and successor); a code only ONS knows is recorded
with in_mysociety = false and nothing but what ONS gives; a terminated code whose ONS successor has the same name is a recode
(the council stays current, ons_gss_code carries the new code), anything else is an abolition; GOV.UK's slug is mySociety's
gov-uk-slug, or a slug made from the name and accepted only if GOV.UK's answer names the same council; slugs for pages come
from nice-name in the style of lib/councils.json and the 29 hand-built slugs are unchanged. Nothing is typed in.

Usage: python scripts/auto/council_register.py [--sample] [--from DIR]
  (dry run without the service key; --sample prints ten rows and skips following home-page redirects; --from DIR reads
  uk_local_authorities_future.csv, authorities.csv, links.csv and chd.zip from DIR instead of fetching them)
"""
import concurrent.futures, csv, datetime, io, json, os, re, sys, urllib.parse, urllib.request, zipfile
sys.path.insert(0, os.path.dirname(__file__))
from common import DRY, fetch, get_json, job, now_iso, remove, select, write, BROWSER_UA, NAMED_UA

LA_CSV = "https://pages.mysociety.org/uk_local_authority_names_and_codes/data/uk_la_future/latest/uk_local_authorities_future.csv"
LA_PAGE = "https://pages.mysociety.org/uk_local_authority_names_and_codes/datasets/uk_la_future/latest"
WDTK_CSV = "https://pages.mysociety.org/wdtk_authorities_list/data/whatdotheyknow_authorities_dataset/latest/authorities.csv"
WDTK_PAGE = "https://pages.mysociety.org/wdtk_authorities_list/datasets/whatdotheyknow_authorities_dataset/latest"
GOVUK_API = "https://www.gov.uk/api/local-authority/"
LINKS_CSV = "https://local-links-manager.publishing.service.gov.uk/data/links_to_services_provided_by_local_authorities.csv"
NOT_COUNCILS = {"COMB", "SRA"}   # combined and strategic authorities are in the register but get no council page
# ONS entity codes for councils, with mySociety's type code and name for the same kind of body (two published
# classifications side by side; used only for a council ONS knows and mySociety does not yet).
ONS_ENTITIES = {"E06": ("UA", "Unitary authority"), "E07": ("NMD", "Non-metropolitan district"), "E08": ("MD", "Metropolitan district"),
                "E09": ("LBO", "London borough"), "E10": ("CTY", "County"), "W06": ("WPA", "Welsh unitary authority"),
                "S12": ("SCO", "Scottish unitary authority"), "N09": ("NID", "NI district")}
NATIONS = {"E": "England", "W": "Wales", "S": "Scotland", "N": "Northern Ireland"}


def slugify(name: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", name.lower().replace("&", "and"))).strip("-")


def norm_name(name: str) -> str:
    n = name.lower().replace("&", "and")
    n = re.sub(r"^(the |royal borough of |london borough of |city of |comhairle nan )", "", n)
    n = re.sub(r"\b(county borough|metropolitan borough|borough|district|county|city|metropolitan|council|of)\b", " ", n)
    return re.sub(r"[^a-z0-9]", "", n)


def to_int(x):
    try: return int(float(x)) if x not in (None, "") else None
    except ValueError: return None


def to_float(x):
    try: return float(x) if x not in (None, "") else None
    except ValueError: return None


def ons_date(x: str | None):
    if not x: return None
    for f in ("%d/%m/%Y %H:%M", "%d/%m/%Y %H:%M:%S", "%d/%m/%Y"):
        try: return datetime.datetime.strptime(x.strip(), f).date().isoformat()
        except ValueError: pass
    return None


def download(url: str) -> bytes:
    status, body, _ = fetch(url, timeout=300, tries=3)
    if status != 200: raise RuntimeError(f"{url}: HTTP {status}")
    return body


def dataset_version(page: str) -> str | None:
    try:
        status, body, _ = fetch(page, timeout=60, tries=2)
        m = re.search(r"(?i)version[^0-9]{0,40}(\d+\.\d+\.\d+)", body.decode("utf-8", "replace"))
        return m.group(1) if m else None
    except Exception:
        return None


def resolve(url: str | None) -> str | None:
    """Follow redirects and keep the final address, so an old http:// home page becomes the site as it is now."""
    if not url: return None
    for method in ("HEAD", "GET"):
        try:
            req = urllib.request.Request(url, method=method, headers={"User-Agent": BROWSER_UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.geturl()
        except Exception:
            continue
    return url   # unreachable today: keep what the list says; the weekly link check will catch a dead one


def govuk(slug: str) -> dict | None:
    try:
        status, body, _ = fetch(GOVUK_API + slug, timeout=30, tries=2, headers={"Accept": "application/json"})
    except Exception:
        return None
    if status != 200: return None
    try: return json.loads(body.decode("utf-8")).get("local_authority")
    except Exception: return None


def govuk_lookup(la_rows: list[dict]) -> dict[str, dict]:
    """GOV.UK's record for each council: by mySociety's gov-uk-slug, else by a slug made from the name, accepted only when
    GOV.UK's answer names the same council (so nothing is matched by guesswork)."""
    def one(r):
        bare = re.sub(r"(?i)\s+council$", "", r["nice-name"])
        cands = ([r["gov-uk-slug"]] if r["gov-uk-slug"] else []) + [slugify(bare), slugify(bare.replace(" and ", " ")), slugify(bare.replace(".", ""))]
        for c in dict.fromkeys(cands):
            d = govuk(c)
            # mySociety's own slug is taken as read; a slug made from the name only if GOV.UK's answer names the same council
            if d and (c == r["gov-uk-slug"] or norm_name(d.get("name", "")) == norm_name(r["nice-name"])):
                return r["local-authority-code"], {**d, "_slug": c}
        return r["local-authority-code"], None
    out = {}
    with concurrent.futures.ThreadPoolExecutor(8) as ex:
        for code, d in ex.map(one, la_rows):
            if d: out[code] = d
    return out


def chd_latest() -> tuple[bytes, str]:
    """The newest Code History Database on the Open Geography Portal: its zip and its edition ("June 2026")."""
    q = urllib.parse.urlencode({"q": 'title:"Code History Database" AND owner:ONSGeography_data', "f": "json", "num": 10, "sortField": "created", "sortOrder": "desc"})
    items = [i for i in get_json("https://www.arcgis.com/sharing/rest/search?" + q, timeout=60).get("results", []) if i.get("title", "").startswith("Code History Database")]
    if not items: raise RuntimeError("Code History Database not found on the Open Geography Portal")
    item = items[0]
    m = re.search(r"\(([A-Za-z]+ \d{4})\)", item["title"])
    return download(f"https://www.arcgis.com/sharing/rest/content/items/{item['id']}/data"), (m.group(1) if m else item["title"])


def chd_councils(zip_bytes: bytes):
    """{code: {name, status, oper, term, entity}} for council codes, and {predecessor code: [successor codes]}."""
    z = zipfile.ZipFile(io.BytesIO(zip_bytes))
    hist = next(n for n in z.namelist() if n.lower().endswith("changehistory.csv"))
    chg = next(n for n in z.namelist() if n.lower().endswith("changes.csv"))
    codes, succ = {}, {}
    for r in csv.DictReader(io.TextIOWrapper(z.open(hist), encoding="utf-8-sig", errors="replace")):
        if r["ENTITYCD"] not in ONS_ENTITIES: continue
        row = {"name": r["GEOGNM"], "status": r["STATUS"], "oper": ons_date(r["OPER_DATE"]), "term": ons_date(r["TERM_DATE"]), "entity": r["ENTITYCD"]}
        prev = codes.get(r["GEOGCD"])
        # A code can have several rows (re-issues, boundary changes). It is live if any row says so; otherwise the latest end date counts.
        if prev is None or (row["status"] == "live" and prev["status"] != "live") or (prev["status"] != "live" and row["status"] != "live" and (row["term"] or "") > (prev["term"] or "")):
            codes[r["GEOGCD"]] = row
    for r in csv.DictReader(io.TextIOWrapper(z.open(chg), encoding="utf-8-sig", errors="replace")):
        if r["ENTITYCD"] in ONS_ENTITIES and r["GEOGCD_P"]:
            succ.setdefault(r["GEOGCD_P"], []).append(r["GEOGCD"])
    return codes, succ


def build(la_text: str, wdtk_text: str, existing: dict, gov: dict, ons: dict, succ: dict, versions: str, stamp: str, resolve_pages: bool = True):
    la = list(csv.DictReader(io.StringIO(la_text)))
    wanted = {str(to_int(r["wdtk-id"])) for r in la if to_int(r["wdtk-id"]) is not None}
    wdtk = {}
    for row in csv.DictReader(io.StringIO(wdtk_text)):
        if row["internal-id"] in wanted: wdtk[row["internal-id"]] = row
    # Home page: GOV.UK's first, else WhatDoTheyKnow's; redirects followed once, eight at a time; one resolved last week
    # is kept unless the listed address changed.
    picks, todo = {}, []
    for r in la:
        code = r["local-authority-code"]; w = wdtk.get(str(to_int(r["wdtk-id"]))) if r["wdtk-id"] else None
        g = gov.get(code) or {}
        raw = g.get("homepage_url") or (w or {}).get("home-page") or None
        source = "gov.uk" if g.get("homepage_url") else ("whatdotheyknow" if raw else None)
        prev = existing.get(code)
        if prev and prev.get("home_page") and (prev.get("home_page_raw") == raw or prev.get("govuk_homepage") == raw): picks[code] = (prev["home_page"], source, raw)
        elif raw and resolve_pages: todo.append((code, raw, source))
        else: picks[code] = (raw, source, raw)
    with concurrent.futures.ThreadPoolExecutor(8) as ex:
        for (code, raw, source), home in zip(todo, ex.map(lambda t: resolve(t[1]), todo)): picks[code] = (home, source, raw)
    rows, by_gss, by_name = [], {}, {}
    for r in la:
        code = r["local-authority-code"]; w = wdtk.get(str(to_int(r["wdtk-id"]))) if r["wdtk-id"] else None; g = gov.get(code) or {}
        current = r["current-authority"] == "True"; prev = existing.get(code)
        home, source, _ = picks.get(code, (None, None, None))
        o = ons.get(r["gss-code"]) if r["gss-code"] else None
        row = {"code": code, "official_name": r["official-name"], "nice_name": r["nice-name"].strip(), "slug": slugify(r["nice-name"]),
               "gss_code": r["gss-code"] or None, "former_gss_codes": r["former-gss-codes"] or None, "ons_gss_code": None,
               "nation": r["nation"] or None, "region": r["region"] or None, "la_type": r["local-authority-type"] or None, "la_type_name": r["local-authority-type-name"] or None,
               "powers": r["powers"] or None, "lower_or_unitary": r["lower-or-unitary"] == "True" if r["lower-or-unitary"] else None,
               "county_la": r["county-la"] or None, "combined_authority": r["combined-authority"] or None,
               "start_date": r["start-date"] or None, "end_date": r["end-date"] or None, "replaced_by": r["replaced-by"] or None, "current": current,
               "gov_uk_slug": r["gov-uk-slug"] or None, "open_council_data_id": to_int(r["open-council-data-id"]), "wdtk_id": to_int(r["wdtk-id"]),
               "pop_2020": to_int(r["pop-2020"]), "lat": to_float(r["lat"]), "long": to_float(r["long"]), "alt_names": r["alt-names"] or None,
               "home_page": home, "home_page_source": source, "home_page_raw": (w or {}).get("home-page") or None,
               "govuk_slug": g.get("_slug"), "govuk_name": g.get("name"), "govuk_homepage": g.get("homepage_url"), "govuk_tier": g.get("tier"),
               "govuk_parent_slug": (g.get("parent") or {}).get("slug"), "govuk_parent_name": (g.get("parent") or {}).get("name"),
               "ons_status": o["status"] if o else None, "ons_oper_date": o["oper"] if o else None, "ons_term_date": o["term"] if o else None,
               "ons_successors": ",".join(succ.get(r["gss-code"], [])) or None if r["gss-code"] else None,
               "publication_scheme": (w or {}).get("publication-scheme") or None, "disclosure_log": (w or {}).get("disclosure-log") or None, "wdtk_url_name": (w or {}).get("url-name") or None,
               "in_mysociety": True, "note": None, "source_versions": versions, "retrieved_at": stamp, "ended_seen_at": prev.get("ended_seen_at") if prev else None}
        # ONS is the authority for what happened to a code after May 2025.
        if current and o and o["status"] == "terminated":
            same = [c for c in succ.get(r["gss-code"], []) if c in ons and norm_name(ons[c]["name"]) == norm_name(row["nice_name"])]
            if same:   # a recode: the council goes on under a new code
                row["ons_gss_code"] = same[0]; row["note"] = f"ONS recoded this council to {same[0]} on {ons[same[0]]['oper']}; mySociety's register still has {r['gss-code']}."
            else:      # an abolition: keep the row, ended
                row["current"] = False; row["end_date"] = row["end_date"] or o["term"]; row["ended_seen_at"] = row["ended_seen_at"] or stamp
                row["note"] = f"ONS records code {r['gss-code']} as terminated on {o['term']}" + (f"; successor codes {', '.join(succ.get(r['gss-code'], []))}" if succ.get(r["gss-code"]) else "") + "."
        rows.append(row)
        if row["current"]:
            by_gss[row["gss_code"]] = row; by_name[norm_name(row["nice_name"])] = row
            if row["ons_gss_code"]: by_gss[row["ons_gss_code"]] = row
    # Councils in our table that mySociety's file no longer has at all: keep them, marked not current.
    seen = {r["code"] for r in rows}
    for code, prev in existing.items():
        if code in seen or not prev.get("in_mysociety", True): continue
        rows.append({**{k: prev.get(k) for k in rows[0].keys()}, "current": False, "ended_seen_at": prev.get("ended_seen_at") or stamp, "retrieved_at": stamp, "source_versions": versions,
                     "note": ((prev.get("note") or "") + " No longer in mySociety's register file.").strip()})
    # Live ONS council codes that no current register row carries: a same-named council gets the code; otherwise a bare row.
    ons_only = []
    for gss, o in ons.items():
        if o["status"] != "live" or gss in by_gss: continue
        same = by_name.get(norm_name(o["name"]))
        if same and not same["ons_gss_code"]:
            same["ons_gss_code"] = gss; same["note"] = f"ONS lists this council under {gss} (live since {o['oper']}); mySociety's register has {same['gss_code']}."
        elif not same:
            t = ONS_ENTITIES[o["entity"]]
            ons_only.append({**{k: None for k in rows[0].keys()}, "code": gss, "official_name": o["name"], "nice_name": o["name"], "slug": slugify(o["name"]), "gss_code": gss,
                             "nation": NATIONS.get(gss[:1]), "la_type": t[0], "la_type_name": t[1], "start_date": o["oper"], "current": True, "in_mysociety": False,
                             "ons_status": "live", "ons_oper_date": o["oper"], "note": "Listed by ONS's Code History Database but not yet in mySociety's register; name, type and date as ONS gives them.",
                             "source_versions": versions, "retrieved_at": stamp})
    return rows + ons_only, len(wdtk)


def service_links(text: str, stamp: str) -> list[dict]:
    rows, seen = [], set()
    for r in csv.DictReader(io.StringIO(text)):
        k = (r["GSS"], to_int(r["LGSL"]), to_int(r["LGIL"]))
        if not r["GSS"] or k[1] is None or k[2] is None or not r["URL"] or k in seen: continue
        seen.add(k)
        rows.append({"gss": r["GSS"], "lgsl": k[1], "lgil": k[2], "description": r["Description"], "url": r["URL"], "title": r["Title"] or None,
                     "supported_by_govuk": r.get("Supported by GOV.UK", "").lower() == "true", "retrieved_at": stamp})
    return rows


def main():
    args = sys.argv[1:]; sample = "--sample" in args
    with job("council register") as st:
        stamp = now_iso()
        if "--from" in args:
            d = args[args.index("--from") + 1]
            rd = lambda n: open(os.path.join(d, n), encoding="utf-8-sig").read()
            la_text, wdtk_text, links_text = rd("uk_local_authorities_future.csv"), rd("authorities.csv"), rd("links.csv")
            chd_zip, chd_edition = open(os.path.join(d, "chd.zip"), "rb").read(), "local copy"
        else:
            la_text, wdtk_text = download(LA_CSV).decode("utf-8-sig", "replace"), download(WDTK_CSV).decode("utf-8-sig", "replace")
            links_text = download(LINKS_CSV).decode("utf-8-sig", "replace")
            chd_zip, chd_edition = chd_latest()
        v1, v2 = dataset_version(LA_PAGE), dataset_version(WDTK_PAGE)
        versions = f"uk_la_future {v1 or 'unknown'}; wdtk authorities {v2 or 'unknown'}; ONS CHD {chd_edition}; GOV.UK local-authority API and Local Links Manager {stamp[:10]}"
        try:
            existing = {r["code"]: r for r in select("/council_register?select=code,home_page,home_page_raw,govuk_homepage,ended_seen_at,in_mysociety,note")}
        except SystemExit as ex:
            if DRY and "Could not find the table" in str(ex): existing = {}
            else: raise
        la_rows = list(csv.DictReader(io.StringIO(la_text)))
        gov = govuk_lookup([r for r in la_rows if r["current-authority"] == "True"])
        ons, succ = chd_councils(chd_zip)
        rows, joined = build(la_text, wdtk_text, existing, gov, ons, succ, versions, stamp, resolve_pages=not sample)
        cur = [r for r in rows if r["current"]]
        councils = [r for r in cur if r["la_type"] not in NOT_COUNCILS]
        links = service_links(links_text, stamp)
        link_councils = {r["gss"] for r in links}
        print(f"{len(rows)} rows ({len(cur)} current, {len(councils)} councils with pages); GOV.UK answered for {len(gov)} ({sum(1 for r in councils if r['govuk_slug'] and not r['gov_uk_slug'])} by confirmed name match); "
              f"{joined} joined to WhatDoTheyKnow; home pages: {sum(1 for r in cur if r['home_page'])} ({sum(1 for r in cur if r['home_page_source'] == 'gov.uk')} from GOV.UK, {sum(1 for r in cur if r['home_page_source'] == 'whatdotheyknow')} from WhatDoTheyKnow); "
              f"ONS CHD {chd_edition}: {len(ons)} council codes, recoded {sum(1 for r in rows if r['ons_gss_code'])}, abolished per ONS {sum(1 for r in rows if r['in_mysociety'] and not r['current'] and (r['note'] or '').startswith('ONS records'))}, ONS-only {sum(1 for r in rows if not r['in_mysociety'])}; "
              f"service links {len(links)} for {len(link_councils)} councils ({sum(1 for r in councils if r['gss_code'] in link_councils or r['ons_gss_code'] in link_councils)} of ours)", flush=True)
        print("recoded: " + ", ".join(f"{r['nice_name']} {r['gss_code']}->{r['ons_gss_code']}" for r in rows if r["ons_gss_code"]) + "; abolished per ONS: "
              + (", ".join(r["nice_name"] for r in rows if r["in_mysociety"] and not r["current"] and (r["note"] or "").startswith("ONS records")) or "none")
              + "; GOV.UK missing for: " + (", ".join(r["nice_name"] for r in councils if not r["govuk_slug"]) or "none"), flush=True)
        if sample:
            import random; random.seed(1)
            for r in random.sample(councils, 10):
                print(json.dumps({k: r[k] for k in ("code", "nice_name", "slug", "gss_code", "ons_gss_code", "nation", "la_type_name", "govuk_tier", "govuk_parent_name", "home_page", "home_page_source")}, ensure_ascii=False))
            for r in random.sample(links, 10): print(json.dumps(r, ensure_ascii=False)[:200])
        write("council_register", rows, "code")
        remove("council_service_links", "lgsl=gte.0")
        write("council_service_links", links)
        # A snapshot in git (like scripts/sql/council_meetings.json) so the site can still list every council when the
        # database is unreachable or the table has not been created yet. Only the fields the pages use, current rows only.
        keep = ("code", "official_name", "nice_name", "slug", "gss_code", "ons_gss_code", "nation", "region", "la_type", "la_type_name", "powers", "county_la", "combined_authority",
                "current", "gov_uk_slug", "open_council_data_id", "home_page", "home_page_source", "govuk_tier", "govuk_parent_name", "govuk_parent_slug", "publication_scheme", "disclosure_log",
                "in_mysociety", "note", "source_versions", "retrieved_at", "alt_names")
        snap = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "scripts", "sql", "council_register.json")
        json.dump({"retrieved_at": stamp, "source_versions": versions, "attribution": "mySociety, UK Local Authorities (CC BY 4.0) and WhatDoTheyKnow authorities (CC BY-SA 4.0); GOV.UK local-authority API and ONS Code History Database (OGL)",
                   "rows": [{k: r[k] for k in keep} for r in cur]}, open(snap, "w"), indent=0, ensure_ascii=False)
        print(f"wrote {snap}", flush=True)
        st["rows"] = len(rows); st["note"] = f"{len(cur)} current; {versions}; {len(links)} service links"


if __name__ == "__main__": main()
