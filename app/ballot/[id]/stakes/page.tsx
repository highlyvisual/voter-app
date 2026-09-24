import { topicsForHousehold } from "@/lib/topicOrder";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Journey, { JourneyNext } from "@/components/Journey";
import ProfileApply from "@/components/ProfileApply";
import { claimsFor } from "@/components/CandidateCard";
import { TOPICS, getBallot, listCandidates, listVerifiedClaims } from "@/lib/data";
import { claimApplies, householdComplete, householdFromParams } from "@/lib/household";
export const dynamic = "force-dynamic";

// "What could this election change for you?" (Romily §8). Relevance, not importance: every card is a count of
// published positions that touch something the user chose to tell us. Nothing here ranks topics or candidates;
// the order is fixed and the same for everyone.
export default async function Stakes({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params; const sp = await searchParams; const ballotId = decodeURIComponent(id);
  const ballot = await getBallot(ballotId); if (!ballot) notFound();
  const [candidates, claims] = await Promise.all([listCandidates(ballotId), listVerifiedClaims(ballotId)]);
  const h = householdFromParams(sp); const complete = householdComplete(h);
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]).toString();
  const topicCard = (k: string) => {
    const relevant = claims.filter((c) => c.topic === k && claimApplies(c.applies_if, h));
    const who = candidates.filter((c) => claimsFor(c, relevant).length > 0);
    return { n: relevant.length, who: who.length };
  };
  const tenureText: Record<string, string> = { private_rent: "You rent privately.", social_rent: "You rent from a council or housing association.", own_mortgage: "You own with a mortgage.", own_outright: "You own outright." };
  const cards: { key: string; title: string; lead: string; topic: string }[] = [
    { key: "money", title: "Your money", lead: complete ? "Tax, benefits and bills for a household like yours." : "Tax, benefits and bills.", topic: "money_and_cost_of_living" },
    { key: "home", title: "Your home", lead: h.tenure && tenureText[h.tenure] ? `${tenureText[h.tenure]} See what has been published on rents, ownership and housing supply.` : "Rents, ownership, building and planning.", topic: "housing_and_property" },
    { key: "health", title: "Your health and care", lead: h.disability === "yes" || h.carer === "yes" ? "Including positions on disability, care and carers, which you told us apply." : "The NHS, GPs and social care.", topic: "healthcare_and_social_care" },
    { key: "education", title: "Education", lead: h.student && h.student !== "no" ? "You're studying: fees, loans and support." : h.children && h.children !== "none" ? "You have children: schools and childcare." : "Schools, colleges and universities.", topic: "education_and_universities" },
    { key: "climate", title: "Climate, energy and the local environment", lead: "Energy bills, green spaces, air, transport.", topic: "environment_climate_and_energy" },
    { key: "crime", title: "Crime and safety", lead: "Policing, courts, safer streets.", topic: "crime_policing_and_justice" },
    { key: "immigration", title: "Immigration", lead: h.visa === "yes" ? "Including visa and asylum policy, which you told us applies." : "Borders, visas and asylum.", topic: "immigration_and_borders" },
    { key: "world", title: "Defence, the world and the EU", lead: "Armed forces, Ukraine, Europe, trade.", topic: "defence_foreign_affairs_and_eu" },
    { key: "rights", title: "Equality and rights", lead: "Discrimination law, disability rights, sex and gender.", topic: "equality_and_rights" },
  ];
  const label = Object.fromEntries(TOPICS);
  const order = topicsForHousehold(h);
  const reason = Object.fromEntries(order.relevant.map((r) => [r.topic, r.reason])) as Record<string, string>;
  const rank = Object.fromEntries(order.all.map((r, i) => [r.topic, i])) as Record<string, number>;
  cards.sort((a, b) => rank[a.topic] - rank[b.topic]);
  return (
    <>
      <Suspense fallback={null}><ProfileApply /></Suspense>
      <Journey ballotId={ballotId} current="stakes" qs={qs} />
      <p className="eyebrow">{ballot.area_name}</p>
      <h1>What could this election change for you?</h1>
      <p className="lede">{complete ? "Each card counts the published positions that touch something you told us about your household." : "Each card counts the published positions on that subject. Add your profile to narrow them to what applies to you."} We show where policy meets your life; we don't decide which of these matters most. That's yours.</p>
      {!complete ? <p><Link href="/start" className="button">Build my profile</Link> <span className="meta">A few questions, each skippable. Nothing sent to us.</span></p> : null}
      <div className="stakes">
        {cards.map((c) => {
          const s = topicCard(c.topic);
          return (
            <Link key={c.key} href={`/ballot/${encodeURIComponent(ballotId)}/topic/${c.topic}${qs ? `?${qs}` : ""}`} className={`stake${s.n ? "" : " empty"}`}>
              <span className="stake-title">{c.title}</span>
              {reason[c.topic] ? <span className="meta stake-why">First {reason[c.topic]}</span> : null}
              <span className="stake-n">{s.n}</span>
              <span className="stake-unit">published {s.n === 1 ? "position" : "positions"}{s.n ? ` from ${s.who} of ${candidates.length} candidates` : ""}</span>
              <span className="stake-lead">{c.lead}</span>
              <span className="stake-go">{s.n ? `Compare them →` : `Nothing published yet →`}</span>
            </Link>
          );
        })}
      </div>
      <p className="meta">{order.relevant.length ? "Cards that touch something you told us about your household come first, with the reason; the rest follow in a fixed order. Nothing political changes the order." : "The order of these cards is fixed until you add your household; then the ones that touch it come first, with the reason."} {label[""] ?? ""}A count measures how much has been published, not how good or how important anything is.</p>
      <JourneyNext ballotId={ballotId} current="stakes" qs={qs} />
    </>
  );
}
