"""Daily: proposed and recent school openings and closures in England, from DfE's Get Information about Schools (GIAS).

Source: the public daily extract (edubasealldataYYYYMMDD.csv, Open Government Licence). We keep only the rows that say
something is changing: "Proposed to open", "Open, but proposed to close", and schools that opened or closed in the last
twelve months. The register's own reason is kept with every row, because most "closures" are academy conversions and
the council page must not read as if schools are shutting when they are changing hands. Wales appears in GIAS only as a
placeholder and is excluded; Scotland is not in GIAS.
"""
import csv, datetime, io, os, sys, tempfile
sys.path.insert(0, os.path.dirname(__file__))
from common import fetch, job, remove, write, now_iso

BASE = "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata{}.csv"


def v(r: dict, k: str):
    x = (r.get(k) or "").strip()
    return None if x in ("", "Not applicable") else x


def d(s: str):
    try: return datetime.datetime.strptime(s, "%d-%m-%Y").date()
    except Exception: return None


def main():
    with job("schools (GIAS)") as st:
        today = datetime.date.today()
        body, used = None, None
        for back in range(0, 4):  # today's file appears early morning; fall back a few days
            day = today - datetime.timedelta(days=back)
            status, b, _ = fetch(BASE.format(day.strftime("%Y%m%d")), timeout=300)
            if status == 200 and len(b) > 1_000_000: body, used = b, day; break
        if body is None: raise RuntimeError("no GIAS extract found for the last four days")
        rows, cutoff, stamp = [], today - datetime.timedelta(days=365), now_iso()
        reader = csv.DictReader(io.StringIO(body.decode("cp1252", "replace")))
        for r in reader:
            status = r.get("EstablishmentStatus (name)", "")
            la = r.get("LA (name)", "")
            if "Wales" in la or "Wales" in r.get("GOR (name)", ""): continue
            od, cd = d(r.get("OpenDate", "")), d(r.get("CloseDate", ""))
            keep = status in ("Proposed to open", "Open, but proposed to close") or \
                   (status == "Closed" and cd and cd >= cutoff) or (status == "Open" and od and od >= cutoff)
            if not keep: continue
            urn = int(r["URN"])
            rows.append({"urn": urn, "name": r.get("EstablishmentName", "").strip(), "la_name": la, "la_gss": r.get("GSSLACode (name)") or None,
                         "district_gss": r.get("DistrictAdministrative (code)") or None, "status": status,
                         "phase": v(r, "PhaseOfEducation (name)"), "type": v(r, "TypeOfEstablishment (name)"),
                         "reason_opened": v(r, "ReasonEstablishmentOpened (name)"), "reason_closed": v(r, "ReasonEstablishmentClosed (name)"),
                         "open_date": od.isoformat() if od else None, "close_date": cd.isoformat() if cd else None,
                         "gias_url": f"https://get-information-schools.service.gov.uk/Establishments/Establishment/Details/{urn}", "retrieved_at": stamp})
        if len(rows) < 50: raise RuntimeError(f"only {len(rows)} rows: the file layout may have changed")
        remove("school_changes", "urn=gte.0")
        write("school_changes", rows)
        by = {}
        for r in rows: by[r["status"]] = by.get(r["status"], 0) + 1
        st["rows"] = len(rows); st["note"] = f"GIAS extract {used}; " + ", ".join(f"{k}: {v}" for k, v in sorted(by.items()))


if __name__ == "__main__": main()
