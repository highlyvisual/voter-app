import { candidatePageTitle } from "@/lib/meta";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ClaimLayers, { whenText } from "@/components/ClaimLayers";
import ScaleTabs from "@/components/ScaleTabs";
import { topicsForHousehold } from "@/lib/topicOrder";
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
// The topics decided mainly beyond the UK's own borders, read under "The world" (as on Your politics).
const WORLD = new Set(["defence_foreign_affairs_and_eu", "environment_climate_and_energy"]);
// Topics with a layer on the area map (design E16): the map and the words point at each other.
const MAP_LAYER: Record<string, string> = { housing_and_property: "land for new homes", crime_policing_and_justice: "recorded crime", education_and_universities: "schools", environment_climate_and_energy: "flood risk" };

function Layered({ c, applies = false }: { c: Claim; applies?: boolean }) {
  return (
    <article className="claim">
      <ClaimLayers c={c} applies={applies} chip={<span className="chip layer-chip">{badge(c)}</span>} />
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
  const isLocal = ballot.level === "local";
  const order = topicsForHousehold(h).all;
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

      {/* Rows 6 and 8 (Romily, 29 Sept): what's at stake by scale (design E), "Applies to you" (design A), and the map
          one tap away for the topics it has a layer for. Same cards, same order, for every candidate. */}
      <h2>What&rsquo;s it to {complete ? "your household" : "you"}?</h2>
      <p className="meta">{complete ? "Showing what applies to a household like yours." : <>Showing everything they have published. <Link href="/start">Add your profile</Link> to see only what applies to you.</>} Open a topic for what they say, what it could mean for you, and where they said it.</p>
      <ScaleTabs initial={isLocal ? "council" : "uk"} tabs={isLocal ? [
        { key: "council", label: "Your council" },
        { key: "region", label: "Your region", note: "A councillor doesn't decide regional matters; in England a mayor and combined authority, where there is one, and in Scotland, Wales and Northern Ireland their own parliament or assembly, do.", href: "/learn/who-decides", hrefText: "Who decides what" },
        { key: "uk", label: "The UK", note: "A councillor doesn't vote on national law, tax or benefits. What each party has published nationally is on Your politics.", href: "/you#you-stake", hrefText: "What's at stake nationally" },
        { key: "world", label: "The world", note: "A councillor doesn't decide defence, foreign affairs or trade.", href: "/you#you-stake", hrefText: "Each party's own words on the world" },
      ] : [
        { key: "council", label: "Your council", note: `An MP doesn't run the council: bins, planning, local roads, parking, libraries and council tax are decided by councillors.`, href: "/learn/who-decides", hrefText: "Who decides what" },
        { key: "region", label: "Your region", note: "An MP votes on laws for the whole UK (or for England where a matter is devolved elsewhere); regional decisions sit with mayors, combined authorities and the devolved parliaments.", href: "/learn/who-decides", hrefText: "Who decides what" },
        { key: "uk", label: "The UK" },
        { key: "world", label: "The world" },
      ]}>
        <div className={`topic-cards${colour ? " party-scope" : ""}`} style={partyVars(colour)}>
          {order.map(({ topic: k, label: t }) => {
            const list = applying.filter((cl) => cl.topic === k);
            const scale = isLocal ? "council" : WORLD.has(k) ? "world" : "uk";
            const map = MAP_LAYER[k];
            return (
              <details key={k} className={`topic-card${list.length ? "" : " empty"}`} data-scale={scale}>
                <summary><span className="tc-title">{TOPIC_SHORT[k] ?? t}</span>{list.length ? (complete && list.some((cl) => whenText(cl.applies_if))) ? <span className="tc-tag applies">Applies to you</span> : <span className="tc-unit">Published</span> : <span className="tc-unit">Nothing found</span>}</summary>
                <div className="tc-body">
                  {list.length ? list.map((cl) => <Layered key={cl.id} c={cl} applies={complete && Boolean(whenText(cl.applies_if)) && claimApplies(cl.applies_if, h)} />) : <p className="small">Nothing published that we could source on {topicLabel[k].toLowerCase()}. That means nothing found, not nothing to say.</p>}
                  {map ? <p className="on-map"><Link href={`/ballot/${encodeURIComponent(ballotId)}/area${qs ? `?${qs}` : ""}#map`}><svg viewBox="0 0 24 24" aria-hidden><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15" /></svg>On the map: {map} near you</Link></p> : null}
                </div>
              </details>
            );
          })}
        </div>
      </ScaleTabs>
      <p className="small"><Link href={`/ballot/${encodeURIComponent(ballotId)}/area${qs ? `?${qs}` : ""}`}>What is happening in {ballot.area_name}: local issues on the map →</Link></p>

      {/* Leaflets beside the candidate (review, 25 Sept). Same section for every candidate, including when there are none. */}
      <h3 className="section-lead" style={{ fontSize: "1.3rem" }}>Leaflets</h3>
      {leaflets.length ? (
        <div className="leaflets">{leaflets.map((l) => <a key={l.id} href={l.url} rel="noopener" className="leaflet"><img src={img(l.thumb_url)} alt={`Leaflet archived ${l.date_uploaded ?? ""}`} loading="lazy" width={110} height={147} /><span className="meta">{l.date_uploaded ? longDate(l.date_uploaded) : "Undated"}</span></a>)}</div>
      ) : <p className="small">No leaflets from this candidate have been archived yet.</p>}
      <p className="meta">From electionleaflets.org (Democracy Club), where anyone can photograph a leaflet they were sent. Leaflets are the candidate&rsquo;s or party&rsquo;s own material, shown as delivered; we check they are real, not that they are true. Older leaflets may be from earlier contests.</p>

      <p><ReadAloud selector="main" label="Read this page aloud" /></p>
      <CiteThis title={`${c.name}: candidate in ${ballot.area_name}, polling day ${longDate(ballot.poll_date)}`} />
      {/* Row 9 (design C20): the next candidate on the paper, always at the foot of the screen, and the way back. */}
      <nav className="cand-foot" aria-label="Other candidates, in ballot-paper order">
        <Link href={`/ballot/${encodeURIComponent(ballotId)}${qs ? `?${qs}` : ""}#ballot-paper`} className="cf-back" aria-label="Back to the ballot paper"><span aria-hidden>&larr;</span>&nbsp;<span className="cf-long">{"Back to the "}</span>paper</Link>
        {prev ? <Link href={nav(prev)} className="cf-prev">&larr; No. {idx}<span className="cf-wide">, {prev.name}</span></Link> : null}
        {next ? <Link href={nav(next)} className="button cf-next">Next: <span className="cf-long">{`No. ${idx + 2}, `}</span>{next.name} <span aria-hidden>&rarr;</span></Link>
          : <Link href={`/ballot/${encodeURIComponent(ballotId)}/compare${qs ? `?${qs}` : ""}`} className="button cf-next">Compare everyone side by side <span aria-hidden>&rarr;</span></Link>}
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
