"""Weekly: each council's local plans as recorded by MHCLG's planning data platform (planning.data.gov.uk, OGL).

Gives the plan's name, stage (adopted, emerging and so on), adoption date, plan period and, where the council has
supplied it, the housing requirement. England only; many councils have not supplied every field, and the page says
when the record was last updated by the council ("entry date"), because some entries are old.
"""
import datetime, os, sys, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
from common import councils, get_json, job, remove, write, now_iso

API = "https://www.planning.data.gov.uk"


def main():
    with job("local plans (planning.data.gov.uk)") as st:
        d = get_json(f"{API}/organisation.json")
        groups = d.get("organisations") or {}
        orgs = groups.get("local-authority", []) if isinstance(groups, dict) else []
        by_gss = {}
        for o in orgs:
            g = o.get("statistical-geography")
            if g and not o.get("end-date"): by_gss[g] = o
        stamp, total, notes = now_iso(), 0, []
        for c in councils():
            o = by_gss.get(c.get("gss") or "")
            if not o: continue
            ent = o.get("entity")
            d = get_json(f"{API}/entity.json?dataset=local-plan&organisation_entity={ent}&limit=100")
            rows = []
            for e in d.get("entities", []):
                def num(k):
                    try: return int(float(e.get(k))) if e.get(k) not in (None, "") else None
                    except Exception: return None
                def dt(k):
                    v = (e.get(k) or "")[:10]
                    return v if len(v) == 10 else None
                rows.append({"council_slug": c["slug"], "entity": e["entity"], "name": e.get("name"), "process": e.get("local-plan-process") or None,
                             "adopted_date": dt("adopted-date"), "period_start": dt("period-start-date"), "period_end": dt("period-end-date"),
                             "required_housing": num("required-housing"), "documentation_url": e.get("documentation-url") or e.get("document-url") or None,
                             "entry_date": dt("entry-date"), "retrieved_at": stamp})
            remove("local_plans", f"council_slug=eq.{c['slug']}")
            write("local_plans", rows, "council_slug,entity")
            total += len(rows); notes.append(f"{c['slug']} {len(rows)}")
        st["rows"] = total; st["note"] = "; ".join(notes)


if __name__ == "__main__": main()
