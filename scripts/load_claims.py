"""Load drafted claims from scripts/claims/*.json into the ledger with the service-role key (env SUPABASE_URL,
SUPABASE_SERVICE_ROLE_KEY). Run by .github/workflows/load-claims.yml so the key never leaves GitHub.

Each file: {"sources": [{"key", "title", "url", "publisher", "published_on", "layer", "notes"}],
            "claims":  [{"source_key", "ballot_paper_id", "dc_person_id" | null, "party_ec_id", "topic",
                         "claim_text", "source_quote", "applies_if", "precision", "drafted_by"}]}

Rules enforced here, matching app/review/actions.ts:
- a source is reused if a row with the same url already exists, otherwise inserted;
- a claim is skipped if a verified row with the same ballot, party, topic and source_quote already exists (idempotent);
- every inserted claim is status "verified", tier "documented", applies_if carries _published_by_source_rule, and a
  "published" event is written to change_log with the file name so the ledger shows where it came from;
- rows are only ever inserted, never updated (the ledger is append-only).
"""
import glob, json, os, sys, urllib.request, urllib.error, urllib.parse

URL = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1"; KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
TOPICS = {"money_and_cost_of_living", "housing_and_property", "healthcare_and_social_care", "education_and_universities",
          "environment_climate_and_energy", "immigration_and_borders", "crime_policing_and_justice",
          "defence_foreign_affairs_and_eu", "equality_and_rights"}
LAYERS = {"manifesto", "enacted_record", "candidate_statement", "campaign_leaflet", "third_party_analysis"}


def req(path, method="GET", body=None, prefer=None):
    h = dict(H)
    if prefer: h["Prefer"] = prefer
    try:
        r = urllib.request.urlopen(urllib.request.Request(URL + path, data=json.dumps(body).encode() if body is not None else None, method=method, headers=h), timeout=60)
    except urllib.error.HTTPError as ex:
        raise SystemExit(f"Database refused {method} {path.split('?')[0]}: HTTP {ex.code} {ex.read().decode()[:600]}")
    return json.load(r) if r.status != 204 and r.headers.get("Content-Type", "").startswith("application/json") else None


def q(s): return urllib.parse.quote(s, safe="")


files = sorted(glob.glob(os.path.join(os.path.dirname(__file__), "claims", "*.json")))
if not files: raise SystemExit("no files in scripts/claims/")
inserted = skipped = 0
for f in files:
    d = json.load(open(f)); name = os.path.basename(f)
    # validate before touching the database
    for s in d.get("sources", []):
        assert s["layer"] in LAYERS, f"{name}: bad layer {s['layer']}"
        assert s["url"].startswith("http"), f"{name}: bad url {s['url']}"
    for c in d.get("claims", []):
        assert c["topic"] in TOPICS, f"{name}: bad topic {c['topic']}"
        assert c.get("precision") in ("measurable", "aspiration"), f"{name}: precision missing"
        assert c["source_quote"].strip(), f"{name}: empty quote"
        assert any(s["key"] == c["source_key"] for s in d["sources"]), f"{name}: unknown source_key {c['source_key']}"
    # sources: reuse by url
    src_ids = {}
    for s in d.get("sources", []):
        ex = req(f"/sources?select=id&url=eq.{q(s['url'])}&limit=1")
        if ex:
            src_ids[s["key"]] = ex[0]["id"]
        else:
            row = {k: s.get(k) for k in ["title", "url", "publisher", "published_on", "layer", "notes"]}
            src_ids[s["key"]] = req("/sources", "POST", [row], "return=representation")[0]["id"]
    # candidates: resolve dc_person_id to candidate id on this ballot
    for c in d.get("claims", []):
        cand_id = None
        if c.get("dc_person_id"):
            got = req(f"/candidates?select=id&ballot_paper_id=eq.{q(c['ballot_paper_id'])}&dc_person_id=eq.{c['dc_person_id']}&limit=1")
            if not got: raise SystemExit(f"{name}: no candidate {c['dc_person_id']} on {c['ballot_paper_id']}")
            cand_id = got[0]["id"]
        dup = req(f"/current_claims?select=id&ballot_paper_id=eq.{q(c['ballot_paper_id'])}&topic=eq.{c['topic']}&source_quote=eq.{q(c['source_quote'])}"
                  + (f"&party_ec_id=eq.{q(c['party_ec_id'])}" if c.get("party_ec_id") else "") + "&limit=1")
        if dup:
            skipped += 1; continue
        applies = dict(c.get("applies_if") or {}); applies["_published_by_source_rule"] = True
        row = {"ballot_paper_id": c["ballot_paper_id"], "candidate_id": cand_id, "party_ec_id": c.get("party_ec_id"), "topic": c["topic"],
               "tier": "documented", "claim_text": c["claim_text"], "source_id": src_ids[c["source_key"]], "source_quote": c["source_quote"],
               "applies_if": applies, "status": "verified", "drafted_by": c.get("drafted_by", "ai:claude (drafted from the published text; quote checked verbatim)"),
               "precision": c["precision"]}
        new = req("/claims", "POST", [row], "return=representation")[0]
        req("/change_log", "POST", [{"claim_id": new["id"], "event": "published", "actor": "loader", "detail": f"Published under the source rule from scripts/claims/{name}."}], "return=minimal")
        inserted += 1
    print(f"{name}: done")
print(f"inserted {inserted}, skipped {skipped} already present")
