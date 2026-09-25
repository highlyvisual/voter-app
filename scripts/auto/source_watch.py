"""Weekly: re-read every source the site quotes, check each quotation is still there, and archive a copy.

For every source in the ledger (party and candidate publications behind the live claims) and every council fact in
lib/councils.json, this job:
  1. fetches the page or PDF and records the HTTP status;
  2. checks that each quotation taken from it is still present, word for word (ignoring case, punctuation and line
     breaks), and records which ones are not;
  3. records a SHA-256 of the readable text, so a change of wording is visible even where the quotes survive;
  4. asks the Internet Archive to keep a copy (Save Page Now) the first time a source is seen, and again when its
     text changes, so there is an independent record of what the source said when we quoted it.
It never edits a claim. What it finds goes into source_checks and the weekly review issue, for a person to act on.
"""
import datetime, os, sys, time, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
from common import councils, fetch, job, norm, page_text, patch, quote_found, select, sha, write, now_iso

ARCHIVE_BUDGET = int(os.environ.get("ARCHIVE_BUDGET", "15"))       # new captures a run; anonymous Save Page Now refuses bursts
ARCHIVE_GAP = 25                                                    # seconds between captures
TIME_BUDGET = int(os.environ.get("SOURCE_WATCH_MINUTES", "35")) * 60


def existing_snapshot(url: str, max_days: int = 180):
    """A capture the Internet Archive already holds from the last six months, if any (no new capture needed)."""
    try:
        st, body, _ = fetch(f"https://archive.org/wayback/available?url={urllib.parse.quote(url, safe='')}", timeout=30, tries=2)
        import json
        snap = (json.loads(body).get("archived_snapshots") or {}).get("closest") or {}
        if snap.get("available") and str(snap.get("status", "200")).startswith("2"):
            when = datetime.datetime.strptime(snap["timestamp"][:8], "%Y%m%d").date()
            if (datetime.date.today() - when).days <= max_days:
                return snap["url"].replace("http://", "https://")
    except Exception:
        pass
    return None


def archive(url: str):
    """Save Page Now (anonymous). The service redirects to the new snapshot; the final URL is the archived copy."""
    import urllib.request
    req = urllib.request.Request(f"https://web.archive.org/save/{url}", headers={"User-Agent": "What's It To Me? (whatsittome.org) source archiving; hello@whatsittome.org"})
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            final = r.geturl()
            if "/web/" in final and "/save/" not in final: return final, None
            loc = r.headers.get("Content-Location") or ""
            if loc.startswith("/web/"): return "https://web.archive.org" + loc, None
            return None, f"archive returned HTTP {r.status} without a snapshot address"
    except Exception as ex:
        return None, f"archive failed: {ex}"[:200]


def main():
    with job("source watch") as st:
        t0 = time.time(); stamp = now_iso()
        targets = {}  # url -> {"kind", "ref", "quotes": [(ref, quote)]}
        srcs = {s["id"]: s for s in select("/sources?select=id,url,title,publisher")}
        for cl in select("/current_claims?select=id,source_id,source_quote"):
            s = srcs.get(cl["source_id"])
            if not s or not s.get("url"): continue
            t = targets.setdefault(s["url"], {"kind": "claim_source", "ref": f"source {s['id']}", "quotes": []})
            t["quotes"].append((f"claim {cl['id']}", cl["source_quote"] or ""))
        for c in councils():
            for f in c.get("facts", []):
                if not f.get("url"): continue
                t = targets.setdefault(f["url"], {"kind": "council_fact", "ref": f"{c['slug']}:{f['topic']}", "quotes": []})
                if f.get("quote"): t["quotes"].append((f"{c['slug']}:{f['topic']}", f["quote"]))
        last = {}
        for r in select("/source_checks?select=url,sha256,archive_url,checked_at&order=checked_at.asc"):
            prev = last.setdefault(r["url"], {"sha256": None, "archived": None, "checked": ""})
            prev["checked"] = r["checked_at"]
            if r.get("sha256"): prev["sha256"] = r["sha256"]
            if r.get("archive_url"): prev["archived"] = r["archive_url"]
        rows, archived, missing, unreachable = [], 0, 0, 0
        # Oldest-checked first (never-checked first of all), so a run cut short by the time budget is picked up next week.
        for url, t in sorted(targets.items(), key=lambda kv: (last.get(kv[0], {}).get("checked", ""), kv[0])):
            if time.time() - t0 > TIME_BUDGET:
                print("time budget reached; the rest are checked next week"); break
            try:
                status, body, hdr = fetch(url, browser=True, timeout=40, tries=1)
            except Exception as ex:
                status, body, hdr = None, b"", {}
            row = {"url": url, "kind": t["kind"], "ref": t["ref"], "checked_at": stamp, "http_status": status,
                   "quotes_total": len(t["quotes"]), "quotes_found": None, "missing_refs": None, "sha256": None, "changed": None, "archive_url": None, "note": None}
            ctype = hdr.get("Content-Type", "")
            is_sheet = any(x in ctype for x in ("spreadsheet", "opendocument", "ms-excel", "text/csv")) or url.lower().split("?")[0].endswith((".ods", ".xlsx", ".xls", ".csv"))
            if status == 200 and body and is_sheet:
                row["sha256"] = sha(body.hex()[:2_000_000]); prev = last.get(url, {})
                row["changed"] = bool(prev.get("sha256") and prev["sha256"] != row["sha256"])
                row["note"] = "spreadsheet: quotations are not checked automatically"
                row["archive_url"] = prev.get("archived")
            elif status == 200 and body:
                text = page_text(body, ctype)
                tn = norm(text)
                digest = sha(tn); row["sha256"] = digest
                prev = last.get(url, {})
                row["changed"] = bool(prev.get("sha256") and prev["sha256"] != digest)
                miss = [ref for ref, q in t["quotes"] if not quote_found(q, tn)]
                row["quotes_found"] = len(t["quotes"]) - len(miss); row["missing_refs"] = miss or None
                missing += len(miss)
                if not prev.get("archived") and not row["changed"]:
                    row["archive_url"] = existing_snapshot(url)   # most sources are already captured; reuse a recent copy
                if not row["archive_url"] and (not prev.get("archived") or row["changed"]) and archived < ARCHIVE_BUDGET and time.time() - t0 < TIME_BUDGET * 0.8:
                    snap, note = archive(url); archived += 1
                    row["archive_url"] = snap; row["note"] = note
                    time.sleep(ARCHIVE_GAP)
                elif prev.get("archived"):
                    row["archive_url"] = prev["archived"]
            else:
                unreachable += 1
                row["note"] = "could not be read automatically (blocked, moved or offline)"
            rows.append(row)
            print(status, len(t["quotes"]), row["quotes_found"], url[:100], flush=True)
            if len(rows) % 20 == 0: write("source_checks", rows[-20:])   # save as we go, so a cut-short run keeps its work
            time.sleep(1)
        write("source_checks", rows[len(rows) - len(rows) % 20:])
        # Put the newest archived copy on the source itself, so every card quoting it can link to it.
        held = {s["url"]: s.get("archive_url") for s in select("/sources?select=url,archive_url")}
        for r in rows:
            if r["kind"] == "claim_source" and r.get("archive_url") and held.get(r["url"]) != r["archive_url"]:
                patch("sources", "url=eq." + urllib.parse.quote(r["url"], safe=""), {"archive_url": r["archive_url"], "archived_at": stamp})
        st["rows"] = len(rows)
        st["note"] = f"{len(targets)} sources; {unreachable} unreadable; {missing} quotations not found; {archived} archived this run"


if __name__ == "__main__": main()
