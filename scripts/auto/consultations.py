"""Daily: open consultations for each council page, from the council's own consultation platform.

Works where the council runs Citizen Space (Delib), which publishes a JSON list of open consultations with start and end
dates (api/2.4/json_search_results?st=open). The host is taken from the consultations link in lib/councils.json and tried
automatically, so a council that moves to Citizen Space is picked up without a code change. Items "open" for more than
a year (standing surveys, information pages) are left out. Titles are the council's own.
"""
import datetime, json, os, sys, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
from common import councils, fetch, job, remove, write, now_iso


def citizen_space(host: str):
    for v in ("2.4", "2.3"):
        try:
            status, body, hdr = fetch(f"https://{host}/api/{v}/json_search_results?st=open", timeout=40, tries=2)
        except Exception:
            return None
        if status == 200 and body[:1] in (b"[", b"{"):
            try:
                data = json.loads(body)
                return data if isinstance(data, list) else data.get("results")
            except Exception:
                return None
    return None


def main():
    with job("consultations") as st:
        today, stamp, total, found = datetime.date.today(), now_iso(), 0, []
        for c in councils():
            link = (c.get("links") or {}).get("consultations") or ""
            host = urllib.parse.urlparse(link).netloc
            if not host: continue
            items = citizen_space(host)
            if items is None: continue
            rows = []
            for it in items:
                try:
                    opens = datetime.datetime.strptime(it.get("startdate", ""), "%Y/%m/%d").date()
                    closes = datetime.datetime.strptime(it.get("enddate", ""), "%Y/%m/%d").date()
                except Exception:
                    continue
                if closes < today or (closes - today).days > 365: continue
                rows.append({"council_slug": c["slug"], "title": it["title"].strip(), "url": it["url"], "opens": opens.isoformat(),
                             "closes": closes.isoformat(), "platform": "Citizen Space", "retrieved_at": stamp})
            remove("council_consultations", f"council_slug=eq.{c['slug']}")
            write("council_consultations", rows, "council_slug,url")
            total += len(rows); found.append(f"{c['slug']} ({len(rows)})")
        st["rows"] = total; st["note"] = "Citizen Space: " + (", ".join(found) or "none")


if __name__ == "__main__": main()
