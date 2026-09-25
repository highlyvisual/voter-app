"""
Ingest every current UK ballot from Democracy Club into SQL statements for the ballots/parties/candidates tables.
- ballots: level, dates, area name, official SoPN, previous contest for the same post (most recent earlier ballot), ONS centroid
- parties: id, name, parent for joint registrations
- candidates: person, party, description, links, verbatim statement to voters
Idempotent (on conflict do nothing / update statements). Run, then execute scripts/sql/ingest_*.sql.
"""
import json, urllib.request, urllib.parse, datetime, time, os, re, sys

H = {"User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)"}
TOKEN = os.environ.get("DEMOCRACY_CLUB_TOKEN")
def get(u, tries=6):
    if TOKEN and "democracyclub.org.uk" in u:
        u = u + ("&" if "?" in u else "?") + "auth_token=" + urllib.parse.quote(TOKEN)
    for i in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=40); return json.load(r)
        except urllib.error.HTTPError as ex:
            if ex.code == 429 and i < tries - 1: time.sleep(8 * (i + 1)); continue
            raise
    raise RuntimeError("unreachable")
def q(s): return "NULL" if s in (None, "") else "'" + str(s).replace("'", "''") + "'"

TODAY = datetime.date.today()

# What we already hold, so the nightly run only asks Democracy Club for what it does not know yet. Democracy Club allows
# 10 requests a minute without a token; asking again for every person every night took ~50 minutes of the monthly
# GitHub Actions allowance. People are re-read in full on Mondays (or with FULL=1) to pick up edited statements.
FULL = os.environ.get("FULL") == "1" or TODAY.weekday() == 0
def _known():
    url = (os.environ.get("SUPABASE_URL") or "https://urufvcutpksjppbjxouc.supabase.co").rstrip("/") + "/rest/v1"
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "sb_publishable_DYz0KZAckWIg4Cf_34ACSg_gXJihTW8"
    h = {"apikey": key, "Authorization": "Bearer " + key}
    def rows(path):
        out, off = [], 0
        while True:
            r = json.load(urllib.request.urlopen(urllib.request.Request(f"{url}{path}&limit=1000&offset={off}", headers=h), timeout=60))
            out += r
            if len(r) < 1000: return out
            off += 1000
    try:
        b = {r["ballot_paper_id"]: r for r in rows("/ballots?select=ballot_paper_id,previous_ballot_paper_id,area_lat")}
        c = {(r["ballot_paper_id"], r["dc_person_id"]): r for r in rows("/candidates?select=ballot_paper_id,dc_person_id,statement_to_voters_present")}
        return b, c
    except Exception as ex:
        print("could not read what we hold; fetching everything", ex); return {}, {}
KNOWN_B, KNOWN_C = _known()
ONS = "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services"

def centroid(level, name, gss=None):
    # Prefer the official GSS code: ward names repeat across the country (Claremont, Town, Queen's Park).
    if level == "parliamentary": svc, field, code_field = "Westminster_Parliamentary_Constituencies_July_2024_Boundaries_UK_BGC", "PCON24NM", "PCON24CD"
    else: svc, field, code_field = "Wards_December_2024_Boundaries_UK_BGC", "WD24NM", "WD24CD"
    where = f"{code_field}='{gss}'" if gss else f"{field}='{name.replace(chr(39), chr(39)*2)}'"
    try:
        d = get(f"{ONS}/{svc}/FeatureServer/0/query?where={urllib.parse.quote(where)}&returnCentroid=true&returnGeometry=false&outFields={field}&outSR=4326&f=json")
        feats = d.get("features", [])
        if len(feats) >= 1:
            c = feats[0].get("centroid"); return (c["y"], c["x"]) if c else (None, None)
    except Exception: pass
    return (None, None)

def previous_ballot(post_id, current_id, poll_date):
    # Same council and ward only: the ballot id prefix up to the ward slug must match. Verified against the Democracy Club results endpoint.
    prefix = re.sub(r'\.(by\.)?\d{4}-\d{2}-\d{2}$', '.', current_id)
    try:
        d = get(f"https://candidates.democracyclub.org.uk/api/next/ballots/?post_id={urllib.parse.quote(post_id)}&page_size=100")
        prev = [b for b in d.get("results", []) if b["ballot_paper_id"].startswith(prefix) and b["ballot_paper_id"] != current_id and b["election"]["election_date"] < poll_date]
        prev.sort(key=lambda b: b["election"]["election_date"], reverse=True)
        if prev: return prev[0]["ballot_paper_id"]
    except Exception: pass
    # Fallback: try the most recent scheduled dates for that council's ward
    for date in ["2026-05-07", "2025-05-01", "2024-05-02", "2023-05-04", "2022-05-05", "2021-05-06"]:
        cand = f"{prefix}{date}"
        try:
            r = get(f"https://candidates.democracyclub.org.uk/api/next/results/{cand}/")
            if r.get("candidate_results"): return cand
        except Exception: continue
    return None

def main():
    # Take the union of "current" and "future": Democracy Club's two flags do not always agree, and on 23 September
    # a live Wiltshire by-election appeared in one and not the other. Missing a ballot means a voter sees nothing.
    res = []
    for flag in ("current=true", "future=1"):
        d = get(f"https://elections.democracyclub.org.uk/api/elections/?{flag}&limit=500"); res += d["results"]
        while d.get("next"): d = get(d["next"]); res += d["results"]
    by_id = {e["election_id"]: e for e in res}
    ballots = [e for e in by_id.values() if e["identifier_type"] == "ballot" and not e["cancelled"] and datetime.date.fromisoformat(e["poll_open_date"]) >= TODAY]
    print(f"{len(ballots)} ballots to fetch ({'full refresh' if FULL else 'known people skipped'}; {len(KNOWN_C)} candidacies held)")
    sql_b, sql_p, sql_c, seen_parties = [], [], [], set()
    J = {"ballots": [], "parties": [], "candidates": []}
    failed = []
    for e in sorted(ballots, key=lambda x: x["poll_open_date"]):
        bid = e["election_id"]
        try: b = get(f"https://candidates.democracyclub.org.uk/api/next/ballots/{bid}/")
        except Exception as ex:
            # Usually rate limiting. Wait and try once more; if it still fails, record it and fail the run at the end
            # rather than quietly dropping an election from the site.
            print("retrying", bid, ex); time.sleep(30)
            try: b = get(f"https://candidates.democracyclub.org.uk/api/next/ballots/{bid}/")
            except Exception as ex2: print("FAILED", bid, ex2); failed.append(bid); continue
        etype = bid.split(".")[0]
        level = {"parl": "parliamentary", "local": "local", "mayor": "mayoral", "sp": "devolved", "senedd": "devolved", "nia": "devolved"}.get(etype, "other")
        org = (e.get("organisation") or {}).get("official_name") or ""
        post = b["post"]["label"]
        council = re.sub(r'^(The )', '', org.replace(' Council','').replace('London Borough of ','').replace('City of ','').replace('Royal Borough of ','')).strip()
        area = post if level == "parliamentary" else f"{council}: {post} ward"
        gss = ((e.get("division") or {}).get("official_identifier") or "").replace("gss:", "") or None
        kb = KNOWN_B.get(bid) or {}
        lat, lng = (None, None) if kb.get("area_lat") is not None and not FULL else centroid(level, post, gss)   # loader keeps the stored point
        prev = None if kb.get("previous_ballot_paper_id") else (previous_ballot(b["post"].get("id") or b["post"].get("slug") or "", bid, e["poll_open_date"]) if b["post"].get("id") else None)
        J["ballots"].append({"ballot_paper_id": bid, "election_id": e.get("group") or bid, "level": level, "poll_date": e["poll_open_date"], "area_name": area, "voting_system": (b.get("voting_system") or {}).get("slug") if isinstance(b.get("voting_system"), dict) else b.get("voting_system"), "by_election_reason": b.get("by_election_reason"), "candidates_locked": b["candidates_locked"], "official_sopn_url": (b.get("sopn") or {}).get("source_url"), "democracy_club_url": b["url"], "previous_ballot_paper_id": prev, "area_lat": lat, "area_lng": lng, "area_point_note": "Centroid of the ONS 2024 boundary. Statistics near this point describe the area, not any household." if lat else None, "area_gss": gss, "winner_count": b.get("winner_count") or 1, "uncontested": bool(b.get("uncontested")), "cancelled": bool(b.get("cancelled"))})
        sql_b.append(f"insert into ballots (ballot_paper_id,election_id,level,poll_date,area_name,voting_system,by_election_reason,candidates_locked,official_sopn_url,democracy_club_url,previous_ballot_paper_id,area_lat,area_lng,area_point_note,area_gss) values ({q(bid)},{q(e.get('group') or bid)},{q(level)},{q(e['poll_open_date'])},{q(area)},{q((b.get('voting_system') or {}).get('slug') if isinstance(b.get('voting_system'),dict) else b.get('voting_system'))},{q(b.get('by_election_reason'))},{'true' if b['candidates_locked'] else 'false'},{q((b.get('sopn') or {}).get('source_url'))},{q(b['url'])},{q(prev)},{lat if lat else 'NULL'},{lng if lng else 'NULL'},{q('Centroid of the ONS 2024 boundary. Statistics near this point describe the area, not any household.') if lat else 'NULL'},{q(gss)}) on conflict (ballot_paper_id) do update set area_name=excluded.area_name, area_gss=coalesce(excluded.area_gss, ballots.area_gss), area_lat=excluded.area_lat, area_lng=excluded.area_lng, area_point_note=excluded.area_point_note, candidates_locked=excluded.candidates_locked, official_sopn_url=coalesce(excluded.official_sopn_url, ballots.official_sopn_url), previous_ballot_paper_id=coalesce(ballots.previous_ballot_paper_id, excluded.previous_ballot_paper_id);")
        J.setdefault("candidacies", {})[bid] = [c["person"]["id"] for c in b["candidacies"] if not c.get("deselected")]
        for c in b["candidacies"]:
            if c.get("deselected"): continue   # withdrawn: the loader marks it
            party = c["party"]; pid = party["ec_id"]
            if pid not in seen_parties:
                seen_parties.add(pid)
                parent = "PP53" if pid == "joint-party:53-119" else None
                J["parties"].append({"ec_id": pid, "name": party["name"], "parent_party_ec_id": parent})
                sql_p.append(f"insert into parties (ec_id,name,parent_party_ec_id) values ({q(pid)},{q(party['name'])},{q(parent)}) on conflict (ec_id) do nothing;")
            kc = KNOWN_C.get((bid, c["person"]["id"]))
            fetched = True
            if kc and kc.get("statement_to_voters_present") and not FULL:
                p = {"id": c["person"]["id"], "name": c["person"]["name"], "identifiers": [], "candidacies": None}; fetched = False
            else:
                try: p = get(c["person"]["url"].replace("http://", "https://")); time.sleep(0.6)
                except Exception: p = {"id": c["person"]["id"], "name": c["person"]["name"], "identifiers": [], "candidacies": None}; fetched = False
            ids = {i["value_type"]: i["value"] for i in p.get("identifiers", [])}
            st = p.get("statement_to_voters") or ""
            surname = re.sub(r'[^a-z\-]', '', p["name"].split()[-1].lower())
            J["candidates"].append({"ballot_paper_id": bid, "dc_person_id": p["id"], "dc_person_url": c["person"]["url"].replace("http://", "https://"), "name": p["name"], "surname_sort": surname, "party_ec_id": pid, "party_name_on_ballot": party["name"], "party_description_on_ballot": c.get("party_description_text"), "homepage_url": ids.get("homepage_url"), "wikipedia_url": ids.get("wikipedia_url"), "statement_to_voters_present": bool(st), "statement_to_voters": st or None, "statement_retrieved_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") if st else None, "previous_candidacies_count": len([x for x in p["candidacies"] if x["ballot"]["ballot_paper_id"] != bid]) if p.get("candidacies") is not None else None, "person_fetched": fetched})
            sql_c.append(f"insert into candidates (ballot_paper_id,dc_person_id,dc_person_url,name,surname_sort,party_ec_id,party_name_on_ballot,party_description_on_ballot,homepage_url,wikipedia_url,statement_to_voters_present,statement_to_voters,statement_retrieved_at,previous_candidacies_count) values ({q(bid)},{p['id']},{q(c['person']['url'].replace('http://','https://'))},{q(p['name'])},{q(surname)},{q(pid)},{q(party['name'])},{q(c.get('party_description_text'))},{q(ids.get('homepage_url'))},{q(ids.get('wikipedia_url'))},{'true' if st else 'false'},{q(st) if st else 'NULL'},{q(datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')) if st else 'NULL'},{len([x for x in (p.get('candidacies') or []) if x['ballot']['ballot_paper_id']!=bid])}) on conflict (ballot_paper_id,dc_person_id) do update set statement_to_voters=coalesce(excluded.statement_to_voters,candidates.statement_to_voters), statement_to_voters_present=excluded.statement_to_voters_present or candidates.statement_to_voters_present, homepage_url=coalesce(excluded.homepage_url,candidates.homepage_url);")
        print(bid, len(b["candidacies"]), "cands", "locked" if b["candidates_locked"] else "open", "centroid" if lat else "no-centroid", "prev" if prev else "no-prev")
    out = os.path.join(os.path.dirname(__file__), "sql"); os.makedirs(out, exist_ok=True)
    for name, rows in [("ingest_ballots", sql_b), ("ingest_parties", sql_p), ("ingest_candidates", sql_c)]:
        open(os.path.join(out, name + ".sql"), "w").write("\n".join(rows))
    J["failed"] = failed
    json.dump(J, open(os.path.join(out, "ingest.json"), "w"))
    print("wrote", len(sql_b), "ballots", len(sql_p), "parties", len(sql_c), "candidates")
    if failed:
        # Fail the run: a ballot missing from the file would silently disappear from the site for voters in that ward.
        print(f"\nERROR: {len(failed)} ballot(s) could not be fetched and are missing from this run:")
        for f in failed: print("   ", f)
        print("Usually Democracy Club rate limiting. Setting the DEMOCRACY_CLUB_TOKEN secret lifts the 10-per-minute limit.")
        sys.exit(1)

if __name__ == "__main__": main()
