"""Nightly leaflet scan: match recent electionleaflets.org uploads to candidates we hold (by Democracy Club person id) and upsert into leaflets.
Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or falls back to the publishable key for read-only dry runs)."""
import json, os, time, urllib.request
H = {"User-Agent": "voter-app leaflet-scan"}
URL = (os.environ.get("SUPABASE_URL") or "https://urufvcutpksjppbjxouc.supabase.co").rstrip("/") + "/rest/v1"
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "sb_publishable_DYz0KZAckWIg4Cf_34ACSg_gXJihTW8"
SH = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
def get(u): return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=40))
cands = json.load(urllib.request.urlopen(urllib.request.Request(f"{URL}/candidates?select=id,dc_person_id", headers=SH)))
byp = {str(c["dc_person_id"]): c["id"] for c in cands}
have = {r["leaflet_pk"] for r in json.load(urllib.request.urlopen(urllib.request.Request(f"{URL}/leaflets?select=leaflet_pk", headers=SH)))}
rows, off, pages = [], 0, int(os.environ.get("LEAFLET_PAGES", "10"))
for _ in range(pages):
    d = get(f"https://electionleaflets.org/api/leaflets/?format=json&limit=100&offset={off}")
    for x in d["results"]:
        if x["pk"] in have: continue
        for p in x.get("people", []):
            for pid in p.keys():
                if pid in byp:
                    rows.append({"candidate_id": byp[pid], "leaflet_pk": x["pk"], "url": f"https://electionleaflets.org/leaflets/{x['pk']}/", "thumb_url": x.get("first_page_thumb"), "image_url": (x.get("images") or [{}])[0].get("image"), "date_uploaded": (x.get("date_uploaded") or "")[:10] or None})
    off += 100; time.sleep(0.4)
if rows and os.environ.get("SUPABASE_SERVICE_ROLE_KEY"):
    urllib.request.urlopen(urllib.request.Request(f"{URL}/leaflets?on_conflict=leaflet_pk", data=json.dumps(rows).encode(), method="POST", headers={**SH, "Prefer": "resolution=ignore-duplicates,return=minimal"}))
print("new leaflets", len(rows))
