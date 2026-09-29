import Link from "next/link";
import { notFound } from "next/navigation";
import ExplainThis from "@/components/ExplainThis";
import PartyFunding from "@/components/PartyFunding";
import { PartyMoney, PartyRegisterEntry } from "@/components/PartyRegister";
import { partyEntry } from "@/lib/partyRegister";
import { TOPICS, publicClient, type Claim } from "@/lib/data";
import { layerOf } from "@/lib/claims";
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
      <p className="lede">{unique.length} published positions, by topic, each with the date it was published and the date we fetched it. {party.official_site_url ? <>Their own site: <a href={party.official_site_url} rel="noopener">{party.official_site_url.replace(/^https?:\/\//, "")}</a>.</> : null}</p>
      {TOPICS.map(([k, label]) => {
        const mine = unique.filter((c) => c.topic === k);
        if (!mine.length) return null;
        return (
          <section key={k}>
            <h2>{label}</h2>
            {mine.map((c) => (
              <article key={c.id} className="claim">
                <p className="meta" style={{ margin: "0 0 0.25rem" }}><span className="chip layer-chip">{layerOf(c)}</span>{c.sources ? <> · {c.sources.publisher}{c.sources.published_on ? `, published ${c.sources.published_on}` : ""} · last checked {c.sources.retrieved_at.slice(0, 10)}</> : null}</p>
                <blockquote className="quote">{c.source_quote}</blockquote>
                <p className="summary">{c.claim_text}</p>
                <ExplainThis text={`${c.source_quote} ${c.claim_text}`} />
                {c.sources ? <p className="meta"><a href={c.sources.url} rel="noopener">{c.sources.title}</a>{(c as { supersedes?: number | null }).supersedes ? <> · <Link href={`/ledger#claim-${c.id}`}>Previous version and why it changed →</Link></> : null}</p> : null}
              </article>
            ))}
          </section>
        );
      })}
      <PartyRegisterEntry p={entry} />
      <PartyFunding ecId={ecId} partyName={party.name} />
      <PartyMoney p={entry} partyName={party.name} />
      <p className="meta">Positions change. Where a party has superseded something, the ledger keeps both and shows the reason: <Link href="/ledger">the public ledger</Link>.</p>
    </div>
  );
}
