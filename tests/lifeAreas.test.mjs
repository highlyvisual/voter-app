import test from "node:test";
import assert from "node:assert/strict";
import { responsible, areaResponsible, LIFE_AREAS } from "../dist-test/lifeAreas.mjs";

// Who is responsible, for real places (Romily, 29 Oct: "right for the real place, not the mockup's wording").
const emsworth = { country: "England", district: "Havant", county: "Hampshire", lad: "E07000090", parish: "Havant, unparished area", pfa: "Hampshire", lpa: "Havant LPA" };
const body = (d, p, role) => responsible(d, p).find((r) => !role || r.role.startsWith(role))?.body;

test("Emsworth: Havant decides planning; no parish council, so none is named as consulted", () => {
  assert.equal(body("brownfield-land", emsworth, "Planning decisions"), "Havant council");
  assert.ok(!responsible("brownfield-land", emsworth).some((r) => /Consulted/.test(r.role)));
});
test("Emsworth: buses are Hampshire County Council with the 2026 combined county authority (SI 2026/595)", () => {
  const r = responsible("transport-stops", emsworth)[0];
  assert.equal(r.body, "Hampshire County Council, with the Hampshire and the Solent Combined County Authority");
  assert.match(r.src[1], /uksi\/2026\/595/);
});
test("local flooding is the county in a two-tier area, the one council in a unitary", () => {
  assert.equal(body("flood-risk-zone", emsworth, "Local flooding"), "Hampshire County Council");
  assert.equal(body("flood-risk-zone", { ...emsworth, district: "Portsmouth", county: null, lad: "E06000044", lpa: "Portsmouth LPA" }, "Local flooding"), "Portsmouth council");
});
test("a parish is consulted, not the decision-maker; a national park decides planning inside it", () => {
  const p = { ...emsworth, parish: "Rowlands Castle", lpa: "South Downs National Park LPA" };
  assert.equal(body("conservation-area", p), "South Downs National Park Authority");
  assert.equal(responsible("conservation-area", p)[1].role, "Consulted on planning applications, not the decision-maker");
});
test("an established combined authority is the transport authority; London is TfL", () => {
  assert.equal(responsible("transport-stops", { ...emsworth, district: "Manchester", county: null, lad: "E08000003", pfa: "Greater Manchester" })[0].body, "Greater Manchester combined authority");
  assert.equal(responsible("transport-stops", { ...emsworth, district: "Camden", county: null, lad: "E09000007", pfa: "Metropolitan Police" })[0].body, "Transport for London, led by the Mayor of London");
  assert.equal(body("police-crime", { ...emsworth, pfa: "Greater Manchester" }), "Mayor of Greater Manchester");
});
test("every life area has at least one line, each with a source link", () => {
  for (const a of LIFE_AREAS) {
    const rs = areaResponsible(a.key, emsworth);
    assert.ok(rs.length, a.key);
    for (const r of rs) assert.match(r.src[1], /^https:\/\//);
  }
});
