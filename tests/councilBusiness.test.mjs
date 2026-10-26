import test from "node:test";
import assert from "node:assert/strict";
import { lensFor, titleTopics, whyFirst } from "../dist-test/councilBusiness.mjs";
import { organiserIn } from "../dist-test/democracyclub.mjs";

// Romily, round ten q13: an agenda item is "about your household" only by the published word rule. Real agenda titles.
test("titles are filed under topics by the fixed words only", () => {
  assert.ok(titleTopics("New Local Plan - Timetable and Commencement").includes("housing_and_property"));
  assert.ok(titleTopics("Temporary Accommodation Framework (providers) - Award of Contract").includes("housing_and_property"));
  assert.ok(titleTopics("CARMARTHENSHIRE OFF STREET PARKING STRATEGY REPORT").includes("transport"));
  assert.deepEqual(titleTopics("Political Balance of Committees"), []);
});

test("a renter sees housing items first, with the reason; nothing else moves", () => {
  const lens = lensFor({ tenure: "private_rent" }, null);
  assert.ok(lens);
  const why = whyFirst("New Local Plan - Timetable and Commencement", lens);
  assert.equal(why.length, 1);
  assert.equal(why[0].kind, "topic");
  assert.match(why[0].reason, /rent/);
  assert.deepEqual(whyFirst("Updates to the Constitution", lens), []);
});

test("no profile, or one that puts nothing first, gives no lens", () => {
  assert.equal(lensFor(null, null), null);
  assert.equal(lensFor({ tenure: "own_outright" }, null), null);
});

test("a group counts only where the title names it, and a street name is not a group", () => {
  const lens = lensFor(null, { sex: "female", religion: "christian" });
  assert.ok(lens);
  assert.equal(whyFirst("Notice of Motion: Violence Against Women and Girls", lens)[0]?.kind, "group");
  assert.deepEqual(whyFirst("Church Street car park - disposal", lens), []);
  // The general "about the subject" tier never counts: only words that name the group.
  assert.deepEqual(whyFirst("Equality, Diversity and Inclusion Policy", lens), []);
});

// Round ten q14: an organiser is named only where the hustings' own title names it.
test("hustings organiser only from the title's own words", () => {
  assert.equal(organiserIn("Penn Hill by-election hustings, organised by Penn Hill Residents' Association"), "Penn Hill Residents' Association");
  assert.equal(organiserIn("Hustings hosted by St Mark's Church (all candidates invited)"), "St Mark's Church");
  assert.equal(organiserIn("Local elections hustings"), null);
});
