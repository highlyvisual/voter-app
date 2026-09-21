"""
Ingest every current UK ballot from Democracy Club into SQL statements for the ballots/parties/candidates tables.
- ballots: level, dates, area name, official SoPN, previous contest for the same post (most recent earlier ballot), ONS centroid
- parties: id, name, parent for joint registrations
- candidates: person, party, description, links, verbatim statement to voters
Idempotent (on conflict do nothing / update statements). Run, then execute scripts/sql/ingest_*.sql.
"""
import json, urllib.request, urllib.parse, datetime, time, os, re, sys

H = {"User-Agent": "voter-app (github.com/highlyvisual/voter-app)"}
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
    d = get("https://elections.democracyclub.org.uk/api/elections/?current=true&limit=500"); res = d["results"]
    while d.get("next"): d = get(d["next"]); res += d["results"]
    ballots = [e for e in res if e["identifier_type"] == "ballot" and not e["cancelled"] and datetime.date.fromisoformat(e["poll_open_date"]) >= TODAY]
    sql_b, sql_p, sql_c, seen_parties = [], [], [], set()
    J = {"ballots": [], "parties": [], "candidates": []}
    for e in sorted(ballots, key=lambda x: x["poll_open_date"]):
        bid = e["election_id"]
        try: b = get(f"https://candidates.democracyclub.org.uk/api/next/ballots/{bid}/")
        except Exception as ex: print("skip", bid, ex); continue
        etype = bid.split(".")[0]
        level = {"parl": "parliamentary", "local": "local", "mayor": "mayoral", "sp": "devolved", "senedd": "devolved", "nia": "devolved"}.get(etype, "other")
        org = (e.get("organisation") or {}).get("official_name") or ""
        post = b["post"]["label"]
        council = re.sub(r'^(The )', '', org.replace(' Council','').replace('London Borough of ','').replace('City of ','').replace('Royal Borough of ','')).strip()
        area = post if level == "parliamentary" else f"{council}: {post} ward"
        gss = ((e.get("division") or {}).get("official_identifier") or "").replace("gss:", "") or None
        lat, lng = centroid(level, post, gss)
        prev = previous_ballot(b["post"].get("id") or b["post"].get("slug") or "", bid, e["poll_open_date"]) if b["post"].get("id") else None
        J["ballots"].append({"ballot_paper_id": bid, "election_id": e.get("group") or bid, "level": level, "poll_date": e["poll_open_date"], "area_name": area, "voting_system": (b.get("voting_system") or {}).get("slug") if isinstance(b.get("voting_system"), dict) else b.get("voting_system"), "by_election_reason": b.get("by_election_reason"), "candidates_locked": b["candidates_locked"], "official_sopn_url": (b.get("sopn") or {}).get("source_url"), "democracy_club_url": b["url"], "previous_ballot_paper_id": prev, "area_lat": lat, "area_lng": lng, "area_point_note": "Centroid of the ONS 2024 boundary. Statistics near this point describe the area, not any household." if lat else None, "area_gss": gss, "winner_count": b.get("winner_count") or 1, "uncontested": bool(b.get("uncontested")), "cancelled": bool(b.get("cancelled"))})
        sql_b.append(f"insert into ballots (ballot_paper_id,election_id,level,poll_date,area_name,voting_system,by_election_reason,candidates_locked,official_sopn_url,democracy_club_url,previous_ballot_paper_id,area_lat,area_lng,area_point_note,area_gss) values ({q(bid)},{q(e.get('group') or bid)},{q(level)},{q(e['poll_open_date'])},{q(area)},{q((b.get('voting_system') or {}).get('slug') if isinstance(b.get('voting_system'),dict) else b.get('voting_system'))},{q(b.get('by_election_reason'))},{'true' if b['candidates_locked'] else 'false'},{q((b.get('sopn') or {}).get('source_url'))},{q(b['url'])},{q(prev)},{lat if lat else 'NULL'},{lng if lng else 'NULL'},{q('Centroid of the ONS 2024 boundary. Statistics near this point describe the area, not any household.') if lat else 'NULL'},{q(gss)}) on conflict (ballot_paper_id) do update set area_name=excluded.area_name, area_gss=coalesce(excluded.area_gss, ballots.area_gss), area_lat=excluded.area_lat, area_lng=excluded.area_lng, area_point_note=excluded.area_point_note, candidates_locked=excluded.candidates_locked, official_sopn_url=coalesce(excluded.official_sopn_url, ballots.official_sopn_url), previous_ballot_paper_id=coalesce(ballots.previous_ballot_paper_id, excluded.previous_ballot_paper_id);")
        for c in b["candidacies"]:
            party = c["party"]; pid = party["ec_id"]
            if pid not in seen_parties:
                seen_parties.add(pid)
                parent = "PP53" if pid == "joint-party:53-119" else None
                J["parties"].append({"ec_id": pid, "name": party["name"], "parent_party_ec_id": parent})
                sql_p.append(f"insert into parties (ec_id,name,parent_party_ec_id) values ({q(pid)},{q(party['name'])},{q(parent)}) on conflict (ec_id) do nothing;")
            try: p = get(c["person"]["url"].replace("http://", "https://")); time.sleep(0.6)
            except Exception: p = {"id": c["person"]["id"], "name": c["person"]["name"], "identifiers": [], "candidacies": []}
            ids = {i["value_type"]: i["value"] for i in p.get("identifiers", [])}
            st = p.get("statement_to_voters") or ""
            surname = re.sub(r'[^a-z\-]', '', p["name"].split()[-1].lower())
            J["candidates"].append({"ballot_paper_id": bid, "dc_person_id": p["id"], "dc_person_url": c["person"]["url"].replace("http://", "https://"), "name": p["name"], "surname_sort": surname, "party_ec_id": pid, "party_name_on_ballot": party["name"], "party_description_on_ballot": c.get("party_description_text"), "homepage_url": ids.get("homepage_url"), "wikipedia_url": ids.get("wikipedia_url"), "statement_to_voters_present": bool(st), "statement_to_voters": st or None, "statement_retrieved_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") if st else None, "previous_candidacies_count": len([x for x in p.get("candidacies", []) if x["ballot"]["ballot_paper_id"] != bid])})
            sql_c.append(f"insert into candidates (ballot_paper_id,dc_person_id,dc_person_url,name,surname_sort,party_ec_id,party_name_on_ballot,party_description_on_ballot,homepage_url,wikipedia_url,statement_to_voters_present,statement_to_voters,statement_retrieved_at,previous_candidacies_count) values ({q(bid)},{p['id']},{q(c['person']['url'].replace('http://','https://'))},{q(p['name'])},{q(surname)},{q(pid)},{q(party['name'])},{q(c.get('party_description_text'))},{q(ids.get('homepage_url'))},{q(ids.get('wikipedia_url'))},{'true' if st else 'false'},{q(st) if st else 'NULL'},{q(datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')) if st else 'NULL'},{len([x for x in p.get('candidacies',[]) if x['ballot']['ballot_paper_id']!=bid])}) on conflict (ballot_paper_id,dc_person_id) do update set statement_to_voters=coalesce(excluded.statement_to_voters,candidates.statement_to_voters), statement_to_voters_present=excluded.statement_to_voters_present or candidates.statement_to_voters_present, homepage_url=coalesce(excluded.homepage_url,candidates.homepage_url);")
        print(bid, len(b["candidacies"]), "cands", "locked" if b["candidates_locked"] else "open", "centroid" if lat else "no-centroid", "prev" if prev else "no-prev")
    out = os.path.join(os.path.dirname(__file__), "sql"); os.makedirs(out, exist_ok=True)
    for name, rows in [("ingest_ballots", sql_b), ("ingest_parties", sql_p), ("ingest_candidates", sql_c)]:
        open(os.path.join(out, name + ".sql"), "w").write("\n".join(rows))
    json.dump(J, open(os.path.join(out, "ingest.json"), "w"))
    print("wrote", len(sql_b), "ballots", len(sql_p), "parties", len(sql_c), "candidates")

if __name__ == "__main__": main()
