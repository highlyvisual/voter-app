"""Weekly: traffic and highways orders each council has published in The Gazette, the official public record.

Source: The Gazette's notice search (notice codes 1501 Road Traffic Acts and 1503 Highways; Open Government Licence).
The Gazette has no field for the issuing council, so we search for the council's official name and keep a notice only if
its heading begins with that name. Titles are the order names as printed; "made" or "proposed" is read from the notice's
own wording. Window: the last 120 days.
"""
import datetime, html, json, os, re, sys, time, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
from common import councils, fetch, get_json, job, remove, write, now_iso

OFFICIAL = {  # slug -> names the council uses at the head of its Gazette notices
    "camden": ["London Borough of Camden"], "lambeth": ["London Borough of Lambeth"],
    "brighton-and-hove": ["Brighton & Hove City Council", "Brighton and Hove City Council"],
    "cotswold": ["Cotswold District Council"], "milton-keynes": ["Milton Keynes City Council", "Milton Keynes Council"],
    "south-staffordshire": ["South Staffordshire Council", "South Staffordshire District Council"],
    "windsor-and-maidenhead": ["Royal Borough of Windsor and Maidenhead"], "blackpool": ["Blackpool Council", "Blackpool Borough Council"],
    "stirling": ["Stirling Council"], "wiltshire": ["Wiltshire Council"], "aberdeen-city": ["Aberdeen City Council"],
    "amber-valley": ["Amber Valley Borough Council"], "argyll-and-bute": ["Argyll and Bute Council"],
    "bassetlaw": ["Bassetlaw District Council"], "carmarthenshire": ["Carmarthenshire County Council"],
    "east-hertfordshire": ["East Hertfordshire District Council", "East Herts Council"], "flintshire": ["Flintshire County Council"],
    "halton": ["Halton Borough Council"], "highland": ["The Highland Council", "Highland Council"], "leeds": ["Leeds City Council"],
    "leicestershire": ["Leicestershire County Council"], "mid-devon": ["Mid Devon District Council"],
    "newark-and-sherwood": ["Newark and Sherwood District Council"], "newcastle-under-lyme": ["Newcastle-under-Lyme Borough Council"],
    "north-west-leicestershire": ["North West Leicestershire District Council"], "northumberland": ["Northumberland County Council"],
    "nottinghamshire": ["Nottinghamshire County Council"], "south-kesteven": ["South Kesteven District Council"],
    "stroud": ["Stroud District Council"],
}
TYPES = {"1501": "Traffic order", "1503": "Highways order"}


def text_of(notice_id: str) -> str:
    status, body, _ = fetch(f"https://www.thegazette.co.uk/notice/{notice_id}/data.xml", timeout=40)
    if status != 200: return ""
    t = re.sub(r"<[^>]+>", " ", body.decode("utf-8", "replace"))
    return re.sub(r"\s+", " ", html.unescape(t)).strip()


def heading(t: str) -> str:
    m = re.search(r"Notice code: \d+ (.*)", t)
    h = m.group(1) if m else t
    return re.sub(r"^(?:Issue number: \d+ )?(?:Page number: \d+ )?", "", h)


def main():
    with job("gazette notices") as st:
        end = datetime.date.today(); start = end - datetime.timedelta(days=120); stamp = now_iso(); total = 0; notes = []
        for c in councils():
            names = OFFICIAL.get(c["slug"]) or [f"{c['name']} Council"]
            rows, seen = [], set()
            for name in names:
                for code in TYPES:
                    q = urllib.parse.urlencode({"noticetypes": code, "text": f'"{name}"', "start-publish-date": start.isoformat(),
                                                "end-publish-date": end.isoformat(), "results-page-size": 100, "sort-by": "latest-date"})
                    d = get_json(f"https://www.thegazette.co.uk/all-notices/notice/data.json?{q}", timeout=60)
                    for e in d.get("entry") or []:
                        nid = e["id"].rsplit("/", 1)[-1]
                        if nid in seen: continue
                        seen.add(nid)
                        t = text_of(nid); time.sleep(0.4)
                        h = heading(t)
                        if not any(h.upper().startswith(n.upper()) or h.upper().startswith("THE " + n.upper()) for n in names): continue
                        body = h[len(max(names, key=len)):] if h.upper().startswith(max(names, key=len).upper()) else h
                        title = re.split(r"\s(?:1\.|NOTICE IS HEREBY)", body, maxsplit=1)[0].strip(" -–:")[:300]
                        low = t.lower()
                        stage = "made" if re.search(r"ha(?:ve|s) made|made the above|order came into force|will come into (?:force|operation)", low) else \
                                "proposed" if re.search(r"propos|intend", low) else None
                        rows.append({"council_slug": c["slug"], "notice_id": nid, "notice_type": TYPES[code] + (f" ({stage})" if stage else ""),
                                     "title": title or TYPES[code], "published": (e.get("published") or "")[:10] or None,
                                     "url": f"https://www.thegazette.co.uk/notice/{nid}", "retrieved_at": stamp})
            remove("gazette_notices", f"council_slug=eq.{c['slug']}")
            write("gazette_notices", rows, "council_slug,notice_id")
            total += len(rows); notes.append(f"{c['slug']} {len(rows)}")
            print(c["slug"], len(rows), flush=True)
        st["rows"] = total; st["note"] = "; ".join(notes)


if __name__ == "__main__": main()
