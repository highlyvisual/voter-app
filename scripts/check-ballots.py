"""
WP-A7 pre-publication accuracy check.
For a ballot: sample 20 postcodes inside its ONS boundary (points in polygon reverse-geocoded via postcodes.io), resolve each through
Democracy Club's for_postcode lookup (the same lookup the app uses), and compare the candidate list against a maintainer-pasted
Statement of Persons Nominated (plain text). Writes reports/ballot-checks/<ballot>-<date>.md.

Usage: python scripts/check-ballots.py <ballot_paper_id> [sopn.txt]
"""
import json, sys, os, random, re, datetime, urllib.request, urllib.parse
H = {"User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org) ballot check"}
def get(u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=40))
KEY = "sb_publishable_DYz0KZAckWIg4Cf_34ACSg_gXJihTW8"; B = "https://urufvcutpksjppbjxouc.supabase.co/rest/v1"
def sb(path): return json.load(urllib.request.urlopen(urllib.request.Request(B + path, headers={"apikey": KEY, "Authorization": "Bearer " + KEY})))

def point_in_poly(x, y, ring):
    inside = False; j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]; xj, yj = ring[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi): inside = not inside
        j = i
    return inside

def main():
    bid = sys.argv[1]; sopn = open(sys.argv[2]).read() if len(sys.argv) > 2 else ""
    b = sb(f"/ballots?ballot_paper_id=eq.{urllib.parse.quote(bid)}")[0]
    ours = sb(f"/candidates?ballot_paper_id=eq.{urllib.parse.quote(bid)}&select=name,party_name_on_ballot&order=surname_sort")
    svc, code = ("Westminster_Parliamentary_Constituencies_July_2024_Boundaries_UK_BGC", "PCON24CD") if b["level"] == "parliamentary" else ("Wards_December_2024_Boundaries_UK_BGC", "WD24CD")
    gj = get(f"https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/{svc}/FeatureServer/0/query?where={code}%3D%27{b['area_gss']}%27&outFields={code}&outSR=4326&f=geojson")
    geom = gj["features"][0]["geometry"]; rings = geom["coordinates"] if geom["type"] == "Polygon" else [r for p in geom["coordinates"] for r in p]
    outer = max(rings, key=len); xs = [p[0] for p in outer]; ys = [p[1] for p in outer]
    random.seed(1); pts = []
    while len(pts) < 200:
        x, y = random.uniform(min(xs), max(xs)), random.uniform(min(ys), max(ys))
        if point_in_poly(x, y, outer): pts.append((x, y))
    postcodes = []
    for x, y in pts:
        try:
            r = get(f"https://api.postcodes.io/postcodes?lon={x}&lat={y}&limit=1&radius=800")
            if r.get("result"):
                pc = r["result"][0]
                # keep only postcodes whose own centroid is inside the boundary (the nearest postcode within the radius can sit just outside)
                if point_in_poly(pc["longitude"], pc["latitude"], outer): postcodes.append(pc["postcode"])
        except Exception: pass
        if len(postcodes) >= 20: break
    rows = []
    for pc in postcodes:
        try:
            d = get(f"https://candidates.democracyclub.org.uk/api/next/ballots/?for_postcode={urllib.parse.quote(pc)}&current=1")
            ids = [x["ballot_paper_id"] for x in d.get("results", [])]
            rows.append((pc, bid in ids, ids))
        except Exception as ex: rows.append((pc, None, [str(ex)[:60]]))
    sopn_names = [n for n in ours if n["name"].split()[-1].lower() in sopn.lower()] if sopn else []
    missing = [n["name"] for n in ours if sopn and n["name"].split()[-1].lower() not in sopn.lower()]
    os.makedirs("reports/ballot-checks", exist_ok=True)
    date = datetime.date.today().isoformat(); path = f"reports/ballot-checks/{bid}-{date}.md"
    with open(path, "w") as f:
        f.write(f"# Ballot check: {bid}\n\nDate: {date}. Area: {b['area_name']}. Sampled {len(rows)} postcodes inside the ONS boundary.\n\n")
        f.write("| Postcode | Resolves to this ballot | Ballots returned |\n|---|---|---|\n")
        for pc, ok, ids in rows: f.write(f"| {pc} | {'yes' if ok else 'NO' if ok is False else 'error'} | {', '.join(ids)} |\n")
        f.write(f"\nResolved correctly: {sum(1 for r in rows if r[1])} of {len(rows)}.\n\n## Candidate list vs Statement of Persons Nominated\n\n")
        if sopn: f.write(f"Our list: {len(ours)}. Surnames found in the pasted SoPN: {len(sopn_names)}. Not found: {', '.join(missing) or 'none'}.\n")
        else: f.write("No SoPN text supplied; candidate comparison skipped.\n")
    print(path)
if __name__ == "__main__": main()
