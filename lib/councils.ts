import data from "./councils.json";
// Council facts: quotations from each council's own publications, gathered 24 Sept 2026 (docs/research/00-BRIEF-round-2.md, q9).
// Kept in git rather than the ledger so every change is a reviewable diff; the ledger is for claims about candidates and parties.
export type CouncilFact = { topic: string; summary: string; quote: string; url: string | null; publisher: string; published_on: string | null; note?: string | null };
export type Council = { slug: string; name: string; gss: string | null; site: string; system: string | null; links: Record<string, string | null>; facts: CouncilFact[]; notes: string | null; checked: string };
export const TOPIC_ORDER = ["housing", "transport", "council_tax", "environment", "education"] as const;
const COUNCILS = (data as { councils: Council[] }).councils;
const norm = (x: string) => x.toLowerCase().replace(/\s+(borough|district|city|county|council|royal borough of|london borough of)(?=\s|$)/g, "").replace(/^(royal borough of|london borough of)\s+/, "").replace(/[^a-z0-9]/g, "");
export function councilBySlug(slug: string): Council | null { return COUNCILS.find((c) => c.slug === slug) ?? null; }
// The slug for a council named the way ballots (\"Camden: Ward\"), postcodes.io (\"Camden\") or Open Council Data name it, or null if no page exists.
export function councilSlugFor(name: string | null | undefined): string | null {
  if (!name) return null;
  const n = norm(name.split(":")[0]);
  return COUNCILS.find((c) => norm(c.name) === n)?.slug ?? null; // exact: "Aberdeenshire" must not match "Aberdeen City"
}
export function listCouncils(): Council[] { return COUNCILS; }
