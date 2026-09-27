"""Load computed party reform sets into receipt_grid.

A reform set is computed with PolicyEngine UK by scripts/compute_reform_sets.py (8,100 households). The full output is
about 5 MB, so it is committed in a compact form in scripts/receipts/<reform_set_id>.json: the distinct results
('tuples') and, for each household in the byte order of household_key, which tuple applies ('rows'). This job rebuilds
every row against the baseline's own household keys, checks two SHA-256 hashes written at compute time, and inserts
the set only if it is not already there. Nothing is ever overwritten: receipt_grid rows are replaced only by a new
reform_set_id. Runs when a file in scripts/receipts/ changes, or by hand.
"""
import glob, hashlib, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import DRY, ROOT, select, write


def load(path: str) -> str:
    spec = json.load(open(path))
    rid = spec["reform_set_id"]
    have = select(f"/receipt_grid?select=id&reform_set_id=eq.{rid}")
    if have:
        return f"{rid}: already loaded ({len(have)} rows), left unchanged"
    base = select("/receipt_grid?select=household_key,household&reform_set_id=eq.baseline")
    base.sort(key=lambda r: r["household_key"].encode())
    if len(base) != len(spec["rows"]):
        raise SystemExit(f"{rid}: {len(spec['rows'])} rows in the file, {len(base)} baseline households")
    if hashlib.sha256("".join(r["household_key"] for r in base).encode()).hexdigest() != spec["keys_sha256"]:
        raise SystemExit(f"{rid}: baseline household keys differ from the ones this set was computed for")
    names = spec["variables"]
    rows, check = [], []
    for b, t in zip(base, spec["rows"]):
        vals = spec["tuples"][t]
        results = dict(zip(names, vals))
        check.append(b["household_key"] + ":" + ",".join(str(v) for v in vals) + ";")
        results.update({"_source_ids": spec["source_ids"], "_label": spec["label"], "_year": spec["year"]})
        rows.append({"reform_set_id": rid, "party_ec_id": spec["party_ec_id"], "household_key": b["household_key"],
                     "household": b["household"], "results": results, "policyengine_version": spec["policyengine_version"]})
    if hashlib.sha256("".join(check).encode()).hexdigest() != spec["results_sha256"]:
        raise SystemExit(f"{rid}: rebuilt results do not match the hash written when they were computed")
    write("receipt_grid", rows)
    return f"{rid}: {'would load' if DRY else 'loaded'} {len(rows)} rows"


if __name__ == "__main__":
    for p in sorted(glob.glob(os.path.join(ROOT, "scripts", "receipts", "*.json"))):
        print(load(p), flush=True)
