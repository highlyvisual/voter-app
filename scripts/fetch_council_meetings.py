"""Council meetings and agenda items from each council's Modern.gov web service (no key; public data).

Romily, round six (24 Sept 2026): the council page should show what the council is actually deciding, with sources, and
Full Council motions labelled with the group that proposed them. This takes only the two bodies that decide for the whole
council (Full Council, and Cabinet or Executive), in a fixed window (183 days back, 92 ahead), in date and agenda order.
It removes only mechanical items: section headings, procedural items from a fixed public list, and private (exempt) items,
whose titles are withheld by the council anyway. Nothing is ranked, matched to a ward or chosen by us. The list of
procedural titles is PROCEDURAL below; it is public in the repository and on the council page.

Usage:
  python scripts/fetch_council_meetings.py              # writes scripts/sql/council_meetings.json
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python scripts/fetch_council_meetings.py --load
"""
import datetime, html, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request

COUNCILS = {  # slug (lib/councils.json) -> Modern.gov base URL
    "lambeth": "https://moderngov.lambeth.gov.uk",
    "brighton-and-hove": "https://democracy.brighton-hove.gov.uk",
    "cotswold": "https://meetings.cotswold.gov.uk",
    "milton-keynes": "https://milton-keynes.moderngov.co.uk",
    "windsor-and-maidenhead": "https://rbwm.moderngov.co.uk",
    "blackpool": "https://democracy.blackpool.gov.uk",
    "wiltshire": "https://cms.wiltshire.gov.uk",
    "camden": "https://democracy.camden.gov.uk",  # blocks automated access (403) as of 24 Sept 2026; kept so it is tried
    # Added 25 Sept 2026 (council pages round two). Bases as each council links them from its own website.
    "northumberland": "https://northumberland.moderngov.co.uk",
    "stroud": "https://stroud.moderngov.co.uk",
    "north-west-leicestershire": "https://minutes-1.nwleics.gov.uk",
    "newcastle-under-lyme": "https://moderngov.newcastle-staffs.gov.uk",
    "south-kesteven": "https://moderngov.southkesteven.gov.uk",
    "argyll-and-bute": "https://www.argyll-bute.gov.uk/moderngov",
    "bassetlaw": "https://bassetlaw.moderngov.co.uk",
    "halton": "https://councillors.halton.gov.uk",  # slow (30-40 s a call)
    "aberdeen-city": "https://aberdeen.moderngov.co.uk",
    "leeds": "https://democracy.leeds.gov.uk",  # refuses anything but a full browser User-Agent (see BROWSER_UA)
    "flintshire": "https://committeemeetings.flintshire.gov.uk",  # unreachable from the research machine; kept so it is tried
    "mid-devon": "https://democracy.middevon.gov.uk",  # as above
    "east-hertfordshire": "https://democracy.eastherts.gov.uk",  # as above
    "newark-and-sherwood": "https://democracy.newark-sherwooddc.gov.uk",  # as above
    "carmarthenshire": "https://democracy.carmarthenshire.gov.wales",  # 403 to automated access; kept so it is tried
}
# Councils whose servers turn away a named reader: for these alone we send an ordinary browser User-Agent.
BROWSER_UA = {"leeds"}
# Councils whose Full Council meeting is listed under the council's own name rather than "Council".
EXTRA_BODIES = {"argyll-and-bute": {"argyll and bute council": "Full Council"}}
BODIES = {"council": "Full Council", "full council": "Full Council", "council meeting": "Full Council", "meeting of the council": "Full Council",
          "cabinet": "Cabinet", "executive": "Cabinet", "the executive": "Cabinet"}
BACK, AHEAD = 183, 92
PROCEDURAL = set("""procedural business; apologies; apologies for absence; apologies and substitutions; apologies for absence and substitutions;
declarations of interest; declarations of interests; disclosures of interest; declaration of interests; declarations of members interests; minutes;
minutes of the previous meeting; minutes of the last meeting; minutes and actions of the previous meeting; part two minutes of the previous meeting;
chairs communications; chairs communication; chairs announcements; mayors communications; mayors announcements; leader and portfolio holders announcements;
announcements from the chair leader or chief executive; welcome and introductions; welcome introductions and apologies; to appoint a chair for the meeting;
election of chair; appointment of chair; appointment of vice chair; call over; callover; call over for reports of committees; public involvement;
member involvement; public questions; member questions; members questions; questions from members of the public; questions from members; written questions from members of the public;
written questions from councillors; oral questions from councillors; deputations from members of the public; deputations; petitions; to receive petitions and e petitions;
petitions for debate; petition s for debate; issues raised by members; matters referred to the executive; representations from opposition members;
items referred for council; reports for decision; reports for information; reports referred for information; for information; urgent business;
urgent items; any other business; items for the next meeting; work programme; forward work programme; forward plan; exclusion of the press and public;
exclusion of press and public; exclusion of public and press; part two proceedings; part two; part 2; break; close of meeting; date of next meeting;
next meeting; notices of motion; notice of motions; notice of motion; motions; motions on notice; major applications; minor applications; information items; councillors items;
announcements; leader and cabinet announcements; leaders announcements; cabinet announcements; mayors announcements and communications;
declarations of pecuniary interest; declarations of pecuniary interests; declaration of pecuniary interests; declaration of pecuniary interest;
public participation; public participation and questions from members; councillors questions; councillor questions; questions from councillors;
council minutes; cabinet minutes; election of mayor; election of deputy mayor; appointment of deputy mayor;
public open forum; public question and answer session; question and answer session; public question time; questions by the public; questions by members;
questions from members of the council; members open questions; open questions from councillors; executive questions; referrals; references from other bodies;
chairmans announcements; members; officers; declarations; reporting minutes; communications; leaders and portfolio holders announcements;
disclosure of exempt information; matters exempt from publication; council business planner; no urgent business; no exempt business; receipt of petitions;
petitions and deputations; reports; reports from cabinet and committees""".replace("\n", " ").split("; "))
PROCEDURAL = {p.strip() for p in PROCEDURAL if p.strip()}
PATTERNS = [r"^\d.*refreshment break$", r"^residents? questions", r"^minutes of .*meeting", r"^co chair election", r"^procedural motion",
            r"^report of mayoral activities", r"^mayoral report", r"^review of allocation of seats", r"^review of political balance",
            r"exclusion of (the )?(press and )?public", r"^notices? of motions?$", r"^public representations$", r"^appointments?( of committees)?$",
            r"^declarations? of", r"^disclosures? of", r"^suspension of (council )?procedure rules", r"^report s of the cabinet member",
            r"^any other business", r"^outstanding minutes", r"forward plan$", r"^communications", r"^vote of thanks", r"^report on appointments$",
            r"^election of (a |the )?(lord )?(mayor|deputy mayor|vice chair|chair)", r"^appointment of (a )?(vice )?chair", r"^calendar of meetings",
            r"^council meeting dates",
            # Romily, round six q8 and q9: no attendance and no allowances, anywhere on the site.
            r"attendance", r"allowances", r"remuneration panel"]
PROPOSER = re.compile(r"\b(?:from|by|in the names? of|proposed by)\s+((?:Cllrs?|Councillors?)\.?\s+[^.;:()]+)", re.I)
NAMED = re.compile(r"^\s*((?:Cllrs?|Councillors?)\.?\s+[A-Z][\w'’-]*(?:\s+[A-Z][\w'’-]*){0,3})\s*$")  # a motion titled with its proposer alone
GROUP = re.compile(r"\b(Green|Labour|Conservative|Liberal Democrats?|Lib Dem|Reform UK|Independent|Plaid Cymru|SNP)\s+(?:Party\s+)?Group\b", re.I)
UA = {"User-Agent": "What's It To Me? (whatsittome.org) council meetings reader; hello@whatsittome.org"}
BROWSER = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"}


def norm(t: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", t.lower().replace("’", "").replace("'", ""))).strip()


def get(url: str, browser: bool = False) -> str:
    # Some councils' servers are slow (Brighton and Hove, Halton: 30-90 s a call), so wait up to two minutes and try twice.
    for attempt in range(2):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=BROWSER if browser else UA), timeout=120) as r:
                return r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError:
            raise
        except Exception:
            if attempt: raise
            time.sleep(10)


def tag(x: str, name: str) -> str:
    m = re.search(rf"<{name}>(.*?)</{name}>", x, re.S)
    # Modern.gov double-encodes entities inside XML text (&amp;#39;), so unescape twice.
    return html.unescape(html.unescape(m.group(1))).strip() if m else ""


def text(h: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", html.unescape(h)))).strip()


def fetch(slug: str, base: str, today: datetime.date):
    ws = f"{base}/mgWebService.asmx"
    b = slug in BROWSER_UA
    cx = get(f"{ws}/GetCommittees?lDummy=0", b)
    bodies = []
    for c in re.findall(r"<committee>(.*?)</committee>", cx, re.S):
        title = tag(c, "committeetitle")
        if tag(c, "committeeexpired") == "True" or tag(c, "committeedeleted") == "True":
            continue
        known = {**BODIES, **EXTRA_BODIES.get(slug, {})}
        if norm(title) in known:
            bodies.append((tag(c, "committeeid"), title, known[norm(title)]))
    frm, to = (today - datetime.timedelta(days=BACK)).strftime("%d/%m/%Y"), (today + datetime.timedelta(days=AHEAD)).strftime("%d/%m/%Y")
    rows = []
    for cid, ctitle, body in bodies:
        mx = get(f"{ws}/GetMeetings?lCommitteeId={cid}&sFromDate={frm}&sToDate={to}", b)
        for m in re.findall(r"<meeting>(.*?)</meeting>", mx, re.S):
            mid, mdate, status = tag(m, "meetingid"), tag(m, "meetingdate"), tag(m, "meetingstatus")
            d = datetime.datetime.strptime(mdate, "%d/%m/%Y").date().isoformat()
            url = f"{base}/ieListDocuments.aspx?CId={cid}&MId={mid}"
            gx = get(f"{ws}/GetMeeting?lMeetingId={mid}", b)
            items = re.findall(r"<agendaitem>(.*?)</agendaitem>", gx, re.S)
            published = tag(gx, "agendapublished") == "True"
            kept = 0
            for it in items:
                title = tag(it, "agendaitemtitle")
                number = tag(it, "fulldisplaynumberformat") or tag(it, "agendaitemnumber")
                n = norm(title)
                if not title or tag(it, "agendaitemnumber") in ("0", ""):
                    continue
                if n in PROCEDURAL or any(re.search(p, n) for p in PATTERNS):
                    continue
                if tag(it, "isrestricted") == "True" or re.search(r"\(exempt|exempt category|part two|part 2|confidential", title, re.I):
                    continue
                body_text = text(tag(it, "agendatext"))
                is_motion = bool(re.search(r"\bmotion\b", title, re.I)) or bool(re.search(r"^\s*(this council|council) (notes|believes|resolves)", body_text, re.I))
                g = (GROUP.search(title + " " + body_text) or PROPOSER.search(title) or PROPOSER.search(body_text) or NAMED.match(title)) if is_motion else None
                rows.append({"council_slug": slug, "body": body, "committee_title": ctitle, "meeting_id": int(mid), "meeting_date": d,
                             "meeting_status": status, "item_id": int(tag(it, "agendaitemid")), "item_number": number, "title": title,
                             "kind": "motion" if is_motion else "item", "proposer": ((g.group(1) if g.re in (PROPOSER, NAMED) else g.group(0)).strip() if g else None), "url": url})
                kept += 1
            if not items or not published:
                rows.append({"council_slug": slug, "body": body, "committee_title": ctitle, "meeting_id": int(mid), "meeting_date": d,
                             "meeting_status": status, "item_id": -int(mid), "item_number": "", "title": "Agenda not yet published",
                             "kind": "placeholder", "proposer": None, "url": url})
    return rows


def load(rows, slugs_ok):
    url = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1"; key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    h = {"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json"}
    def req(path, method, body=None, prefer=None):
        hh = dict(h)
        if prefer: hh["Prefer"] = prefer
        try:
            urllib.request.urlopen(urllib.request.Request(url + path, data=json.dumps(body).encode() if body is not None else None, method=method, headers=hh), timeout=60)
        except urllib.error.HTTPError as ex:
            raise SystemExit(f"Database refused {method} {path.split('?')[0]}: HTTP {ex.code} {ex.read().decode()[:400]}")
    for slug in slugs_ok:  # replace each council's window wholesale: this is a view of the council's own record, not a ledger
        req(f"/council_agenda_items?council_slug=eq.{urllib.parse.quote(slug)}", "DELETE")
    for i in range(0, len(rows), 500):
        req("/council_agenda_items", "POST", rows[i:i + 500], "return=minimal")


if __name__ == "__main__":
    today = datetime.date.today()
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    all_rows, ok, failed = [], [], []
    for slug, base in COUNCILS.items():
        try:
            r = fetch(slug, base, today)
            for x in r: x["retrieved_at"] = now
            all_rows += r; ok.append(slug)
            print(f"{slug}: {sum(1 for x in r if x['kind'] != 'placeholder')} items, {len({x['meeting_id'] for x in r})} meetings", flush=True)
        except Exception as ex:  # a council that blocks or times out is named, not silently dropped
            failed.append(slug); print(f"{slug}: FAILED ({ex})", flush=True)
    out = os.path.join(os.path.dirname(__file__), "sql", "council_meetings.json")
    json.dump({"retrieved_at": now, "window_days": [BACK, AHEAD], "ok": ok, "failed": failed, "rows": all_rows}, open(out, "w"), indent=1, ensure_ascii=False)
    print(f"wrote {len(all_rows)} rows to {out}; failed: {', '.join(failed) or 'none'}")
    if "--load" in sys.argv:
        load(all_rows, ok); print("loaded")
        url = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1/job_runs"; key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        note = f"{len(ok)} councils read, {len(all_rows)} rows; not read: {', '.join(failed) or 'none'}"
        urllib.request.urlopen(urllib.request.Request(url, data=json.dumps([{"job": "council meetings", "started_at": now, "ok": bool(ok), "rows": len(all_rows), "note": note}]).encode(),
                                                      method="POST", headers={"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json", "Prefer": "return=minimal"}), timeout=60)
