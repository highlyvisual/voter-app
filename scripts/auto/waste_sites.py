"""Weekly: every permitted waste site in England from the Environment Agency's public register of waste operations (OGL),
into waste_sites for the "Permitted waste sites" map layer (round eight q6, next batch: waste).

The register's API (https://environment.data.gov.uk/public-register/waste-operations/registration.json) answers a plain
page of 2,000 records in about ten seconds but a distance query in over twenty, so the whole register is read here, in
pages, and the map reads a small box of rows. Only permits whose status is "Effective" and that give a site location are
kept. Eastings and northings are turned into latitude and longitude with the Ordnance Survey's own formulae (as lib/osgb.ts
does for the site). The table is replaced wholesale each run.

Usage: python scripts/auto/waste_sites.py [--pages N]   (dry run without the service key; --pages limits the read for tests)
"""
import json, math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import fetch, job, now_iso, remove, write

API = "https://environment.data.gov.uk/public-register/waste-operations/registration.json"
PAGE = 2000


# ---------- OSGB36 National Grid -> WGS84 (OS formulae; a few metres, enough for a map marker) ----------
def osgb_to_wgs84(E: float, N: float):
    a, b = 6377563.396, 6356256.909; F0 = 0.9996012717; lat0, lon0 = math.radians(49), math.radians(-2); N0, E0 = -100000, 400000
    e2 = 1 - (b * b) / (a * a); n = (a - b) / (a + b)
    lat, M = lat0, 0.0
    while True:
        lat = (N - N0 - M) / (a * F0) + lat
        M = b * F0 * ((1 + n + 1.25 * n * n + 1.25 * n ** 3) * (lat - lat0) - (3 * n + 3 * n * n + 2.625 * n ** 3) * math.sin(lat - lat0) * math.cos(lat + lat0)
                      + (1.875 * n * n + 1.875 * n ** 3) * math.sin(2 * (lat - lat0)) * math.cos(2 * (lat + lat0)) - (35 / 24) * n ** 3 * math.sin(3 * (lat - lat0)) * math.cos(3 * (lat + lat0)))
        if N - N0 - M < 0.00001: break
    s, c, t = math.sin(lat), math.cos(lat), math.tan(lat)
    nu = a * F0 / math.sqrt(1 - e2 * s * s); rho = a * F0 * (1 - e2) / (1 - e2 * s * s) ** 1.5; eta2 = nu / rho - 1
    VII = t / (2 * rho * nu); VIII = t / (24 * rho * nu ** 3) * (5 + 3 * t * t + eta2 - 9 * t * t * eta2); IX = t / (720 * rho * nu ** 5) * (61 + 90 * t * t + 45 * t ** 4)
    sec = 1 / c; X = sec / nu; XI = sec / (6 * nu ** 3) * (nu / rho + 2 * t * t); XII = sec / (120 * nu ** 5) * (5 + 28 * t * t + 24 * t ** 4); XIIA = sec / (5040 * nu ** 7) * (61 + 662 * t * t + 1320 * t ** 4 + 720 * t ** 6)
    dE = E - E0
    lat_a = lat - VII * dE ** 2 + VIII * dE ** 4 - IX * dE ** 6; lon_a = lon0 + X * dE - XI * dE ** 3 + XII * dE ** 5 - XIIA * dE ** 7
    # Airy (OSGB36) -> WGS84 datum shift (Helmert)
    def cart(lat, lon, a, b):
        e2 = 1 - (b * b) / (a * a); nu = a / math.sqrt(1 - e2 * math.sin(lat) ** 2)
        return nu * math.cos(lat) * math.cos(lon), nu * math.cos(lat) * math.sin(lon), (1 - e2) * nu * math.sin(lat)
    x, y, z = cart(lat_a, lon_a, a, b)
    tx, ty, tz, rx, ry, rz, sc = 446.448, -125.157, 542.06, math.radians(0.1502 / 3600), math.radians(0.247 / 3600), math.radians(0.8421 / 3600), 1 - 20.4894 / 1e6
    x2 = tx + sc * x - rz * y + ry * z; y2 = ty + rz * x + sc * y - rx * z; z2 = tz - ry * x + rx * y + sc * z
    a, b = 6378137.0, 6356752.3142; e2 = 1 - (b * b) / (a * a); p = math.hypot(x2, y2); lat = math.atan2(z2, p * (1 - e2))
    for _ in range(12):
        nu = a / math.sqrt(1 - e2 * math.sin(lat) ** 2); lat = math.atan2(z2 + e2 * nu * math.sin(lat), p)
    return math.degrees(lat), math.degrees(math.atan2(y2, x2))


def main():
    pages = int(sys.argv[sys.argv.index("--pages") + 1]) if "--pages" in sys.argv else 10 ** 6
    with job("waste sites") as st:
        stamp = now_iso(); rows, offset, read = [], 0, 0
        while offset // PAGE < pages:
            status, body, _ = fetch(f"{API}?_limit={PAGE}&_offset={offset}", timeout=120, tries=3)
            if status != 200: raise RuntimeError(f"register page at {offset}: HTTP {status}")
            items = json.loads(body.decode("utf-8")).get("items", [])
            read += len(items)
            for it in items:
                site = it.get("site") or {}; loc = site.get("location") or {}
                if (it.get("status") or {}).get("comment") != "Effective" or not loc.get("easting") or not loc.get("northing"): continue
                lat, lng = osgb_to_wgs84(float(loc["easting"]), float(loc["northing"]))
                rows.append({"registration": it.get("registrationNumber") or str(it.get("@id", "")).rsplit("/", 1)[-1], "name": site.get("premises") or (it.get("holder") or {}).get("name") or "Permitted waste site",
                             "holder": (it.get("holder") or {}).get("name"), "site_type": (site.get("siteType") or {}).get("description"), "address": (site.get("siteAddress") or {}).get("address"),
                             "local_authority": (it.get("localAuthority") or {}).get("prefLabel"), "status": "Effective", "effective_date": it.get("effectiveDate"),
                             "easting": int(loc["easting"]), "northing": int(loc["northing"]), "lat": round(lat, 6), "lng": round(lng, 6), "retrieved_at": stamp})
            print(f"offset {offset}: {len(items)} read, {len(rows)} kept so far", flush=True)
            if len(items) < PAGE: break
            offset += PAGE
        seen = set(); rows = [r for r in rows if not (r["registration"] in seen or seen.add(r["registration"]))]
        if not rows: raise RuntimeError("no rows read from the register")
        remove("waste_sites", "lat=gte.-90")
        write("waste_sites", rows, "registration")
        st["rows"] = len(rows); st["note"] = f"{read} register entries read, {len(rows)} in force with a location"
        for r in rows[:3]: print("  ", json.dumps(r)[:220])


if __name__ == "__main__": main()
