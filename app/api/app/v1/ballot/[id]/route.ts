import { NextResponse } from "next/server";
import { ballotLabel, baselineIdFor, effectivePartyId, getBallot, getElectionDates, listCandidates, listReceiptSets, listVerifiedClaims, type Candidate, type Claim } from "@/lib/data";
import { electionTimetable, hustingsFor } from "@/lib/democracyclub";
import { layerOf, precisionLabel } from "@/lib/claims";
import { keyDates } from "@/lib/deadlines";
import { inkOn } from "@/lib/partyColour";
import { isHeld, nationalPartyClaims } from "@/lib/partyPolicy";
import { baselineYear } from "@/lib/receipts";
import { APP_API_PATH, type AppClaim, type AppHusting, type AppParty, type AppReceiptSetRef, type AppSource, type BallotResponse } from "@/lib/appApi";
export const dynamic = "force-dynamic";

// Phone app, contract v1 (lib/appApi.ts: add optional fields only, never rename or remove).
// One ballot as the app needs it: the ballot, key dates, candidates in ballot-paper order, each party's verified claims, and
// which reform sets to download for the money layer. The same rules as the website's ballot page (app/ballot/[id]):
// ballot-paper order, verified claims only, party colour only on party material, photos only for the candidate's own screen.
// Nothing about the household is sent or used here; the app filters claims and looks up receipts on the phone.
const SITE = "https://whatsittome.org";
const HEX = /^#[0-9a-f]{6}$/i;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ballotId = decodeURIComponent(id);
  const reply = (res: BallotResponse, status = 200) =>
    NextResponse.json(res, { status, headers: { "Cache-Control": status === 200 ? "public, max-age=300, stale-while-revalidate=3600" : "no-store" } });
  if (!/^[a-z0-9.-]{3,200}$/i.test(ballotId)) return reply({ ok: false, message: "That isn't a ballot we know." }, 400);

  let ballot;
  try { ballot = await getBallot(ballotId); } catch { return reply({ ok: false, message: "We couldn't load this ballot just now. Please try again in a minute." }, 503); }
  if (!ballot) return reply({ ok: false, message: "We don't have a page for this ballot yet." }, 404);

  const [candidates, claims, dates, sets, timetable, hustings] = await Promise.all([
    listCandidates(ballotId), listVerifiedClaims(ballotId), getElectionDates(ballotId).catch(() => null), listReceiptSets().catch(() => []),
    ballot.archived ? Promise.resolve(null) : electionTimetable(ballotId),
    hustingsFor(ballotId).catch(() => null),
  ]);
  // Optional (29 Oct): each party's national policy, for the app to show, labelled, where a candidate has nothing of
  // their own on a topic (lib/partyPolicy.ts). Not for elections already held. Left out if it can't be read.
  const national = isHeld(ballot.poll_date) ? null : await nationalPartyClaims().catch(() => null);

  const appClaim = (c: Claim): AppClaim => ({
    id: c.id, ballot_paper_id: c.ballot_paper_id, candidate_id: c.candidate_id, party_ec_id: c.party_ec_id, topic: c.topic, tier: c.tier,
    claim_text: c.claim_text, source_quote: c.source_quote, applies_if: c.applies_if ?? {}, status: c.status, drafted_by: c.drafted_by,
    created_at: c.created_at, precision: c.precision, sources: c.sources ?? null, layer: layerOf(c), precision_label: precisionLabel(c),
  });
  // Every claim served must carry its source (rule: a verbatim quote with a named, dated, linked source).
  const served = claims.filter((c) => c.status === "verified" && c.sources);

  // Parties on this ballot, keyed by the party whose claims apply (a joint candidacy takes its parent's).
  const parties = new Map<string, AppParty>();
  const partyOf = (c: Candidate) => effectivePartyId(c);
  for (const c of candidates) {
    const ec = partyOf(c);
    // Democracy Club's pseudo-parties ("ynmp-party:2" Independent, Speaker) aren't parties: no party material, no colour.
    if (!ec || ec.startsWith("ynmp-party:") || parties.has(ec)) continue;
    const colour = c.parties?.colour_hex && HEX.test(c.parties.colour_hex) ? c.parties.colour_hex : null;
    const nat = (national?.get(ec) ?? []).filter((cl) => cl.sources);
    parties.set(ec, { ec_id: ec, name: c.parties?.name ?? c.party_name_on_ballot, colour, ink: colour ? inkOn(colour) : null, claims: served.filter((cl) => cl.candidate_id === null && cl.party_ec_id === ec).map(appClaim), ...(nat.length ? { national_claims: nat.map(appClaim) } : {}) });
  }

  // Reform sets: the baseline for this ballot's law year, the other baseline for comparison, and each party's modelled pledge
  // under the same law year whose source is one of that party's verified claims (as CandidateCard's Receipt does).
  const baselineId = baselineIdFor(ballot);
  const year = baselineYear(baselineId);
  const sourcesById = new Map<number, AppSource>();
  for (const c of served) if (c.sources) sourcesById.set(c.sources.id, c.sources);
  const verifiedFor = (ec: string) => new Set(served.filter((c) => c.party_ec_id === ec || candidates.some((k) => k.id === c.candidate_id && partyOf(k) === ec)).map((c) => c.sources!.id));
  const base = sets.find((s) => s.reform_set_id === baselineId);
  const compareId = baselineId === "baseline" ? "baseline-2024" : "baseline";
  const refs: AppReceiptSetRef[] = [];
  const ref = (s: (typeof sets)[number], sourceIds: number[]): AppReceiptSetRef => ({
    id: s.reform_set_id, party_ec_id: s.party_ec_id, label: s.label, year: s.year,
    url: `${SITE}${APP_API_PATH}/receipts/sets/${encodeURIComponent(s.reform_set_id)}?v=${encodeURIComponent(s.policyengine_version)}`,
    sources: sourceIds.map((i) => sourcesById.get(i)).filter((x): x is AppSource => !!x),
  });
  if (base) {
    refs.push(ref(base, []));
    const cmp = sets.find((s) => s.reform_set_id === compareId);
    if (cmp) refs.push(ref(cmp, []));
    for (const ec of parties.keys()) {
      const ok = verifiedFor(ec);
      const s = sets.find((r) => r.party_ec_id === ec && r.year === year && r.source_ids.some((i) => ok.has(i)));
      if (s) refs.push(ref(s, s.source_ids.filter((i) => ok.has(i))));
    }
  }

  const kd = keyDates({ pollDate: ballot.poll_date, gss: ballot.area_gss, level: ballot.level, timetable });
  const label = (c: Candidate) => (c.party_description_on_ballot && c.party_description_on_ballot !== "[blank]" ? c.party_description_on_ballot : c.party_name_on_ballot);

  return reply({
    ok: true,
    ballot: {
      id: ballot.ballot_paper_id, name: ballotName(ballot.ballot_paper_id, ballot.area_name), date: ballot.poll_date, area: ballot.area_name, level: ballot.level,
      voting_system: ballot.voting_system, winner_count: ballot.winner_count, by_election_reason: ballot.by_election_reason,
      cancelled: ballot.cancelled, postponed: ballot.postponed, postponed_note: ballot.postponed_note, uncontested: ballot.uncontested,
      sopn_url: ballot.official_sopn_url, web_url: `${SITE}/ballot/${encodeURIComponent(ballot.ballot_paper_id)}`,
    },
    key_dates: {
      items: kd.items, id_required: kd.idRequired, source: kd.timetableSource,
      notice_url: dates?.notice_of_election_url ?? null, note: dates?.source_note ?? null,
    },
    // listCandidates returns ballot-paper order (surname, as the law prescribes); position is that order, nothing else.
    candidates: candidates.map((c, i) => ({
      id: c.id, position: i + 1, name: c.name, party_label: label(c), registered_party: c.party_name_on_ballot, party_ec_id: partyOf(c),
      photo_url: c.photo_url && c.photo_url.startsWith("https://") ? c.photo_url : null, photo_credit: c.photo_copyright ?? c.photo_uploader ?? null,
      statement: c.statement_to_voters_present ? c.statement_to_voters : null, homepage_url: c.homepage_url, is_incumbent: c.is_incumbent,
      claims: served.filter((cl) => cl.candidate_id === c.id).map(appClaim),
    })),
    parties: [...parties.values()],
    receipts: base ? { version: base.policyengine_version, baseline_id: baselineId, compare_baseline_id: sets.some((s) => s.reform_set_id === compareId) ? compareId : null, sets: refs } : null,
    source: "Democracy Club (CC BY 4.0), the council’s notice of election where linked, and the source under each position (whatsittome.org/ledger)",
    // Round ten q14, optional: every hustings Democracy Club lists, by date; left out when the list could not be read.
    ...(hustings ? { hustings: hustings.map((h): AppHusting => ({ title: h.title, starts: h.starts, ends: h.ends, location: h.location, url: h.url, postevent_url: h.postevent_url, organiser: h.organiser, domain: h.domain })) } : {}),
  });
}

// The ballot's name as the website shows it (lib/data ballotLabel), falling back to the area name.
function ballotName(id: string, area: string): string {
  const l = ballotLabel(id);
  return l === id ? area : l;
}
