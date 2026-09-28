#!/usr/bin/env python3
"""Party pages: the Electoral Commission's register entry, latest statement of accounts, recent loans and campaign
spending at the last UK general election, for every registered party (Great Britain and Northern Ireland registers).

Writes lib/party_register.json keyed by the Commission's reference ("PP52"), the same id the parties table uses.
Donations stay in the party_funding table (scripts/auto/party_funding.py).

Source: the Electoral Commission's public registers search (search.electoralcommission.org.uk), its JSON and CSV
exports. The Commission's registers are public; figures are shown as the Commission publishes them, in its own
headings, the same way for every party. Nothing is ranked or compared.

Usage: python scripts/loaders/party_register.py   (run weekly by the "Data files" workflow)
"""
from __future__ import annotations

import csv
import io
import json
import re
import sys
import time

import requests
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "lib" / "party_register.json"
API = "https://search.electoralcommission.org.uk"
UA = {"User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)", "Accept": "application/json, text/csv"}
GE = "UK Parliamentary general election 04/07/2024"

# Statement of accounts headings, in the Commission's own words and order (its "Statement of account details" page).
INCOME = [
    ("IncomeMembership", "Membership"), ("IncomeDonations", "Donations"), ("IncomeAffiliations", "Affiliations"),
    ("IncomeFundraising", "Fundraising"), ("IncomeBranch", "Branch"), ("IncomeTransfersIn", "Transfers in"),
    ("IncomeInvestment", "Investments"), ("IncomePropertyRentalOfficeServices", "Property and rental income/office services"),
    ("IncomeSaleOfAssets", "Profit/loss on sale of assets"), ("IncomeUnrealisedGainsLosses", "Unrealised gains and losses"),
    ("IncomeCommercialActivities", "Commercial activities"), ("IncomeGrant", "Grant"), ("IncomeConference", "Conference"),
    ("IncomeMisc", "Miscellaneous income"),
]
EXPENDITURE = [
    ("ExpenditurePremises", "Premises"), ("ExpenditureOffice", "Office"), ("ExpenditureBranch", "Branch"),
    ("ExpenditureTransfersOut", "Transfers out"), ("ExpenditureStaff", "Staff"), ("ExpenditureFundraising", "Fundraising"),
    ("ExpenditureCampaigning", "Campaigning"), ("ExpenditureDepreciation", "Depreciation"),
    ("ExpenditureFinancingChargesTaxation", "Financing charges and taxation"), ("ExpenditureDisposalOfAssets", "Disposal of assets"),
    ("ExpenditureCommercialActivities", "Commercial activities"), ("ExpenditureConferenceExpenditure", "Conferences"),
    ("ExpenditureMisc", "Miscellaneous"),
]


SESSION = requests.Session()
SESSION.headers.update(UA)


def get(path: str, tries: int = 5, timeout: int = 30) -> bytes:
    """One kept-alive connection for the whole run: the Commission's front end stalls new TLS handshakes after a burst."""
    for i in range(tries):
        try:
            r = SESSION.get(API + path, timeout=(15, timeout))
            if r.status_code in (429, 500, 502, 503, 504):
                raise RuntimeError(f"HTTP {r.status_code}")
            r.raise_for_status()
            return r.content
        except Exception as ex:
            if i == tries - 1:
                raise
            print(f"  retry {i + 1} for {path[:60]}: {ex}", flush=True)
            time.sleep(10 * (i + 1))
    raise RuntimeError("unreachable")


def rows(path: str) -> list[dict]:
    return list(csv.DictReader(io.StringIO(get(path, timeout=300).decode("utf-8-sig", "replace"))))


def rows_both(path: str) -> list[dict]:
    """Both registers ({reg} = gb, ni), each row once: some exports ignore the register filter and return everything."""
    seen, out = set(), []
    for reg in ("gb", "ni"):
        for r in rows(path.format(reg=reg)):
            k = r.get("ECRef") or json.dumps(r, sort_keys=True)
            if k not in seen:
                seen.add(k)
                out.append(r)
    return out


def jdate(s: str | None) -> str | None:
    """The Commission's "/Date(ms)/" values are UK midnights; read them in UK time so 4 August stays 4 August."""
    m = re.search(r"/Date\((-?\d+)", s or "")
    return datetime.fromtimestamp(int(m.group(1)) / 1000, tz=ZoneInfo("Europe/London")).date().isoformat() if m else None


def uk_date(s: str | None) -> str | None:
    m = re.fullmatch(r"(\d{2})/(\d{2})/(\d{4})", (s or "").strip())
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else None


def money(s: str | None) -> float:
    return float(re.sub(r"[£,\s]", "", s or "") or 0)


def quarter_start(q: str) -> date:
    n, y = q.split()
    return date(int(y), 3 * (int(n[1]) - 1) + 1, 1)


def main() -> None:
    today = date.today()
    parties: dict[str, dict] = {}

    # 1. The registers: every registered party, Great Britain and Northern Ireland.
    for reg in ("gb", "ni"):
        for r in rows(f"/api/csv/Registrations?start=0&rows=20&query=&sort=RegulatedEntityName&order=asc&et=pp&register={reg}&regStatus=registered"):
            ref = r["ECRef"].strip()
            if not ref.startswith("PP"):
                continue
            parties[ref] = {"name": r["RegulatedEntityName"].strip(), "register": r["RegisterName"].strip(), "registered_on": uk_date(r.get("ApprovedDate"))}
    print(f"Registered parties: {len(parties)}", flush=True)
    if len(parties) < 200:
        raise SystemExit(f"Only {len(parties)} registered parties: refusing to write")

    # 2. Each party's register entry: officers, ballot-paper descriptions, where it fields candidates.
    for i, (ref, p) in enumerate(sorted(parties.items())):
        d = json.loads(get(f"/api/Registrations/{ref}"))
        p["officers"] = [[o["Role"], " ".join(o["Name"].split())] for o in d.get("Officers") or [] if o.get("Role") in ("Leader", "Treasurer", "Nominating Officer", "Campaigns Officer")]
        # Each registered description exactly as registered, with its registered other-language version if it has one.
        descs = []
        for x in d.get("PartyDescriptions") or []:
            if not x.get("Description"):
                continue
            t = " ".join(x["Description"].split()) + (f" / {' '.join(x['Translation'].split())}" if x.get("Translation") else "")
            if t not in descs:
                descs.append(t)
        p["descriptions"] = descs
        where = [n for n, k in (("England", "FieldingCandidatesInEngland"), ("Scotland", "FieldingCandidatesInScotland"), ("Wales", "FieldingCandidatesInWales")) if d.get(k)]
        if p["register"] == "Northern Ireland":
            where = ["Northern Ireland"]
        p["fields_candidates_in"] = where
        p["minor_party"] = bool(d.get("FieldingCandidatesMinorParty"))
        p["page"] = f"{API}/English/Registrations/{ref}"
        if i % 50 == 49:
            print(f"  register entries: {i + 1}/{len(parties)}", flush=True)
        time.sleep(0.4)

    # 3. Latest statement of accounts for the central party (this year's publication if out, else last year's).
    latest: dict[str, dict] = {}
    for year in (today.year - 1, today.year - 2):
        for r in rows_both(f"/api/csv/Accounts?start=0&rows=20&query=&sort=PublishedDate&order=desc&et=pp&year={year}&register={{reg}}&regStatus=registered"):
            if r.get("AccountingUnitName", "").strip() != "Central Party":
                continue
            # Some parties are registered under the same name in Great Britain and Northern Ireland: match on both.
            name, register = r["RegulatedEntityName"].strip(), r.get("RegisterName", "").strip()
            refs = [k for k, v in parties.items() if v["name"] == name and v["register"] == register]
            if len(refs) == 1 and refs[0] not in latest:
                latest[refs[0]] = {"st": r["ECRef"].strip(), "year": int(r["ReportingPeriodDescription"])}
    for i, (ref, a) in enumerate(sorted(latest.items())):
        d = json.loads(get(f"/api/Accounts/{a['st']}"))
        if f"PP{d.get('RegulatedEntityId')}" != ref:
            continue   # the name matched a different party: leave it out rather than guess
        parties[ref]["accounts"] = {
            "year": a["year"], "financial_year_end": jdate(d.get("FinancialYearEnd")), "published": jdate(d.get("PublishedDate")),
            "basis": d.get("SoaType"), "band": d.get("BandName"),
            "total_income": d.get("TotalIncome"), "total_expenditure": d.get("TotalExpenditure"),
            "income": [[label, d.get(k) or 0] for k, label in INCOME],
            "expenditure": [[label, d.get(k) or 0] for k, label in EXPENDITURE],
            "net_assets": d.get("NetAssetsLiabilities"),
            "page": f"{API}/English/Accounts/{a['st']}",
            "document": f"{API}/Api/Accounts/Documents/{d['SOARedactedDocumentId']}" if d.get("SOARedactedDocumentId") else None,
        }
        if i % 50 == 49:
            print(f"  accounts: {i + 1}/{len(latest)}", flush=True)
        time.sleep(0.4)

    # 4. Loans reported in the latest four published quarters (all accounting units), as the register records them.
    loans = rows_both(f"/api/csv/Loans?start=0&rows=20&query=&sort=StartDate&order=desc&et=pp&date=Reported&from={(today - timedelta(days=480)).isoformat()}&to={today.isoformat()}&rptPd=&register={{reg}}&regStatus=registered")
    quarters = sorted({r["ReportingPeriodName"] for r in loans if re.fullmatch(r"Q[1-4] \d{4}", r.get("ReportingPeriodName", ""))}, key=quarter_start)
    last4: list[str] = []
    if quarters:
        q = quarter_start(quarters[-1])
        for _ in range(4):
            last4.insert(0, f"Q{(q.month - 1) // 3 + 1} {q.year}")
            q = date(q.year - (q.month == 1), (q.month - 4) % 12 + 1, 1)
    by = defaultdict(list)
    for r in loans:
        if r.get("ReportingPeriodName") in last4:
            by["PP" + r["RegulatedEntityId"]].append({
                "lender": " ".join(r["LoanParticipantName"].split()), "lender_type": r["LoanParticipantType"], "value": money(r["Value"]),
                "start": uk_date(r["StartDate"]), "status": r["LoanStatus"], "outstanding": money(r["AmountOutstanding"]),
                "unit": r["AccountingUnitName"], "reported": r["ReportingPeriodName"], "type": r["LoanType"], "ref": r["ECRef"],
            })
    for ref, p in parties.items():
        ls = sorted(by.get(ref, []), key=lambda x: (-x["value"], x["start"] or ""))
        p["loans"] = {"count": len(ls), "total": round(sum(x["value"] for x in ls), 2), "largest": ls[:5]}

    # 5. Campaign spending reported for the 2024 UK general election, by the Commission's categories.
    spend = defaultdict(lambda: defaultdict(float))
    for r in rows_both("/api/csv/Spending?start=0&rows=20&query=&sort=DateIncurred&order=desc&et=pp&register={reg}&regStatus=registered"):
        if r.get("ReportingPeriodName") == GE and r.get("RegulatedEntityId"):
            spend["PP" + r["RegulatedEntityId"]][r.get("ExpenseCategoryName") or "Not categorised"] += money(r["TotalExpenditure"])
    for ref, p in parties.items():
        s = spend.get(ref)
        if s:
            p["ge2024_spending"] = {"total": round(sum(s.values()), 2), "by_category": sorted([[k, round(v, 2)] for k, v in s.items()], key=lambda x: -x[1])}

    doc = {
        "retrieved_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": {"publisher": "The Electoral Commission", "title": "Political finance and party registers search", "page": f"{API}/"},
        "loan_quarters": last4, "ge": GE,
        "parties": dict(sorted(parties.items(), key=lambda kv: int(kv[0][2:]))),
    }
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"Wrote {OUT.relative_to(ROOT)}: {len(parties)} parties, {len(latest)} with accounts, {sum(1 for p in parties.values() if p['loans']['count'])} with loans in {', '.join(last4)}, {len(spend)} with GE2024 spending")


if __name__ == "__main__":
    main()
