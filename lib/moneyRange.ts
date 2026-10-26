// Money figures from a partly answered household (Romily and Barny, round ten, q33). Shared by the website and, once
// Romily approves it there, the phone app, which already holds every row of each set (/api/app/v1/receipts/sets/[id]).
//
// The rule, from handoff/FROM-CLAUDE-CODE-2026-10-14d.md:
// - Nothing until the income band is answered: below that the range is too wide to help.
// - Then the lowest to the highest monthly change across every row of the grid that matches the answers given.
//   Never a midpoint and never "about": the rows are a grid, not a sample of people, so the middle means nothing.
// - Name the missing answers that would narrow it, in plain words.
// - A range that crosses zero gets no figures: "could be more or less, depending on ...".
// - The same lowest and highest: the single figure.
import { GRID_KEYS, foldGridValue, modelCaveat, type GridField, type Household } from "@/lib/household";

// One row of the grid for one pledge: its household_key and the change in net income a year (pledge minus current law).
export type DeltaRow = { household_key: string; delta: number };
// Pair a pledge's rows with the baseline's by household_key.
export function deltaRows(baseline: { household_key: string; net: number }[], pledge: { household_key: string; net: number }[]): DeltaRow[] {
  const base = new Map(baseline.map((r) => [r.household_key, r.net]));
  return pledge.filter((r) => base.has(r.household_key)).map((r) => ({ household_key: r.household_key, delta: r.net - base.get(r.household_key)! }));
}
// A SQL LIKE pattern for the grid keys that match the answers given, "%" for each unanswered one. Only a first cut on
// the server: the "_" in values is LIKE's one-character wildcard, so moneyRange checks every row exactly.
export function gridPattern(h: Household): string {
  return GRID_KEYS.map((k) => `${k}=${h[k] ? foldGridValue(k, h[k] as string) : "%"}`).join("|");
}

export type MoneyRange =
  | { kind: "none"; reason: "income" | "no_rows" } // income not answered, or no matching row the site would show
  | { kind: "single"; perMonth: number; rows: number } // whole pounds a month, signed
  | { kind: "range"; low: number; high: number; direction: "more" | "less"; narrowBy: GridField[]; rows: number } // low < high, both >= 0
  | { kind: "mixed"; narrowBy: GridField[]; rows: number }; // some households gain and some lose

// The missing answers, in the words the sentence uses. Question order, as on the form.
export const NARROW_WORDS: Record<GridField, string> = { age_band: "your age", household: "your household", children: "your children", tenure: "your home", income_band: "your income", employment: "your work" };

const parse = (key: string) => Object.fromEntries(key.split("|").map((p) => p.split("=") as [string, string])) as Record<GridField, string>;
// Whole pounds a month. Math.round(-0.4) is -0, so add 0 to make it a plain 0.
const monthly = (perYear: number) => Math.round(perYear / 12) + 0;

export function moneyRange(h: Household, rows: DeltaRow[]): MoneyRange {
  if (!h.income_band) return { kind: "none", reason: "income" };
  const missing = GRID_KEYS.filter((k) => !h[k]);
  const want = Object.fromEntries(GRID_KEYS.filter((k) => h[k]).map((k) => [k, foldGridValue(k, h[k] as string)]));
  const answered = Object.fromEntries(Object.entries(h).filter(([, v]) => v !== undefined));
  const matched: { kv: Record<GridField, string>; m: number }[] = [];
  for (const r of rows) {
    const kv = parse(r.household_key);
    if (!Object.entries(want).every(([k, v]) => kv[k as GridField] === v)) continue;
    // A row the site would withhold once every question was answered (a 16 or 17-year-old household, a single
    // student with no children; see modelCaveat) is left out of the range too: the answers given win over the row's.
    if (modelCaveat({ ...kv, ...answered } as Household)) continue;
    matched.push({ kv, m: monthly(r.delta) });
  }
  if (!matched.length) return { kind: "none", reason: "no_rows" };
  const ends = (xs: typeof matched) => [Math.min(...xs.map((x) => x.m)), Math.max(...xs.map((x) => x.m))];
  const [lo, hi] = ends(matched);
  if (lo === hi) return { kind: "single", perMonth: lo, rows: matched.length };
  // A missing answer narrows the range if, for some value of it, the range is narrower than now.
  let narrowBy = missing.filter((k) => [...new Set(matched.map((x) => x.kv[k]))].some((v) => {
    const [a, b] = ends(matched.filter((x) => x.kv[k] === v));
    return a !== lo || b !== hi;
  }));
  // Only two answers together would narrow it: name every missing one.
  if (!narrowBy.length) narrowBy = missing;
  if (lo < 0 && hi > 0) return { kind: "mixed", narrowBy, rows: matched.length };
  return hi > 0
    ? { kind: "range", low: lo, high: hi, direction: "more", narrowBy, rows: matched.length }
    : { kind: "range", low: -hi, high: -lo, direction: "less", narrowBy, rows: matched.length };
}

// "your household and your home"; "your age, your household and your home".
export function narrowList(fields: GridField[]): string {
  const w = fields.map((k) => NARROW_WORDS[k]);
  return w.length <= 1 ? (w[0] ?? "") : `${w.slice(0, -1).join(", ")} and ${w[w.length - 1]}`;
}

// The sentence and its follow-up, the same for every party (handoff q33 wording). Null when nothing is shown.
export function moneyRangeText(r: MoneyRange): { gist: string; narrow: string } | null {
  if (r.kind === "none") return null;
  if (r.kind === "single") {
    return { gist: r.perMonth === 0 ? "No change for households like yours." : `£${Math.abs(r.perMonth)} ${r.perMonth > 0 ? "more" : "less"} a month for households like yours.`, narrow: "" };
  }
  if (r.kind === "mixed") return { gist: `Could be more or less a month, depending on ${narrowList(r.narrowBy)}.`, narrow: "" };
  return { gist: `Between £${r.low} and £${r.high} ${r.direction} a month for households like yours.`, narrow: `Answer ${narrowList(r.narrowBy)} to narrow it.` };
}
