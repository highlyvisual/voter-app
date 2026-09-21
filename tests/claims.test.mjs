import test from "node:test";
import assert from "node:assert/strict";
import { layerKey, layerOf, precisionLabel, LAYERS } from "../dist-test/claims.mjs";

const base = { id: 1, ballot_paper_id: "b", candidate_id: null, party_ec_id: "PP53", topic: "housing_and_property", tier: "documented", claim_text: "x", source_quote: "y", applies_if: {}, status: "verified", drafted_by: "t", created_at: "2026-01-01" };

test("layer comes from the source when set, else derived", () => {
  assert.equal(layerKey({ ...base, sources: { id: 1, title: "t", url: "u", publisher: "p", published_on: null, retrieved_at: "r", layer: "enacted_record" } }), "enacted_record");
  assert.equal(layerKey({ ...base, candidate_id: 5, sources: { id: 1, title: "t", url: "u", publisher: "p", published_on: null, retrieved_at: "r" } }), "candidate_statement");
  assert.equal(layerKey({ ...base, sources: { id: 1, title: "Manifesto", url: "u", publisher: "HM Treasury (UK Government)", published_on: null, retrieved_at: "r" } }), "enacted_record");
});
test("layer labels are the fixed set", () => {
  assert.deepEqual(Object.values(LAYERS), ["Manifesto", "Public record", "Candidate's own words", "Campaign leaflet", "Third-party report"]);
  assert.equal(layerOf({ ...base, sources: null }), "Manifesto");
});
test("precision label only for aspirations", () => {
  assert.equal(precisionLabel({ ...base, precision: "measurable" }), null);
  assert.equal(precisionLabel({ ...base, precision: "aspiration" }), "Stated aim, no measurable commitment found");
});
