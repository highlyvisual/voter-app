"""Weekly: the result of each council agenda item, read from the published minutes (phase 1 of docs/automation).

For every past Full Council or Cabinet item on a council page (council_agenda_items), once the council has published the
minutes, this records what the minutes say happened: carried, lost, withdrawn, deferred, noted or agreed, the recorded
vote if the minutes give one, the exact sentence, and a link to the printed minutes. Nothing is inferred: an item gets a
result only when one of the fixed forms of words below (SET_WORDS) appears in that item's own minute text, and only one
outcome is found. Everything else goes to outcome_queue with its passage, for a reader to answer later; an answer is
published only after the word-for-word check in verify().

Where the text comes from. Each council's Modern.gov web service (GetMeeting) carries, once the minutes are published,
the minute text of every agenda item separately (minutesnonemptyhtmlbody), so each item is read on its own with no
cutting. Where a council publishes only a PDF, the printed minutes are read with pdftotext and cut at the minute numbers.
The link shown is the council's own "Printed minutes" PDF for the meeting, taken from the meeting page.

Usage:
  python scripts/auto/motion_outcomes.py                       # read new minutes (dry run without the service key)
  python scripts/auto/motion_outcomes.py --councils a,b --table  # a few councils; print item / outcome / sentence / method
  python scripts/auto/motion_outcomes.py --verify              # publish answered queue rows that pass the word check
No AI is called from this file.
"""
import datetime, html, os, re, subprocess, sys, tempfile, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__))))
from common import DRY, fetch, job, norm, now_iso, patch, select, write
from fetch_council_meetings import BROWSER_UA as BROWSER_COUNCILS, COUNCILS, SLOW as SLOW_COUNCILS

OUTCOMES = ("carried", "lost", "withdrawn", "deferred", "noted", "agreed")
SLOW = SLOW_COUNCILS | {"wiltshire"}   # Wiltshire's server answers, but takes 15-90 s a call (27 Sept 2026)

# ---------- the fixed forms of words ----------
# Each entry: outcome, regular expression. A paragraph of the item's minute text yields at most one outcome: the first
# entry that matches, in this order. Uppercase forms are deliberate: minutes put the verdict in capitals ("the motion
# was CARRIED"), while lower-case "it was noted that" is discussion, not a result. "Motion" here means the substantive
# motion; paragraphs about an amendment or a procedural motion are left out first (SKIP below), so an amendment that
# fell does not read as the motion falling.
MOTION = r"(?:substantive\s+)?(?:motion|recommendations?|proposals?|proposition|resolution)"
PAPER = r"(?:report|update|minutes|presentation|position|item|plan|statement|contents|information|progress|recommendations?|proposals?|application)"
SET_WORDS = [
    ("withdrawn", rf"(?i)\b(?:{MOTION}|item|report|application|notice of motion)\b[^.;]{{0,60}}?\b(?:was|were|had been|has been|be|is)\s+withdrawn\b"),
    ("withdrawn", r"(?i)\bwithdrew\s+(?:the|their|his|her)\s+motion\b|\bwithdrawn from the agenda\b"),
    ("deferred", rf"(?i)\b(?:{MOTION}|item|report|matter|decision|consideration|application)\b[^.;]{{0,60}}?\b(?:was|were|be|is|had been)\s+(?:deferred|adjourned)\b"),
    ("deferred", r"(?i)\b(?:deferred|adjourned)\s+(?:to|until)\s+(?:the|a)\s+(?:next|future|later|subsequent)\s+meeting\b"),
    ("lost", rf"(?i)\b{MOTION}\b[^.;]{{0,60}}?\b(?:was|were|be)\s+(?:declared\s+|therefore\s+)?(?:lost|defeated|not\s+carried|not\s+agreed|rejected)\b"),
    ("lost", rf"(?i)\b{MOTION}\b[^.;]{{0,40}}?\bfell\b"),
    ("lost", r"\b(?:LOST|FELL|NOT CARRIED|DEFEATED)\b"),                       # capitals only: the verdict as minutes print it
    ("carried", r"(?i)\bmotion\b[^.;]{0,60}?\b(?:was|were|be)\s+(?:declared\s+|therefore\s+|duly\s+)?(?:carried|agreed|approved|passed|adopted)\b"),
    ("carried", r"(?i)\bcarried\s+(?:unanimously|nem\.?\s*con)\b"),
    ("carried", r"\bCARRIED\b"),                                                # capitals only ("carried out" in prose must not count)
    ("agreed", r"\bRESOLVED\b|\bResolved\s*:|\bAGREED\b"),
    ("agreed", r"(?i)\b(?:council|cabinet|committee|executive|members)\s+resolved\b|\bit was (?:unanimously\s+|therefore\s+)?agreed\b"),
    ("agreed", r"(?i)^decisions?:?\s+(?:that\s+)?(?:the\s+)?(?:cabinet|council|full council|executive|committee)\b"),
    ("agreed", rf"(?i)^(?:the\s+)?{PAPER}\b[^.;]{{0,60}}?\b(?:was|were)\s+(?:approved|agreed|adopted|accepted|endorsed)\b"),   # at the start of a paragraph only
    ("noted", rf"(?i)^(?:the\s+)?{PAPER}\b[^.;]{{0,40}}?\b(?:was|were)\s+noted\b"),
    ("noted", r"(?i)^decisions?:?\s+.{0,80}?\b(?:was|were)\s+noted\b"),
    ("noted", r"\bNOTED\b"),                                                    # capitals only ("Cllr X noted that" is discussion)
]
SET_WORDS = [(o, re.compile(p)) for o, p in SET_WORDS]
# A numbered or bulleted point is the content of a resolution, not a verdict of its own ("2. The slippage ... be noted").
POINT = re.compile(r"^(?:\(?\d{1,2}[.)]|\(?[a-z][.)]|\([ivx]+\)|[·•–-])\s")
# Paragraphs about something other than the substantive motion or the item itself.
SKIP = re.compile(r"(?i)\b(?:amendments?|alterations?|amended motion|procedural motion|question be now put|closure motion|motion to (?:extend|continue|adjourn)|additional wording|became part of the (?:substantive )?motion)\b")
# Headings that follow a decision in Modern.gov minutes; a merged unit stops before them.
NEXT_HEADING = re.compile(r"(?i)^(?:reasons? for (?:the )?decisions?|other options considered|alternative options(?: considered)?|options considered)\b")
# Recorded votes, in the forms councils use: "Votes for the motion (45)", "For: 23", "23 votes for, 12 against and 3 abstentions", "by 23 votes to 12".
VOTE_FORMS = [
    re.compile(r"(?i)\bvotes?\s+(?:for|in favour)(?:\s+(?:of\s+)?the\s+(?P<what>\w+))?\s*[:\-–]?\s*\(?(\d+)\)?.{0,60}?\bvotes?\s+against(?:\s+the\s+\w+)?\s*[:\-–]?\s*\(?(\d+)\)?(?:.{0,60}?\b(?:votes?\s+in\s+)?abst(?:ain(?:ed|ing)?|entions?)\s*[:\-–]?\s*\(?(\d+)\)?)?"),
    re.compile(r"\bFor[:\-–]\s*(\d+)\b.{0,40}?\bAgainst[:\-–]\s*(\d+)\b(?:.{0,40}?\bAbst(?:ain(?:ed)?|entions?)[:\-–]\s*(\d+)\b)?"),
    re.compile(r"(?i)\b(\d+)\s+(?:votes?\s+)?(?:for|in favour)\b[,;]?\s*(?:and\s+)?(\d+)\s+(?:votes?\s+)?against\b(?:[,;]?\s*(?:and\s+|with\s+)?(\d+)\s+abst(?:aining|entions?))?"),
    re.compile(r"(?i)\bby\s+(\d+)\s+votes?\s+to\s+(\d+)\b(?:[,;]?\s*(?:and\s+|with\s+)?(\d+)\s+abst(?:aining|entions?))?"),
]


def tag(x: str, name: str) -> str:
    m = re.search(rf"<{name}>(.*?)</{name}>", x, re.S)
    return html.unescape(html.unescape(m.group(1))).strip() if m else ""   # Modern.gov double-encodes entities


def paragraphs(h: str) -> list[str]:
    """The minute text as the council's own paragraphs, tags removed, whitespace collapsed."""
    h = re.sub(r"\s+", " ", h)   # the council's HTML wraps lines inside a paragraph; only tags mark paragraph ends
    h = re.sub(r"(?i)</(?:p|div|li|tr|h\d|td)>|<br\s*/?>", "\n", h)
    t = html.unescape(re.sub(r"<[^>]+>", " ", h))
    out = []
    for p in t.split("\n"):
        p = re.sub(r"[\s\xa0]+", " ", p).strip()
        if p: out.append(p)
    return out


def units(paras: list[str]) -> list[str]:
    """Join a heading-only line ("Decision", "That Cabinet:", "RESOLVED THAT:") to the paragraph that follows it, so the
    recorded sentence carries the resolution as well as the word. A line ending in a colon or comma is always continued;
    at most six lines are joined, and never past a "Reasons for the decision" heading."""
    out, i = [], 0
    while i < len(paras):
        u, n = paras[i], 1
        while (u.endswith((":", ",")) or (len(u) <= 120 and not re.search(r"[.!?]$", u))) and i + n < len(paras) and n < 6 and len(u) < 700 and not NEXT_HEADING.match(paras[i + n]):
            u = u + " " + paras[i + n]; n += 1
        out.append(u); i += n
    return out


def sentence_of(unit: str, m: re.Match) -> str:
    """The sentence(s) of the unit that carry the match, verbatim, at most about 500 characters."""
    if len(unit) <= 500: return unit
    bounds = [0] + [x.end() for x in re.finditer(r"(?<=[.!?])\s+(?=[A-Z(\d])", unit)] + [len(unit)]
    start = max(b for b in bounds if b <= m.start()); end = min(b for b in bounds if b >= m.end())
    s = unit[start:end].strip()
    return s if len(s) <= 500 else s[:500].rsplit(" ", 1)[0] + " …"


def read_votes(text: str):
    """The recorded vote, when the passage has exactly one, or exactly one labelled as the vote on the motion itself
    ("Votes for the motion (86)" beside "Votes for the amendment (23)"). Otherwise none: never a guess between two."""
    found = []
    for rx in VOTE_FORMS:
        for m in rx.finditer(text):
            g = m.groups()[-3:]
            what = (m.groupdict().get("what") or "").lower()
            found.append((what, (int(g[0]), int(g[1]), int(g[2]) if g[2] else None)))
    distinct = {v for _, v in found}
    if len(distinct) == 1: return distinct.pop()
    on_motion = {v for w, v in found if w in ("motion", "substantive", "recommendation", "recommendations", "proposal")}
    if len(on_motion) == 1: return on_motion.pop()
    return None, None, None


def set_words(passage_html: str):
    """(outcome, sentence, votes, note). outcome is None when the fixed words do not settle it."""
    paras = paragraphs(passage_html)
    hits = []
    for u in units(paras):
        if SKIP.search(u) or POINT.match(u): continue
        for outcome, rx in SET_WORDS:
            m = rx.search(u)
            if m:
                hits.append((outcome, sentence_of(u, m))); break
    outcomes = {o for o, _ in hits}
    if not hits: return None, None, (None, None, None), "no fixed wording found"
    if len(outcomes) > 1: return None, None, (None, None, None), "more than one outcome in the fixed wording: " + ", ".join(sorted(outcomes))
    # A motion's verdict is its final vote, so the last sentence; a resolution is best quoted from its first line.
    hit = hits[-1] if hits[0][0] in ("carried", "lost") else hits[0]
    return hit[0], hit[1], read_votes(" ".join(paras)), None


# ---------- sources ----------
def get(slug: str, url: str) -> tuple[int, bytes]:
    slow = slug in SLOW
    st, body, _ = fetch(url, browser=slug in BROWSER_COUNCILS, timeout=150 if slow else 60, tries=2 if slow else 1)
    return st, body


def printed_minutes_url(slug: str, base: str, meeting_id: int) -> str | None:
    """The council's own "Printed minutes" PDF, linked from the meeting page."""
    try:
        st, body = get(slug, f"{base}/ieListDocuments.aspx?MId={meeting_id}")
    except Exception:
        return None
    if st != 200: return None
    m = re.search(r'href="(documents/g\d+/[^"]*?minutes[^"]*?\.pdf\?T=\d+)"[^>]*title="Link(?:&#32;| )to(?:&#32;| )printed', body.decode("utf-8", "replace"), re.I)
    return f"{base}/" + urllib.parse.quote(html.unescape(m.group(1)), safe="/?=&") if m else None


def pdf_text(body: bytes) -> str:
    with tempfile.NamedTemporaryFile(suffix=".pdf") as f:
        f.write(body); f.flush()
        out = subprocess.run(["pdftotext", "-layout", f.name, "-"], capture_output=True, text=True, timeout=120)
        if out.returncode == 0 and out.stdout.strip(): return out.stdout
    import io
    from pdfminer.high_level import extract_text
    return extract_text(io.BytesIO(body))


def cut_pdf(text: str, numbers: list[str]) -> dict[str, str]:
    """Each minute's own passage from the printed minutes: the text from its number to the next minute's number.
    Only a number at the start of a line, on its own or followed by a capitalised heading, counts as a minute number."""
    lines = text.split("\n"); starts = {}
    for i, line in enumerate(lines):
        m = re.match(r"^\s*(\d+)\.?\s*(?:$|[A-Z])", line)
        if m and m.group(1) in numbers and m.group(1) not in starts: starts[m.group(1)] = i
    order = sorted(starts.items(), key=lambda kv: kv[1]); out = {}
    for k, (n, i) in enumerate(order):
        j = order[k + 1][1] if k + 1 < len(order) else len(lines)
        out[n] = "<p>" + "</p><p>".join(html.escape(l.strip()) for l in lines[i + 1:j] if l.strip()) + "</p>"
    return out


# ---------- the job ----------
def select_if_exists(path: str) -> list:
    """A dry run before the migration is applied sees no outcome tables; treat them as empty. A real run must fail."""
    try:
        return select(path)
    except SystemExit as ex:
        if DRY and "Could not find the table" in str(ex):
            print(f"[dry run] {path.split('?')[0]} does not exist yet (migration not applied); treating as empty"); return []
        raise
def read(councils_wanted: set[str] | None, table: bool):
    today = datetime.date.today().isoformat(); stamp = now_iso()
    items = select(f"/council_agenda_items?select=council_slug,body,meeting_id,meeting_date,item_id,item_number,title,kind,url&meeting_date=lt.{today}&kind=neq.placeholder&order=meeting_date")
    done = {(r["council_slug"], r["meeting_id"], r["item_id"]) for r in select_if_exists("/council_item_outcomes?select=council_slug,meeting_id,item_id")}
    done |= {(r["council_slug"], r["meeting_id"], r["item_id"]) for r in select_if_exists("/outcome_queue?select=council_slug,meeting_id,item_id")}
    meetings = {}
    for r in items:
        if councils_wanted and r["council_slug"] not in councils_wanted: continue
        if (r["council_slug"], r["meeting_id"], r["item_id"]) in done: continue
        meetings.setdefault((r["council_slug"], r["meeting_id"]), []).append(r)
    outcomes, queue, log, rows_out = [], [], [], []
    read_meetings, unpublished, failed = 0, 0, []
    for (slug, mid), rs in sorted(meetings.items()):
        base = COUNCILS.get(slug)
        if not base: continue
        try:
            st, body = get(slug, f"{base}/mgWebService.asmx/GetMeeting?lMeetingId={mid}")
            if st != 200: raise RuntimeError(f"HTTP {st}")
        except Exception as ex:
            failed.append(f"{slug} {mid} ({str(ex)[:60]})"); print(f"{slug} {mid}: not read ({ex})", flush=True); continue
        x = body.decode("utf-8", "replace")
        if tag(x, "minutepublished") != "True":
            unpublished += 1; continue
        by_id, numbers = {}, {}
        for it in re.findall(r"<agendaitem>(.*?)</agendaitem>", x, re.S):
            iid = tag(it, "agendaitemid"); n = tag(it, "minutesitemnumber")
            by_id[iid] = tag(it, "minutesnonemptyhtmlbody"); numbers[iid] = n
        minutes_url = printed_minutes_url(slug, base, mid) or rs[0]["url"]
        if not any(by_id.values()) and minutes_url != rs[0]["url"]:   # a council that publishes only the PDF: cut it by minute number
            try:
                st, pdf = get(slug, minutes_url)
                if st == 200 and pdf[:5] == b"%PDF-":
                    cut = cut_pdf(pdf_text(pdf), [n for n in numbers.values() if n and n != "0"])
                    by_id = {iid: cut.get(n, "") for iid, n in numbers.items()}
            except Exception as ex:
                print(f"{slug} {mid}: minutes PDF not read ({ex})", flush=True)
        read_meetings += 1
        for r in rs:
            key = {"council_slug": slug, "meeting_id": mid, "item_id": r["item_id"]}
            passage = by_id.get(str(r["item_id"]), "")
            text = " ".join(paragraphs(passage))
            if not text:
                queue.append({**key, "passage": "", "minutes_url": minutes_url, "status": "rejected", "note": "The minutes have no text for this item.", "queued_at": stamp})
                rows_out.append((slug, r, "—", "", "no minute text", minutes_url)); continue
            outcome, sentence, (vf, va, vab), note = set_words(passage)
            if outcome:
                outcomes.append({**key, "outcome": outcome, "votes_for": vf, "votes_against": va, "abstentions": vab, "sentence": sentence, "minutes_url": minutes_url, "method": "set-words", "read_at": stamp})
                log.append({"claim_id": None, "event": "council outcome published", "actor": "motion outcomes job", "detail": f"{slug}: {r['body']} {r['meeting_date']}, item {r['item_number'] or ''} \"{r['title'][:80]}\": {outcome} (set-words). {minutes_url}"})
                rows_out.append((slug, r, outcome + (f" ({vf}–{va}" + (f", {vab} abst." if vab is not None else "") + ")" if vf is not None else ""), sentence, "set-words", minutes_url))
            else:
                queue.append({**key, "passage": text[:20000], "minutes_url": minutes_url, "status": "open", "note": note, "queued_at": stamp})
                rows_out.append((slug, r, "—", text[:160], "queued: " + note, minutes_url))
    if table:
        print("\n| Council | Meeting | Item | Outcome | Sentence | Method |\n|---|---|---|---|---|---|")
        for slug, r, outcome, sentence, method, _ in rows_out:
            esc = lambda s: s.replace("|", "\\|").replace("\n", " ")
            print(f"| {slug} | {r['body']} {r['meeting_date']} | {esc(r['item_number'] or '')} {esc(r['title'][:70])} | {outcome} | {esc(sentence)} | {method} |")
    write("council_item_outcomes", outcomes, "council_slug,meeting_id,item_id")
    write("outcome_queue", queue, "council_slug,meeting_id,item_id")
    write("change_log", log)
    return outcomes, queue, read_meetings, unpublished, failed


def verify():
    """Publish answered queue rows whose sentence is in the passage word for word (whitespace and quotes normalised) and
    whose outcome is in the fixed list. Anything else is marked rejected, and the page says the result could not be read."""
    stamp = now_iso(); published, rejected = 0, 0
    for q in select("/outcome_queue?status=eq.answered"):
        filt = f"council_slug=eq.{urllib.parse.quote(q['council_slug'])}&meeting_id=eq.{q['meeting_id']}&item_id=eq.{q['item_id']}"
        s = (q.get("answer_sentence") or "").strip(); o = (q.get("answer_outcome") or "").strip().lower()
        why = None
        if o not in OUTCOMES: why = f"outcome '{o}' is not in the fixed list"
        elif not s or norm(s) not in norm(q["passage"]): why = "the sentence is not in the minutes word for word"
        if why:
            patch("outcome_queue", filt, {"status": "rejected", "note": why}); rejected += 1; continue
        write("council_item_outcomes", [{"council_slug": q["council_slug"], "meeting_id": q["meeting_id"], "item_id": q["item_id"], "outcome": o,
                                         "votes_for": q.get("answer_votes_for"), "votes_against": q.get("answer_votes_against"), "abstentions": q.get("answer_abstentions"),
                                         "sentence": s, "minutes_url": q["minutes_url"], "minutes_published": q.get("minutes_published"), "method": "reader", "read_at": stamp}],
              "council_slug,meeting_id,item_id")
        write("change_log", [{"claim_id": None, "event": "council outcome published", "actor": "motion outcomes job",
                              "detail": f"{q['council_slug']}: meeting {q['meeting_id']} item {q['item_id']}: {o} (reader answer, checked word for word by {q.get('answered_by') or 'unknown'}). {q['minutes_url']}"}])
        patch("outcome_queue", filt, {"status": "published", "note": None}); published += 1
    return published, rejected


def main():
    args = sys.argv[1:]
    wanted = set(args[args.index("--councils") + 1].split(",")) if "--councils" in args else None
    with job("motion outcomes") as st:
        if "--verify" in args:
            p, r = verify(); st["rows"] = p; st["note"] = f"verify: {p} published, {r} rejected"
            return
        outcomes, queue, meetings, unpublished, failed = read(wanted, "--table" in args)
        st["rows"] = len(outcomes)
        st["note"] = (f"{meetings} meetings with minutes read: {len(outcomes)} results by set words, {len(queue)} queued; {unpublished} past meetings without minutes yet"
                      + (f"; not read: {', '.join(failed)}" if failed else ""))


if __name__ == "__main__": main()
