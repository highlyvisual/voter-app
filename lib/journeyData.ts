import { TOPIC_SHORT } from "@/lib/data";
import { getBallot, listCandidates, listVerifiedClaims, TOPICS } from "@/lib/data";
import { claimApplies, householdComplete, householdFromParams, type Household } from "@/lib/household";
import { claimsFor } from "@/components/CandidateCard";
import { candidateOnTopic, isHeld, nationalPartyClaims } from "@/lib/partyPolicy";
import { topicsForHousehold } from "@/lib/topicOrder";

// One plain data object for the two journey prototypes (Romily, round 5, q6), so both draw on exactly the same facts.
export type JourneyData = {
  ballot: { id: string; area: string; council: string | null; place: string; date: string; dateText: string; days: number; level: string; seats: number; system: string | null; lat: number | null; lng: number | null; gss: string | null };
  household: Household; complete: boolean; qs: string;
  candidates: { id: number; n: number; name: string; party: string; colour: string | null; positions: number }[];
  topics: { topic: string; label: string; short: string; reason: string | null; n: number; who: number }[];
  stats: { claims: number; sources: number; covered: number };
};
const SHORT = TOPIC_SHORT;

export async function loadJourney(ballotId: string, sp: Record<string, string | string[] | undefined>): Promise<JourneyData | null> {
  const ballot = await getBallot(ballotId); if (!ballot) return null;
  const [candidates, claims, national] = await Promise.all([listCandidates(ballotId), listVerifiedClaims(ballotId), isHeld(ballot.poll_date) ? Promise.resolve(null) : nationalPartyClaims()]);
  // Own words, else the party's national policy on the topic (lib/partyPolicy.ts).
  const onTopic = (c: (typeof candidates)[number], t: string) => candidateOnTopic(c, claims, national, t).list.filter((cl) => claimApplies(cl.applies_if, household));
  const household = householdFromParams(sp); const complete = householdComplete(household);
  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => typeof v === "string" && k !== "s") as [string, string][]).toString();
  const today = new Date().toISOString().slice(0, 10);
  const days = Math.max(0, Math.round((new Date(ballot.poll_date + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime()) / 86400000));
  const [council, place] = ballot.area_name.includes(":") ? ballot.area_name.split(":").map((x) => x.trim()) : [null, ballot.area_name];
  const order = topicsForHousehold(household, (t) => candidates.some((c) => onTopic(c, t).length > 0));
  const label = Object.fromEntries(TOPICS) as Record<string, string>;
  const topics = order.all.map((t) => {
    const per = candidates.map((c) => onTopic(c, t.topic).length);
    return { topic: t.topic, label: label[t.topic], short: SHORT[t.topic] ?? t.label, reason: t.reason, n: per.reduce((a, b) => a + b, 0), who: per.filter(Boolean).length };
  });
  return {
    ballot: { id: ballotId, area: ballot.area_name, council, place: (place ?? ballot.area_name).replace(/\s+ward$/i, ""), date: ballot.poll_date, dateText: new Date(ballot.poll_date + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }), days, level: ballot.level, seats: ballot.winner_count, system: ballot.voting_system, lat: ballot.area_lat, lng: ballot.area_lng, gss: ballot.area_gss },
    household, complete, qs,
    candidates: candidates.map((c, i) => ({ id: c.id, n: i + 1, name: c.name, party: c.party_name_on_ballot, colour: c.parties?.colour_hex ?? null, positions: claimsFor(c, claims).length })),
    topics,
    stats: { claims: claims.length, sources: new Set(claims.map((c) => c.sources?.id).filter(Boolean)).size, covered: candidates.filter((c) => claimsFor(c, claims).length > 0).length },
  };
}
