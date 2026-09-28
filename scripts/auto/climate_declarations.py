"""Weekly: each council's own climate-emergency motion, as a sourced line on its council page (open-data brief, section 5).

The list of leads is "Local authority climate emergency declarations" (mySociety and Climate Emergency UK, CC BY 4.0):
  https://mysociety.github.io/la-plans-promises/data/local_authority_climate_emergency_declarations/latest/declarations.csv
Its quality is poor for our purposes (404 rows, 167 with a real link, most from 2019, flags in free text), so nothing in it
is shown. It is used only to find documents: for a row whose motion_url is on the council's own website (the registrable
domain of the council's home page in council_register), the document is fetched; a line is published only if it is still
there and contains the words "climate emergency". The line is the first sentence of the document that contains those words
in a form of words where the council itself declares (see DECLARE), and is not about a petition, an amendment, another
council or a speaker (NOT_THE_DECISION),
verbatim, with the document's link and a date only where the document itself gives one near the top. Everything else:
nothing. The table's rows for this dataset are replaced on every run, so a document that disappears takes its line with it.

Usage: python scripts/auto/climate_declarations.py [--from DIR]   (dry run without the service key; --from reads declarations.csv from DIR)
"""
import csv, datetime, io, json, os, re, sys, urllib.parse, concurrent.futures
sys.path.insert(0, os.path.dirname(__file__))
from common import DRY, ROOT, fetch, job, norm, now_iso, page_text, quote_found, remove, select, write

DATASET = "mySociety and Climate Emergency UK, Local authority climate emergency declarations (CC BY 4.0)"
CSV_URL = "https://mysociety.github.io/la-plans-promises/data/local_authority_climate_emergency_declarations/latest/declarations.csv"
PHRASE = "climate emergency"
MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December"
DATE = re.compile(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s+({MONTHS})\s+(20\d\d)\b|\b({MONTHS})\s+(\d{{1,2}})(?:st|nd|rd|th)?,?\s+(20\d\d)\b|\b(\d{{1,2}})/(\d{{1,2}})/(20\d\d)\b")


def domain(url: str) -> str:
    """The registrable part of a UK public-sector host: councillorsupport.bedford.gov.uk -> bedford.gov.uk."""
    h = urllib.parse.urlparse(url).netloc.lower().split(":")[0]
    h = h[4:] if h.startswith("www.") else h
    parts = h.split(".")
    for i in range(len(parts)):
        tail = ".".join(parts[i:])
        if tail.count(".") == 2 and tail.endswith((".gov.uk", ".gov.wales", ".gov.scot", ".llyw.cymru", ".org.uk", ".co.uk")): return tail
    return h


# The sentence shown must be the council declaring: "this Council resolves / declares / commits", "declares a climate
# emergency", "resolves to declare", "has been declared by", "decision to declare"; and not a petition, an amendment,
# another council, reported speech ("he said"), a declaration of interest, or the website's furniture. Fixed words, no
# judgement: a document with no such sentence gets no line.
DECLARE = re.compile(r"(?i)\b(?:this |the )?council\b[^.;]{0,40}?\b(?:resolves|declares|commits|declared|has declared)\b|\bdeclar(?:e|es|ed|ing)\s+(?:an?\s+)?(?:immediate\s+)?[‘'\"]?climate emergency|\bresolves?\s+to\s+declare\b|\bclimate emergency has been declared by\b|\bdecision to declare a climate emergency\b")
NOT_THE_DECISION = re.compile(r"(?i)\b(petition|amendment|cookies?|spoke on|statement made by|should have been|list of motions|other (?:councils|authorities)|councils across|calls? for councils|urging|(?:he|she|they) (?:said|stated|added|considered|noted)|a member|declared an interest|sign in|asking the|around the world|on behalf of)\b")


def first_sentence_with(text: str, phrase: str) -> str | None:
    flat = re.sub(r"\s+", " ", text)
    for m in re.finditer(r"[^.!?\n]*?" + re.escape(phrase) + r"[^.!?\n]*[.!?]?", flat, re.I):
        s = m.group(0).strip(" -•·")
        if 30 <= len(s) <= 400 and DECLARE.search(s) and not NOT_THE_DECISION.search(s): return s
    return None


def date_near_top(text: str) -> str | None:
    """A full date in the first 1,500 characters of the document (a minutes heading, a news dateline), or nothing."""
    head = re.sub(r"\s+", " ", text[:1500])
    m = DATE.search(head)
    if not m: return None
    try:
        if m.group(1): d = datetime.datetime.strptime(f"{m.group(1)} {m.group(2)} {m.group(3)}", "%d %B %Y")
        elif m.group(4): d = datetime.datetime.strptime(f"{m.group(5)} {m.group(4)} {m.group(6)}", "%d %B %Y")
        else: d = datetime.datetime.strptime(f"{m.group(7)}/{m.group(8)}/{m.group(9)}", "%d/%m/%Y")
        return d.date().isoformat()
    except ValueError:
        return None


def title_of(body: bytes, content_type: str) -> str | None:
    if body[:5] == b"%PDF-" or "pdf" in content_type.lower(): return None
    m = re.search(r"(?is)<title[^>]*>(.*?)</title>", body.decode("utf-8", "replace"))
    t = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", m.group(1))).strip() if m else None
    return t[:200] if t else None


def check(lead: dict, council: dict):
    url = lead["motion_url"]
    try:
        st, body, h = fetch(url, browser=True, timeout=45, tries=1)
    except Exception as ex:
        return None, f"not fetched ({str(ex)[:60]})"
    if st != 200: return None, f"HTTP {st}"
    ct = h.get("Content-Type", "")
    text = page_text(body, ct)
    if text.startswith("__"): return None, "unreadable"
    sentence = first_sentence_with(text, PHRASE)
    if not sentence: return None, "words absent" if PHRASE not in norm(text) else "no sentence in which the council declares"
    if not quote_found(sentence, norm(text)): return None, "sentence check failed"
    return {"council_code": council["code"], "topic": "environment", "url": url, "quote": sentence, "title": title_of(body, ct), "doc_date": date_near_top(text),
            "publisher": council["official_name"], "dataset": DATASET, "checked_at": now_iso()}, "published"


def main():
    with job("climate declarations") as st:
        if "--from" in sys.argv:
            text = open(os.path.join(sys.argv[sys.argv.index("--from") + 1], "declarations.csv"), encoding="utf-8-sig").read()
        else:
            status, body, _ = fetch(CSV_URL, timeout=300, tries=3)
            if status != 200: raise RuntimeError(f"{CSV_URL}: HTTP {status}")
            text = body.decode("utf-8-sig", "replace")
        leads = [r for r in csv.DictReader(io.StringIO(text)) if r.get("motion_url", "").startswith("http")]
        try:
            reg = {r["code"]: r for r in select("/council_register?select=code,official_name,home_page,la_type&current=eq.true")}
        except SystemExit as ex:
            if not (DRY and "Could not find the table" in str(ex)): raise
            reg = {r["code"]: r for r in json.load(open(os.path.join(ROOT, "scripts", "sql", "council_register.json")))["rows"]}
        own = []
        for lead in leads:
            c = reg.get(lead["local-authority-code"])
            if c and c.get("home_page") and domain(lead["motion_url"]) == domain(c["home_page"]): own.append((lead, c))
        with concurrent.futures.ThreadPoolExecutor(8) as ex:
            results = list(ex.map(lambda t: check(*t), own))
        rows = [r for r, _ in results if r]
        why = {}
        for _, w in results: why[w] = why.get(w, 0) + 1
        print(f"{len(leads)} leads with a link; {len(own)} on the council's own domain; published {len(rows)}; " + ", ".join(f"{k} {v}" for k, v in sorted(why.items())), flush=True)
        for r in rows: print(f"  {r['publisher']} | {r['doc_date'] or 'undated'} | {r['quote'][:140]} | {r['url'][:80]}", flush=True)
        remove("council_lines", f"dataset=eq.{urllib.parse.quote(DATASET)}")
        write("council_lines", rows, "council_code,topic,url")
        st["rows"] = len(rows); st["note"] = f"{len(own)} leads on councils' own sites, {len(rows)} lines published; " + ", ".join(f"{k} {v}" for k, v in sorted(why.items()))


if __name__ == "__main__": main()
