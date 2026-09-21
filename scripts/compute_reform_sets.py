import json, os, sys, hashlib
sys.path.insert(0, os.path.dirname(__file__))
from policyengine_uk import Simulation
import compute_grid as g
from reform_sets import REFORM_SETS

OUT = os.path.join(os.path.dirname(__file__), "sql"); os.makedirs(OUT, exist_ok=True)

def make_reform(params, year):
    # This PolicyEngine version accepts a parameter dict directly: {parameter: {"YYYY-MM-DD.YYYY-MM-DD": value}}
    return {k: {f"{year}-01-01.2030-12-31": v} for k, v in params.items()}

def run(reform_id, spec):
    year = spec.get("year", "2026")
    if g.YEAR != year:
        return None  # run with GRID_YEAR=<year> to compute this set
    reform = make_reform(spec["parameters"], year)
    allc = list(g.cells()); rows = []
    for start in range(0, len(allc), 300):
        batch = allc[start:start + 300]
        sim = Simulation(situation=g.situation_for(batch), reform=reform)
        res = {v: sim.calculate(v, int(year), map_to="household") for v in g.VARS}
        for i, c in enumerate(batch):
            results = {v: int(round(float(res[v][i]))) for v in g.VARS}
            results.update({"_source_ids": spec["source_ids"], "_label": spec["label"], "_year": year})
            rows.append({"reform_set_id": reform_id, "party_ec_id": spec["party_ec_id"], "household_key": g.key(c), "household": c,
                         "results": results, "policyengine_version": g.VERSION})
    with open(os.path.join(OUT, f"reform_{reform_id}.json"), "w") as f: json.dump(rows, f)
    h = hashlib.sha256("".join(r["household_key"] + json.dumps(r["results"], sort_keys=True) for r in sorted(rows, key=lambda r: r["household_key"])).encode()).hexdigest()
    print(reform_id, len(rows), "rows, sha256", h)
    return rows

if __name__ == "__main__":
    for rid, spec in REFORM_SETS.items(): run(rid, spec)
