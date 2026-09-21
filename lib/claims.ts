import type { Claim } from "@/lib/data";
import { FIELDS, type Household } from "@/lib/household";

// Layer label: what kind of publication a claim rests on.
// Fixed layer set (docs/claims-style-guide.md). Grey chips, identical weight, no order implied in the UI; ordering below is for reading only.
export const LAYERS: Record<string, string> = {
  manifesto: "Manifesto", enacted_record: "Public record", candidate_statement: "Candidate's own words", campaign_leaflet: "Campaign leaflet", third_party_analysis: "Third-party report",
};
export function layerKey(c: Claim): string {
  const l = c.sources?.layer;
  if (l && l in LAYERS) return l;
  if (c.candidate_id !== null) return "candidate_statement";
  const pub = (c.sources?.publisher ?? "").toLowerCase();
  if (pub.includes("uk government") || pub.includes("hm treasury") || pub.includes("ministry") || pub.includes("home office")) return "enacted_record";
  if (pub.includes("press association") || pub.includes("via ")) return "third_party_analysis";
  return "manifesto";
}
export function layerOf(c: Claim): string { return LAYERS[layerKey(c)]; }
export const LEGEND = "Candidate statements and leaflets are published as written; we check they are real, not that they are true.";
export function precisionLabel(c: Claim): string | null { return c.precision === "aspiration" ? "Stated aim, no measurable commitment found" : null; }
const RANK: Record<string, number> = { candidate_statement: 0, enacted_record: 1, third_party_analysis: 2, campaign_leaflet: 3, manifesto: 4 };

// Own words first, then the most recent and most binding party material.
export function orderClaims(list: Claim[]): Claim[] {
  return [...list].sort((a, b) => {
    const r = (RANK[layerKey(a)] ?? 9) - (RANK[layerKey(b)] ?? 9);
    if (r !== 0) return r;
    return (b.sources?.published_on ?? "").localeCompare(a.sources?.published_on ?? "");
  });
}

// Plain-English condition for a claim that only applies to some households.
export function conditionText(appliesIf: unknown): string | null {
  if (!appliesIf || typeof appliesIf !== "object") return null;
  const parts: string[] = [];
  const named: Record<string, string> = { has_children: "there are children", rents: "renting", owns: "owning", is_student: "a student", is_pensioner: "a pensioner", has_disability: "someone is disabled or has a long-term condition", is_carer: "someone is an unpaid carer", on_visa: "someone is on a visa or seeking asylum", on_benefits: "receiving a means-tested benefit", drives: "driving", is_veteran: "someone has served in the armed forces" };
  for (const [k, v] of Object.entries(appliesIf as Record<string, unknown>)) {
    if (k.startsWith("_") || k.startsWith("within_m")) continue;
    if (k in named) { parts.push(v ? named[k] : `not ${named[k]}`); continue; }
    if (k in FIELDS) {
      const opts = (FIELDS[k as keyof typeof FIELDS].options as readonly (readonly [string, string])[]);
      const vals = (Array.isArray(v) ? v : [v]).map((x) => opts.find((o) => o[0] === String(x))?.[1] ?? String(x));
      parts.push(vals.join(" or ").toLowerCase());
    }
  }
  return parts.length ? `Applies if: ${parts.join("; ")}` : null;
}

export type Split = { shown: Claim[]; hidden: Claim[] };
export function splitForHousehold(list: Claim[], household: Household, complete: boolean, applies: (a: unknown, h: Household) => boolean): Split {
  const ordered = orderClaims(list);
  if (!complete) return { shown: ordered, hidden: [] };
  return { shown: ordered.filter((c) => applies(c.applies_if, household)), hidden: ordered.filter((c) => !applies(c.applies_if, household)) };
}
