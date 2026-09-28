#!/usr/bin/env python3
"""The money layer's change-watch: official tax and benefit rates, read from GOV.UK, against

  1. the values we last confirmed (scripts/money/official_rates.json), so a change at source is noticed the week it
     happens; and
  2. the same parameters inside the pinned PolicyEngine UK version that computed the receipt grid, so a stale model is
     noticed before its figures are shown as today's.

The site never displays PolicyEngine's parameter values as today's rates; it shows what the model computes for a
household. This job is what makes that safe: if the model and the official rates disagree for the current tax year, the
run fails and says which figure, where each value came from, and what to do.

Sources: GOV.UK content API (Open Government Licence): "Income Tax rates and Personal Allowances"; HMRC "Rates and
thresholds for employers <year>"; DWP "Benefit and pension rates <year>"; "Universal Credit: how your earnings affect
your payments"; "Child Benefit: what you'll get".

Usage: python scripts/auto/rates_watch.py            check and report (exit 1 on any change or mismatch)
       python scripts/auto/rates_watch.py --accept   after checking a change by hand, record today's official values
"""
from __future__ import annotations

import html
import json
import os
import re
import sys
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASELINE = ROOT / "scripts" / "money" / "official_rates.json"
UA = {"User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)"}


def tax_year(today: date) -> int:
    return today.year if (today.month, today.day) >= (4, 6) else today.year - 1


def gov_text(path: str) -> str:
    with urllib.request.urlopen(urllib.request.Request("https://www.gov.uk/api/content" + path, headers=UA), timeout=60) as r:
        d = json.load(r)
    det = d.get("details", {})
    body = det.get("body") or "".join(p.get("body", "") for p in det.get("parts", []))
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", body)))


def gov_attachment_text(path: str) -> tuple[str, str]:
    """The first HTML attachment of a publication (DWP publishes the rates as an HTML attachment)."""
    with urllib.request.urlopen(urllib.request.Request("https://www.gov.uk/api/content" + path, headers=UA), timeout=60) as r:
        d = json.load(r)
    att = next(a["url"] for a in d["details"]["attachments"] if a.get("url", "").startswith("/government/"))
    return att, gov_text(att)


def num(s: str) -> float:
    return float(s.replace(",", "").replace("£", ""))


def official(y: int) -> dict[str, dict]:
    """Each watched figure: value, where it was read, and the words it was read from."""
    out: dict[str, dict] = {}

    def grab(key: str, label: str, url: str, text: str, pattern: str, conv=num):
        m = re.search(pattern, text)
        out[key] = {"label": label, "source": "https://www.gov.uk" + url, "value": conv(m.group(1)) if m else None, "words": m.group(0) if m else None}

    p = "/income-tax-rates"
    t = gov_text(p)
    grab("personal_allowance", "Personal Allowance (£ a year)", p, t, r"standard Personal Allowance is £([\d,]+)")
    grab("higher_rate_threshold", "Higher rate starts above (£ a year)", p, t, r"Basic rate £[\d,]+ to £([\d,]+) 20%")
    grab("additional_rate_threshold", "Additional rate starts above (£ a year)", p, t, r"Additional rate over £([\d,]+) 45%")

    p = f"/guidance/rates-and-thresholds-for-employers-{y}-to-{y + 1}"
    t = gov_text(p)
    grab("ni_primary_threshold", "National Insurance primary threshold (£ a year)", p, t, r"Primary threshold £[\d,]+ per week £[\d,]+ per month £([\d,]+) per year")
    grab("ni_upper_earnings_limit", "National Insurance upper earnings limit (£ a year)", p, t, r"Upper earnings limit £[\d,]+ per week £[\d,]+ per month £([\d,]+) per year")
    grab("ni_main_rate", "Employee National Insurance main rate", p, t, r"\bA 0% ([\d.]+)% [\d.]+%", lambda s: round(float(s) / 100, 4))
    grab("ni_additional_rate", "Employee National Insurance rate above the upper earnings limit", p, t, r"\bA 0% [\d.]+% ([\d.]+)%", lambda s: round(float(s) / 100, 4))

    att, t = gov_attachment_text(f"/government/publications/benefit-and-pension-rates-{y}-to-{y + 1}")
    # Two columns, last year then this year; this year's is the second number.
    grab("uc_single_under_25", "Universal Credit standard allowance, single under 25 (£ a month)", att, t, r"Single under 25 [\d.]+ ([\d.]+)")
    grab("uc_single_25_plus", "Universal Credit standard allowance, single 25 or over (£ a month)", att, t, r"Single 25 or over [\d.]+ ([\d.]+)")
    grab("uc_couple_25_plus", "Universal Credit standard allowance, couple, one or both 25 or over (£ a month)", att, t, r"Joint claimants, one or both 25 or over [\d.]+ ([\d.]+)")
    grab("uc_work_allowance_higher", "Universal Credit higher work allowance (£ a month)", att, t, r"Higher work allowance \(no housing amount\)[^0-9]*[\d.]+ ([\d.]+)")
    grab("uc_work_allowance_lower", "Universal Credit lower work allowance (£ a month)", att, t, r"Lower work allowance[^0-9]*[\d.]+ ([\d.]+)")

    p = "/universal-credit/how-your-earnings-affect-payments"
    grab("uc_taper", "Universal Credit taper (reduction per £1 earned)", p, gov_text(p), r"goes down by (\d+)p", lambda s: round(int(s) / 100, 4))

    p = "/child-benefit"
    t = gov_text(p)
    grab("child_benefit_eldest", "Child Benefit, eldest or only child (£ a week)", p, t, r"Eldest or only child £([\d.]+)")
    grab("child_benefit_additional", "Child Benefit, additional children (£ a week)", p, t, r"Additional children £([\d.]+)")
    return out


# The same figures inside PolicyEngine UK, converted to the official units. Weekly NI thresholds are compared a year at a
# time, as HMRC publishes them (£241.73 a week is £12,570 a year).
PE = {
    "personal_allowance": ("gov.hmrc.income_tax.allowances.personal_allowance.amount", lambda v, P, d: v),
    "higher_rate_threshold": ("gov.hmrc.income_tax.allowances.personal_allowance.amount", lambda v, P, d: v + P.gov.hmrc.income_tax.rates.uk.brackets[1].threshold(d)),
    "additional_rate_threshold": ("gov.hmrc.income_tax.allowances.personal_allowance.amount", lambda v, P, d: P.gov.hmrc.income_tax.rates.uk.brackets[2].threshold(d)),
    "ni_primary_threshold": ("gov.hmrc.national_insurance.class_1.thresholds.primary_threshold", lambda v, P, d: round(v * 52)),
    "ni_upper_earnings_limit": ("gov.hmrc.national_insurance.class_1.thresholds.upper_earnings_limit", lambda v, P, d: round(v * 52)),
    "ni_main_rate": ("gov.hmrc.national_insurance.class_1.rates.employee.main", lambda v, P, d: round(v, 4)),
    "ni_additional_rate": ("gov.hmrc.national_insurance.class_1.rates.employee.additional", lambda v, P, d: round(v, 4)),
    "uc_single_under_25": ("gov.dwp.universal_credit.standard_allowance.amount.SINGLE_YOUNG", lambda v, P, d: v),
    "uc_single_25_plus": ("gov.dwp.universal_credit.standard_allowance.amount.SINGLE_OLD", lambda v, P, d: v),
    "uc_couple_25_plus": ("gov.dwp.universal_credit.standard_allowance.amount.COUPLE_OLD", lambda v, P, d: v),
    "uc_work_allowance_higher": ("gov.dwp.universal_credit.means_test.work_allowance.without_housing", lambda v, P, d: v),
    "uc_work_allowance_lower": ("gov.dwp.universal_credit.means_test.work_allowance.with_housing", lambda v, P, d: v),
    "uc_taper": ("gov.dwp.universal_credit.means_test.reduction_rate", lambda v, P, d: round(v, 4)),
    "child_benefit_eldest": ("gov.hmrc.child_benefit.amount.eldest", lambda v, P, d: v),
    "child_benefit_additional": ("gov.hmrc.child_benefit.amount.additional", lambda v, P, d: v),
}


def policyengine_values(y: int) -> tuple[str, dict[str, float]]:
    import importlib.metadata as md
    from policyengine_uk.system import system
    P, d = system.parameters, f"{y}-06-01"
    out = {}
    for key, (path, conv) in PE.items():
        node = P
        for k in path.split("."):
            node = getattr(node, k)
        out[key] = float(conv(float(node(d)), P, d))
    return md.version("policyengine-uk"), out


def same(a: float | None, b: float | None) -> bool:
    return a is not None and b is not None and abs(a - b) <= max(0.011, abs(b) * 1e-6) + (1.0 if abs(b) > 1000 else 0)


def main() -> None:
    today = date.today()
    y = tax_year(today)
    now = official(y)
    base = json.loads(BASELINE.read_text()) if BASELINE.exists() else {"tax_year": None, "values": {}}
    lines = [f"## Money layer: official rates for {y}-{str(y + 1)[2:]}", "", "| Figure | Official (GOV.UK) | Last confirmed | PolicyEngine | |", "|---|---|---|---|---|"]
    problems = []
    try:
        pe_version, pe = policyengine_values(y)
    except Exception as ex:  # the package isn't installed or a parameter moved
        pe_version, pe = f"unavailable ({type(ex).__name__}: {ex})", {}
        problems.append(f"PolicyEngine parameters could not be read: {ex}")
    for key, o in now.items():
        was = base["values"].get(key) if base.get("tax_year") == y else None
        flags = []
        if o["value"] is None:
            flags.append("not found on the page")
            problems.append(f"{o['label']}: not found at {o['source']} (the page's wording may have changed)")
        if was is not None and o["value"] is not None and not same(o["value"], was):
            flags.append("changed at source")
            problems.append(f"{o['label']}: GOV.UK now says {o['value']:g} (was {was:g}) at {o['source']}")
        if key in pe and o["value"] is not None and not same(pe[key], o["value"]):
            flags.append("model differs")
            problems.append(f"{o['label']}: PolicyEngine {pe_version} has {pe[key]:g}, GOV.UK says {o['value']:g}")
        lines.append(f"| {o['label']} | {o['value'] if o['value'] is not None else '—'} | {was if was is not None else '—'} | {pe.get(key, '—')} | {', '.join(flags) or 'ok'} |")
    if base.get("tax_year") != y:
        problems.append(f"No confirmed values for {y}-{str(y + 1)[2:]} yet: check the table against GOV.UK, then run with --accept")
    lines += ["", f"PolicyEngine UK checked: {pe_version}. Official figures read {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC."]
    if problems:
        lines += ["", "### Needs a look", *[f"- {p}" for p in problems], "",
                  "If GOV.UK changed: check the figure on the page, then run this script with `--accept` and commit scripts/money/official_rates.json. "
                  "If the model differs: the receipt grid was computed with outdated rates; recompute with a PolicyEngine version that has them (the Money layer workflow's compute job) before showing new figures."]
    report = "\n".join(lines)
    print(report)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as f:
            f.write(report + "\n")
    if "--accept" in sys.argv:
        missing = [k for k, o in now.items() if o["value"] is None]
        if missing:
            raise SystemExit(f"Not accepting: {', '.join(missing)} not found")
        BASELINE.parent.mkdir(parents=True, exist_ok=True)
        BASELINE.write_text(json.dumps({"tax_year": y, "confirmed_on": today.isoformat(), "values": {k: o["value"] for k, o in now.items()},
                                        "sources": {k: {"url": o["source"], "words": o["words"]} for k, o in now.items()}}, indent=1, ensure_ascii=False) + "\n")
        print(f"Recorded {BASELINE.relative_to(ROOT)}")
        return
    if problems:
        sys.exit(1)


if __name__ == "__main__":
    main()
