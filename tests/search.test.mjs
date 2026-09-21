import test from "node:test";
import assert from "node:assert/strict";
import { index, matches, queryTokens, normalise, suggest } from "../dist-test/search.mjs";

const corpus = index("We will fix the pothole repair backlog, end Section 21 no-fault evictions for renters, protect GP surgeries, and remove the two-child limit in Universal Credit.");
const hit = (q) => matches(queryTokens(q), corpus);

test("word forms find each other", () => {
  for (const q of ["pothole", "potholes", "renter", "renters", "renting", "evict", "evictions"]) assert.equal(hit(q), true, q);
});
test("hyphens and punctuation stop mattering on both sides", () => {
  for (const q of ["two child limit", "two-child limit", "section 21", "no fault eviction"]) assert.equal(hit(q), true, q);
});
test("everyday synonyms work", () => {
  for (const q of ["doctor", "surgery", "tenant", "landlord"]) assert.equal(hit(q), true, q);
});
test("one typo is forgiven, nonsense is not", () => {
  assert.equal(hit("potholr"), true);
  assert.equal(hit("zebra"), false);
  assert.equal(hit("aeroplane"), false);
});
test("multiple words must all match", () => {
  assert.equal(hit("pothole repair"), true);
  assert.equal(hit("pothole zebra"), false);
});
test("did you mean draws only on words that occur", () => {
  assert.deepEqual(suggest("polcie", new Set(["police", "policy", "zebra"])).includes("police"), true);
});
test("normalise strips punctuation and case", () => {
  assert.equal(normalise("Two-Child Limit!"), "two child limit");
});
