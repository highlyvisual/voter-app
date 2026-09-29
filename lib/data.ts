import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function publicClient() {
  if (!url || !key) throw new Error("Supabase public environment variables are not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const TOPICS = [
  ["money_and_cost_of_living", "Money and cost of living"],
  ["housing_and_property", "Housing and property"],
  ["healthcare_and_social_care", "Healthcare and social care"],
  ["education_and_universities", "Education and universities"],
  ["environment_climate_and_energy", "Environment, climate and energy"],
  // Tenth topic, added 29 Sept 2026 at Romily's request (round eight q17).
  ["transport", "Transport and roads"],
  ["immigration_and_borders", "Immigration and borders"],
  ["crime_policing_and_justice", "Crime, policing and justice"],
  ["defence_foreign_affairs_and_eu", "Defence, foreign affairs and the EU"],
  ["equality_and_rights", "Equality and rights"],
] as const;
export type Topic = (typeof TOPICS)[number][0];
// The one set of short topic names, used wherever space is tight (chips, cards). Full names are in TOPICS.
export const TOPIC_SHORT: Record<string, string> = { money_and_cost_of_living: "Money", housing_and_property: "Housing", healthcare_and_social_care: "Health and care", education_and_universities: "Education", environment_climate_and_energy: "Environment", transport: "Transport", immigration_and_borders: "Immigration", crime_policing_and_justice: "Crime and policing", defence_foreign_affairs_and_eu: "Defence and the EU", equality_and_rights: "Equality and rights" };

export type Ballot = {
  ballot_paper_id: string;
  election_id: string;
  level: string;
  poll_date: string;
  area_name: string;
  voting_system: string | null;
  by_election_reason: string | null;
  candidates_locked: boolean;
  official_sopn_url: string | null;
  democracy_club_url: string | null;
  previous_ballot_paper_id: string | null;
  archived: boolean;
  area_lat: number | null;
  area_lng: number | null;
  area_point_note: string | null;
  area_gss: string | null;
  winner_count: number;
  uncontested: boolean;
  postponed: boolean;
  postponed_note: string | null;
  cancelled: boolean;
  hpi_region: string | null;
  retrieved_at: string;
};

export function baselineIdFor(ballot: Ballot): string {
  const y = ballot.poll_date.slice(0, 4);
  return y >= "2026" ? "baseline" : `baseline-${y}`;
}

export type Candidate = {
  id: number;
  ballot_paper_id: string;
  dc_person_id: number | null;
  dc_person_url: string | null;
  name: string;
  surname_sort: string;
  party_ec_id: string | null;
  party_name_on_ballot: string;
  party_description_on_ballot: string | null;
  homepage_url: string | null;
  wikipedia_url: string | null;
  statement_to_voters_present: boolean;
  statement_to_voters: string | null;
  statement_retrieved_at: string | null;
  parliament_member_id: number | null;
  parliament_match_note: string | null;
  photo_url: string | null;
  photo_copyright: string | null;
  photo_uploader: string | null;
  photo_source: string | null;
  previous_candidacies_count: number;
  is_incumbent: boolean;
  parties?: { name: string; official_site_url: string | null; colour_hex: string | null; parent_party_ec_id: string | null; emblem_url: string | null; emblem_description: string | null } | null;
};

export type Claim = {
  id: number;
  ballot_paper_id: string;
  candidate_id: number | null;
  party_ec_id: string | null;
  topic: Topic;
  tier: "computed" | "documented";
  claim_text: string;
  source_quote: string;
  applies_if: Record<string, unknown>;
  status: string;
  drafted_by: string;
  created_at: string;
  precision?: "measurable" | "aspiration";
  sources?: { id: number; title: string; url: string; publisher: string; published_on: string | null; retrieved_at: string; layer?: string | null; archive_url?: string | null } | null;
};

export type ReceiptRow = {
  reform_set_id: string;
  party_ec_id: string | null;
  household_key: string;
  results: Record<string, number | string>;
  policyengine_version: string;
  computed_at: string;
};

export async function listBallots(): Promise<Ballot[]> {
  const { data, error } = await publicClient()
    .from("ballots")
    .select("*")
    .eq("archived", false)
    .gte("poll_date", new Date().toISOString().slice(0, 10))
    .order("poll_date");
  if (error) throw error;
  return data ?? [];
}

export async function listArchivedBallots(): Promise<Ballot[]> {
  const { data, error } = await publicClient().from("ballots").select("*").eq("archived", true).order("poll_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getBallot(id: string): Promise<Ballot | null> {
  const { data, error } = await publicClient().from("ballots").select("*").eq("ballot_paper_id", id).maybeSingle();
  if (error) throw error;
  return data;
}

// Ballot-paper order: alphabetical by surname, as the law prescribes. Never by party, never by anything computed.
export async function listCandidates(ballotId: string): Promise<Candidate[]> {
  const { data, error } = await publicClient()
    .from("candidates")
    .select("*, parties(name, official_site_url, colour_hex, parent_party_ec_id, emblem_url, emblem_description)")
    .eq("ballot_paper_id", ballotId)
    .is("withdrawn_at", null) // set by the nightly ingest when Democracy Club no longer lists the candidacy
    .order("surname_sort");
  if (error) throw error;
  return (data ?? []) as Candidate[];
}

// Only verified claims are ever shown. Drafts exist in the ledger but never reach a user.
export async function listVerifiedClaims(ballotId: string): Promise<Claim[]> {
  const { data, error } = await publicClient()
    .from("current_claims")
    .select("*, sources(id, title, url, publisher, published_on, retrieved_at, layer, archive_url)")
    .eq("ballot_paper_id", ballotId)
    .eq("status", "verified")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Claim[];
}

export async function getReceipts(householdKey: string): Promise<ReceiptRow[]> {
  const { data, error } = await publicClient().from("receipt_grid").select("*").eq("household_key", householdKey);
  if (error) throw error;
  return (data ?? []) as ReceiptRow[];
}

export type ChangeLogRow = { id: number; claim_id: number | null; event: string; actor: string; detail: string | null; created_at: string };

export async function listChangeLog(limit = 200): Promise<ChangeLogRow[]> {
  const { data, error } = await publicClient().from("change_log").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function countClaimsByStatus(): Promise<Record<string, number>> {
  const { data, error } = await publicClient().from("current_claims").select("status");
  if (error) throw error;
  const out: Record<string, number> = {};
  for (const r of data ?? []) out[r.status] = (out[r.status] ?? 0) + 1;
  return out;
}

export async function listCurrentVerifiedClaimsAll(): Promise<(Claim & { candidates?: { name: string } | null })[]> {
  const { data, error } = await publicClient()
    .from("current_claims")
    .select("*, sources(id, title, url, publisher, published_on, retrieved_at), candidates(name)")
    .eq("status", "verified")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as (Claim & { candidates?: { name: string } | null })[];
}

export type ClaimMeta = { id: number; status: string; topic: Topic; drafted_by: string; created_at: string; supersedes: number | null; candidates?: { name: string } | null; party_ec_id: string | null };
// Metadata only (no claim text) for every current ledger row, so the public log can name what each entry refers to
// without exposing unverified wording.
export async function listClaimMeta(): Promise<ClaimMeta[]> {
  const { data, error } = await publicClient().from("current_claims").select("id, status, topic, drafted_by, created_at, supersedes, party_ec_id, candidates(name)").order("id");
  if (error) throw error;
  return (data ?? []) as unknown as ClaimMeta[];
}
export async function listAllClaimMeta(): Promise<ClaimMeta[]> {
  const { data, error } = await publicClient().from("claims").select("id, status, topic, drafted_by, created_at, supersedes, party_ec_id, candidates(name)").order("id");
  if (error) throw error;
  return (data ?? []) as unknown as ClaimMeta[];
}

// Effective party for matching party-level claims: a joint registration inherits its parent.
export function effectivePartyId(c: Candidate): string | null {
  return c.parties?.parent_party_ec_id ?? c.party_ec_id;
}

// Anonymous usage: one counter per ballot per day, nothing else. Never blocks rendering.
export async function bumpUsage(ballotId: string) {
  try {
    const { adminClient } = await import("@/lib/admin");
    const db = adminClient();
    const day = new Date().toISOString().slice(0, 10);
    const { data } = await db.from("usage_totals").select("lookups").eq("day", day).eq("ballot_paper_id", ballotId).maybeSingle();
    if (data) await db.from("usage_totals").update({ lookups: data.lookups + 1 }).eq("day", day).eq("ballot_paper_id", ballotId);
    else await db.from("usage_totals").insert({ day, ballot_paper_id: ballotId, lookups: 1 });
  } catch { /* counting is best-effort */ }
}

export type Resource = { id: number; topic: string; title: string; url: string; publisher: string; kind: string };
export async function listResources(topic?: string): Promise<Resource[]> {
  let q = publicClient().from("resources").select("*").order("topic").order("title");
  if (topic) q = q.in("topic", ["all", topic]);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Resource[];
}

export type InvitationStatus = { candidate_id: number; ballot_paper_id: string; invited_at: string; responded_at: string | null; submission_status: string };
export async function listInvitationStatus(ballotId: string): Promise<InvitationStatus[]> {
  const { data, error } = await publicClient().from("invitation_status").select("*").eq("ballot_paper_id", ballotId);
  if (error) throw error;
  return (data ?? []) as InvitationStatus[];
}
export type ElectionDates = { ballot_paper_id: string; register_by: string | null; postal_by: string | null; proxy_by: string | null; vac_by: string | null; notice_of_election_url: string | null; sopn_url: string | null; notice_of_poll_url: string | null; source_note: string | null };
export async function getElectionDates(ballotId: string): Promise<ElectionDates | null> {
  const { data, error } = await publicClient().from("election_dates").select("*").eq("ballot_paper_id", ballotId).maybeSingle();
  if (error) throw error;
  return data as ElectionDates | null;
}

export type Leaflet = { id: number; candidate_id: number; leaflet_pk: number; url: string; thumb_url: string | null; date_uploaded: string | null };
export async function listLeaflets(ballotId: string): Promise<Leaflet[]> {
  const { data, error } = await publicClient().from("leaflets").select("*, candidates!inner(ballot_paper_id)").eq("candidates.ballot_paper_id", ballotId);
  if (error) throw error;
  return (data ?? []) as unknown as Leaflet[];
}

// Sourced position counts per ballot for the elections list. Party-level claims count once per ballot; identical computation for all.
export async function countClaimsPerBallot(): Promise<Record<string, number>> {
  const { data, error } = await publicClient().from("current_claims").select("ballot_paper_id").eq("status", "verified");
  if (error) throw error;
  const out: Record<string, number> = {};
  for (const r of data ?? []) out[r.ballot_paper_id] = (out[r.ballot_paper_id] ?? 0) + 1;
  return out;
}

export type CouncilPledge = { id: number; party_ec_id: string | null; council: string; pledge_text: string; source_url: string; source_title: string | null; made_on: string | null; measurable: boolean; state: string | null; evidence_urls: string[]; note: string | null };
export async function listCouncilPledges(council: string): Promise<CouncilPledge[]> {
  const { data, error } = await publicClient().from("council_pledges").select("*").eq("council", council).order("made_on", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CouncilPledge[];
}

export type PreviousCandidacy = { id: number; candidate_id: number; ballot_paper_id: string; election_date: string | null; party: string | null; elected: boolean | null };
export async function listPreviousCandidacies(ballotId: string): Promise<PreviousCandidacy[]> {
  const { data, error } = await publicClient().from("previous_candidacies").select("*, candidates!inner(ballot_paper_id)").eq("candidates.ballot_paper_id", ballotId).order("election_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PreviousCandidacy[];
}
// Human label from a Democracy Club ballot id: "local.camden.camden-square.2022-05-05" → "Camden council, Camden Square ward"
export function ballotLabel(id: string): string {
  const parts = id.split(".");
  const cap = (x: string) => x.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  if (parts[0] === "parl") return `UK Parliament, ${cap(parts[1])}${parts[2] === "by" ? " (by-election)" : ""}`;
  if (parts[0] === "local") return `${cap(parts[1])} council, ${cap(parts[2])} ward${parts[3] === "by" ? " (by-election)" : ""}`;
  if (parts[0] === "mayor") return `Mayor, ${cap(parts[1])}`;
  if (parts[0] === "sp") return `Scottish Parliament, ${cap(parts[2] ?? parts[1])}`;
  if (parts[0] === "senedd") return `Senedd, ${cap(parts[2] ?? parts[1])}`;
  if (parts[0] === "europarl") return `European Parliament, ${cap(parts[1])}`;
  if (parts[0] === "pcc") return `Police and Crime Commissioner, ${cap(parts[1])}`;
  return id;
}

export async function listFaceTiles(): Promise<{ id: number; name: string; party: string; colour: string | null; photo: string | null; ballot: string; area: string }[]> {
  const { data, error } = await publicClient().from("candidates").select("id, name, party_name_on_ballot, photo_url, ballot_paper_id, surname_sort, parties(colour_hex), ballots!inner(area_name, poll_date, archived)").eq("ballots.archived", false).is("withdrawn_at", null).gte("ballots.poll_date", new Date().toISOString().slice(0, 10)).order("surname_sort");
  if (error) throw error;
  type Row = { id: number; name: string; party_name_on_ballot: string; photo_url: string | null; ballot_paper_id: string; parties: { colour_hex: string | null } | null; ballots: { area_name: string; poll_date: string } };
  return ((data ?? []) as unknown as Row[]).sort((a, b) => a.ballots.poll_date.localeCompare(b.ballots.poll_date) || a.ballot_paper_id.localeCompare(b.ballot_paper_id)).map((r) => ({ id: r.id, name: r.name, party: r.party_name_on_ballot, colour: r.parties?.colour_hex ?? null, photo: r.photo_url, ballot: r.ballot_paper_id, area: r.ballots.area_name }));
}

export type PageSnapshot = { ballot_paper_id: string; page_url: string; archive_url: string | null; taken_at: string };
// Eve-of-poll copies of every ballot, comparison and candidate page, kept by the Internet Archive (scripts/auto/poll_eve_snapshots.py).
export async function listPageSnapshots(): Promise<PageSnapshot[]> {
  const { data, error } = await publicClient().from("page_snapshots").select("ballot_paper_id, page_url, archive_url, taken_at").not("archive_url", "is", null).order("taken_at", { ascending: false }).limit(2000);
  if (error) return [];
  return (data ?? []) as PageSnapshot[];
}
