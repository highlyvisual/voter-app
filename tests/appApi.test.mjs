import test from "node:test";
import assert from "node:assert/strict";
import { problemsWithElections, problemsWithMeta, compareVersions, MIN_APP_VERSION, LATEST_APP_VERSION, APP_API_VERSION } from "../dist-test/appApi.mjs";

// The phone-app contract (lib/appApi.ts). If one of these fails, a change would break apps already on people's phones.
const good = {
  ok: true, outcode: "WC1H", placeUrl: "https://whatsittome.org/place?pc=WC1H", source: "Democracy Club (CC BY 4.0) and postcodes.io",
  elections: [{ ballot_paper_id: "parl.holborn-and-st-pancras.2026-10-08", election_date: "2026-10-08", election_name: "UK Parliament by-election", post_label: "Holborn and St Pancras", covered: true, url: "https://whatsittome.org/ballot/x/area" }],
};

test("a well-formed elections reply passes", () => assert.deepEqual(problemsWithElections(good), []));
test("an error reply needs a message", () => {
  assert.deepEqual(problemsWithElections({ ok: false, message: "No such postcode" }), []);
  assert.notDeepEqual(problemsWithElections({ ok: false }), []);
});
test("renamed or missing fields are caught", () => {
  const { elections, ...rest } = good;
  assert.ok(problemsWithElections({ ...rest, ballots: elections }).length > 0);
  const e = { ...good.elections[0] }; delete e.election_date;
  assert.ok(problemsWithElections({ ...good, elections: [e] }).some((p) => p.includes("election_date")));
  assert.ok(problemsWithElections({ ...good, elections: [{ ...good.elections[0], url: null }] }).some((p) => p.includes("covered but has no url")));
});
test("extra fields are allowed (additive changes are fine)", () => {
  assert.deepEqual(problemsWithElections({ ...good, newThing: 1, elections: [{ ...good.elections[0], extra: "x" }] }), []);
});
test("meta reply and version rules", () => {
  const meta = { ok: true, apiVersion: APP_API_VERSION, minAppVersion: MIN_APP_VERSION, latestAppVersion: LATEST_APP_VERSION, updateMessage: "x", storeUrls: { ios: null, android: null } };
  assert.deepEqual(problemsWithMeta(meta), []);
  assert.ok(compareVersions(MIN_APP_VERSION, LATEST_APP_VERSION) <= 0, "MIN_APP_VERSION must not be above LATEST_APP_VERSION");
  assert.equal(compareVersions("0.10.0", "0.9.9"), 1);
  assert.equal(compareVersions("1.0.0", "1.0.0"), 0);
  assert.equal(compareVersions("0.1.0", "0.2.0"), -1);
});

// ---- v1 additions for app 0.2.0: topics, ballot, receipt sets ----
import { problemsWithTopics, problemsWithBallot, problemsWithReceiptSet } from "../dist-test/appApi.mjs";

const src = { id: 7, title: "Manifesto 2026", url: "https://example.org/m", publisher: "Example Party", published_on: "2026-05-01", retrieved_at: "2026-09-01T00:00:00Z", layer: "manifesto" };
const claim = { id: 1, ballot_paper_id: "b", candidate_id: null, party_ec_id: "PP1", topic: "transport", tier: "documented", claim_text: "Fix roads", source_quote: "We will fix the roads.", applies_if: {}, status: "verified", drafted_by: "x", created_at: "2026-09-01", sources: src, layer: "Manifesto", precision_label: null };
const ballot = {
  ok: true,
  ballot: { id: "local.x.y.by.2026-10-15", name: "X council, Y ward (by-election)", date: "2026-10-15", area: "Y", level: "local", web_url: "https://whatsittome.org/ballot/local.x.y.by.2026-10-15" },
  key_dates: { items: [{ kind: "register", label: "Register", date: "2026-09-29", time: "", href: "https://www.gov.uk/register-to-vote" }], id_required: true, source: null, notice_url: null, note: null },
  candidates: [
    { id: 10, position: 1, name: "A Adams", party_label: "Example Party", registered_party: "Example Party", party_ec_id: "PP1", photo_url: null, photo_credit: null, statement: null, homepage_url: null, is_incumbent: false, claims: [] },
    { id: 11, position: 2, name: "B Brown", party_label: "Independent", registered_party: "Independent", party_ec_id: null, photo_url: "https://static.example/b.jpg", photo_credit: null, statement: "Hello", homepage_url: null, is_incumbent: false, claims: [] },
  ],
  parties: [{ ec_id: "PP1", name: "Example Party", colour: "#B8004F", ink: "#ffffff", claims: [claim] }],
  receipts: { version: "2.98.0", baseline_id: "baseline", compare_baseline_id: null, sets: [{ id: "baseline", party_ec_id: null, label: null, year: "2026", url: "https://whatsittome.org/api/app/v1/receipts/sets/baseline?v=2.98.0", sources: [] }] },
  source: "Democracy Club",
};

test("topics reply", () => {
  assert.deepEqual(problemsWithTopics({ ok: true, topics: [{ id: "transport", name: "Transport and roads", short: "Transport" }] }), []);
  assert.ok(problemsWithTopics({ ok: true, topics: [] }).length > 0);
});
test("a well-formed ballot reply passes", () => assert.deepEqual(problemsWithBallot(ballot), []));
test("ballot: candidates must be in ballot-paper order", () => {
  const swapped = { ...ballot, candidates: [ballot.candidates[1], ballot.candidates[0]] };
  assert.ok(problemsWithBallot(swapped).some((p) => p.includes("ballot-paper order")));
});
test("ballot: only verified claims, each with its source", () => {
  const unverified = { ...ballot, parties: [{ ...ballot.parties[0], claims: [{ ...claim, status: "draft" }] }] };
  assert.ok(problemsWithBallot(unverified).some((p) => p.includes("only verified")));
  const noSource = { ...ballot, parties: [{ ...ballot.parties[0], claims: [{ ...claim, sources: null }] }] };
  assert.ok(problemsWithBallot(noSource).some((p) => p.includes("no source")));
  const noQuote = { ...ballot, parties: [{ ...ballot.parties[0], claims: [{ ...claim, source_quote: "" }] }] };
  assert.ok(problemsWithBallot(noQuote).some((p) => p.includes("source_quote")));
});
test("ballot: receipts must include the baseline", () => {
  assert.ok(problemsWithBallot({ ...ballot, receipts: { ...ballot.receipts, baseline_id: "baseline-2024" } }).some((p) => p.includes("baseline")));
  assert.deepEqual(problemsWithBallot({ ...ballot, receipts: null }), []);
});
test("ballot: error reply", () => assert.deepEqual(problemsWithBallot({ ok: false, message: "Not found" }), []));
test("receipt set reply", () => {
  const set = { ok: true, id: "baseline", party_ec_id: null, label: null, year: "2026", version: "2.98.0", computed_at: "2026-09-18", fields: ["income_tax", "household_net_income"], rows: { "age_band=35_49|household=couple|children=none|tenure=own_mortgage|income_band=40k_60k|employment=employed": [5000, 40000] } };
  assert.deepEqual(problemsWithReceiptSet(set), []);
  assert.ok(problemsWithReceiptSet({ ...set, rows: { "postcode=CH4": [1, 2] } }).some((p) => p.includes("grid key")));
  assert.ok(problemsWithReceiptSet({ ...set, rows: { [Object.keys(set.rows)[0]]: [1] } }).some((p) => p.includes("numbers")));
});
