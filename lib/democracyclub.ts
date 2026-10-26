// Democracy Club candidates API (CC BY 4.0; credit Democracy Club). Unauthenticated: 10 requests/minute.
// Set DEMOCRACY_CLUB_TOKEN to lift the limit (self-service token from a Democracy Club account profile page).
const BASE = "https://candidates.democracyclub.org.uk/api/next";

function withToken(url: string) {
  const t = process.env.DEMOCRACY_CLUB_TOKEN;
  return t ? `${url}${url.includes("?") ? "&" : "?"}auth_token=${encodeURIComponent(t)}` : url;
}

export type DcBallotSummary = { ballot_paper_id: string; election_date: string; post_label: string; election_name: string; candidates_locked: boolean };

// Democracy Club developers API (aggregator: postcode -> ballots, polling station, timetable). Needs a key on every request;
// the hobbyist key (issued 24 Sept 2026, account "What's It To Me?") allows 1,000 requests a day. Distinct from the
// candidates-API token above: the two systems do not accept each other's keys (tested 24 Sept).
const DEV_BASE = "https://developers.democracyclub.org.uk/api/v1";

async function ballotsForPostcodeDevelopers(postcode: string): Promise<DcBallotSummary[] | null> {
  const key = process.env.DEMOCRACY_CLUB_DEVELOPERS_KEY;
  if (!key) return null;
  try {
    const r = await fetch(`${DEV_BASE}/postcode/${encodeURIComponent(postcode)}/?auth_token=${encodeURIComponent(key)}`, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)" }, next: { revalidate: 3600 },
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { address_picker?: boolean; dates?: { date: string; ballots: { ballot_paper_id: string; election_name: string; post_name: string; candidates_verified: boolean; cancelled: boolean }[] }[] };
    // A split postcode needs an address picker we do not offer; let the candidates API decide instead.
    if (j.address_picker) return null;
    return (j.dates ?? []).flatMap((d) => d.ballots.filter((b) => !b.cancelled).map((b) => ({
      ballot_paper_id: b.ballot_paper_id, election_date: d.date, election_name: b.election_name.replace(/\s+/g, " ").trim(), post_label: b.post_name, candidates_locked: b.candidates_verified,
    })));
  } catch {
    return null;
  }
}

// Every current ballot at a postcode, all election levels. Developers API first (1,000/day with the key), then the
// candidates API (10/minute without a token).
export async function ballotsForPostcode(postcode: string): Promise<DcBallotSummary[] | null> {
  const dev = await ballotsForPostcodeDevelopers(postcode);
  if (dev) return dev;
  try {
    const r = await fetch(withToken(`${BASE}/ballots/?for_postcode=${encodeURIComponent(postcode)}&current=1&page_size=50`), {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)" }, next: { revalidate: 3600 },
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { results?: { ballot_paper_id: string; candidates_locked: boolean; election: { election_date: string; name: string }; post: { label: string } }[] };
    return (j.results ?? []).map((b) => ({
      ballot_paper_id: b.ballot_paper_id, election_date: b.election.election_date, election_name: b.election.name, post_label: b.post.label, candidates_locked: b.candidates_locked,
    }));
  } catch {
    return null;
  }
}

export type PreviousResult = {
  ballot_paper_id: string; source: string | null; turnout_percentage: number | null; total_electorate: number | null; total_votes: number;
  spoilt: number | null; turnout_reported: number | null;
  rows: { name: string; party: string; votes: number; share: number; elected: boolean }[];
};

// The most recent result for the same post, for a factual "last time here" panel. No commentary is derived from it.
// A result declared overnight must show the next morning, so a ballot polled in the last fortnight is re-read every 15
// minutes; older results are cached for a week.
export async function previousResult(ballotPaperId: string): Promise<PreviousResult | null> {
  const poll = ballotPaperId.slice(-10);
  const recent = /^\d{4}-\d{2}-\d{2}$/.test(poll) && Date.now() - new Date(poll + "T00:00:00Z").getTime() < 15 * 86400000;
  try {
    const r = await fetch(withToken(`${BASE}/results/${encodeURIComponent(ballotPaperId)}/`), { signal: AbortSignal.timeout(6000), next: { revalidate: recent ? 900 : 604800 } });
    if (!r.ok) return null;
    const j = (await r.json()) as {
      source: string | null; turnout_percentage: number | null; total_electorate: number | null; num_spoilt_ballots: number | null; num_turnout_reported: number | null;
      candidate_results: { num_ballots: number | null; elected: boolean; person: { name: string }; party: { name: string } | null }[];
    };
    const total = j.candidate_results.reduce((a, c) => a + (c.num_ballots ?? 0), 0);
    const rows = j.candidate_results
      .map((c) => ({ name: c.person.name, party: c.party?.name ?? "Independent", votes: c.num_ballots ?? 0, share: total ? (100 * (c.num_ballots ?? 0)) / total : 0, elected: c.elected }))
      .sort((a, b) => b.votes - a.votes);
    if (!rows.length) return null;
    return { ballot_paper_id: ballotPaperId, source: j.source, turnout_percentage: j.turnout_percentage == null ? null : Number(j.turnout_percentage), total_electorate: j.total_electorate, total_votes: total, spoilt: j.num_spoilt_ballots ?? null, turnout_reported: j.num_turnout_reported ?? null, rows };
  } catch {
    return null;
  }
}


// Democracy Club EveryElection: the statutory timetable for a ballot (registration, postal, proxy and voter-ID
// certificate deadlines) and whether photo ID is required. CC BY 4.0, no key.
export type Timetable = { registration?: string; postal?: string; proxy?: string; vac?: string; requiresId: boolean | null; source: string };
export async function electionTimetable(ballotPaperId: string): Promise<Timetable | null> {
  const url = `https://elections.democracyclub.org.uk/api/elections/${encodeURIComponent(ballotPaperId)}/`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)" }, next: { revalidate: 86400 } });
    if (!r.ok) return null;
    const j = (await r.json()) as { timetable?: Record<string, string | null> | null; requires_voter_id?: string | null };
    const t = j.timetable ?? {};
    const d = (k: string) => (typeof t[k] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t[k] as string) ? (t[k] as string) : undefined);
    const out = { registration: d("registration_deadline"), postal: d("postal_vote_application_deadline"), proxy: d("proxy_vote_application_deadline"), vac: d("vac_application_deadline"),
      requiresId: "requires_voter_id" in j ? !!j.requires_voter_id : null, source: `https://elections.democracyclub.org.uk/elections/${encodeURIComponent(ballotPaperId)}/` };
    return out.registration || out.postal || out.proxy ? out : null;
  } catch {
    return null;
  }
}

// Hustings for a ballot (Romily, round ten q14: "Yes, list them all and say who runs each"). From Democracy Club's Who Can I
// Vote For API (candidates_for_ballots, by ballot id, no key): the same hustings records the developers API returns on each
// ballot, CC BY 4.0. Democracy Club records no organiser, so one is named only where the hustings' own title names it
// verbatim ("... organised by X", "hosted by X"); otherwise the page says to see the event page, with its domain. Every
// record is listed, by date; nothing is filtered by organiser. Null when the API could not be read (the page then says
// nothing rather than "none").
export type Husting = { title: string; url: string | null; starts: string; ends: string | null; location: string | null; postevent_url: string | null; organiser: string | null; domain: string | null };
export const HUSTINGS_SOURCE = "https://whocanivotefor.co.uk/";
export async function hustingsFor(ballotPaperId: string): Promise<Husting[] | null> {
  try {
    const r = await fetch(`https://whocanivotefor.co.uk/api/candidates_for_ballots/?ballot_ids=${encodeURIComponent(ballotPaperId)}`, {
      signal: AbortSignal.timeout(6000), headers: { "User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)" }, next: { revalidate: 3600 },
    });
    if (!r.ok) return null;
    type Raw = { title?: string; url?: string; starts?: string; ends?: string | null; location?: string; postevent_url?: string };
    const j = (await r.json()) as { ballot_paper_id: string; hustings?: Raw[] | null }[];
    const b = Array.isArray(j) ? j.find((x) => x.ballot_paper_id === ballotPaperId) : undefined;
    if (!b) return null;
    const web = (u?: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);
    const when = (d?: string | null) => (d && !Number.isNaN(Date.parse(d)) ? d : null);
    return (b.hustings ?? [])
      .filter((h): h is Raw & { title: string; starts: string } => Boolean(h.title?.trim() && when(h.starts)))
      .map((h) => {
        const url = web(h.url);
        return { title: h.title.trim(), url, starts: h.starts, ends: when(h.ends), location: h.location?.trim() || null, postevent_url: web(h.postevent_url), organiser: organiserIn(h.title), domain: url ? domainOf(url) : null };
      })
      .sort((a, b) => Date.parse(a.starts) - Date.parse(b.starts));
  } catch {
    return null;
  }
}

/** The organiser, only where the title itself names it: the words after "organised by", "hosted by" and the like. */
export function organiserIn(title: string): string | null {
  const m = title.match(/\b(?:organi[sz]ed|hosted|run|arranged|convened|presented|chaired|held) by\s+([^,.;:()|–—]+?)\s*(?:[,.;:()|–—]|$)/i);
  return m && m[1].trim().length > 1 ? m[1].trim() : null;
}

function domainOf(u: string): string | null {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return null; }
}

// Who stood on one past ballot (Romily, round eleven q5: outside an election, the parties that stood where you live at
// the last general election). From the candidates API by ballot id, CC BY 4.0. A finished general election does not
// change, so the answer is cached for a week. Null when the API could not be read or has no such ballot; the page then
// says so rather than guessing.
export type StoodParty = { ec_id: string; name: string };
export type BallotStood = { ballot_paper_id: string; label: string; parties: StoodParty[]; independents: number; url: string };
export async function ballotStood(ballotPaperId: string): Promise<BallotStood | null> {
  try {
    const r = await fetch(withToken(`${BASE}/ballots/${encodeURIComponent(ballotPaperId)}/`), {
      signal: AbortSignal.timeout(6000), headers: { "User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)" }, next: { revalidate: 604800 },
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { post?: { label?: string }; candidacies?: { party?: { ec_id?: string; name?: string } | null }[] };
    const seen = new Map<string, string>();
    let independents = 0;
    for (const c of j.candidacies ?? []) {
      const id = c.party?.ec_id ?? "";
      if (!id || id === "ynmp-party:2") { independents++; continue; }
      if (!seen.has(id)) seen.set(id, c.party?.name ?? id);
    }
    return { ballot_paper_id: ballotPaperId, label: j.post?.label ?? "", parties: [...seen].map(([ec_id, name]) => ({ ec_id, name })), independents, url: `https://candidates.democracyclub.org.uk/elections/${encodeURIComponent(ballotPaperId)}/` };
  } catch {
    return null;
  }
}
