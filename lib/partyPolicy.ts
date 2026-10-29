import { publicClient, effectivePartyId, type Candidate, type Claim, type Topic } from "@/lib/data";

// Round six decision (option 4): party positions for every candidate, with the candidate's own record as an extra.
// A party's national documents are filed against the ballot they were first read for (Holborn and St Pancras), so on
// any other ballot a candidate with nothing of their own showed nothing at all (Romily, 29 Oct: Emsworth, "First
// because you told us you're out of work", then "Nothing published yet"). Where a candidate has published nothing on a
// topic and their ballot holds nothing from their party, their party's national policy is shown instead, always
// labelled "[Party]'s national policy, not [name]'s own commitment" (the Your Home rule). Not for elections already
// held: today's policy wasn't what was on offer then. Independents have no party policy to show.
export const INDEPENDENT_ID = "ynmp-party:2";

// Every party's own national positions, across elections, one copy of each quotation, the most recent first, keyed by
// the parent party (a Welsh or Scottish branch shares its party's national documents).
export async function nationalPartyClaims(): Promise<Map<string, Claim[]>> {
  const db = publicClient();
  const [{ data: rows }, { data: parties }] = await Promise.all([
    db.from("current_claims").select("*, sources(id, title, url, publisher, published_on, retrieved_at, layer, archive_url)").eq("status", "verified").is("candidate_id", null).not("party_ec_id", "is", null),
    db.from("parties").select("ec_id, parent_party_ec_id"),
  ]);
  const parent = new Map(((parties ?? []) as { ec_id: string; parent_party_ec_id: string | null }[]).map((p) => [p.ec_id, p.parent_party_ec_id]));
  const seen = new Set<string>();
  const out = new Map<string, Claim[]>();
  for (const c of [...((rows ?? []) as Claim[])].sort((a, b) => (b.sources?.published_on ?? "").localeCompare(a.sources?.published_on ?? ""))) {
    const p = c.party_ec_id ? parent.get(c.party_ec_id) ?? c.party_ec_id : null;
    if (!p) continue;
    const k = `${p}|${c.topic}|${c.source_quote}`;
    if (seen.has(k)) continue; seen.add(k);
    out.set(p, [...(out.get(p) ?? []), c]);
  }
  return out;
}

export const poss = (name: string) => (/s$/i.test(name) ? `${name}’` : `${name}’s`);

export function isHeld(pollDate: string) {
  return pollDate < new Date().toISOString().slice(0, 10);
}

// One candidate on one topic: their own words and their party's words for this ballot (as before); if there are none,
// and the election is still to come, their party's national policy, flagged so the page can label it.
export function candidateOnTopic(c: Candidate, ballotClaims: Claim[], national: Map<string, Claim[]> | null, topic: Topic | string): { list: Claim[]; national: boolean } {
  const party = effectivePartyId(c);
  const list = ballotClaims.filter((cl) => cl.topic === topic && (cl.candidate_id === c.id || (cl.candidate_id === null && cl.party_ec_id === party)));
  if (list.length || !national || !party || party === INDEPENDENT_ID) return { list, national: false };
  const fallback = (national.get(party) ?? []).filter((cl) => cl.topic === topic);
  return { list: fallback, national: fallback.length > 0 };
}

export function nationalLabel(c: Candidate, partyName?: string | null) {
  const party = partyName || c.parties?.name || c.party_name_on_ballot || "Their party";
  return `${poss(party)} national policy, not ${poss(c.name)} own commitment`;
}
