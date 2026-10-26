#!/usr/bin/env python3
"""Combined authorities, mayors and the Greater London Authority: one page each at /authority/[slug] (Romily, round ten,
q3: "Start now. Combined authorities and mayors first, parishes later").

Writes lib/authorities.json. Nothing in it is typed by hand: every fact comes from one of the sources below, fetched by
this script, and carries the source it came from. Where a fact can't be fetched mechanically it is left out and the page
says it hasn't been read yet.

  Which authorities, and the councils in each   ONS Open Geography Portal: the newest "Local Authority District to
                                                Combined Authority" lookup, "LAD to County and Unitary Authority" (for
                                                county councils) and "LAD to Region" (London's 33 councils). OGL v3.
  What each one is and does (quoted)            MHCLG, "English devolution: Area factsheets" (GOV.UK content API), one
                                                section per authority; each paragraph quoted as published. OGL v3.
  The legal "areas of competence" for its tier  MHCLG, "Devolution Framework Explainers" (one PDF per tier), the
                                                "Area of Competence" headings as printed. OGL v3.
  The mayor, and when they were elected         Democracy Club: EveryElection (which mayoral elections exist) and the
                                                candidates API (who was elected at the latest one). CC BY 4.0.
  The next mayoral election                     Democracy Club EveryElection: a future, uncancelled election only.
  Its website                                   mySociety's council register (scripts/sql/council_register.json), else
                                                Wikidata (CC0) on an exact name match; checked by fetching it.
  Meetings, budget and mayor links              The authority's own home page: the first link whose words say so,
                                                with those words kept, so a reader can see why it was chosen.
  What a regional mayor is (quoted)             Institute for Government, "Regional mayors" explainer: two sentences,
                                                kept only if found word for word on the page.

Usage: python scripts/loaders/authorities.py   (weekly, by the "Data files" workflow). Needs `requests`, and Poppler's
pdftotext for the explainer PDFs (without it the competence headings are left out and the page says so).
"""
from __future__ import annotations

import html
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "lib" / "authorities.json"
REGISTER = ROOT / "scripts" / "sql" / "council_register.json"
UA = {"User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)"}
S = requests.Session()
S.headers.update(UA)

ARCGIS = "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services"
FACTSHEETS = "/government/publications/english-devolution-area-factsheets/english-devolution-area-factsheets"
EXPLAINERS = "/government/publications/english-devolution-and-community-empowerment-bill-devolution-framework-explainers"
IFG = "https://www.instituteforgovernment.org.uk/explainer/regional-mayors-devolution"
# The two sentences from the IfG explainer the page quotes. The script only checks they are still there, word for word;
# if either has gone, it is dropped and the page goes without it.
IFG_QUOTES = [
    "Regional mayors are directly-elected leaders who chair mayoral strategic authorities (also known as combined authorities) to which specified functions and budgets have been devolved from Whitehall.",
    "The specifics of the powers of MSAs vary from place to place but typically include aspects of transport, skills, housing, and local infrastructure investment, and in some cases spatial planning, policing, health and employment support.",
]
EE = "https://elections.democracyclub.org.uk/api/elections/"
DC = "https://candidates.democracyclub.org.uk/api/next"
GLA_NAME = "Greater London Authority"
LONDON = "E12000007"


def get(url: str, tries: int = 4, timeout: int = 60, **kw) -> requests.Response:
    for i in range(tries):
        try:
            r = S.get(url, timeout=(15, timeout), **kw)
            if r.status_code in (429, 500, 502, 503, 504):
                raise RuntimeError(f"HTTP {r.status_code}")
            return r
        except Exception as ex:
            if i == tries - 1:
                raise
            print(f"  retry {i + 1} for {url[:80]}: {ex}", flush=True)
            time.sleep(10 * (i + 1))
    raise RuntimeError("unreachable")


def text(fragment: str) -> str:
    """HTML to the words a reader sees, spaces tidied; nothing else changed."""
    t = re.sub(r"<br\s*/?>", " ", fragment)
    t = html.unescape(re.sub(r"<[^>]+>", "", t))
    return re.sub(r"\s+", " ", t.replace("​", "")).strip()


def norm(s: str) -> str:
    s = s.lower().replace("&", "and")
    s = re.sub(r"\b(mayoral|combined|county|authority|strategic|the)\b", " ", s)
    return re.sub(r"[^a-z0-9]", "", s)


def today() -> str:
    return date.today().isoformat()


# ---------------------------------------------------------------- ONS lookups
def newest(prefix: str, suffix: str) -> str:
    """The newest ONS lookup service with this shape (e.g. LAD25_CAUTH25_EN_LU), so a new edition is picked up by itself."""
    names = [s["name"] for s in get(f"{ARCGIS}?f=json").json()["services"]]
    pat = re.compile(rf"^{prefix}(\d\d)_{suffix.replace('{yy}', r'(\d\d)')}$")
    found = sorted({(int(m.group(1)), n) for n in names if (m := pat.match(n)) and m.group(1) == m.group(2)})
    if not found:
        sys.exit(f"No ONS lookup found matching {prefix}yy_{suffix}")
    return found[-1][1]


def features(service: str, where: str = "1=1") -> list[dict]:
    out, offset = [], 0
    while True:
        j = get(f"{ARCGIS}/{service}/FeatureServer/0/query", params={"where": where, "outFields": "*", "returnGeometry": "false", "f": "json", "resultOffset": offset, "resultRecordCount": 2000}).json()
        out += [f["attributes"] for f in j.get("features", [])]
        if not j.get("exceededTransferLimit"):
            return out
        offset += 2000


# ---------------------------------------------------------------- GOV.UK
def govuk(path: str) -> dict:
    return get(f"https://www.gov.uk/api/content{path}").json()


def sections(body: str) -> dict[str, dict]:
    """The factsheet's sections, one per authority: each paragraph or list as published, grouped under its bold label."""
    out: dict[str, dict] = {}
    parts = re.split(r'<h2 id="([^"]+)">(.*?)</h2>', body)
    for i in range(1, len(parts), 3):
        anchor, title, chunk = parts[i], text(parts[i + 1]), parts[i + 2]
        blocks = re.findall(r"<(p|ul)>(.*?)</\1>", chunk, flags=re.S)
        sec = {"anchor": anchor, "title": title, "intro": [], "labelled": {}}
        label = None
        for tag, inner in blocks:
            if tag == "ul":
                items = [text(li) for li in re.findall(r"<li>(.*?)</li>", inner, flags=re.S)]
                target = sec["labelled"][label] if label else sec["intro"]
                target.append({"list": items})
                continue
            m = re.match(r"\s*<strong>(.*?)</strong>\s*:?\s*(.*)$", inner, flags=re.S)
            if m:
                label = text(m.group(1)).rstrip(":").strip()
                rest = text(m.group(2)).lstrip(": ")
                while rest.startswith(label + ":"):   # one section repeats its own label ("Fire functions: Fire functions: ...")
                    rest = rest[len(label) + 1:].lstrip()
                sec["labelled"].setdefault(label, [])
                if rest:
                    sec["labelled"][label].append({"p": rest})
            else:
                (sec["labelled"][label] if label else sec["intro"]).append({"p": text(inner)})
        out[title] = sec
    return out


TIER_PAT = re.compile(r"\bis an? ((?:non-mayoral )?(?:Established )?(?:Mayoral |Foundation )?(?:Strategic|Combined) Authority)\b")


def tier_of(sentence: str) -> str | None:
    m = TIER_PAT.search(sentence)
    return m.group(1) if m else None


def explainer_for(tier: str, explainers: dict[str, str]) -> str | None:
    """The explainer whose title names this tier. Checked in this order so "non-mayoral" never reads as "Mayoral"."""
    t = tier.lower()
    if "non-mayoral" in t or ("foundation" in t and "mayoral" not in t):
        key = "Non-Mayoral Foundation Strategic Authorities"
    elif "established" in t:
        key = "Established Mayoral Strategic Authorities"
    elif "mayoral" in t:
        key = "Mayoral Strategic Authorities"
    else:
        return None
    return next((title for title in explainers if title.endswith(": " + key)), None)


def pdf_text(url: str) -> str | None:
    body = get(url, timeout=120).content
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf") as f:
            f.write(body)
            f.flush()
            r = subprocess.run(["pdftotext", f.name, "-"], capture_output=True, text=True, timeout=120)
            return r.stdout if r.returncode == 0 else None
    except FileNotFoundError:
        print("  pdftotext is not installed: competence headings left out", flush=True)
        return None


def competences(pdf: str) -> list[str]:
    seen: list[str] = []
    for m in re.finditer(r"Area of Competence\s*[:–-]\s*([^\n]+)", pdf):
        h = re.sub(r"\s+", " ", m.group(1)).strip()
        if h and h not in seen:
            seen.append(h)
    return seen


# ---------------------------------------------------------------- websites
def fetch_home(url: str) -> tuple[str, str] | None:
    """The page at url, if it answers 200 on the same site (not a bot wall on some other host)."""
    try:
        r = get(url, tries=2, timeout=30, allow_redirects=True)
    except Exception as ex:
        print(f"  {url}: {ex}", flush=True)
        return None
    host = lambda u: (urlparse(u).hostname or "").removeprefix("www.")
    if r.status_code != 200 or host(r.url) != host(url) or "html" not in r.headers.get("content-type", ""):
        print(f"  {url}: HTTP {r.status_code} at {r.url[:80]}", flush=True)
        return None
    return r.url, r.text


def wikidata_site(name: str) -> tuple[str, str] | None:
    """Wikidata's official website (P856) for the one current item whose English label is exactly this name."""
    try:
        hits = get("https://www.wikidata.org/w/api.php", params={"action": "wbsearchentities", "search": name, "language": "en", "format": "json", "limit": 5}).json().get("search", [])
        live = []
        for h in hits:
            if (h.get("label") or "").strip().lower() != name.lower():
                continue
            e = get(f"https://www.wikidata.org/wiki/Special:EntityData/{h['id']}.json").json()["entities"][h["id"]]
            if e["claims"].get("P576"):
                continue   # dissolved
            sites = [c["mainsnak"].get("datavalue", {}).get("value") for c in e["claims"].get("P856", [])]
            live.append((h["id"], [s for s in sites if s]))
        if len(live) == 1 and live[0][1]:
            return live[0][1][0], f"https://www.wikidata.org/wiki/{live[0][0]}"
    except Exception as ex:
        print(f"  Wikidata {name}: {ex}", flush=True)
    return None


# Kept narrow on purpose: "Meeting net zero ambitions" is not the meetings page, and "Find out more" is not the mayor's.
LINK_WORDS = {
    "meetings": re.compile(r"\bmeetings\b|\bcommittees?\b|^(democracy|governance)\b", re.I),
    "budget": re.compile(r"\bbudgets?\b", re.I),
    "mayor_page": re.compile(r"^(?:(?:the|your|meet your|meet the)\s+)?(?:metro\s+)?mayor\b", re.I),
}


def home_links(base: str, page: str) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for href, inner in re.findall(r'<a\b[^>]*?href="([^"#][^"]*)"[^>]*>(.*?)</a>', page, flags=re.S | re.I):
        words = text(inner)
        if not words or len(words) > 60 or href.startswith(("mailto:", "tel:", "javascript:")):
            continue
        url = urljoin(base, html.unescape(href))
        if (urlparse(url).hostname or "").removeprefix("www.") != (urlparse(base).hostname or "").removeprefix("www."):
            continue   # the authority's own pages only
        for key, pat in LINK_WORDS.items():
            if key not in out and pat.search(words):
                out[key] = {"url": url, "words": words}
    return out


# ---------------------------------------------------------------- Democracy Club
def ee_mayoral() -> list[dict]:
    out, url = [], f"{EE}?election_id_regex=%5Emayor%5C.&limit=200"
    while url:
        j = get(url.replace("http://", "https://")).json()
        out += j["results"]
        url = j.get("next")
    return [e for e in out if e.get("identifier_type") == "ballot" and e.get("organisation") and not e.get("deleted")]


def dc_ballot(ballot_id: str) -> dict | None:
    url = f"{DC}/ballots/{ballot_id}/"
    tok = os.environ.get("DEMOCRACY_CLUB_TOKEN")
    r = get(url, params={"auth_token": tok} if tok else None)
    if not tok:
        time.sleep(6.5)   # unauthenticated: 10 requests a minute
    return r.json() if r.status_code == 200 else None


# ---------------------------------------------------------------- main
def main() -> None:
    sources: dict[str, dict] = {}

    # 1. Which authorities, and the councils in each (ONS).
    ca_svc = newest("LAD", "CAUTH{yy}_EN_LU")
    cty_svc = newest("LAD", "CTYUA{yy}_EW_LU_v2")
    rgn_svc = newest("LAD", "RGN{yy}_EN_LU_v2")
    ca_rows = features(ca_svc)
    cty_rows = features(cty_svc)
    rgn_rows = features(rgn_svc, f"RGN{rgn_svc[3:5]}CD='{LONDON}'")
    for key, svc, what in (("ons_ca", ca_svc, "Local Authority District to Combined Authority lookup"), ("ons_cty", cty_svc, "Local Authority District to County and Unitary Authority lookup"), ("ons_rgn", rgn_svc, "Local Authority District to Region lookup")):
        sources[key] = {"name": f"ONS Open Geography Portal, {what} ({svc})", "url": f"{ARCGIS}/{svc}/FeatureServer/0", "publisher": "Office for National Statistics", "licence": "Open Government Licence v3.0", "retrieved": today()}
    yy = ca_svc[3:5]
    authorities: dict[str, dict] = {}
    for r in ca_rows:
        code, name = r[f"CAUTH{yy}CD"], r[f"CAUTH{yy}NM"]
        a = authorities.setdefault(code, {"code": code, "name": name, "kind": "combined", "councils": []})
        a["councils"].append({"gss": r[f"LAD{yy}CD"], "name": r[f"LAD{yy}NM"], "tier": "lad"})
    authorities["E61000001"] = {"code": "E61000001", "name": GLA_NAME, "kind": "gla",
                                "councils": [{"gss": r[f"LAD{rgn_svc[3:5]}CD"], "name": r[f"LAD{rgn_svc[3:5]}NM"], "tier": "lad"} for r in rgn_rows]}
    # County councils: a county is listed when every one of its districts is in the authority AND the factsheet names
    # it among the constituent councils (two sources agreeing, never a guess from one).
    cyy = cty_svc[3:5]
    by_county: dict[tuple[str, str], set[str]] = {}
    for r in cty_rows:
        if r[f"CTYUA{cyy}CD"].startswith("E10"):
            by_county.setdefault((r[f"CTYUA{cyy}CD"], r[f"CTYUA{cyy}NM"]), set()).add(r[f"LAD{cyy}CD"])

    # 2. What each is and does (GOV.UK area factsheets) and its tier's areas of competence (framework explainers).
    fs = govuk(FACTSHEETS)
    secs = sections(fs["details"]["body"])
    sources["factsheets"] = {"name": "MHCLG, English devolution: Area factsheets", "url": f"https://www.gov.uk{FACTSHEETS}", "publisher": "Ministry of Housing, Communities and Local Government", "licence": "Open Government Licence v3.0", "updated": (fs.get("public_updated_at") or "")[:10], "retrieved": today()}
    ex = govuk(EXPLAINERS)
    explainers = {a["title"].strip(): a["url"] for a in ex["details"].get("attachments", []) if a.get("content_type") == "application/pdf"}
    sources["explainers"] = {"name": "MHCLG, Devolution Framework Explainers", "url": f"https://www.gov.uk{EXPLAINERS}", "publisher": "Ministry of Housing, Communities and Local Government", "licence": "Open Government Licence v3.0", "updated": (ex.get("public_updated_at") or "")[:10], "retrieved": today()}
    comp_cache: dict[str, list[str]] = {}

    # 3. Democracy Club: mayoral elections and their winners.
    ee = ee_mayoral()
    sources["everyelection"] = {"name": "Democracy Club, EveryElection", "url": "https://elections.democracyclub.org.uk/", "publisher": "Democracy Club", "licence": "CC BY 4.0", "retrieved": today()}
    sources["dc_candidates"] = {"name": "Democracy Club candidates", "url": "https://candidates.democracyclub.org.uk/", "publisher": "Democracy Club", "licence": "CC BY 4.0", "retrieved": today()}

    # 4. Websites: mySociety's register first, then Wikidata.
    reg = {r["gss_code"]: r for r in json.loads(REGISTER.read_text())["rows"] if r.get("la_type") in ("COMB", "SRA") and r.get("current")}
    sources["register"] = {"name": "mySociety, UK Local Authorities, with WhatDoTheyKnow home pages", "url": "https://pages.mysociety.org/uk_local_authority_names_and_codes/", "publisher": "mySociety", "licence": "CC BY 4.0 / CC BY-SA 4.0", "retrieved": json.loads(REGISTER.read_text()).get("retrieved_at", "")[:10]}
    sources["wikidata"] = {"name": "Wikidata, official website (P856)", "url": "https://www.wikidata.org/", "publisher": "Wikimedia Foundation", "licence": "CC0", "retrieved": today()}

    # 5. The IfG's two general sentences, if still there word for word.
    ifg_page = text(get(IFG).text).replace("’", "'")
    ifg = [q for q in IFG_QUOTES if q.replace("’", "'") in ifg_page]
    sources["ifg"] = {"name": "Institute for Government, Regional mayors (explainer)", "url": IFG, "publisher": "Institute for Government", "licence": "Quoted for reference; © Institute for Government", "retrieved": today()}

    out = []
    for a in sorted(authorities.values(), key=lambda x: x["name"]):
        sec = secs.get(a["name"])
        print(f"{a['name']}: {'factsheet section found' if sec else 'NO factsheet section'}", flush=True)
        a["slug"] = sec["anchor"] if sec else re.sub(r"[^a-z0-9]+", "-", a["name"].lower()).strip("-")
        a["factsheet_anchor"] = sec["anchor"] if sec else None
        intro = [b["p"] for b in (sec["intro"] if sec else []) if "p" in b]
        first = intro[0] if intro else ""
        lead, _, after = first.partition(". ") if first else ("", "", "")
        lead = lead + "." if after else first
        a["what"] = lead or None
        a["formal_name"] = re.split(r"\s+(?:\(|is an? )", lead)[0].strip() if lead else a["name"]
        a["tier"] = tier_of(lead) if lead else None
        if a["kind"] == "gla" and sec:
            a["what_more"] = ([{"p": after}] if after else []) + sec["intro"][1:]
        a["election_note"] = next((p for p in intro if p.startswith("The Mayor is elected")), None)
        if a["kind"] == "gla" and sec:
            for b in sec["intro"]:
                for li in b.get("list", []):
                    if li.startswith("The Mayor of London") and "next election" in li:
                        a["election_note"] = li
        a["members_quote"] = next((p for p in intro if p.startswith("Its constituent councils")), None)
        lab = sec["labelled"] if sec else {}
        flat = lambda k: [b for b in lab.get(k, [])] or None
        a["police"] = flat("Police functions")
        a["fire"] = flat("Fire functions")
        a["distinctive"] = flat("Future distinctive governance arrangements") or flat("Future distinctive governance arrangement")
        # Mayoral or not, from the factsheet's own tier words; checked against EveryElection below.
        t = (a["tier"] or "").lower()
        a["mayoral"] = True if a["kind"] == "gla" else (False if "non-mayoral" in t or ("foundation" in t and "mayoral" not in t) else ("mayoral" in t or None))
        # Areas of competence for the tier (not the GLA: the factsheet says the framework applies to it case by case).
        a["competences"] = None
        if a["kind"] == "combined" and a["tier"]:
            title = explainer_for(a["tier"], explainers)
            if title:
                if title not in comp_cache:
                    pdf = pdf_text(explainers[title])
                    comp_cache[title] = competences(pdf) if pdf else []
                a["competences"] = {"tier_title": title, "url": explainers[title], "headings": comp_cache[title]} if comp_cache[title] else {"tier_title": title, "url": explainers[title], "headings": []}
        # County councils (see above).
        lads = {c["gss"] for c in a["councils"]}
        mq = (a["members_quote"] or "").lower()
        for (cc, cn), members in sorted(by_county.items()):
            if members and members <= lads and re.sub(r"\s+county$", "", cn.lower()) in mq:
                a["councils"].append({"gss": cc, "name": cn, "tier": "county"})
        a["councils"].sort(key=lambda c: (c["tier"] != "county", c["name"]))

        # Mayor and elections (Democracy Club).
        mine = [e for e in ee if norm(e["organisation"].get("official_name") or "") == norm(a["name"])]
        a["ee_org"] = mine[0]["organisation"].get("slug") if mine else None
        if a["mayoral"] is None and mine:
            a["mayoral"] = True
        past = sorted([e for e in mine if not e.get("cancelled") and e["poll_open_date"] <= today()], key=lambda e: e["poll_open_date"])
        future = sorted([e for e in mine if not e.get("cancelled") and e["poll_open_date"] > today()], key=lambda e: e["poll_open_date"])
        a["next_election"] = {"date": future[0]["poll_open_date"], "election_id": future[0]["election_id"], "title": future[0].get("election_title"), "url": f"https://elections.democracyclub.org.uk/elections/{future[0]['election_id']}/"} if future else None
        a["mayor"] = None
        if a["mayoral"] and past:
            b = dc_ballot(past[-1]["election_id"])
            won = [c for c in (b or {}).get("candidacies", []) if c.get("elected")]
            if len(won) == 1:
                w = won[0]
                pid = re.search(r"/people/(\d+)/", w["person"]["url"])
                a["mayor"] = {"name": w["person"]["name"], "party": w["party"]["name"], "party_id": w["party"].get("legacy_slug"),
                              "elected_on": past[-1]["poll_open_date"], "election": b["election"]["name"], "ballot_id": past[-1]["election_id"],
                              "source": f"https://candidates.democracyclub.org.uk/elections/{past[-1]['election_id']}/",
                              "person_page": f"https://candidates.democracyclub.org.uk/person/{pid.group(1)}/" if pid else None, "retrieved": today()}
            else:
                print(f"  {a['name']}: no single winner recorded for {past[-1]['election_id']}", flush=True)

        # Website and the links on its home page.
        a["links"] = {}
        cands = []
        r = reg.get(a["code"])
        if r and r.get("home_page"):
            cands.append((r["home_page"], "register", None))
        w = wikidata_site(a["formal_name"])
        if w:
            cands.append((w[0], "wikidata", w[1]))
        for url, src, ref in cands:
            got = fetch_home(url)
            if got:
                a["links"]["website"] = {"url": url, "source": src, "ref": ref, "checked": today(), "opened": True}
                for k, v in home_links(got[0], got[1]).items():
                    a["links"][k] = {**v, "source": "home_page", "checked": today()}
                break
        if "website" not in a["links"]:
            # Some sites turn automated readers away. A plain gov.uk home page from a named source is still listed, marked
            # as not opened, so its links are not read; anything else (a bot-check address, say) is dropped.
            plain = [c for c in cands if (urlparse(c[0]).hostname or "").endswith(".gov.uk") and not urlparse(c[0]).query]
            if plain:
                a["links"]["website"] = {"url": plain[0][0], "source": plain[0][1], "ref": plain[0][2], "checked": today(), "opened": False}
        out.append(a)

    missing = [a["name"] for a in out if not a["factsheet_anchor"]]
    if missing:
        print(f"No factsheet section for: {', '.join(missing)}", flush=True)
    doc = {"retrieved_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "sources": sources, "ifg_quotes": ifg, "authorities": out}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n")
    print(f"Wrote {OUT.relative_to(ROOT)}: {len(out)} authorities, {sum(1 for a in out if a['mayor'])} mayors, {sum(1 for a in out if a['links'].get('website'))} websites", flush=True)


if __name__ == "__main__":
    main()
