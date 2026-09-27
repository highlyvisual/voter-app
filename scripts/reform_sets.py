"""
Party reform sets for the receipt grid. Each is a dict of PolicyEngine UK parameter overrides for 2026,
tied to a verified (or to-be-verified) claim by source. Recomputed with the same representative households as the baseline.

Only pledges that map cleanly onto model parameters are included. Everything else stays documented-tier text.
"""
REFORM_SETS = {
    # Conservative 2024 manifesto: employee NI main rate cut from 8% towards 6% (source id 22). Computed under 2024 law for the archive ballot.
    "PP52-2024-employee-ni-6pct": {
        "party_ec_id": "PP52",
        "label": "Conservatives (2024): employee National Insurance 6%",
        "source_ids": [22],
        "year": "2024",
        "parameters": {"gov.hmrc.national_insurance.class_1.rates.employee.main": 0.06},
    },
    # Reform UK, September 2026 conference pledge: personal allowance to £15,000 in a first Budget (source id 16)
    "PP7931-2026-09-personal-allowance-15000": {
        "party_ec_id": "PP7931",
        "label": "Reform UK: personal allowance £15,000",
        "source_ids": [16],
        "parameters": {"gov.hmrc.income_tax.allowances.personal_allowance.amount": 15000},
    },
    # Green Party 2024 manifesto: remove the Upper Earnings Limit, so the main employee NI rate applies to all earnings (source id 13)
    "PP63-2024-ni-upper-earnings-limit": {
        "party_ec_id": "PP63",
        "label": "Green Party: remove NI upper earnings limit",
        "source_ids": [13],
        "parameters": {"gov.hmrc.national_insurance.class_1.rates.employee.additional": 0.08},
    },
    # Liberal Democrats: "raising the tax-free personal allowance (and the national insurance threshold) to £15,000" (source id 64).
    # Added 27 Sept 2026 so that the same £15,000 allowance pledged by two parties on one ballot is modelled for both (review, 25 Sept).
    # The employee NI primary threshold is weekly in the model: £15,000 / 52. Their separate pledge to raise the higher-rate point gives
    # no figure, so it is not modelled beyond the rise that follows automatically from a higher allowance.
    "PP90-2026-09-personal-allowance-ni-threshold-15000": {
        "party_ec_id": "PP90",
        "label": "Liberal Democrats: personal allowance and National Insurance threshold £15,000",
        "source_ids": [64],
        "parameters": {"gov.hmrc.income_tax.allowances.personal_allowance.amount": 15000,
                       "gov.hmrc.national_insurance.class_1.thresholds.primary_threshold": round(15000 / 52, 2)},
    },
}
