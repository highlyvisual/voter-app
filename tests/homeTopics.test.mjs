import test from "node:test";
import assert from "node:assert/strict";
import { HOME_SUBS, SUB_WORDS_SHOWN, becauseText, billLabel, constituencySlug, ge2024Ballot, matchesSub, outcomeLabel, profileSub, sortNow, subOrder, subsOf, titleMatchesSub } from "../dist-test/homeTopics.mjs";
import { meansForYou, whoHasPower } from "../dist-test/homeFacts.mjs";
import { THEMES } from "../dist-test/themes.mjs";
import { TOPICS } from "../dist-test/types.mjs";

// Your Home (Romily, round eleven): positions are filed under a sub-topic by the published word lists only. Real
// summaries from the ledger (current_claims, topic housing_and_property, 26 Oct 2026).
test("real housing positions land under the sub-topics their words name", () => {
  assert.deepEqual(subsOf("Labour's 2024 manifesto pledged to abolish Section 21 no-fault evictions and let private renters challenge unreasonable rent increases."), ["renting"]);
  assert.deepEqual(subsOf("The Conservative Party's current plan says it would abolish Stamp Duty Land Tax on primary residences."), ["owning"]);
  assert.deepEqual(subsOf("Labour's 2024 manifesto pledged 1.5 million new homes in England over the parliament."), ["housing"]);
  assert.deepEqual(subsOf("Reform UK says it would sell up to 25,000 social houses a year through a renewed Right to Buy programme."), ["housing", "renting", "owning"]);
  assert.deepEqual(subsOf("Reform UK's 2024 contract states it would make it cheaper and easier for leaseholders to extend leases to 990 years."), ["owning"]);
  assert.deepEqual(subsOf("Christian Peoples Alliance pledged to make second homes a separate planning use class from main residences."), ["housing", "owning"]);
  assert.deepEqual(subsOf("Says he has been closely involved in protecting the city's social and physical infrastructure from over-development."), ["housing"]);
  assert.deepEqual(subsOf("Says the political focus should be centred on housing, among other issues."), []);
  assert.ok(matchesSub("The Green Party's 2024 manifesto pledged rent controls (relevant to renters).", "renting"));
});

test("ground rent is a leaseholder's charge, not renting", () => {
  assert.equal(matchesSub("Abolish ground rent for existing leaseholders.", "renting"), false);
  assert.ok(matchesSub("Abolish ground rent for existing leaseholders.", "owning"));
  assert.equal(matchesSub("the current system", "renting"), false);
});

test("every word the page publishes is caught by its own list", () => {
  for (const { key } of HOME_SUBS) {
    for (const phrase of SUB_WORDS_SHOWN[key]) {
      for (const w of phrase.replace(/\(.*?\)/g, "").split(",").map((x) => x.trim()).filter(Boolean)) {
        assert.ok(matchesSub(w, key), `${key}: "${w}"`);
      }
    }
  }
});

test("titles from Parliament and councils must be about homes at all", () => {
  assert.ok(titleMatchesSub("Renters’ Rights Act 2025", "renting"));
  assert.ok(titleMatchesSub("Social Housing Bill [HL]", "renting"));
  assert.ok(titleMatchesSub("Leasehold and Freehold Reform Act 2024", "owning"));
  assert.ok(titleMatchesSub("Planning and Infrastructure Act 2025", "housing"));
  assert.ok(titleMatchesSub("Consultation on the Main Modifications to the Local Plan", "housing"));
  assert.equal(titleMatchesSub("House of Lords (Hereditary Peers) Act 2026", "housing"), false);
  assert.equal(titleMatchesSub("Economic Development Strategy", "housing"), false);
  assert.equal(titleMatchesSub("Heritage Public Houses Bill", "housing"), false);
});

test("the profile's housing answer puts one sub-topic first, with the reason; otherwise the fixed order", () => {
  assert.deepEqual(subOrder(null).map((x) => x.key), ["housing", "renting", "owning"]);
  assert.deepEqual(subOrder(null).map((x) => x.reason), [null, null, null]);
  const r = subOrder("private_rent");
  assert.deepEqual(r.map((x) => x.key), ["renting", "housing", "owning"]);
  assert.match(r[0].reason, /rent privately/);
  assert.equal(subOrder("own_mortgage")[0].key, "owning");
  assert.equal(subOrder("other")[0].key, "housing");
  assert.equal(profileSub("student_halls"), "renting");
});

test("what's happening: items touching the profile first, then newest first", () => {
  const items = [
    { id: "a", text: "Planning and Infrastructure Act 2025", date: "2025-12-18" },
    { id: "b", text: "Renters' Rights Act 2025", date: "2025-10-27" },
    { id: "c", text: "Consultation on the Local Plan", date: "2026-11-23" },
  ];
  assert.deepEqual(sortNow(items, "private_rent").map((x) => x.id), ["b", "c", "a"]);
  assert.deepEqual(sortNow(items, null).map((x) => x.id), ["c", "a", "b"]);
});

test("labels only where the source says which", () => {
  assert.equal(billLabel({ isAct: true, billTypeId: 1, isDefeated: false, billWithdrawn: null }), "decision");
  assert.equal(billLabel({ isAct: false, billTypeId: 1, isDefeated: false, billWithdrawn: null }), "proposal");
  assert.equal(billLabel({ isAct: false, billTypeId: 8, isDefeated: false, billWithdrawn: null }), null);
  assert.equal(billLabel({ isAct: false, billTypeId: 1, isDefeated: true, billWithdrawn: null }), null);
  assert.equal(outcomeLabel("agreed"), "decision");
  assert.equal(outcomeLabel("lost"), "decision");
  assert.equal(outcomeLabel("noted"), null);
  assert.equal(outcomeLabel("deferred"), null);
});

test("'applies to you because you told us' only for a housing condition", () => {
  assert.equal(becauseText({ tenure: "private_rent", _published_by_source_rule: true }, "private_rent"), "you told us you're renting privately");
  assert.equal(becauseText({ rents: true }, "social_rent"), "you told us you're renting from a council or housing association");
  assert.equal(becauseText({ on_visa: true }, "private_rent"), null);
  assert.equal(becauseText({}, "private_rent"), null);
});

test("Democracy Club ballot ids for the 2024 general election", () => {
  assert.equal(ge2024Ballot(constituencySlug("Holborn and St Pancras")), "parl.holborn-and-st-pancras.2024-07-04");
  assert.equal(constituencySlug("Caithness, Sutherland and Easter Ross"), "caithness-sutherland-and-easter-ross");
  assert.equal(constituencySlug("Ynys Môn"), "ynys-mon");
});

test("sourced lines: a renter's line is marked, a Scottish page doesn't cite English law", () => {
  const l = meansForYou("renting", { country: "England", london: true, mayor: null }, { tenure: "private_rent" });
  assert.match(l[0].text, /Renters' Rights Act/);
  assert.match(l[0].because, /renting privately/);
  const s = meansForYou("renting", { country: "Scotland", london: false, mayor: null }, { tenure: "private_rent" });
  assert.ok(s.every((x) => !/Renters' Rights/.test(x.text)));
  const p = whoHasPower("housing", { country: "England", london: true, mayor: null }, "Camden council");
  assert.deepEqual(p.map((b) => b.body), ["UK Parliament", "Camden council", "Mayor of London"]);
});

test("the ten themes cover every existing topic, and only Your Home is built", () => {
  assert.equal(THEMES.length, 10);
  const covered = new Set(THEMES.flatMap((t) => t.topics));
  for (const [k] of TOPICS) assert.ok(covered.has(k), k);
  assert.deepEqual(THEMES.filter((t) => t.built).map((t) => t.slug), ["your-home"]);
});
