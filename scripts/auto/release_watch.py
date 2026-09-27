"""Weekly: notice when an official dataset the site uses has published a new edition.

Some sources change once a year (council tax, deprivation, emissions, boundaries and lookups). Their file names change
with every release, so they cannot be reloaded blindly. This job records the latest edition each publisher shows and
flags any change in the weekly review, so the reload happens within a week of publication instead of being forgotten.
"""
import datetime, hashlib, json, os, re, sys, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
from common import fetch, get_json, job, select, write, now_iso

GOVUK = [  # key, content API path, what it feeds
    ("England council tax levels (MHCLG)", "government/collections/council-tax-statistics", "council_tax_2026 and the council-tax line on council pages", "Council Tax levels set by local authorities"),
    ("English indices of deprivation (MHCLG)", "government/collections/english-indices-of-deprivation", "deprivation_2025", None),
    ("Local authority emissions (DESNZ)", "government/collections/uk-local-authority-and-regional-greenhouse-gas-emissions-statistics", "not yet used; environment line", None),
    ("Housing Delivery Test (MHCLG)", "government/collections/housing-delivery-test", "not yet used; housing line", None),
    ("Net additional dwellings, Live Table 122 (MHCLG)", "government/statistical-data-sets/live-tables-on-net-supply-of-housing", "not yet used; housing line", None),
]
ONS = [  # key, ArcGIS title search, feeds
    ("ONS lookup: council to combined authority", 'title:"Combined Authority" AND title:"Lookup"', "lib/widerBodies.json"),
    ("ONS lookup: council to fire authority", 'title:"Fire and Rescue Authority" AND title:"Lookup"', "lib/widerBodies.json"),
    ("ONS lookup: NHS integrated care boards", 'title:"Integrated Care Boards" AND title:"Lookup"', "lib/widerBodies.json"),
    ("ONS lookup: ward to council", 'title:"Ward to Local Authority District" AND title:"Lookup"', "ward matching"),
]
MONTHS = "January February March April May June July August September October November December".split()


def govuk(path, title_has=None):
    d = get_json(f"https://www.gov.uk/api/content/{path}", timeout=60)
    docs = (d.get("links") or {}).get("documents") or []
    if title_has:
        docs = [x for x in docs if title_has.lower() in (x.get("title") or "").lower()]
        if docs:  # GOV.UK lists a collection's documents newest first
            return docs[0]["title"], "https://www.gov.uk" + docs[0].get("base_path", "")
    best = max([(x.get("public_updated_at") or "", x.get("title") or "", x.get("base_path") or "") for x in docs] + [(d.get("public_updated_at") or "", d.get("title") or "", d.get("base_path") or "")])
    return f"{best[1]} (updated {best[0][:10]})", "https://www.gov.uk" + best[2]


def ons(q):
    url = "https://www.arcgis.com/sharing/rest/search?" + urllib.parse.urlencode({"q": f"{q} AND owner:ONSGeography_data", "f": "json", "num": 50, "sortField": "created", "sortOrder": "desc"})
    d = get_json(url, timeout=60)
    best = None
    for r in d.get("results", []):
        m = re.search(r"\((" + "|".join(MONTHS) + r") (\d{4})\)", r.get("title", ""))
        if not m: continue
        k = (int(m.group(2)), MONTHS.index(m.group(1)))
        if best is None or k > best[0]: best = (k, r["title"], f"https://www.arcgis.com/home/item.html?id={r['id']}")
    if not best: raise RuntimeError("no dated edition found")
    return best[1], best[2]


def other():
    out = []
    st, _, h = fetch("https://opencouncildata.co.uk/history2016-26.csv", method="HEAD", timeout=40)
    out.append(("Open Council Data: councillors history file", f"last modified {h.get('Last-Modified', 'unknown')}", "https://opencouncildata.co.uk/", "councillors, council_control"))
    d = get_json("https://search.electoralcommission.org.uk/api/search/Donations?currentPage=1&rows=1&sort=AcceptedDate&order=desc&et=pp&prePoll=false&postPoll=true", timeout=60)
    r = (d.get("Result") or [{}])[0]
    out.append(("Electoral Commission: party donations", f"latest reporting period {r.get('ReportingPeriodName')}", "https://search.electoralcommission.org.uk/", "party_funding"))
    # The devolved nations' deprivation indices (deprivation_areas): a new edition means a reload with scripts/loaders/deprivation_nations.py.
    for key, url, pat, feeds in [
        ("Welsh Index of Multiple Deprivation (Welsh Government)", "https://www.gov.wales/welsh-index-multiple-deprivation", rb"WIMD\s?(20\d\d)", "deprivation_areas (Wales)"),
        ("Scottish Index of Multiple Deprivation (Scottish Government)", "https://simd.scot/", rb"SIMD\s?(20\d\d(?:v\d)?)", "deprivation_areas (Scotland)"),
        ("Northern Ireland Multiple Deprivation Measure (NISRA)", "https://www.nisra.gov.uk/statistics/deprivation", rb"NIMDM\s?(20\d\d)", "deprivation_areas (Northern Ireland)"),
    ]:
        try:
            st, body, _ = fetch(url, browser=True, timeout=60)
            eds = sorted(set(m.decode() for m in re.findall(pat, body))) if st == 200 else []
            out.append((key, f"newest edition named on the page: {eds[-1]}" if eds else f"page returned HTTP {st}", url, feeds))
        except Exception as ex:
            out.append((key, f"not read: {str(ex)[:80]}", url, feeds))
    st, body, _ = fetch("https://www.gov.scot/publications/council-tax-datasets/", browser=True, timeout=60)
    links = sorted(set(re.findall(rb'href="([^"]+\.xlsx)"', body))) if st == 200 else []
    out.append(("Scotland council tax by band (Scottish Government)", f"{len(links)} files, fingerprint {hashlib.sha256(b'|'.join(links)).hexdigest()[:12]}" if links else f"page returned HTTP {st}", "https://www.gov.scot/publications/council-tax-datasets/", "not yet used; Scottish council pages"))
    m = get_json("https://api.stats.gov.wales/v1/1988b6af-2a9c-43b6-8939-83e6cceb3903", timeout=60)
    rev = m.get("published_revision") or {}
    out.append(("Wales council tax levels (StatsWales)", f"data to {m.get('end_date')}, revision {str(rev.get('publish_at') or rev.get('id') or '')[:24]}", "https://stats.gov.wales/", "not yet used; Welsh council pages"))
    return out


def main():
    with job("release watch") as st:
        prev = {r["key"]: r for r in select("/release_watch?select=key,latest,changed_at")}
        stamp, rows, changed, failed = now_iso(), [], [], []
        checks = [(k, (lambda p=p, t=t: govuk(p, t)), feeds) for k, p, feeds, t in GOVUK] + [(k, (lambda q=q: ons(q)), feeds) for k, q, feeds in ONS]
        for key, fn, feeds in checks:
            try:
                latest, url = fn()
            except Exception as ex:
                failed.append(f"{key}: {ex}"[:160]); continue
            rows.append((key, latest, url))
        try:
            rows += [(k, latest, url) for k, latest, url, _ in other()]
        except Exception as ex:
            failed.append(f"other checks: {ex}"[:160])
        out = []
        for key, latest, url in rows:
            p = prev.get(key)
            is_new = p is not None and p.get("latest") != latest
            if is_new: changed.append(key)
            out.append({"key": key, "latest": latest, "url": url, "checked_at": stamp,
                        "changed_at": stamp if (is_new or p is None) else p.get("changed_at")})
        write("release_watch", out, "key")
        st["rows"] = len(out)
        st["note"] = ("new editions: " + ", ".join(changed) if changed else "no new editions") + (("; failed: " + "; ".join(failed)) if failed else "")
        if failed and len(failed) > len(checks) // 2: raise RuntimeError("most release checks failed: " + "; ".join(failed))


if __name__ == "__main__": main()
