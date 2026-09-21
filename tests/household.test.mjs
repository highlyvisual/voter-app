import test from "node:test";
import assert from "node:assert/strict";
import { claimApplies, gridKey, householdFromParams, householdComplete } from "../dist-test/household.mjs";

const full = { age_band: "25_34", household: "couple", children: "school_age", tenure: "private_rent", income_band: "25k_40k", employment: "employed", student: "no" };

test("complete household is complete; missing field is not", () => {
  assert.equal(householdComplete(full), true);
  assert.equal(householdComplete({ ...full, tenure: undefined }), false);
});

test("params parsing rejects unknown codes", () => {
  const h = householdFromParams({ ...full, tenure: "castle" });
  assert.equal(h.tenure, undefined);
  assert.equal(h.age_band, "25_34");
});

test("metadata keys are ignored by the matcher", () => {
  assert.equal(claimApplies({ _single_check: true }, full), true);
  assert.equal(claimApplies({ _single_check: true, tenure: "own_outright" }, full), false);
});

test("empty applies_if matches everyone", () => {
  assert.equal(claimApplies({}, full), true);
  assert.equal(claimApplies(null, full), true);
});

test("field and array rules", () => {
  assert.equal(claimApplies({ tenure: "private_rent" }, full), true);
  assert.equal(claimApplies({ tenure: ["social_rent", "private_rent"] }, full), true);
  assert.equal(claimApplies({ tenure: "own_outright" }, full), false);
});

test("derived booleans", () => {
  assert.equal(claimApplies({ rents: true }, full), true);
  assert.equal(claimApplies({ owns: true }, full), false);
  assert.equal(claimApplies({ has_children: true }, { ...full, children: "none" }), false);
  assert.equal(claimApplies({ is_pensioner: true }, { ...full, age_band: "65_plus" }), true);
});

test("geographic rules never match through the household matcher", () => {
  assert.equal(claimApplies({ within_m: 500 }, full), false);
});

test("grid key excludes student and folds adult_dependant", () => {
  const a = gridKey(full);
  const b = gridKey({ ...full, student: "university" });
  assert.equal(a, b);
  assert.equal(gridKey({ ...full, children: "adult_dependant" }), gridKey({ ...full, children: "none" }));
  assert.equal(a, "age_band=25_34|household=couple|children=school_age|tenure=private_rent|income_band=25k_40k|employment=employed");
});

test("optional fields: unanswered never matches, answered matches", () => {
  assert.equal(claimApplies({ has_disability: true }, full), false);
  assert.equal(claimApplies({ has_disability: true }, { ...full, disability: "yes" }), true);
  assert.equal(claimApplies({ has_disability: true }, { ...full, disability: "no" }), false);
  assert.equal(claimApplies({ on_benefits: true }, { ...full, employment: "unemployed" }), true);
});

test("optional visa field drives on_visa strictly", () => {
  assert.equal(claimApplies({ on_visa: true }, full), false);
  assert.equal(claimApplies({ on_visa: true }, { ...full, visa: "yes" }), true);
});
