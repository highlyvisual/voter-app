"""Weekly: new publications from the parties' own websites and from GOV.UK, listed for a person to review.

This does not create claims. It notices that something new has been published (a policy paper, a press release, a
manifesto page) so the weekly review can decide whether it contains a position worth quoting. Every party is watched
the same way where its site allows it; a party whose site blocks automated reading is named in the review as needing a
manual check, so that no party is quietly watched less closely than another.
"""
import datetime, email.utils, json, os, re, sys, xml.etree.ElementTree as ET
sys.path.insert(0, os.path.dirname(__file__))
from common import fetch, job, select, write, now_iso

FEEDS = [  # (feed key, party EC id or None, url, kind)
    ("Labour: posts", "PP53", "https://labour.org.uk/wp-json/wp/v2/posts?per_page=30", "wp"),
    ("Labour: documents", "PP53", "https://labour.org.uk/labour_document-sitemap.xml", "sitemap"),
    ("Conservatives", "PP52", "https://www.conservatives.com/sitemap.xml", "sitemap"),
    ("Liberal Democrats", "PP90", "https://www.libdems.org.uk/news.rss", "rss"),
    ("Green Party", "PP63", "https://greenparty.org.uk/feed/", "rss"),
    ("SNP", "PP102", "https://www.snp.org/feed/", "rss"),
    ("Plaid Cymru", "PP77", "https://www.partyof.wales/news.rss", "rss"),
    ("Reform UK", "PP7931", "https://www.reformparty.uk/sitemap.xml", "sitemap"),
    ("GOV.UK policy papers and consultations", None, "https://www.gov.uk/search/policy-papers-and-consultations.atom", "atom"),
]


def strip_ns(root):
    for el in root.iter():
        if "}" in el.tag: el.tag = el.tag.split("}", 1)[1]
    return root


def parse_date(s):
    if not s: return None
    s = s.strip()
    try: return email.utils.parsedate_to_datetime(s).astimezone(datetime.timezone.utc).isoformat()
    except Exception: pass
    try: return datetime.datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(datetime.timezone.utc).isoformat()
    except Exception: return None


def items(kind, body):
    if kind == "wp":
        return [(p["link"], re.sub(r"<[^>]+>", "", p["title"]["rendered"]), parse_date(p.get("date_gmt", "") + "Z")) for p in json.loads(body)]
    root = strip_ns(ET.fromstring(body))
    out = []
    if kind == "rss":
        for it in root.iter("item"):
            out.append(((it.findtext("link") or "").strip(), (it.findtext("title") or "").strip(), parse_date(it.findtext("pubDate"))))
    elif kind == "atom":
        for e in root.iter("entry"):
            link = e.find("link"); href = link.get("href") if link is not None else ""
            out.append((href, (e.findtext("title") or "").strip(), parse_date(e.findtext("updated") or e.findtext("published"))))
    elif kind == "sitemap":
        subs = [l.text.strip() for l in root.iter("sitemap") for l in [l.find("loc")] if l is not None and l.text]
        for u in root.iter("url"):
            loc = (u.findtext("loc") or "").strip()
            if loc: out.append((loc, loc.rstrip("/").rsplit("/", 1)[-1].replace("-", " "), parse_date(u.findtext("lastmod"))))
        for sm in subs[:10]:  # sitemap index: follow child sitemaps
            st, b, _ = fetch(sm, browser=True, timeout=60, tries=2)
            if st == 200: out += items("sitemap", b)
    return out


def main():
    with job("party publications") as st:
        known = {(r["feed"], r["url"]) for r in select("/feed_items?select=feed,url")}
        rows, blocked, stamp = [], [], now_iso()
        cutoff = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=45)).isoformat()
        for key, party, url, kind in FEEDS:
            try:
                status, body, _ = fetch(url, browser=True, timeout=60, tries=2)
            except Exception as ex:
                status, body = None, b""
            if status != 200:
                blocked.append(f"{key} (HTTP {status})"); continue
            try:
                found = items(kind, body)
            except Exception as ex:
                blocked.append(f"{key} (unreadable: {type(ex).__name__})"); continue
            for link, title, published in found:
                if not link or (key, link) in known: continue
                if published and published < cutoff: continue   # only recent items: sitemaps list whole sites
                rows.append({"feed": key, "url": link, "title": title[:300] or None, "published": published, "first_seen": stamp})
                known.add((key, link))
        write("feed_items", rows, "feed,url")
        st["rows"] = len(rows); st["note"] = "not readable automatically: " + (", ".join(blocked) or "none")


if __name__ == "__main__": main()
