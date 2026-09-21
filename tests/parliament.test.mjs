import test from "node:test";
import assert from "node:assert/strict";
import { contextTag, topicOf } from "../dist-test/parliament.mjs";
test("context tags from titles, never Free vote", () => {
  assert.equal(contextTag("Public Office (Accountability) Bill Report Stage: Amendment 19"), "Amendment");
  assert.equal(contextTag("Immigration and asylum: Ten Minute Rule Motion"), "Private Member's Bill");
  assert.equal(contextTag("Renters' Rights Bill: Programme (No. 2)"), "Procedural");
  assert.equal(contextTag("Border Security, Asylum and Immigration Bill: Third Reading"), "Bill stage (sponsor not classified)");
});
test("topic mapping by keyword", () => {
  assert.equal(topicOf("Border Security, Asylum and Immigration Bill: Third Reading"), "immigration_and_borders");
  assert.equal(topicOf("Renters' Rights Bill: Report Stage"), "housing_and_property");
  assert.equal(topicOf("Sittings of the House"), null);
});
