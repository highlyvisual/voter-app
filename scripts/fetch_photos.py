"""Fetch candidate photos from Democracy Club person records (image + licence + uploader) for candidates we hold. Writes scripts/sql/photos.json.
Respects the 10-requests-a-minute unauthenticated limit."""
import json, os, time, urllib.request
H = {"User-Agent": "voter-app photos"}; KEY = "sb_publishable_DYz0KZAckWIg4Cf_34ACSg_gXJihTW8"
cands = json.load(urllib.request.urlopen(urllib.request.Request("https://urufvcutpksjppbjxouc.supabase.co/rest/v1/candidates?select=id,dc_person_id,name&order=ballot_paper_id", headers={"apikey": KEY, "Authorization": "Bearer " + KEY})))
out = []
seen = set()
for c in cands:
    if c["dc_person_id"] in seen: continue
    seen.add(c["dc_person_id"])
    for attempt in range(4):
        try:
            p = json.load(urllib.request.urlopen(urllib.request.Request(f"https://candidates.democracyclub.org.uk/api/next/people/{c['dc_person_id']}/", headers=H), timeout=40)); break
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(20 * (attempt + 1)); continue
            p = None; break
        except Exception: p = None; break
    img = (p or {}).get("image") or {}
    if img.get("image_url") or img.get("image"):
        out.append({"dc_person_id": c["dc_person_id"], "photo_url": img.get("image_url") or img.get("image"), "photo_copyright": img.get("copyright"), "photo_uploader": img.get("uploading_user"), "photo_source": img.get("source")})
    time.sleep(6.5)
os.makedirs("scripts/sql", exist_ok=True)
json.dump(out, open("scripts/sql/photos.json", "w"))
print("photos", len(out), "of", len(seen))
