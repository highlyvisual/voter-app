// The money layer's arithmetic and wording, shared by the website (components/CurrentLaw.tsx, CandidateCard.tsx) and the
// phone app (mobile/), so a household sees the same lines and totals in both. No imports.

// The five figures stored per household in receipt_grid.results (scripts/compute_grid.py), in display order.
export const RECEIPT_FIELDS = ["income_tax", "national_insurance", "universal_credit", "child_benefit", "household_net_income"] as const;
export type ReceiptField = (typeof RECEIPT_FIELDS)[number];

// The review (25 Sept) found the lines did not add up to the total: PolicyEngine's net income counts earnings and every
// tax and benefit it models, and only four are listed. The first line is the remainder, so the table sums exactly.
export function otherItems(r: Record<string, unknown>): number {
  const n = (k: string) => Number(r[k] ?? 0);
  return n("household_net_income") + n("income_tax") + n("national_insurance") - n("universal_credit") - n("child_benefit");
}
// Persona test (28 Sept): the first line used to be the whole remainder, labelled as earnings, so it showed -£180 for a
// household with no income. The model's earnings or pension input is known exactly (scripts/compute_grid.py): the band's
// midpoint (over £100,000 uses £130,000) for employed, self-employed and retired households, and nothing otherwise.
// So that is shown as its own line, and what is left over is labelled for what it is.
const MIDPOINT: Record<string, number> = { under_15k: 10000, "15k_25k": 20000, "25k_40k": 32500, "40k_60k": 50000, "60k_100k": 80000, over_100k: 130000 };
export function modelledEarnings(householdKey: string): number {
  const kv = Object.fromEntries(householdKey.split("|").map((p) => p.split("=") as [string, string]));
  return ["employed", "self_employed", "retired"].includes(kv.employment) ? MIDPOINT[kv.income_band] ?? 0 : 0;
}

// Lines of the current-law table, in order.
export const CURRENT_LAW_LABELS: Record<string, string> = {
  earnings: "Earnings or pension before tax (the middle of your band)",
  income_tax: "Income tax paid",
  national_insurance: "National Insurance paid",
  universal_credit: "Universal Credit received",
  child_benefit: "Child Benefit received",
  other: "Other taxes and benefits the model counts (net)",
  household_net_income: "Net income after tax and benefits",
};
// Short labels for the pledge comparison table.
export const PLEDGE_LABELS: Record<ReceiptField, string> = { income_tax: "Income tax", national_insurance: "National Insurance", universal_credit: "Universal Credit", child_benefit: "Child Benefit", household_net_income: "Net income" };

// The current-law lines for one household: earnings, each modelled item, the "other" remainder (left out when it rounds
// to zero) and net income. Each line carries its sign: "-" for a tax paid, "+" for money received, "" for earnings.
export type ReceiptLine = { key: string; label: string; amount: number; sign: "+" | "-" | "" };
export function currentLawLines(householdKey: string, results: Record<string, unknown>): ReceiptLine[] {
  const earned = modelledEarnings(householdKey);
  const other = otherItems(results) - earned;
  const val: Record<string, number> = { earnings: earned, other, ...Object.fromEntries(RECEIPT_FIELDS.map((k) => [k, Number(results[k] ?? 0)])) };
  return Object.keys(CURRENT_LAW_LABELS).filter((k) => k !== "other" || Math.round(other) !== 0).map((k) => ({
    key: k,
    label: CURRENT_LAW_LABELS[k],
    amount: k === "other" ? Math.abs(val[k]) : val[k],
    sign: k === "income_tax" || k === "national_insurance" ? "-" : k === "earnings" ? "" : k === "other" ? (val[k] < 0 ? "-" : "+") : "+",
  }));
}

// Direction before precision (review, 25 Sept, after the Dutch CPB and Nibud): the rough monthly change first.
export function monthlyGist(deltaPerYear: number): string {
  return Math.abs(deltaPerYear) < 60 ? "Little or no change" : `About £${Math.round(Math.abs(deltaPerYear) / 12 / 5) * 5 || 5} a month ${deltaPerYear > 0 ? "more" : "less"}`;
}

// The law year a baseline stands for: "baseline" is 2026 law, "baseline-2024" is 2024 law. Only a reform set computed under
// the same year is comparable with it.
export function baselineYear(baselineId: string): string {
  return baselineId === "baseline" ? "2026" : baselineId.replace("baseline-", "");
}
