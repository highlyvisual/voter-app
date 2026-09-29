import { candidatePageTitle } from "@/lib/meta";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ClaimLayers from "@/components/ClaimLayers";
import ProfileApply from "@/components/ProfileApply";
import ReadAloud from "@/components/ReadAloud";
import CiteThis from "@/components/CiteThis";
import { claimsFor } from "@/components/CandidateCard";
import { TOPICS, TOPIC_SHORT, getBallot, listCandidates, listVerifiedClaims, listPreviousCandidacies, listLeaflets, ballotLabel, type Claim } from "@/lib/data";
import { claimApplies, householdComplete, householdFromParams } from "@/lib/household";
import { layerKey, layerOf } from "@/lib/claims";
import { img } from "@/lib/site";
import { longDate } from "@/lib/dates";
import JsonLd from "@/components/JsonLd";
import { breadcrumbs, candidatePerson, graph, webPage } from "@/lib/schema";
import { partyFill, partyVars } from "@/lib/partyColour";
export const dynamic = "force-dynamic";

// A candidate's own page (Romily §10): short factual introduction, then large topic cards. Each card opens into
// three layers — what they say, what it could mean for you, and the exact words with the source one tap away
// (Romily, round eight) — so a person can stop at ten seconds, one minute or five. Every candidate's page has exactly the same structure, whatever they have published.
const BIG: [string, string][] = ["money_and_cost_of_living", "housing_and_property", "healthcare_and_social_care", "education_and_universities", "environment_climate_and_energy"].map((k) => [k, TOPIC_SHORT[k]]);

function Layered({ c }: { c: Claim }) {
  return (
    <article className="claim">
      <ClaimLayers c={c} chip={<span className="chip layer-chip">{badge(c)}</span>} />
    </article>
  );
}
function badge(c: Claim): string {
  const k = layerKey(c);
  if (k === "enacted_record") return "Public record";
  if (k === "candidate_statement") return "Candidate's own words";
  if (k === "third_party_analysis") return "Third-party report";
  if (k === "campaign_leaflet") return "Campaign leaflet";
  return layerOf(c);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; cid: string }> }) { const p = await params; return candidatePageTitle(p.id, p.cid); }

export default async function CandidatePage({ params, searchParams }: { params: Promise<{ id: string; cid: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id, cid } = await params; const sp = await searchParams; const ballotId = decodeURIComponent(id);
  const ballot = await getBallot(ballotId); if (!ballot) notFound();
  const [candidates, claims, stood, allLeaflets] = await Promise.all([listCandidates(ballotId), listVerifiedClaims(ballotId), listPreviousCandidacies(ballotId), listLeaflets(ballotId).catch(() => [])]);
  const idx = candidates.findIndex((c) => c.id === Number(cid)); if (idx < 0) notFound();
  const c = candidates[idx];
  const h = householdFromParams(sp); const complete = householdComplete(h);
  const mine = claimsFor(c, claims);
  const applying = complete ? mine.filter((cl) => claimApplies(cl.applies_if, h)) : mine;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]).toString();
  const colour = c.parties?.colour_hex ?? null;
  const party = c.party_description_on_ballot && c.party_description_on_ballot !== "[blank]" ? c.party_description_on_ballot : c.party_name_on_ballot;
  const mineStood = stood.filter((s) => s.candidate_id === c.id);
  const leaflets = allLeaflets.filter((l) => l.candidate_id === c.id).sort((a, b) => (b.date_uploaded ?? "").localeCompare(a.date_uploaded ?? ""));
  const prev = candidates[idx - 1], next = candidates[idx + 1];
  const nav = (x: typeof c) => `/ballot/${encodeURIComponent(ballotId)}/candidate/${x.id}${qs ? `?${qs}` : ""}`;
  const statement = c.statement_to_voters ?? "";
  const topicLabel = Object.fromEntries(TOPICS);
  return (
    <>
      {/* The same structured data for every candidate (lib/schema.ts): who they are, what they are standing for, their place on the ballot paper. */}
      <JsonLd data={graph(
        webPage(`/ballot/${encodeURIComponent(ballotId)}/candidate/${c.id}`, `${c.name}, candidate in ${ballot.area_name}`, undefined, { "@type": "ProfilePage", mainEntity: { "@id": `https://whatsittome.org/ballot/${encodeURIComponent(ballotId)}/candidate/${c.id}#person` } }),
        candidatePerson(ballot, c, idx + 1, candidates.length),
        breadcrumbs([[ballot.area_name, `/ballot/${encodeURIComponent(ballotId)}`], [c.name, `/ballot/${encodeURIComponent(ballotId)}/candidate/${c.id}`]]),
      )} />
      <Suspense fallback={null}><ProfileApply /></Suspense>
      <p className="eyebrow"><Link href={`/ballot/${encodeURIComponent(ballotId)}${qs ? `?${qs}` : ""}#ballot-paper`}>{ballot.area_name}</Link> · number {idx + 1} of {candidates.length} on the ballot paper</p>
      <div className={`cand-hero${colour ? " party-band" : ""}`} id="cand" style={partyVars(colour)}>
        {c.photo_url ? <img src={img(c.photo_url)} alt="" width={120} height={120} className="cand-photo" data-initials={c.name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).map((w) => w[0]).slice(0, 2).join("")} style={{ borderColor: colour ?? "var(--ink)" }} /> : <span className="cand-photo initials" style={{ borderColor: colour ?? "var(--ink)" }}>{c.name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).map((w) => w[0]).slice(0, 2).join("")}</span>}
        <div>
          <h1 style={{ margin: "0 0 0.3rem" }}>{c.name}</h1>
          <p className="party"><span className={`party-pill${colour ? " filled" : ""}`} style={partyFill(colour)}>{party}</span>{party !== c.party_name_on_ballot && c.party_name_on_ballot ? <span className="meta registered">Ballot-paper description. Registered party: {c.party_name_on_ballot}.</span> : null}</p>
          <p className="small" style={{ margin: "0.4rem 0 0" }}>Standing for {ballot.level === "parliamentary" ? "Parliament" : "the council"} in {ballot.area_name}, polling day {new Date(ballot.poll_date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}. {mineStood.length ? `Has stood ${mineStood.length} time${mineStood.length === 1 ? "" : "s"} before, on Democracy Club’s records.` : "No previous candidacies on Democracy Club’s records."}</p>
          {c.photo_url ? <p className="meta" style={{ margin: "0.3rem 0 0" }}>Photo: <a href={c.dc_person_url ? c.dc_person_url.replace("/api/next/people/", "/person/") : "https://candidates.democracyclub.org.uk/"} rel="noopener">Democracy Club</a>{PHOTO_LICENCE[(c as { photo_copyright?: string | null }).photo_copyright ?? ""] ? `, ${PHOTO_LICENCE[(c as { photo_copyright?: string | null }).photo_copyright ?? ""]}` : ""}.</p> : null}
        </div>
      </div>

      {statement ? (
        <details className="statement-intro">
          <summary><span className="layer-label" style={{ display: "block" }}>In their own words</span>{statement.slice(0, 220)}{statement.length > 220 ? "…" : ""}</summary>
          <div className="statement">{statement.split(/\n+/).map((para, i) => <p key={i}>{para}</p>)}</div>
          <p className="meta">Statement supplied by the candidate to Democracy Club, reproduced unedited.</p>
        </details>
      ) : <p className="meta">No statement to voters supplied.</p>}

      <h2>What could their policies mean for {complete ? "your profile" : "you"}?</h2>
      <p className="meta">{complete ? "Counting what applies to a household like yours." : <>Showing everything they have published. <Link href="/start">Add your profile</Link> to see only what applies to you.</>} Tap a card to open it: what they say, what it could mean for you, and the exact words with their source.</p>
      <div className={`topic-cards${colour ? " party-scope" : ""}`} style={partyVars(colour)}>
        {BIG.map(([k, t]) => {
          const list = applying.filter((cl) => cl.topic === k);
          return (
            <details key={k} className={`topic-card${list.length ? "" : " empty"}`}>
              <summary><span className="tc-title">{t}</span><span className="tc-unit">{list.length ? "Published" : "Nothing found"}</span></summary>
              <div className="tc-body">{list.length ? list.map((cl) => <Layered key={cl.id} c={cl} />) : <p className="small">Nothing published that we could source on {topicLabel[k].toLowerCase()}. That means nothing found, not nothing to say.</p>}</div>
            </details>
          );
        })}
      </div>
      <p className="small"><Link href={`/ballot/${encodeURIComponent(ballotId)}/area${qs ? `?${qs}` : ""}`}>What is happening in {ballot.area_name}: local issues on the map →</Link></p>
      <h3 className="section-lead" style={{ fontSize: "1.3rem" }}>Other topics</h3>
      <div className={`topic-cards small-cards${colour ? " party-scope" : ""}`} style={partyVars(colour)}>
        {TOPICS.filter(([k]) => !BIG.some(([b]) => b === k)).map(([k, t]) => {
          const list = applying.filter((cl) => cl.topic === k);
          return (
            <details key={k} className={`topic-card${list.length ? "" : " empty"}`}>
              <summary><span className="tc-title">{t}</span><span className="tc-unit">{list.length ? "Published" : "Nothing found"}</span></summary>
              <div className="tc-body">{list.length ? list.map((cl) => <Layered key={cl.id} c={cl} />) : <p className="small">Nothing published that we could source.</p>}</div>
            </details>
          );
        })}
      </div>

      {/* Leaflets beside the candidate (review, 25 Sept). Same section for every candidate, including when there are none. */}
      <h3 className="section-lead" style={{ fontSize: "1.3rem" }}>Leaflets</h3>
      {leaflets.length ? (
        <div className="leaflets">{leaflets.map((l) => <a key={l.id} href={l.url} rel="noopener" className="leaflet"><img src={img(l.thumb_url)} alt={`Leaflet archived ${l.date_uploaded ?? ""}`} loading="lazy" width={110} height={147} /><span className="meta">{l.date_uploaded ? longDate(l.date_uploaded) : "Undated"}</span></a>)}</div>
      ) : <p className="small">No leaflets from this candidate have been archived yet.</p>}
      <p className="meta">From electionleaflets.org (Democracy Club), where anyone can photograph a leaflet they were sent. Leaflets are the candidate&rsquo;s or party&rsquo;s own material, shown as delivered; we check they are real, not that they are true. Older leaflets may be from earlier contests.</p>

      <p><ReadAloud selector="main" label="Read this page aloud" /></p>
      <CiteThis title={`${c.name}: candidate in ${ballot.area_name}, polling day ${longDate(ballot.poll_date)}`} />
      <nav className="cand-nav" aria-label="Other candidates, in ballot-paper order">
        {prev ? <Link href={nav(prev)} className="button secondary-link">← {idx}. {prev.name}</Link> : <span />}
        <Link href={`/ballot/${encodeURIComponent(ballotId)}/compare${qs ? `?${qs}` : ""}`} className="quiet-link">Compare side by side</Link>
        {next ? <Link href={nav(next)} className="button secondary-link">{idx + 2}. {next.name} →</Link> : <span />}
      </nav>
      <p className="meta">Every candidate's page has the same structure and the same cards, in the same order. Previous candidacies on Democracy Club’s records{mineStood.length ? ` (${mineStood.length})` : ""}: {mineStood.map((s) => ballotLabel(s.ballot_paper_id)).join("; ") || "none"}.</p>
    </>
  );
}

// Democracy Club records how each photo may be used; shown as a short credit under the photo.
const PHOTO_LICENCE: Record<string, string> = {
  "profile-photo": "the candidate's own profile photo",
  "public-domain": "public domain",
  "copyright-assigned": "copyright assigned to Democracy Club",
};
