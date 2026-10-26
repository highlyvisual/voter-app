import test from "node:test";
import assert from "node:assert/strict";
import { keyDates } from "../dist-test/deadlines.mjs";
import { currentLawLines, monthlyGist, baselineYear } from "../dist-test/receipts.mjs";

// Code the website and the phone app share (lib/deadlines.ts, lib/receipts.ts).
test("key dates: statutory working days, skipping weekends", () => {
  // Poll Thursday 15 Oct 2026: register 12 working days before = Tue 29 Sep; postal 11 = Wed 30 Sep; proxy and ID 6 = Wed 7 Oct.
  const kd = keyDates({ pollDate: "2026-10-15", gss: "E05000001", level: "local" });
  assert.deepEqual(kd.items.map((i) => [i.kind, i.date]), [["register", "2026-09-29"], ["postal", "2026-09-30"], ["proxy", "2026-10-07"], ["voter_id", "2026-10-07"]]);
  assert.ok(kd.items.every((i) => i.href.startsWith("https://")));
});
test("key dates: no photo ID at Welsh council elections; Democracy Club dates win", () => {
  assert.equal(keyDates({ pollDate: "2026-10-15", gss: "W05000001", level: "local" }).items.some((i) => i.kind === "voter_id"), false);
  const kd = keyDates({ pollDate: "2026-10-15", gss: "E05000001", level: "local", timetable: { registration: "2026-09-28", requiresId: true, source: "https://elections.democracyclub.org.uk/x" } });
  assert.equal(kd.items[0].date, "2026-09-28");
  assert.equal(kd.fromTimetable, true);
});
test("receipt lines add up to net income", () => {
  const key = "age_band=35_49|household=couple|children=none|tenure=own_mortgage|income_band=40k_60k|employment=employed";
  const results = { income_tax: 6000, national_insurance: 2500, universal_credit: 0, child_benefit: 0, household_net_income: 41500 };
  const lines = currentLawLines(key, results);
  const total = lines.filter((l) => l.key !== "household_net_income").reduce((n, l) => n + (l.sign === "-" ? -l.amount : l.amount), 0);
  assert.equal(total, 41500);
  assert.equal(lines[0].amount, 50000);
});
test("monthly gist and law year", () => {
  assert.equal(monthlyGist(30), "Little or no change");
  assert.equal(monthlyGist(1200), "About £100 a month more");
  assert.equal(baselineYear("baseline"), "2026");
  assert.equal(baselineYear("baseline-2024"), "2024");
});
