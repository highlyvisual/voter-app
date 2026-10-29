// The contract between whatsittome.org and the phone app (mobile/). Both sides use these types: the website routes in
// app/api/app/v1/ and mobile/App.tsx (type-only import, so the app bundle never pulls in website code).
//
// Rules (docs/PROJECT.md, 13 Oct 2026):
// - Within v1, only ever ADD optional fields. Never rename, remove or change the meaning of a field: installed apps
//   stay on old versions for months.
// - A breaking change means a new folder app/api/app/v2/, with v1 kept running until MIN_APP_VERSION passes the last
//   app version that used it.
// - Content, data and copy live on the website, never in the app, so they reach the app without a store release.
// - This file has no imports, so `node --experimental-strip-types` can run the validators (scripts/app-contract.mjs).

export const APP_API_VERSION = 1;
export const APP_API_PATH = "/api/app/v1";

// Apps older than MIN_APP_VERSION are asked to update (a full-screen notice). Raise it only when a v1 route really can
// no longer serve an old app; LATEST_APP_VERSION is shown as a gentle "update available" line.
export const MIN_APP_VERSION = "0.1.0";
export const LATEST_APP_VERSION = "0.1.0";

export type AppError = { ok: false; message: string };

export type AppElection = {
  ballot_paper_id: string;
  election_date: string; // YYYY-MM-DD
  election_name: string;
  post_label: string;
  covered: boolean; // true when whatsittome.org has a ballot page for it
  url: string | null; // ballot page on whatsittome.org, when covered
};

// POST /api/app/v1/elections  body: { postcode: string }, or (app 0.3.0) { lat: number; lng: number } from the phone's
// approximate location, rounded on the phone to 3 decimal places (about 100 m). The server turns a location into the
// nearest postcode once and keeps neither. found_by says which was used (absent from older servers: "postcode").
export type ElectionsRequest = { postcode: string } | { lat: number; lng: number };
export type ElectionsResponse =
  | { ok: true; outcode: string; elections: AppElection[]; placeUrl: string; source: string; found_by?: "postcode" | "location" }
  | AppError;

// GET /api/app/v1/boundary/[ballot id]  (app 0.3.0) The voting area's outline for the drawn map on Home: outer rings as
// [lng, lat] pairs (WGS84). Static per ballot and cacheable; nothing about the viewer is sent.
// roads and places (optional) are main roads and place names around the area from OpenStreetMap, fetched by the server
// so the phone never contacts it; absent when OpenStreetMap didn't answer. credits names every source drawn, for the
// map's (i).
export type AppMapRoad = { ref: string | null; name: string | null; kind: "major" | "minor"; line: [number, number][] };
export type AppMapPlace = { name: string; kind: string; at: [number, number] };
export type BoundaryResponse = { ok: true; area: string; rings: [number, number][][]; source: string; roads?: AppMapRoad[]; places?: AppMapPlace[]; credits?: string[] } | AppError;

// GET /api/app/v1/meta
export type MetaResponse = {
  ok: true;
  apiVersion: number;
  minAppVersion: string;
  latestAppVersion: string;
  updateMessage: string;
  storeUrls: { ios: string | null; android: string | null };
};

// GET /api/app/v1/topics  The topic list, in the website's order (lib/types.ts TOPICS).
export type AppTopic = { id: string; name: string; short: string };
export type TopicsResponse = { ok: true; topics: AppTopic[] };

// A published source, shown with every claim.
export type AppSource = { id: number; title: string; url: string; publisher: string; published_on: string | null; retrieved_at: string; layer?: string | null; archive_url?: string | null };

// One verified claim. Field names match lib/types.ts Claim, so the app runs the website's own logic on it (lib/claims.ts
// orderClaims, splitForHousehold, conditionText; lib/household.ts claimApplies). applies_if is left raw for that.
// layer and precision_label are the website's labels for it, worked out on the server.
export type AppClaim = {
  id: number;
  ballot_paper_id: string;
  candidate_id: number | null; // set when it is the candidate's own words; null for party material
  party_ec_id: string | null;
  topic: string;
  tier: "computed" | "documented";
  claim_text: string;
  source_quote: string; // verbatim
  applies_if: Record<string, unknown>;
  status: string; // always "verified": nothing else is ever served
  drafted_by: string;
  created_at: string;
  precision?: "measurable" | "aspiration";
  sources: AppSource | null;
  layer: string; // label, e.g. "Manifesto", "Candidate's own words"
  precision_label: string | null;
};

// A party on this ballot. colour is the party's own colour, for its own material only; ink is black or white, whichever
// reads on it. claims are its verified party-level claims for this ballot. national_claims (optional, 29 Oct 2026): the
// party's national policy from its own documents, whatever ballot they were read for; served for elections still to
// come. Show one only on a topic where the candidate has nothing of their own and claims has nothing, always labelled
// "[Party]'s national policy, not [candidate]'s own commitment".
export type AppParty = { ec_id: string; name: string; colour: string | null; ink: "#000000" | "#ffffff" | null; claims: AppClaim[]; national_claims?: AppClaim[] };

// A candidate, in ballot-paper order (position 1 first). party_ec_id is the party whose claims apply (a joint candidacy
// takes its parent party's). photo_url is for the candidate's own screen only (Romily, round five). claims are the
// candidate's own verified words.
export type AppCandidate = {
  id: number;
  position: number;
  name: string;
  party_label: string; // as on the ballot paper
  registered_party: string;
  party_ec_id: string | null;
  photo_url: string | null;
  photo_credit: string | null;
  statement: string | null;
  homepage_url: string | null;
  is_incumbent: boolean;
  claims: AppClaim[];
};

export type AppKeyDate = { kind: "register" | "postal" | "proxy" | "voter_id"; label: string; date: string; time: string; href: string };

// A reform set the app may need for this ballot: the baseline(s) and each party's modelled pledge (same law year, backed
// by a verified source). url downloads the whole set (GET receipts/sets/[id]); the app picks its household's row itself.
export type AppReceiptSetRef = { id: string; party_ec_id: string | null; label: string | null; year: string; url: string; sources: AppSource[] };

// GET /api/app/v1/ballot/[id]
export type BallotResponse =
  | {
      ok: true;
      ballot: {
        id: string; name: string; date: string; area: string; level: string; voting_system: string | null; winner_count: number;
        by_election_reason: string | null; cancelled: boolean; postponed: boolean; postponed_note: string | null; uncontested: boolean;
        sopn_url: string | null; web_url: string;
      };
      key_dates: { items: AppKeyDate[]; id_required: boolean; source: string | null; notice_url: string | null; note: string | null };
      candidates: AppCandidate[];
      parties: AppParty[];
      receipts: { version: string; baseline_id: string; compare_baseline_id: string | null; sets: AppReceiptSetRef[] } | null;
      source: string;
      // Added in round ten (q14). Optional: absent when the list could not be read; an empty list means none listed yet.
      hustings?: AppHusting[];
    }
  | AppError;

// A hustings for this ballot, by date (Democracy Club, CC BY 4.0). starts/ends are ISO date-times. organiser is set only
// where the hustings' own title names it; otherwise null and the app says to see the event page (domain is its host).
export type AppHusting = { title: string; starts: string; ends: string | null; location: string | null; url: string | null; postevent_url: string | null; organiser: string | null; domain: string | null };

// GET /api/app/v1/receipts/sets/[id]?v=<policyengine_version>  Every household in one reform set, keyed by the grid key
// (lib/household.ts gridKey). rows[key] holds the figures in the order of fields. Static and cacheable; the household's
// answers never leave the phone, because the app looks its row up locally.
export type ReceiptSetResponse =
  | { ok: true; id: string; party_ec_id: string | null; label: string | null; year: string; version: string; computed_at: string; fields: string[]; rows: Record<string, number[]> }
  | AppError;

// ---- Runtime checks, used by the contract test and the CI workflow ----

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const isStr = (x: unknown): x is string => typeof x === "string";
const isDate = (x: unknown) => isStr(x) && /^\d{4}-\d{2}-\d{2}$/.test(x);

export function problemsWithElections(x: unknown): string[] {
  const p: string[] = [];
  if (!isObj(x)) return ["not an object"];
  if (x.ok === false) { if (!isStr(x.message) || !x.message) p.push("error without a message"); return p; }
  if (x.ok !== true) return ["ok is neither true nor false"];
  if (!isStr(x.outcode) || !/^[A-Z]{1,2}\d[A-Z\d]?$/.test(x.outcode)) p.push("outcode missing or malformed");
  if (!isStr(x.placeUrl) || !x.placeUrl.startsWith("https://")) p.push("placeUrl missing or not https");
  if (!isStr(x.source) || !x.source) p.push("source missing");
  if (!Array.isArray(x.elections)) return [...p, "elections is not a list"];
  x.elections.forEach((e, i) => {
    if (!isObj(e)) { p.push(`elections[${i}] not an object`); return; }
    if (!isStr(e.ballot_paper_id) || !e.ballot_paper_id) p.push(`elections[${i}].ballot_paper_id missing`);
    if (!isDate(e.election_date)) p.push(`elections[${i}].election_date not YYYY-MM-DD`);
    if (!isStr(e.election_name)) p.push(`elections[${i}].election_name missing`);
    if (!isStr(e.post_label)) p.push(`elections[${i}].post_label missing`);
    if (typeof e.covered !== "boolean") p.push(`elections[${i}].covered not a boolean`);
    if (!(e.url === null || (isStr(e.url) && e.url.startsWith("https://")))) p.push(`elections[${i}].url not null or https`);
    if (e.covered === true && e.url === null) p.push(`elections[${i}] covered but has no url`);
  });
  return p;
}

export function problemsWithMeta(x: unknown): string[] {
  const p: string[] = [];
  if (!isObj(x) || x.ok !== true) return ["not an ok object"];
  if (x.apiVersion !== APP_API_VERSION) p.push(`apiVersion is ${String(x.apiVersion)}, expected ${APP_API_VERSION}`);
  for (const k of ["minAppVersion", "latestAppVersion"] as const) if (!isStr(x[k]) || !/^\d+\.\d+\.\d+$/.test(x[k] as string)) p.push(`${k} not x.y.z`);
  if (!isStr(x.updateMessage)) p.push("updateMessage missing");
  if (!isObj(x.storeUrls)) p.push("storeUrls missing");
  if (isStr(x.minAppVersion) && isStr(x.latestAppVersion) && compareVersions(x.minAppVersion, x.latestAppVersion) > 0) p.push("minAppVersion is above latestAppVersion");
  return p;
}

export function problemsWithTopics(x: unknown): string[] {
  if (!isObj(x) || x.ok !== true) return ["not an ok object"];
  if (!Array.isArray(x.topics) || x.topics.length === 0) return ["topics missing or empty"];
  const p: string[] = [];
  x.topics.forEach((t, i) => { if (!isObj(t) || !isStr(t.id) || !isStr(t.name) || !isStr(t.short) || !t.id || !t.name) p.push(`topics[${i}] needs id, name and short`); });
  return p;
}

const isHttps = (x: unknown) => isStr(x) && x.startsWith("https://");
const isHex = (x: unknown) => isStr(x) && /^#[0-9a-fA-F]{6}$/.test(x);

function problemsWithSource(s: unknown, at: string): string[] {
  if (!isObj(s)) return [`${at} not an object`];
  const p: string[] = [];
  if (typeof s.id !== "number") p.push(`${at}.id not a number`);
  if (!isStr(s.title) || !s.title) p.push(`${at}.title missing`);
  if (!isStr(s.publisher) || !s.publisher) p.push(`${at}.publisher missing`);
  if (!isStr(s.url) || !/^https?:\/\//.test(s.url)) p.push(`${at}.url not a link`);
  if (!(s.published_on === null || isDate(s.published_on))) p.push(`${at}.published_on not null or YYYY-MM-DD`);
  return p;
}

// Every claim carries its verbatim quote and its source, and only verified claims are ever served.
function problemsWithClaim(c: unknown, at: string): string[] {
  if (!isObj(c)) return [`${at} not an object`];
  const p: string[] = [];
  if (typeof c.id !== "number") p.push(`${at}.id not a number`);
  if (!isStr(c.topic) || !c.topic) p.push(`${at}.topic missing`);
  if (!isStr(c.source_quote) || !c.source_quote) p.push(`${at}.source_quote missing`);
  if (!isStr(c.claim_text)) p.push(`${at}.claim_text missing`);
  if (c.status !== "verified") p.push(`${at}.status is ${String(c.status)}, only verified claims may be served`);
  if (!isObj(c.applies_if)) p.push(`${at}.applies_if not an object`);
  if (!isStr(c.layer) || !c.layer) p.push(`${at}.layer missing`);
  if (!(c.precision_label === null || isStr(c.precision_label))) p.push(`${at}.precision_label not null or text`);
  if (c.sources === null || c.sources === undefined) p.push(`${at} has no source`);
  else p.push(...problemsWithSource(c.sources, `${at}.sources`));
  return p;
}

export function problemsWithBallot(x: unknown): string[] {
  if (!isObj(x)) return ["not an object"];
  if (x.ok === false) return isStr(x.message) && x.message ? [] : ["error without a message"];
  if (x.ok !== true) return ["ok is neither true nor false"];
  const p: string[] = [];
  const b = x.ballot;
  if (!isObj(b)) p.push("ballot missing");
  else {
    for (const k of ["id", "name", "area", "level"] as const) if (!isStr(b[k]) || !b[k]) p.push(`ballot.${k} missing`);
    if (!isDate(b.date)) p.push("ballot.date not YYYY-MM-DD");
    if (!isHttps(b.web_url)) p.push("ballot.web_url not https");
  }
  const kd = x.key_dates;
  if (!isObj(kd) || !Array.isArray(kd.items)) p.push("key_dates.items missing");
  else kd.items.forEach((d, i) => { if (!isObj(d) || !isStr(d.kind) || !isDate(d.date) || !isHttps(d.href) || !isStr(d.label)) p.push(`key_dates.items[${i}] needs kind, label, date and an https link`); });
  if (!Array.isArray(x.candidates)) p.push("candidates is not a list");
  else x.candidates.forEach((c, i) => {
    const at = `candidates[${i}]`;
    if (!isObj(c)) { p.push(`${at} not an object`); return; }
    if (c.position !== i + 1) p.push(`${at}.position is ${String(c.position)}, expected ${i + 1} (ballot-paper order)`);
    if (!isStr(c.name) || !c.name) p.push(`${at}.name missing`);
    if (!isStr(c.party_label)) p.push(`${at}.party_label missing`);
    if (!(c.photo_url === null || isHttps(c.photo_url))) p.push(`${at}.photo_url not null or https`);
    if (!Array.isArray(c.claims)) p.push(`${at}.claims is not a list`);
    else c.claims.forEach((cl, j) => p.push(...problemsWithClaim(cl, `${at}.claims[${j}]`)));
  });
  if (!Array.isArray(x.parties)) p.push("parties is not a list");
  else x.parties.forEach((pt, i) => {
    const at = `parties[${i}]`;
    if (!isObj(pt)) { p.push(`${at} not an object`); return; }
    if (!isStr(pt.ec_id) || !pt.ec_id) p.push(`${at}.ec_id missing`);
    if (!isStr(pt.name)) p.push(`${at}.name missing`);
    if (!(pt.colour === null || isHex(pt.colour))) p.push(`${at}.colour not null or #rrggbb`);
    if (pt.colour !== null && pt.ink !== "#000000" && pt.ink !== "#ffffff") p.push(`${at}.ink must be black or white when there is a colour`);
    if (!Array.isArray(pt.claims)) p.push(`${at}.claims is not a list`);
    else pt.claims.forEach((cl, j) => p.push(...problemsWithClaim(cl, `${at}.claims[${j}]`)));
  });
  if (x.receipts !== null) {
    const r = x.receipts;
    if (!isObj(r) || !isStr(r.version) || !isStr(r.baseline_id) || !Array.isArray(r.sets)) p.push("receipts needs version, baseline_id and sets");
    else {
      if (!r.sets.some((s) => isObj(s) && s.id === r.baseline_id)) p.push("receipts.sets does not include the baseline");
      r.sets.forEach((s, i) => { if (!isObj(s) || !isStr(s.id) || !isHttps(s.url) || !isStr(s.year) || !Array.isArray(s.sources)) p.push(`receipts.sets[${i}] needs id, year, an https url and sources`); });
    }
  }
  if (!isStr(x.source) || !x.source) p.push("source missing");
  return p;
}

const isLngLat = (pt: unknown) => Array.isArray(pt) && pt.length === 2 && typeof pt[0] === "number" && typeof pt[1] === "number" && Math.abs(pt[0]) <= 180 && Math.abs(pt[1]) <= 90;

export function problemsWithBoundary(x: unknown): string[] {
  if (!isObj(x)) return ["not an object"];
  if (x.ok === false) return isStr(x.message) && x.message ? [] : ["error without a message"];
  if (x.ok !== true) return ["ok is neither true nor false"];
  const p: string[] = [];
  if (!isStr(x.area) || !x.area) p.push("area missing");
  if (!isStr(x.source) || !x.source) p.push("source missing");
  if (!Array.isArray(x.rings) || x.rings.length === 0) return [...p, "rings missing or empty"];
  x.rings.forEach((r, i) => {
    if (!Array.isArray(r) || r.length < 4) { p.push(`rings[${i}] needs at least 4 points`); return; }
    if (!r.every(isLngLat)) p.push(`rings[${i}] has a point that isn't [lng, lat]`);
  });
  if (x.roads !== undefined) {
    if (!Array.isArray(x.roads)) p.push("roads is not a list");
    else x.roads.forEach((r, i) => { if (!isObj(r) || (r.kind !== "major" && r.kind !== "minor") || !Array.isArray(r.line) || !r.line.every(isLngLat)) p.push(`roads[${i}] needs a kind and a line of [lng, lat]`); });
  }
  if (x.places !== undefined) {
    if (!Array.isArray(x.places)) p.push("places is not a list");
    else x.places.forEach((pl, i) => { if (!isObj(pl) || !isStr(pl.name) || !pl.name || !isLngLat(pl.at)) p.push(`places[${i}] needs a name and an [lng, lat]`); });
  }
  if (x.credits !== undefined && !(Array.isArray(x.credits) && x.credits.every(isStr))) p.push("credits is not a list of text");
  return p;
}

export function problemsWithReceiptSet(x: unknown): string[] {
  if (!isObj(x)) return ["not an object"];
  if (x.ok === false) return isStr(x.message) && x.message ? [] : ["error without a message"];
  if (x.ok !== true) return ["ok is neither true nor false"];
  const p: string[] = [];
  if (!isStr(x.id) || !x.id) p.push("id missing");
  if (!isStr(x.version) || !x.version) p.push("version missing");
  if (!isStr(x.year)) p.push("year missing");
  if (!Array.isArray(x.fields) || !x.fields.every(isStr) || !x.fields.includes("household_net_income")) return [...p, "fields must list the figures, including household_net_income"];
  if (!isObj(x.rows)) return [...p, "rows is not an object"];
  const keys = Object.keys(x.rows);
  if (keys.length === 0) p.push("rows is empty");
  const n = x.fields.length;
  // Check a sample, so a full set (8,100 rows) stays quick to validate.
  for (const k of keys.slice(0, 50)) {
    if (!/^age_band=[^|]+\|household=[^|]+\|children=[^|]+\|tenure=[^|]+\|income_band=[^|]+\|employment=[^|]+$/.test(k)) { p.push(`row key ${k} is not a grid key`); break; }
    const v = (x.rows as Record<string, unknown>)[k];
    if (!Array.isArray(v) || v.length !== n || !v.every((y) => typeof y === "number")) { p.push(`row ${k} needs ${n} numbers`); break; }
  }
  return p;
}

// -1, 0 or 1, comparing "x.y.z" strings numerically.
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) { const d = (pa[i] ?? 0) - (pb[i] ?? 0); if (d) return d > 0 ? 1 : -1; }
  return 0;
}
