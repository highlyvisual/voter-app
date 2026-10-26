import Link from "next/link";
import { notFound } from "next/navigation";
import ClaimLayers from "@/components/ClaimLayers";
import HowThisPage from "@/components/HowThisPage";
import { SourceTagKey } from "@/components/SourceTag";
import ViewMode from "@/components/ViewMode";
import PartyFunding from "@/components/PartyFunding";
import { PartyMoney, PartyRegisterEntry } from "@/components/PartyRegister";
import { partyEntry } from "@/lib/partyRegister";
import { TOPICS, publicClient, type Claim } from "@/lib/data";
import { img } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import { breadcrumbs, graph, webPage } from "@/lib/schema";
import { partyVars } from "@/lib/partyColour";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ ec: string }> }) {
  const { ec } = await params;
  const { data } = await publicClient().from("parties").select("name").eq("ec_id", decodeURIComponent(ec)).maybeSingle();
  return data?.name ? { title: `${data.name}: published positions`, description: `What ${data.name} has published, by topic, quoted exactly with the date it was published and the date we checked. No rankings, no recommendations.`, alternates: { canonical: `/parties/${encodeURIComponent(decodeURIComponent(ec))}` } } : { title: "Party" };
}

export default async function Party({ params }: { params: Promise<{ ec: string }> }) {
  const { ec } = await params; const ecId = decodeURIComponent(ec);
  const db = publicClient();
  const { data: party } = await db.from("parties").select("*").eq("ec_id", ecId).maybeSingle();
  if (!party) notFound();
  const { data } = await db.from("current_claims").select("*, sources(title, url, publisher, published_on, retrieved_at, layer, archive_url)").eq("party_ec_id", ecId).eq("status", "verified").is("candidate_id", null);
  const claims = (data ?? []) as Claim[];
  const seen = new Map<string, Claim>();
  for (const c of claims) { const k = `${c.topic}|${c.source_quote}`; if (!seen.has(k)) seen.set(k, c); }
  const unique = [...seen.values()];
  const entry = partyEntry(ecId);
  // The party's own colour runs through its own page (Romily, 29 Sept).
  return (
    <div className={party.colour_hex ? "party-page party-scope" : "party-page"} style={partyVars(party.colour_hex)}>
      <JsonLd data={graph(
        webPage(`/parties/${encodeURIComponent(ecId)}`, `${party.name}: published positions`, undefined, { about: { "@type": "Organization", name: party.name, identifier: ecId, ...(party.official_site_url ? { url: party.official_site_url } : {}) } }),
        breadcrumbs([["Parties", "/parties"], [party.name, `/parties/${encodeURIComponent(ecId)}`]]),
      )} />
      <p className="eyebrow"><Link href="/parties">All parties</Link></p>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        {party.emblem_url ? <img src={img(party.emblem_url)} alt="" style={{ height: "2.2rem", width: "auto", background: "#fff" }} /> : null}
        {party.name}
      </h1>
      <p className="lede">Their published positions, by topic.</p>
      <HowThisPage>
        <p>{unique.length} published positions. Each one is quoted exactly from its source, with the date it was published and the date we fetched it; open &ldquo;Sourced&rdquo; under any position to see both.</p>
        {party.official_site_url ? <p>Their own site: <a href={party.official_site_url} rel="noopener">{party.official_site_url.replace(/^https?:\/\//, "")}</a>.</p> : null}
      </HowThisPage>
      <div className="claims-tools"><ViewMode /><SourceTagKey /></div>
      {/* Romily, round ten, q2: "a bit less busy". One topic open at a time; the rest are a tap away, in the usual order.
          Each position uses the same card as the candidate pages. */}
      {TOPICS.filter(([k]) => unique.some((c) => c.topic === k)).map(([k, label], i) => {
        const mine = unique.filter((c) => c.topic === k);
        return (
          <details key={k} className="topic-fold" open={i === 0 || undefined}>
            <summary><h2>{label}</h2></summary>
            {mine.map((c) => (
              <article key={c.id} className="claim">
                <ClaimLayers c={c} footnote={(c as { supersedes?: number | null }).supersedes ? <p className="small" style={{ margin: "0.3rem 0 0" }}><Link href={`/ledger#claim-${c.id}`}>Previous version and why it changed →</Link></p> : null} />
              </article>
            ))}
          </details>
        );
      })}
      <PartyRegisterEntry p={entry} />
      <PartyFunding ecId={ecId} partyName={party.name} />
      <PartyMoney p={entry} partyName={party.name} />
      <p className="meta">Positions change. Where a party has superseded something, the ledger keeps both and shows the reason: <Link href="/ledger">the public ledger</Link>.</p>
    </div>
  );
}
