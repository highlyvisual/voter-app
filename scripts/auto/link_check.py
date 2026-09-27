"""Weekly check of every outbound link the site shows, so a dead source never leaves a reader at an error page.

Collects the links from sources, local plans, candidates' own sites, ballots' official notices and lib/councils.json,
and fetches each with an ordinary browser user agent. A link is marked dead only when two attempts both give 404, 410
or a 5xx; a 403 is almost always bot protection against a data-centre address and is left alone. For a dead link the
Internet Archive's closest copy is recorded, and the site shows that copy instead, labelled "archived copy". A plain
http:// link that also works over https is recorded so the page can use the secure address.
"""
import json, os, re, sys, time, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
from common import DRY, ROOT, fetch, get_json, job, now_iso, select, write

GAP = float(os.environ.get("LINK_GAP", "0.5"))
DEAD = {404, 410, 500, 502, 503, 504, 520, 521, 522, 523, 524}


def urls() -> list[str]:
    found: set[str] = set()
    for path, col in [("/sources?select=url", "url"), ("/local_plans?select=documentation_url", "documentation_url"),
                      ("/candidates?select=homepage_url&withdrawn_at=is.null", "homepage_url"),
                      ("/ballots?select=official_sopn_url&archived=eq.false", "official_sopn_url")]:
        for r in select(path):
            if r.get(col): found.add(r[col].strip())
    text = open(os.path.join(ROOT, "lib", "councils.json")).read()
    found.update(u.rstrip(".,;:)") for u in re.findall(r'https?://[^\s"\\]+', text))
    return sorted(u for u in found if u.startswith(("http://", "https://")) and "web.archive.org" not in u)


def status(url: str) -> int:
    try:
        return fetch(url, browser=True, timeout=15, tries=1)[0]
    except Exception:
        return 599  # no answer at all


def archived(url: str) -> str | None:
    try:
        d = get_json("https://archive.org/wayback/available?url=" + urllib.parse.quote(url, safe=""), timeout=40)
        s = (d.get("archived_snapshots") or {}).get("closest")
        return s["url"].replace("http://web.archive.org", "https://web.archive.org") if s and s.get("available") else None
    except Exception:
        return None


if __name__ == "__main__":
    with job("link check") as st:
        rows, dead = [], 0
        for u in urls():
            s = status(u)
            if s in DEAD:
                time.sleep(10); s2 = status(u)
                s = s2 if s2 not in DEAD else s
            is_dead = s in DEAD
            row = {"url": u, "status": s, "dead": is_dead, "archive_url": archived(u) if is_dead else None, "https_url": None, "checked_at": now_iso()}
            if u.startswith("http://") and not is_dead:
                h = "https://" + u[len("http://"):]
                if status(h) == 200: row["https_url"] = h
            if is_dead:
                dead += 1; print(f"dead {s} {u} -> {row['archive_url'] or 'no archived copy'}", flush=True)
            rows.append(row)
            time.sleep(GAP)
        write("link_status", rows, on_conflict="url")
        st["rows"] = len(rows); st["note"] = f"{dead} dead, {sum(1 for r in rows if r['dead'] and r['archive_url'])} with an archived copy"
