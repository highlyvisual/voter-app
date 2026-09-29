"""The NaPTAN administrative areas (ATCO area codes) from the National Public Transport Gazetteer, DfT, OGL.

Writes lib/atco_areas.json: {atco, name, region} for each of the ~150 areas whose NaPTAN stop files the site fetches for
public-transport stops outside England (England's stops come from planning.data.gov.uk). Re-run when the gazetteer changes
(rarely). The NPTG XML is about 55 MB; it is streamed, not held in memory.

Usage: python scripts/loaders/atco_areas.py [--from FILE]
"""
import json, os, sys, urllib.request, xml.etree.ElementTree as ET
URL = "https://naptan.api.dft.gov.uk/v1/nptg?dataFormat=csv"   # answers with the gazetteer XML whatever the format asked for (Sept 2026)
NS = "{http://www.naptan.org.uk/}"
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main():
    src = sys.argv[sys.argv.index("--from") + 1] if "--from" in sys.argv else None
    if not src:
        src = "/tmp/nptg.xml"
        with urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": "What's It To Me? (whatsittome.org) data refresh; hello@whatsittome.org"}), timeout=300) as r, open(src, "wb") as f:
            while chunk := r.read(1 << 20): f.write(chunk)
    areas, region_of = [], {}
    for _, el in ET.iterparse(src, events=("end",)):
        if el.tag == NS + "AdministrativeArea":
            g = lambda t: (el.findtext(NS + t) or "").strip()
            areas.append({"atco": g("AtcoAreaCode"), "name": g("Name")})
        elif el.tag == NS + "Region":
            name = (el.findtext(NS + "Name") or "").strip()
            for a in el.iter(NS + "AtcoAreaCode"): region_of[(a.text or "").strip()] = name
            el.clear()
    for a in areas: a["region"] = region_of.get(a["atco"])
    areas = [a for a in areas if a["atco"]]
    out = os.path.join(ROOT, "lib", "atco_areas.json")
    json.dump({"source": "DfT National Public Transport Gazetteer (NPTG), Open Government Licence; https://naptan.api.dft.gov.uk/", "areas": sorted(areas, key=lambda a: a["atco"])}, open(out, "w"), indent=0, ensure_ascii=False)
    print(f"{len(areas)} areas -> {out}")


if __name__ == "__main__": main()
