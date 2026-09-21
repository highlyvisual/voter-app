"""
Compute the baseline receipt grid with PolicyEngine UK.

One row per *economic cell*: the household bands that change a tax-and-benefit result.
Student status is excluded (not modelled) and "adult_dependant" is treated as "none"
(not modelled). The app maps a full household to its economic key before lookup.

Every assumption below is deliberate, deterministic and stored with each row.
Region is LONDON for the only ballot currently covered; extend the key when a second
region is added.

Usage: python compute_grid.py  -> writes sql/grid_batch_NN.sql
"""
import itertools, json, math, os, importlib.metadata as m
from policyengine_uk import Simulation

YEAR = os.environ.get("GRID_YEAR", "2026")
REGION = "LONDON"
VERSION = m.version("policyengine-uk")
OUT = os.path.join(os.path.dirname(__file__), "sql" if os.environ.get("GRID_YEAR", "2026") == "2026" else f"sql-{os.environ.get('GRID_YEAR')}")
os.makedirs(OUT, exist_ok=True)

AGE = {"16_17": 17, "18_24": 21, "25_34": 30, "35_49": 42, "50_64": 57, "65_plus": 70}
INCOME = {"under_15k": 10000, "15k_25k": 20000, "25k_40k": 32500, "40k_60k": 50000, "60k_100k": 80000, "over_100k": 130000}
HOUSEHOLD = ["single", "couple", "other"]
CHILDREN = {"none": [], "under_5": [3], "school_age": [10]}  # adult_dependant -> none
TENURE = ["private_rent", "social_rent", "own_mortgage", "own_outright", "other"]
EMPLOYMENT = ["employed", "self_employed", "unemployed", "retired", "not_working_other"]

ASSUMPTIONS = {
    "region": REGION,
    "income": "household gross income at band midpoint (over_100k uses 130000); split 60/40 between adults in a couple",
    "income_type": "employed -> employment income; self_employed -> self-employment income; retired -> private pension income; unemployed and not_working_other -> no earned income (band not applied)",
    "age": "representative age per band: 17, 21, 30, 42, 57, 70; partner same age",
    "children": "none -> no children; under_5 -> one child aged 3; school_age -> one child aged 10; adult_dependant -> treated as none",
    "rent": "private_rent: 15600/yr single without children, 21600/yr otherwise; social_rent: 9000/yr; owners and other: 0 (mortgage interest not modelled)",
    "student": "no effect modelled (student finance is outside the tax-benefit model)",
    "other_adults": "household type 'other' modelled as a single adult; other adults' incomes not included",
    "benefits": "household assumed to claim Universal Credit and Child Benefit if entitled",
    "policy": "current law as encoded in policyengine-uk " + VERSION,
}

VARS = ["income_tax", "national_insurance", "universal_credit", "child_benefit", "household_net_income"]


def rent_for(tenure, hh, kids):
    if tenure == "private_rent":
        return 15600 if (hh == "single" and not kids) else 21600
    if tenure == "social_rent":
        return 9000
    return 0


def income_fields(employment, amount):
    if employment == "employed":
        return {"employment_income": {YEAR: amount}}
    if employment == "self_employed":
        return {"self_employment_income": {YEAR: amount}}
    if employment == "retired":
        return {"private_pension_income": {YEAR: amount}}
    return {}


def cells():
    for age, hh, ch, ten, inc, emp in itertools.product(AGE, HOUSEHOLD, CHILDREN, TENURE, INCOME, EMPLOYMENT):
        yield {"age_band": age, "household": hh, "children": ch, "tenure": ten, "income_band": inc, "employment": emp}


def key(c):
    return "|".join(f"{k}={c[k]}" for k in ["age_band", "household", "children", "tenure", "income_band", "employment"])


def situation_for(batch):
    people, benunits, households = {}, {}, {}
    for i, c in enumerate(batch):
        amount = INCOME[c["income_band"]]
        kids = CHILDREN[c["children"]]
        members = []
        a1 = f"a{i:04d}"
        share1 = 0.6 if c["household"] == "couple" else 1.0
        people[a1] = {"age": {YEAR: AGE[c["age_band"]]}, **income_fields(c["employment"], round(amount * share1))}
        members.append(a1)
        if c["household"] == "couple":
            a2 = f"p{i:04d}"
            people[a2] = {"age": {YEAR: AGE[c["age_band"]]}, **income_fields(c["employment"], round(amount * 0.4))}
            members.append(a2)
        for j, k in enumerate(kids):
            kid = f"k{i:04d}_{j}"
            people[kid] = {"age": {YEAR: k}}
            members.append(kid)
        benunits[f"b{i:04d}"] = {"members": members, "would_claim_uc": {YEAR: True}}
        households[f"h{i:04d}"] = {"members": members, "region": {YEAR: REGION}, "rent": {YEAR: rent_for(c["tenure"], c["household"], kids)}}
    return {"people": people, "benunits": benunits, "households": households}


def q(s):
    return "'" + s.replace("'", "''") + "'"


def main():
    allc = list(cells())
    print(len(allc), "economic cells")
    rows = []
    B = 300
    for start in range(0, len(allc), B):
        batch = allc[start:start + B]
        sim = Simulation(situation=situation_for(batch))
        res = {v: sim.calculate(v, int(YEAR), map_to="household") for v in VARS}
        for i, c in enumerate(batch):
            r = {v: int(round(float(res[v][i]))) for v in VARS}
            rows.append((key(c), c, r))
        print("computed", min(start + B, len(allc)))
    # sanity
    assert all(r["household_net_income"] >= 0 for _, _, r in rows)
    # write SQL in batches of 1200 rows
    n = 0
    for start in range(0, len(rows), 1200):
        chunk = rows[start:start + 1200]
        rsid = "baseline" if YEAR == "2026" else f"baseline-{YEAR}"
        vals = ",\n".join(
            f"('{rsid}',NULL,{q(k)},{q(json.dumps(c))}::jsonb,{q(json.dumps(r))}::jsonb,{q(VERSION)})" for k, c, r in chunk
        )
        sql = ("insert into receipt_grid (reform_set_id, party_ec_id, household_key, household, results, policyengine_version) values\n"
               + vals + "\non conflict (reform_set_id, household_key) do update set household=excluded.household, results=excluded.results, policyengine_version=excluded.policyengine_version, computed_at=now();")
        with open(os.path.join(OUT, f"grid_batch_{n:02d}.sql"), "w") as f:
            f.write(sql)
        n += 1
    with open(os.path.join(OUT, "grid_assumptions.json"), "w") as f:
        json.dump({"policyengine_version": VERSION, "cells": len(rows), "assumptions": ASSUMPTIONS}, f, indent=1)
    print("wrote", n, "batches")


if __name__ == "__main__":
    main()
