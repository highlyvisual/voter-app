import Link from "next/link";
import { notFound } from "next/navigation";
import { publicClient } from "@/lib/data";
import { councilBySlug, TOPIC_ORDER, type CouncilFact } from "@/lib/councils";
import CiteThis from "@/components/CiteThis";

// Romily, round six (24 Sept): "Lets focus on Councils as the major data set - What's happening where you live",
// five lines (housing, transport, council tax, environment, education) with sources, then introduce the councillors
// with a link to their register of interests. No attendance, no allowances (her q8, q9). Everything here is a
// quotation from the council's own publication or an official statistic; the page never says whether any of it is good.
export const dynamic = "force-dynamic";

const TOPIC_LABEL: Record<string, string> = { housing: "Housing", transport: "Transport", council_tax: "Council tax", environment: "Environment", education: "Education" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = councilBySlug((await params).slug);
  return c ? { title: `${c.name}: what's happening where you live`, description: `What ${c.name} council has published on housing, transport, council tax, the environment and schools, with sources.` } : {};
}

export default async function CouncilPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = councilBySlug((await params).slug);
  if (!c) notFound();
  const db = publicClient();
  const stripped = c.name.replace(/\s+(Borough|District|City|County|Council)(?=\s|$)/g, "").trim();
  const [{ data: cllrs }, { data: control }, { data: ctax }, { data: ballots }] = await Promise.all([
    db.from("councillors").select("name, party_name, ward, next_election").ilike("council", `${stripped}%`).order("ward").order("name"),
    db.from("council_control").select("*").ilike("authority", `${stripped}%`).eq("year", 2026).limit(1).maybeSingle(),
    db.from("council_tax_2026").select("*").ilike("authority", `${stripped}%`).limit(1).maybeSingle(),
    db.from("ballots").select("ballot_paper_id, area_name, poll_date").ilike("area_name", `${stripped}%`).eq("archived", false).order("poll_date"),
  ]);
  const councillors = (cllrs ?? []) as { name: string; party_name: string | null; ward: string; next_election: string | null }[];
  const nextElection = councillors.map((x) => x.next_election).filter(Boolean).sort()[0] ?? null;
  const byParty = new Map<string, number>();
  for (const x of councillors) byParty.set(x.party_name ?? "Not recorded", (byParty.get(x.party_name ?? "Not recorded") ?? 0) + 1);
  const parties = [...byParty.entries()].sort((a, b) => b[1] - a[1]);
  const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const gbp = (n: number) => "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const factsFor = (t: string): CouncilFact[] => c.facts.filter((f) => f.topic === t);
  const links: [string, string | null][] = [["Council plan", c.links.plan], ["Budget", c.links.budget], ["Meeting papers", c.links.meetings], ["Councillors", c.links.councillors], ["Register of interests", c.links.interests], ["Consultations", c.links.consultations]];

  return (
    <>
      <p className="eyebrow">Your council</p>
      <h1>{c.name}: what&rsquo;s happening where you live</h1>
      <p className="lede">What the council itself has published on the five things it most shapes for a household: homes, getting about, the bill, the local environment and schools. Each line is quoted from the council&rsquo;s own document, with the link. This page says what was decided or proposed; it never says whether it was right.</p>
      <p className="meta">Read on {fmt(c.checked)}. Councils publish at different rates and in different places, so &ldquo;nothing found&rdquo; means nothing found, not nothing happening.</p>

      <p className="council-links">{links.filter(([, u]) => u).map(([l, u], i) => <span key={l}>{i ? " · " : ""}<a href={u!} rel="noopener">{l}</a></span>)}</p>

      {TOPIC_ORDER.map((t) => {
        const fs = factsFor(t);
        const found = fs.filter((f) => f.quote);
        const empty = fs.find((f) => !f.quote);
        return (
          <section key={t} className="council-topic">
            <h2>{TOPIC_LABEL[t]}</h2>
            {t === "council_tax" && ctax ? (
              <p className="small">Band D set by {ctax.authority} for 2026&ndash;27: <b>{gbp(Number(ctax.own_band_d))}</b>{ctax.area_band_d ? <> of a {gbp(Number(ctax.area_band_d))} total bill in the area</> : null}. <span className="meta">MHCLG, Council Tax levels set by local authorities in England 2026 to 2027 (Open Government Licence).</span></p>
            ) : null}
            {found.length ? found.map((f, i) => (
              <div key={i} className="council-fact">
                <p>{f.summary}</p>
                <blockquote className="council-quote">&ldquo;{f.quote}&rdquo;</blockquote>
                <p className="meta"><a href={f.url ?? "#"} rel="noopener">{f.publisher}</a>{f.published_on ? `, ${fmt(f.published_on)}` : ", undated"}. Read {fmt(c.checked)}.{f.note ? ` ${f.note}` : ""}</p>
              </div>
            )) : (
              <p className="empty">{empty?.summary || `Nothing on ${TOPIC_LABEL[t].toLowerCase()} was found on the council's website.`}{empty?.url ? <> <a href={empty.url} rel="noopener" className="meta">Where we looked</a></> : null}</p>
            )}
          </section>
        );
      })}

      <section className="council-topic">
        <h2>Who runs the council</h2>
        {control ? (
          <p className="small">{control.total} seats in 2026. Run by: <b>{describeControl(control.majority)}</b>. <span className="meta">Open Council Data (public domain).</span></p>
        ) : null}
        {parties.length ? <p className="small">Councillors by party: {parties.map(([p, n]) => `${p} ${n}`).join(", ")}.</p> : null}
        {nextElection ? <p className="small">Next scheduled council election: <b>{fmt(nextElection)}</b>.</p> : null}
        {ballots?.length ? <p className="small">Elections here now: {ballots.map((b, i) => <span key={b.ballot_paper_id}>{i ? "; " : ""}<Link href={`/ballot/${encodeURIComponent(b.ballot_paper_id)}`}>{b.area_name.split(":")[1]?.trim() ?? b.area_name}</Link> ({fmt(b.poll_date)})</span>)}.</p> : null}
        {councillors.length ? (
          <details className="more">
            <summary className="meta">All {councillors.length} councillors, by ward</summary>
            <ul className="small" style={{ columns: "2 16rem", paddingLeft: "1.1rem" }}>
              {councillors.map((x) => <li key={`${x.ward}-${x.name}`}>{x.name}{x.party_name ? ` (${x.party_name})` : ""} &mdash; {x.ward}</li>)}
            </ul>
          </details>
        ) : null}
        <p className="meta">
          {c.links.interests ? <>Each councillor&rsquo;s <a href={c.links.interests} rel="noopener">register of interests</a> is on the council&rsquo;s own site, linked rather than summarised, because summarising means choosing. </> : <>The council&rsquo;s register of interests could not be located; the <a href={c.links.councillors ?? c.site} rel="noopener">councillors page</a> is the place to look. </>}
          Councillors from Open Council Data as recorded after the May 2026 elections; a by-election since then may have changed one seat. Attendance and allowances are not shown.
        </p>
        <p className="meta">Council motions, labelled by the group that proposed them and with the result, are not yet collected for this council; the <a href={c.links.meetings ?? c.site} rel="noopener">meeting papers</a> hold them.</p>
      </section>

      <CiteThis title={`${c.name}: what's happening where you live`} />
      <p className="meta">Every council page has the same five headings in the same order. Sources are the council&rsquo;s own publications and official statistics. Corrections: hello@whatsittome.org.</p>
    </>
  );
}

function describeControl(m: string | null): string {
  if (!m) return "not recorded";
  if (/^\s*NOC\s*$/i.test(m)) return "no overall control: no single party or group has a majority";
  const names: Record<string, string> = { CON: "Conservatives", LAB: "Labour", LD: "Liberal Democrats", GRN: "Greens", REF: "Reform UK", PC: "Plaid Cymru", SNP: "SNP", IND: "independents", UKIP: "UKIP", NOC: "no overall control" };
  const parts = m.replace(/\s*min$/i, "").split("/").map((x) => names[x.trim().toUpperCase()] ?? x.trim());
  const minority = /min$/i.test(m.trim());
  if (parts.length === 1) return minority ? `${parts[0]}, as a minority administration` : `${parts[0]}, with a majority`;
  return `a coalition or arrangement of ${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}
