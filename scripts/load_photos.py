"""Load scripts/sql/photos.json onto candidates with the service-role key."""
import json, os, urllib.request
URL = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1"; KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json", "Prefer": "return=minimal"}
for p in json.load(open(os.path.join(os.path.dirname(__file__), "sql", "photos.json"))):
    body = {k: p.get(k) for k in ["photo_url", "photo_copyright", "photo_uploader", "photo_source"]}
    urllib.request.urlopen(urllib.request.Request(f"{URL}/candidates?dc_person_id=eq.{p['dc_person_id']}", data=json.dumps(body).encode(), method="PATCH", headers=H))
print("photos loaded")
