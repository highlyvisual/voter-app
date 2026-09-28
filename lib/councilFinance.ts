// Council budgets by service (England, Wales, Scotland) and council tax for Wales and Scotland, from each government's
// own official statistics. Written by scripts/loaders/council_finance.py (the "Data files" workflow, weekly), so
// no database table is needed. Figures are £ thousand, as published. England's council tax stays in council_tax_2026.
import data from "./council_finance.json";

export type SourceRef = { publisher: string; title: string; page: string; file: string; updated?: string; measure?: string; note?: string };
export type Spend = { source: "england" | "wales" | "scotland"; lines: [string, number][]; total: [string, number] };
export type BandD = { source: "wales" | "scotland"; council: number; community?: number; police?: number; total: number };
export type CouncilFinance = { nation: "England" | "Wales" | "Scotland"; source_name: string; spend: Spend | null; band_d?: BandD; bands?: [string, number][] };

type Doc = { year: string; retrieved_at: string; licence: string; sources: Record<string, SourceRef>; councils: Record<string, CouncilFinance> };
const DOC = data as unknown as Doc;

export const FINANCE_YEAR = DOC.year;
export const FINANCE_SOURCES = DOC.sources;
export const FINANCE_RETRIEVED = DOC.retrieved_at;

/** The first of the given ONS codes that has figures (a council can carry an old and a new code). */
export function councilFinance(...codes: (string | null | undefined)[]): CouncilFinance | null {
  for (const c of codes) if (c && DOC.councils[c]) return DOC.councils[c];
  return null;
}

const squash = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/\b(the|city of|council|county|borough)\b/g, "").replace(/[^a-z]/g, "");

/** By name, for pages that only know an area name (the ballot "about this office" page). Wales and Scotland only. */
export function councilFinanceByName(name: string): CouncilFinance | null {
  const k = squash(name);
  if (!k) return null;
  for (const c of Object.values(DOC.councils)) if (c.nation !== "England" && squash(c.source_name) === k) return c;
  return null;
}

/** £ thousand to words: "£1,449.3 million", "£67,000", "none budgeted", "−£0.1 million". */
export function thousands(v: number): string {
  if (v === 0) return "none budgeted";
  const sign = v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (a >= 1000) return `${sign}£${(a / 1000).toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} million`;
  return `${sign}£${(a * 1000).toLocaleString("en-GB")}`;
}

export const pounds = (n: number) => "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
