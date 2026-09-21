// Democracy Club candidates API (CC BY 4.0; credit Democracy Club). Unauthenticated: 10 requests/minute.
// Set DEMOCRACY_CLUB_TOKEN to lift the limit (self-service token from a Democracy Club account profile page).
const BASE = "https://candidates.democracyclub.org.uk/api/next";

function withToken(url: string) {
  const t = process.env.DEMOCRACY_CLUB_TOKEN;
  return t ? `${url}${url.includes("?") ? "&" : "?"}auth_token=${encodeURIComponent(t)}` : url;
}

export type DcBallotSummary = { ballot_paper_id: string; election_date: string; post_label: string; election_name: string; candidates_locked: boolean };

// Every current ballot at a postcode, all election levels.
export async function ballotsForPostcode(postcode: string): Promise<DcBallotSummary[] | null> {
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
