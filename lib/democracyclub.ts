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
      headers: { "User-Agent": "voter-app (github.com/highlyvisual/voter-app)" }, next: { revalidate: 3600 },
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
      headers: { "User-Agent": "voter-app (github.com/highlyvisual/voter-app)" }, next: { revalidate: 3600 },
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
  rows: { name: string; party: string; votes: number; share: number; elected: boolean }[];
};

// The most recent result for the same post, for a factual "last time here" panel. No commentary is derived from it.
export async function previousResult(ballotPaperId: string): Promise<PreviousResult | null> {
  try {
    const r = await fetch(withToken(`${BASE}/results/${encodeURIComponent(ballotPaperId)}/`), { next: { revalidate: 604800 } });
    if (!r.ok) return null;
    const j = (await r.json()) as {
      source: string | null; turnout_percentage: number | null; total_electorate: number | null;
      candidate_results: { num_ballots: number | null; elected: boolean; person: { name: string }; party: { name: string } | null }[];
    };
    const total = j.candidate_results.reduce((a, c) => a + (c.num_ballots ?? 0), 0);
    const rows = j.candidate_results
      .map((c) => ({ name: c.person.name, party: c.party?.name ?? "Independent", votes: c.num_ballots ?? 0, share: total ? (100 * (c.num_ballots ?? 0)) / total : 0, elected: c.elected }))
      .sort((a, b) => b.votes - a.votes);
    return { ballot_paper_id: ballotPaperId, source: j.source, turnout_percentage: j.turnout_percentage, total_electorate: j.total_electorate, total_votes: total, rows };
  } catch {
    return null;
  }
}
