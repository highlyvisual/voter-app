"""Load scripts/sql/ingest.json into Supabase with the service-role key (env SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Preserves hand-set fields.

Also, since 25 Sept 2026: marks candidacies Democracy Club no longer lists as withdrawn (and clears the mark if one
reappears), archives ballots the day after polling, and records the run in job_runs for /status."""
import json, os, urllib.request, urllib.error, datetime
STARTED = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
NOW = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
URL = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1"; KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
def req(path, method="GET", body=None, prefer=None):
    h = dict(H); 
    if prefer: h["Prefer"] = prefer
    try:
        r = urllib.request.urlopen(urllib.request.Request(URL + path, data=json.dumps(body).encode() if body is not None else None, method=method, headers=h), timeout=60)
    except urllib.error.HTTPError as ex:
        raise SystemExit(f"Database refused {method} {path.split('?')[0]}: HTTP {ex.code} {ex.read().decode()[:600]}")
    return json.load(r) if r.status != 204 and r.headers.get("Content-Type", "").startswith("application/json") else None
def req_all(path):
    out, off = [], 0
    while True:
        r = req(f"{path}&limit=1000&offset={off}") or []
        out += r
        if len(r) < 1000: return out
        off += 1000
d = json.load(open(os.path.join(os.path.dirname(__file__), "sql", "ingest.json")))
req("/parties?on_conflict=ec_id", "POST", d["parties"], "resolution=ignore-duplicates,return=minimal")
existing = {r["ballot_paper_id"]: r for r in req_all("/ballots?select=ballot_paper_id,previous_ballot_paper_id,area_lat,area_lng,area_point_note,area_gss,postponed,postponed_note")}
for b in d["ballots"]:
    ex = existing.get(b["ballot_paper_id"]) or {}
    for k in ["previous_ballot_paper_id", "area_lat", "area_lng", "area_point_note", "area_gss"]:
        if b.get(k) is None and ex.get(k) is not None: b[k] = ex[k]
    for k in ["postponed", "postponed_note"]:
        if ex.get(k) is not None: b[k] = ex[k]
for b in d["ballots"]: b["retrieved_at"] = NOW   # record when each ballot was last refreshed from Democracy Club
# One request per ballot: a batch must have identical fields in every row, but existing ballots carry hand-set
# fields (map point, previous result) that new ballots do not have yet. Writing each on its own lets new rows take
# the table's defaults and leaves anything not supplied untouched.
for b in d["ballots"]:
    req("/ballots?on_conflict=ballot_paper_id", "POST", [b], "resolution=merge-duplicates,return=minimal")
print(f"loaded {len(d['ballots'])} ballots at {NOW}")
exc = {(r["ballot_paper_id"], r["dc_person_id"]): r for r in req_all("/candidates?select=ballot_paper_id,dc_person_id,statement_to_voters,statement_retrieved_at,parliament_member_id,parliament_match_note,previous_candidacies_count,homepage_url,wikipedia_url,withdrawn_at")}
keys = ["ballot_paper_id","dc_person_id","dc_person_url","name","surname_sort","party_ec_id","party_name_on_ballot","party_description_on_ballot","homepage_url","wikipedia_url","statement_to_voters_present","statement_to_voters","statement_retrieved_at","previous_candidacies_count","parliament_member_id","parliament_match_note"]
rows = []
for c in d["candidates"]:
    ex = exc.get((c["ballot_paper_id"], c["dc_person_id"])) or {}
    r = {k: c.get(k) for k in keys}
    if not r["statement_to_voters"] and ex.get("statement_to_voters"): r.update(statement_to_voters=ex["statement_to_voters"], statement_to_voters_present=True, statement_retrieved_at=ex["statement_retrieved_at"])
    r["parliament_member_id"] = ex.get("parliament_member_id"); r["parliament_match_note"] = ex.get("parliament_match_note")
    # A person not re-read tonight keeps what we already hold for them.
    for k in ["previous_candidacies_count", "homepage_url", "wikipedia_url"]:
        if r.get(k) is None and ex.get(k) is not None: r[k] = ex[k]
    if r.get("previous_candidacies_count") is None: r["previous_candidacies_count"] = 0
    rows.append(r)
req("/candidates?on_conflict=ballot_paper_id,dc_person_id", "POST", rows, "resolution=merge-duplicates,return=minimal")
print("loaded", len(d["ballots"]), "ballots", len(rows), "candidates")

# Withdrawals: for each ballot fetched tonight, a candidacy we hold that Democracy Club no longer lists is marked, not
# deleted (claims and leaflets may point at it). If it comes back, the mark is cleared.
withdrawn = restored = 0
for bid, people in (d.get("candidacies") or {}).items():
    if not people: continue   # an empty list before nominations close says nothing about who withdrew
    live = set(people)
    for (b, pid), ex in exc.items():
        if b != bid: continue
        if pid not in live and not ex.get("withdrawn_at"):
            req(f"/candidates?ballot_paper_id=eq.{bid}&dc_person_id=eq.{pid}", "PATCH", {"withdrawn_at": NOW}, "return=minimal"); withdrawn += 1
        elif pid in live and ex.get("withdrawn_at"):
            req(f"/candidates?ballot_paper_id=eq.{bid}&dc_person_id=eq.{pid}", "PATCH", {"withdrawn_at": None}, "return=minimal"); restored += 1

# Archive: the day after polling day a ballot leaves the "current" lists; its page stays reachable by link.
yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
old = req(f"/ballots?select=ballot_paper_id&archived=eq.false&poll_date=lt.{yesterday}") or []
if old: req(f"/ballots?archived=eq.false&poll_date=lt.{yesterday}", "PATCH", {"archived": True}, "return=minimal")
failed = d.get("failed") or []
note = f"{len(d['ballots'])} ballots, {len(rows)} candidacies; {withdrawn} withdrawn, {restored} restored; {len(old)} ballots archived" + (f"; NOT FETCHED: {', '.join(failed)}" if failed else "")
print(note)
req("/job_runs", "POST", [{"job": "ballot ingest", "started_at": STARTED, "ok": not failed, "rows": len(rows), "note": note}], "return=minimal")
