// Live check of the phone-app API on the deployed site (run by .github/workflows/app-contract.yml).
// Usage: node --experimental-strip-types scripts/app-contract.mjs [base URL]   (default https://whatsittome.org)
// Exits non-zero if any reply breaks the v1 contract in lib/appApi.ts, so the workflow run shows red.
import { APP_API_PATH, problemsWithBallot, problemsWithBoundary, problemsWithElections, problemsWithMeta, problemsWithReceiptSet, problemsWithTopics } from "../lib/appApi.ts";

const base = (process.argv[2] || process.env.APP_API_BASE || "https://whatsittome.org").replace(/\/$/, "");
const ua = { "User-Agent": "What's It To Me? contract check (github actions)" };
let failed = 0;
const report = (name, problems) => {
  if (problems.length) { failed++; console.log(`FAIL ${name}\n  - ${problems.join("\n  - ")}`); }
  else console.log(`ok   ${name}`);
};

async function getJson(path, init) {
  let r, text;
  try {
    r = await fetch(base + path, { ...init, headers: { ...ua, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(20000) });
    text = await r.text();
  } catch (e) { return { status: 0, json: null, text: `request failed: ${e?.name ?? e}` }; }
  try { return { status: r.status, json: JSON.parse(text) }; } catch { return { status: r.status, json: null, text: text.slice(0, 200) }; }
}

const meta = await getJson(`${APP_API_PATH}/meta`);
report(`GET ${APP_API_PATH}/meta (${meta.status})`, meta.status === 200 ? problemsWithMeta(meta.json) : [`HTTP ${meta.status} ${meta.text ?? ""}`.trim()]);

// One London postcode (the site's example), one Scottish, one Welsh; then malformed and unknown postcodes, which must
// come back as a well-formed error. 503 (Democracy Club unreachable) is reported but not counted as a contract break.
const cases = [
  ["WC1H 9JE", "real"], ["EH1 1YZ", "real"], ["CF10 1EP", "real"],
  ["NOT A POSTCODE", "error"], ["ZZ9 9ZZ", "error"],
];
for (const [postcode, kind] of cases) {
  const r = await getJson(`${APP_API_PATH}/elections`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postcode }) });
  const name = `POST ${APP_API_PATH}/elections ${postcode} (${r.status})`;
  if (r.json === null) { report(name, [`not JSON: ${r.text}`]); continue; }
  const problems = problemsWithElections(r.json);
  if (kind === "error" && r.json.ok !== false) problems.push("expected an error reply");
  if (kind === "real" && r.status === 503) { console.log(`warn ${name}: lookup unavailable, not a contract break`); continue; }
  if (kind === "real" && r.json.ok !== true) problems.push(`expected ok:true, got: ${r.json.message}`);
  report(name, problems);
}

// App 0.2.0 routes. The ballot is whichever covered ballot the real postcodes above returned, plus a fixed list of
// postcodes, so the check doesn't depend on one election that will soon be over. No covered ballot is a warning, not a break.
const topics = await getJson(`${APP_API_PATH}/topics`);
report(`GET ${APP_API_PATH}/topics (${topics.status})`, topics.status === 200 ? problemsWithTopics(topics.json) : [`HTTP ${topics.status}`]);

let ballotId = null;
for (const postcode of ["CH4 9AA", "LE12 9AA", "WC1H 9JE", "EH1 1YZ", "CF10 1EP", "M1 1AE", "B1 1AA", "LS1 1UR"]) {
  const r = await getJson(`${APP_API_PATH}/elections`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postcode }) });
  const hit = r.json?.ok ? r.json.elections.find((e) => e.covered) : null;
  if (hit) { ballotId = hit.ballot_paper_id; break; }
}
let setUrl = `${base}${APP_API_PATH}/receipts/sets/baseline`;
if (!ballotId) console.log("warn no covered ballot found for the test postcodes; ballot route not checked");
else {
  const b = await getJson(`${APP_API_PATH}/ballot/${encodeURIComponent(ballotId)}`);
  report(`GET ${APP_API_PATH}/ballot/${ballotId} (${b.status})`, b.status === 200 ? problemsWithBallot(b.json) : [`HTTP ${b.status} ${b.text ?? ""}`.trim()]);
  const first = b.json?.receipts?.sets?.[0]?.url;
  if (first) setUrl = first.replace("https://whatsittome.org", base);
}
// App 0.3.0: the area outline for the covered ballot, and "Use my location" (a point in central Leeds).
if (ballotId) {
  const bd = await getJson(`${APP_API_PATH}/boundary/${encodeURIComponent(ballotId)}`);
  report(`GET ${APP_API_PATH}/boundary/${ballotId} (${bd.status})`, bd.json === null ? [`not JSON: ${bd.text}`] : bd.status === 200 ? problemsWithBoundary(bd.json) : bd.status >= 500 ? (console.log("warn boundary source unavailable, not a contract break"), []) : [`HTTP ${bd.status}`]);
}
{
  const r = await getJson(`${APP_API_PATH}/elections`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lat: 53.797, lng: -1.545 }) });
  const name = `POST ${APP_API_PATH}/elections by location (${r.status})`;
  if (r.json === null) report(name, [`not JSON: ${r.text}`]);
  else if (r.status === 503) console.log(`warn ${name}: lookup unavailable, not a contract break`);
  else report(name, [...problemsWithElections(r.json), ...(r.json.ok === true ? [] : [`expected ok:true, got: ${r.json.message}`])]);
}
const unknown = await getJson(`${APP_API_PATH}/ballot/not.a.real.ballot`);
report(`GET ${APP_API_PATH}/ballot/not.a.real.ballot (${unknown.status})`, unknown.json === null ? ["not JSON"] : [...problemsWithBallot(unknown.json), ...(unknown.json.ok === false ? [] : ["expected an error reply"])]);
const set = await getJson(setUrl.slice(base.length));
report(`GET ${setUrl.slice(base.length)} (${set.status})`, set.status === 200 ? problemsWithReceiptSet(set.json) : [`HTTP ${set.status}`]);

console.log(failed ? `\n${failed} check(s) failed against ${base}` : `\nAll checks passed against ${base}`);
process.exit(failed ? 1 : 0);
