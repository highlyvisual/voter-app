import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { moneyRange, moneyRangeText } from "../dist-test/moneyRange.mjs";

// Round ten q33: money figures from a partly answered household. The worked example in
// handoff/FROM-CLAUDE-CODE-2026-10-14d.md, from the live grid (Reform UK's £15,000 personal allowance).
const fx = JSON.parse(fs.readFileSync(new URL("./fixtures/q33-reform-pa15000-25k_40k.json", import.meta.url), "utf8"));
const rows = fx.rows.map(([household_key, delta]) => ({ household_key, delta }));

test("q33 worked example: nothing answered shows nothing", () => {
  assert.deepEqual(moneyRange({}, rows), { kind: "none", reason: "income" });
  assert.equal(moneyRangeText(moneyRange({}, rows)), null);
  // Every answer but income: still nothing.
  assert.equal(moneyRange({ age_band: "25_34", household: "couple", children: "none", tenure: "private_rent", employment: "employed" }, rows).kind, "none");
});

test("q33 worked example: income £25k to £40k gives £0 to £73 more", () => {
  const r = moneyRange({ income_band: "25k_40k" }, rows);
  assert.equal(r.kind, "range");
  assert.deepEqual([r.low, r.high, r.direction], [0, 73, "more"]);
  // 1,350 rows match; the 225 aged 16 to 17 are withheld once complete, so they are left out of the range too.
  assert.equal(r.rows, 1125);
  assert.equal(moneyRangeText(r).gist, "Between £0 and £73 more a month for households like yours.");
});

// The handoff's example sentence named "your household and your home"; in the live grid all four missing answers narrow
// it (a pensioner, a couple, no children, or owning or "other" housing each raises the lowest figure), so all four are named.
test("q33 worked example: plus employed gives £18 to £73 more, narrowed by every missing answer", () => {
  const r = moneyRange({ income_band: "25k_40k", employment: "employed" }, rows);
  assert.deepEqual([r.kind, r.low, r.high, r.direction], ["range", 18, 73, "more"]);
  assert.deepEqual(moneyRangeText(r), { gist: "Between £18 and £73 more a month for households like yours.", narrow: "Answer your age, your household, your children and your home to narrow it." });
  assert.deepEqual(r.narrowBy, ["age_band", "household", "children", "tenure"]);
});

test("q33 worked example: plus a couple gives £33 to £73 more", () => {
  const r = moneyRange({ income_band: "25k_40k", employment: "employed", household: "couple" }, rows);
  assert.deepEqual([r.kind, r.low, r.high], ["range", 33, 73]);
  // Children no longer narrow it: for a couple, the lowest and highest are the same with or without them.
  assert.equal(moneyRangeText(r).narrow, "Answer your age and your home to narrow it.");
});

test("q33 worked example: all seven gives £33 more", () => {
  const h = { age_band: "25_34", household: "couple", children: "none", tenure: "private_rent", income_band: "25k_40k", employment: "employed", student: "no" };
  const r = moneyRange(h, rows);
  assert.deepEqual(r, { kind: "single", perMonth: 33, rows: 1 });
  assert.equal(moneyRangeText(r).gist, "£33 more a month for households like yours.");
});

test("student-friendly answers fold into the grid's bands", () => {
  const a = moneyRange({ income_band: "25k_40k", employment: "student_working", household: "couple" }, rows);
  const b = moneyRange({ income_band: "25k_40k", employment: "employed", household: "couple" }, rows);
  assert.deepEqual([a.low, a.high], [b.low, b.high]);
});

test("households the site withholds give no range", () => {
  assert.deepEqual(moneyRange({ income_band: "25k_40k", visa: "yes" }, rows), { kind: "none", reason: "no_rows" });
  assert.deepEqual(moneyRange({ income_band: "25k_40k", age_band: "16_17" }, rows), { kind: "none", reason: "no_rows" });
});

// Synthetic rows (not from the grid) for the cases the live sets don't produce.
const K = (age, hh, tenure, emp, delta) => ({ household_key: `age_band=${age}|household=${hh}|children=none|tenure=${tenure}|income_band=15k_25k|employment=${emp}`, delta });
const synth = [K("25_34", "single", "private_rent", "employed", -600), K("25_34", "single", "own_outright", "employed", 240), K("35_49", "single", "private_rent", "employed", -600), K("35_49", "single", "own_outright", "employed", 240)];

test("a range that crosses zero shows no figures, only what it depends on", () => {
  const r = moneyRange({ income_band: "15k_25k", employment: "employed", household: "single" }, synth);
  assert.deepEqual(r, { kind: "mixed", narrowBy: ["tenure"], rows: 4 });
  assert.deepEqual(moneyRangeText(r), { gist: "Could be more or less a month, depending on your home.", narrow: "" });
});

test("a range of losses reads as less, smallest first", () => {
  const rs = [K("25_34", "single", "private_rent", "employed", -600), K("35_49", "single", "private_rent", "employed", -1200)];
  const r = moneyRange({ income_band: "15k_25k" }, rs);
  assert.deepEqual([r.kind, r.low, r.high, r.direction, r.narrowBy], ["range", 50, 100, "less", ["age_band"]]);
  assert.equal(moneyRangeText(r).narrow, "Answer your age to narrow it.");
});

test("the same lowest and highest shows the single figure; zero reads as no change", () => {
  const rs = [K("25_34", "single", "private_rent", "employed", 0), K("35_49", "single", "private_rent", "employed", 3)];
  const r = moneyRange({ income_band: "15k_25k" }, rs);
  assert.deepEqual(r, { kind: "single", perMonth: 0, rows: 2 });
  assert.equal(moneyRangeText(r).gist, "No change for households like yours.");
});
