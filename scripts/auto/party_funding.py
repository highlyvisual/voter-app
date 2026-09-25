"""Weekly: party donations for the latest four published quarters, from the Electoral Commission's register.

Source: the Commission's public search (CSV export of accepted donations to political parties, post-poll reports).
Totals are split into public funds (Short money, Cranborne money, policy development grants and similar) and all other
donations, as the register records them. Top donors are grouped by the Commission's own donor id, so one donor entered
with and without a title is counted once
(the register sometimes gives one person two donor records, e.g. "Christopher Harborne" and "Mr Christopher Harborne",
so individuals are grouped by name with honorifics removed; companies and other bodies by their donor id). Rebuilt only when a new quarter has been published.
"""
import collections, csv, datetime, io, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import fetch, job, remove, select, write, now_iso

BASE = ("https://search.electoralcommission.org.uk/api/csv/Donations?start=0&rows=50&query=&sort=AcceptedDate&order=desc&et=pp"
        "&date=Accepted&from={frm}&to={to}&rptPd=&prePoll=false&postPoll=true&register=gb&register=ni&regStatus=")


def quarter_bounds(name: str):
    q, y = name.split(); q = int(q[1]); y = int(y)
    start = datetime.date(y, 3 * (q - 1) + 1, 1)
    end = (datetime.date(y + (q == 4), (3 * q) % 12 + 1, 1) - datetime.timedelta(days=1))
    return start, end


TITLES = re.compile(r"^(?:(?:mr|mrs|ms|miss|mx|dr|sir|dame|lord|lady|baroness|baron|the rt hon|rt hon|hon|prof|professor|rev|cllr)\.?\s+)+", re.I)


def donor_key(r: dict) -> str:
    name = " ".join((r.get("DonorName") or "").split())
    if r.get("DonorStatus") == "Individual":
        return "person:" + TITLES.sub("", name).lower()
    return "id:" + (r.get("DonorId") or name.lower())


def money(v: str) -> float:
    return float((v or "0").replace("£", "").replace(",", "") or 0)


def main():
    with job("party funding (Electoral Commission)") as st:
        today = datetime.date.today()
        status, body, _ = fetch(BASE.format(frm=(today - datetime.timedelta(days=480)).isoformat(), to=today.isoformat()), browser=True, timeout=300)
        if status != 200: raise RuntimeError(f"Electoral Commission returned HTTP {status}")
        rows = list(csv.DictReader(io.StringIO(body.decode("utf-8-sig", "replace"))))
        quarters = sorted({r["ReportingPeriodName"] for r in rows if r.get("ReportingPeriodName", "").startswith("Q")}, key=lambda n: (int(n.split()[1]), n))
        if len(quarters) < 4: raise RuntimeError(f"only {len(quarters)} quarters found")
        last4 = quarters[-4:]
        start, end = quarter_bounds(last4[0])[0], quarter_bounds(last4[-1])[1]
        have = select("/party_funding?select=period_end&limit=1")
        if have and have[0]["period_end"] == end.isoformat() and not os.environ.get("FUNDING_FORCE"):
            st["rows"] = 0; st["note"] = f"already current to {end} ({', '.join(last4)})"; return
        status, body, _ = fetch(BASE.format(frm=start.isoformat(), to=end.isoformat()), browser=True, timeout=300)
        rows = [r for r in csv.DictReader(io.StringIO(body.decode("utf-8-sig", "replace"))) if r.get("ReportingPeriodName") in last4]
        by = collections.defaultdict(lambda: {"name": None, "pt": 0.0, "pc": 0, "ut": 0.0, "uc": 0, "donors": collections.defaultdict(lambda: {"total": 0.0, "names": collections.Counter(), "kind": None})})
        for r in rows:
            p = by["PP" + r["RegulatedEntityId"]]; p["name"] = r["RegulatedEntityName"]
            v = money(r["Value"])
            if r.get("DonorStatus") == "Public Fund":
                p["ut"] += v; p["uc"] += 1
            else:
                p["pt"] += v; p["pc"] += 1
                d = p["donors"][donor_key(r)]
                d["total"] += v; d["names"][" ".join(r.get("DonorName", "").split())] += 1; d["kind"] = r.get("DonorStatus")
        stamp, out = now_iso(), []
        for ec, p in by.items():
            top = sorted(p["donors"].values(), key=lambda d: -d["total"])[:5]
            out.append({"ec_id": ec, "entity_name": p["name"], "period_start": start.isoformat(), "period_end": end.isoformat(),
                        "private_total": round(p["pt"], 2), "private_count": p["pc"], "public_total": round(p["ut"], 2), "public_count": p["uc"],
                        "top_donors": [{"kind": d["kind"], "name": TITLES.sub("", d["names"].most_common(1)[0][0]) if d["kind"] == "Individual" else d["names"].most_common(1)[0][0], "total": round(d["total"], 2)} for d in top],
                        "retrieved_at": stamp})
        if len(out) < 10: raise RuntimeError(f"only {len(out)} parties: refusing to replace the table")
        remove("party_funding", "ec_id=neq.__none__")
        write("party_funding", out)
        st["rows"] = len(out); st["note"] = f"{', '.join(last4)} ({start} to {end}); {len(rows)} donations"


if __name__ == "__main__": main()
