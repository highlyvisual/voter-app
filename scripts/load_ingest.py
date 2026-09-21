"""Load scripts/sql/ingest.json into Supabase with the service-role key (env SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Preserves hand-set fields."""
import json, os, urllib.request, datetime
NOW = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
URL = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1"; KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
def req(path, method="GET", body=None, prefer=None):
    h = dict(H); 
    if prefer: h["Prefer"] = prefer
    r = urllib.request.urlopen(urllib.request.Request(URL + path, data=json.dumps(body).encode() if body is not None else None, method=method, headers=h), timeout=60)
    return json.load(r) if r.status != 204 and r.headers.get("Content-Type", "").startswith("application/json") else None
d = json.load(open(os.path.join(os.path.dirname(__file__), "sql", "ingest.json")))
req("/parties?on_conflict=ec_id", "POST", d["parties"], "resolution=ignore-duplicates,return=minimal")
existing = {r["ballot_paper_id"]: r for r in req("/ballots?select=ballot_paper_id,previous_ballot_paper_id,area_lat,area_lng,area_point_note,area_gss,postponed,postponed_note")}
for b in d["ballots"]:
    ex = existing.get(b["ballot_paper_id"]) or {}
    for k in ["previous_ballot_paper_id", "area_lat", "area_lng", "area_point_note", "area_gss"]:
        if b.get(k) is None and ex.get(k) is not None: b[k] = ex[k]
    for k in ["postponed", "postponed_note"]:
        if ex.get(k) is not None: b[k] = ex[k]
for b in d["ballots"]: b["retrieved_at"] = NOW   # record when each ballot was last refreshed from Democracy Club
req("/ballots?on_conflict=ballot_paper_id", "POST", d["ballots"], "resolution=merge-duplicates,return=minimal")
print(f"loaded {len(d['ballots'])} ballots at {NOW}")
exc = {(r["ballot_paper_id"], r["dc_person_id"]): r for r in req("/candidates?select=ballot_paper_id,dc_person_id,statement_to_voters,statement_retrieved_at,parliament_member_id,parliament_match_note")}
keys = ["ballot_paper_id","dc_person_id","dc_person_url","name","surname_sort","party_ec_id","party_name_on_ballot","party_description_on_ballot","homepage_url","wikipedia_url","statement_to_voters_present","statement_to_voters","statement_retrieved_at","previous_candidacies_count","parliament_member_id","parliament_match_note"]
rows = []
for c in d["candidates"]:
    ex = exc.get((c["ballot_paper_id"], c["dc_person_id"])) or {}
    r = {k: c.get(k) for k in keys}
    if not r["statement_to_voters"] and ex.get("statement_to_voters"): r.update(statement_to_voters=ex["statement_to_voters"], statement_to_voters_present=True, statement_retrieved_at=ex["statement_retrieved_at"])
    r["parliament_member_id"] = ex.get("parliament_member_id"); r["parliament_match_note"] = ex.get("parliament_match_note")
    rows.append(r)
req("/candidates?on_conflict=ballot_paper_id,dc_person_id", "POST", rows, "resolution=merge-duplicates,return=minimal")
print("loaded", len(d["ballots"]), "ballots", len(rows), "candidates")
