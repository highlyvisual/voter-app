import Link from "next/link";
import { TOPIC_SHORT, type Candidate, type Claim } from "@/lib/data";
import { claimApplies, type Household } from "@/lib/household";
import { claimsFor } from "@/components/CandidateCard";
import { partyFill, partyVars } from "@/lib/partyColour";
import { whenText } from "@/components/ClaimLayers";

// Row 5 of Romily's design choices (29 Sept): the ballot as name cards (design C). Every candidate the same card, in
// ballot-paper order: number, party, name, a line of their own words, the topics they have published on (or, with a
// profile, the topics where something applies to this household), and one link to what it means for you.
// Topics are named, never counted (round eight q9). No photos in lists (round five q8).
function firstSentence(text: string | null | undefined): string | null {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  const m = t.match(/^(.{20,160}?[.!?])(\s|$)/);
  const s = m ? m[1] : t.slice(0, 140);
  return s.length < t.length && !m ? `${s.replace(/\s+\S*$/, "")}…` : s;
}

export default function NameCards({ ballotId, candidates, claims, household, complete, qs }: { ballotId: string; candidates: Candidate[]; claims: Claim[]; household: Household; complete: boolean; qs: string }) {
  return (
    <section className="name-cards" id="ballot-paper" aria-labelledby="names-h">
      <h2 id="names-h">The {candidates.length === 1 ? "candidate" : `${candidates.length} on your paper`} <span className="names-sub">in the order you&rsquo;ll see them</span></h2>
      <ol>
        {candidates.map((c, i) => {
          const colour = c.parties?.colour_hex ?? null;
          const party = c.party_description_on_ballot && c.party_description_on_ballot !== "[blank]" ? c.party_description_on_ballot : c.party_name_on_ballot;
          const mine = claimsFor(c, claims);
          // "Applies to you on" names only topics where a statement's own condition matches this household (a renter, a
          // family with children...); statements for everyone are counted as published, not as applying to you.
          const specific = complete ? mine.filter((cl) => whenText(cl.applies_if) && claimApplies(cl.applies_if, household)) : [];
          const byYou = specific.length > 0;
          const low = (t: string) => { const l = TOPIC_SHORT[t] ?? t; return l.charAt(0).toLowerCase() + l.slice(1); };
          const topics = [...new Set((byYou ? specific : mine).map((cl) => cl.topic))].map(low);
          const words = firstSentence(c.statement_to_voters);
          const href = `/ballot/${encodeURIComponent(ballotId)}/candidate/${c.id}${qs ? `?${qs}` : ""}`;
          return (
            <li key={c.id} className={`name-card${colour ? " party-scope" : ""}`} style={partyVars(colour)}>
              <p className="nc-top"><span className="nc-n">No. {i + 1}</span>{party ? <span className={`party-pill${colour ? " filled" : ""}`} style={partyFill(colour)}>{party}</span> : null}</p>
              <h3 className="nc-name"><Link href={href} className="card-link">{c.name}</Link></h3>
              {words ? <p className="nc-words">&ldquo;{words}&rdquo;</p> : <p className="nc-words none">No statement supplied{mine.length ? "; the published positions are shown on their page" : ""}.</p>}
              <p className="nc-foot">
                <span className="nc-topics">{topics.length ? `${byYou ? "Applies to you on" : "Published on"}: ${topics.slice(0, 3).join(", ")}${topics.length > 3 ? " and more" : ""}` : "Nothing published that we could source yet"}</span>
                <span className="nc-go" aria-hidden>What&rsquo;s it to me? &rarr;</span>
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
