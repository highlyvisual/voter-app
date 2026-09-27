import ExtLink from "@/components/ExtLink";
import { fixLink, linkFixes, type LinkFix } from "@/lib/links";
// Outbound links go through the weekly link check: a dead page is replaced by its archived copy.
let FX: Map<string, LinkFix> = new Map();
const L = (u: string) => fixLink(FX, u)?.href ?? u;
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicClient } from "@/lib/data";
import { councilBySlug, councilSlugFor, TOPIC_ORDER, type CouncilFact } from "@/lib/councils";
import CiteThis from "@/components/CiteThis";
import JsonLd from "@/components/JsonLd";
import { breadcrumbs, graph, webPage } from "@/lib/schema";

// Romily, round six (24 Sept): "Lets focus on Councils as the major data set - What's happening where you live",
// five lines (housing, transport, council tax, environment, education) with sources, then introduce the councillors
// with a link to their register of interests. No attendance, no allowances (her q8, q9). Everything here is a
// quotation from the council's own publication or an official statistic; the page never says whether any of it is good.
export const dynamic = "force-dynamic";

const TOPIC_LABEL: Record<string, string> = { housing: "Housing", transport: "Transport", council_tax: "Council tax", environment: "Environment", education: "Education" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = councilBySlug((await params).slug);
  return c ? { title: `${c.name}: what's happening where you live`, description: `What ${c.name} council has published on housing, transport, council tax, the environment and schools, with sources.`, alternates: { canonical: `/council/${c.slug}` } } : {};
}

export default async function CouncilPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = councilBySlug((await params).slug);
  if (!c) notFound();
  FX = await linkFixes();
  const db = publicClient();
  const stripped = c.name.replace(/\s+(Borough|District|City|County|Council)(?=\s|$)/g, "").trim();
  // Exact names only: a prefix match would give Aberdeen City the councillors of Aberdeenshire.
  const names = [...new Set([c.name, stripped])];
  const gss = c.gss ?? "__none__";
  const since = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10);
  const [{ data: cllrs }, { data: control }, { data: ctax }, { data: ballotRows }, { data: agenda }, { data: plans }, { data: notices }, { data: schools }, { data: consults }] = await Promise.all([
    db.from("councillors").select("name, party_name, ward, next_election").in("council", names).order("ward").order("name"),
    db.from("council_control").select("*").in("authority", names).eq("year", 2026).limit(1).maybeSingle(),
    db.from("council_tax_2026").select("*").in("authority", names).limit(1).maybeSingle(),
    db.from("ballots").select("ballot_paper_id, area_name, poll_date").ilike("area_name", `${stripped}%`).eq("archived", false).order("poll_date"),
    db.from("council_agenda_items").select("*").eq("council_slug", c.slug).order("meeting_date").order("item_id"),
    db.from("local_plans").select("*").eq("council_slug", c.slug).order("period_end", { ascending: false, nullsFirst: false }),
    db.from("gazette_notices").select("*").eq("council_slug", c.slug).gte("published", since).order("published", { ascending: false }),
    db.from("school_changes").select("*").or(`district_gss.eq.${gss},la_gss.eq.${gss}`).order("name"),
    db.from("council_consultations").select("*").eq("council_slug", c.slug).order("closes"),
  ]);
  const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const auto: Record<string, ReactNode> = {
    housing: <PlanLines rows={(plans ?? []) as PlanRow[]} fmt={fmt} />,
    transport: <GazetteLines rows={(notices ?? []) as NoticeRow[]} fmt={fmt} />,
    education: <SchoolLines rows={(schools ?? []) as SchoolRow[]} fmt={fmt} county={c.gss?.startsWith("E10") ?? false} />,
  };
  const ballots = (ballotRows ?? []).filter((b) => councilSlugFor(b.area_name) === c.slug);
  const councillors = (cllrs ?? []) as { name: string; party_name: string | null; ward: string; next_election: string | null }[];
  const nextElection = councillors.map((x) => x.next_election).filter(Boolean).sort()[0] ?? null;
  const byParty = new Map<string, number>();
  for (const x of councillors) byParty.set(x.party_name ?? "Not recorded", (byParty.get(x.party_name ?? "Not recorded") ?? 0) + 1);
  const parties = [...byParty.entries()].sort((a, b) => b[1] - a[1]);
  const gbp = (n: number) => "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const factsFor = (t: string): CouncilFact[] => c.facts.filter((f) => f.topic === t);
  const links: [string, string | null][] = [["Council plan", c.links.plan], ["Budget", c.links.budget], ["Meeting papers", c.links.meetings], ["Councillors", c.links.councillors], ["Register of interests", c.links.interests], ["Consultations", c.links.consultations]];

  return (
    <>
      <JsonLd data={graph(
        webPage(`/council/${c.slug}`, `${c.name}: what's happening where you live`, undefined, { about: { "@type": "GovernmentOrganization", name: c.name, url: c.site, ...(c.gss ? { identifier: c.gss } : {}), areaServed: { "@type": "AdministrativeArea", name: c.name } } }),
        breadcrumbs([[c.name, `/council/${c.slug}`]]),
      )} />
      <p className="eyebrow">Your council</p>
      <h1>{c.name}: what&rsquo;s happening where you live</h1>
      <p className="lede">What the council itself has published on the five things it most shapes for a household: homes, getting about, the bill, the local environment and schools. Each line is quoted from the council&rsquo;s own document, with the link. This page says what was decided or proposed; it never says whether it was right.</p>
      <p className="meta">Read on {fmt(c.checked)}. Councils publish at different rates and in different places, so &ldquo;nothing found&rdquo; means nothing found, not nothing happening.</p>

      <p className="council-links">{links.filter(([, u]) => u).map(([l, u], i) => <span key={l}>{i ? " · " : ""}<a href={L(u!)} rel="noopener">{l}</a></span>)}</p>

      {(consults ?? []).length ? (
        <section className="council-topic">
          <h2>Open consultations</h2>
          <ul className="auto-list">
            {(consults ?? []).map((x: { url: string; title: string; closes: string }) => <li key={x.url}><a href={L(x.url)} rel="noopener">{x.title}</a> <span className="meta">closes {fmt(x.closes)}</span></li>)}
          </ul>
          <p className="meta">Listed automatically from the council&rsquo;s own consultation site, refreshed daily. Standing surveys open for more than a year are left out.</p>
        </section>
      ) : null}

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
                <p className="meta"><a href={L(f.url ?? "#")} rel="noopener">{f.publisher}</a>{f.published_on ? `, ${fmt(f.published_on)}` : ", undated"}. Read {fmt(c.checked)}.{f.note ? ` ${f.note}` : ""}</p>
              </div>
            )) : (
              <p className="empty">{empty?.summary || `Nothing on ${TOPIC_LABEL[t].toLowerCase()} was found on the council's website.`}{empty?.url ? <> <a href={L(empty.url)} rel="noopener" className="meta">Where we looked</a></> : null}</p>
            )}
            {auto[t] ?? null}
          </section>
        );
      })}

      <Decisions rows={(agenda ?? []) as AgendaRow[]} councillors={councillors} councilName={c.name} meetingsUrl={c.links.meetings ?? c.site} />

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
          {c.links.interests ? <>Each councillor&rsquo;s <a href={L(c.links.interests)} rel="noopener">register of interests</a> is on the council&rsquo;s own site, linked rather than summarised, because summarising means choosing. </> : <>The council&rsquo;s register of interests could not be located; the <a href={L(c.links.councillors ?? c.site)} rel="noopener">councillors page</a> is the place to look. </>}
          Councillors from Open Council Data as recorded after the May 2026 elections; a by-election since then may have changed one seat. Attendance and allowances are not shown.
        </p>
        {(agenda ?? []).length ? null : <p className="meta">This council&rsquo;s meeting papers could not be read automatically (the site blocks or did not answer), so decisions and motions are not listed here; the <a href={L(c.links.meetings ?? c.site)} rel="noopener">meeting papers</a> hold them.</p>}
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

type AgendaRow = { body: string; meeting_id: number; meeting_date: string; meeting_status: string | null; item_id: number; item_number: string | null; title: string; kind: string; proposer: string | null; url: string; retrieved_at: string };

// Romily, round six (q13): every Full Council motion shown, labelled with who proposed it. The proposer is taken from the
// council's own agenda text; a councillor's party comes from Open Council Data. Where the agenda does not name the
// proposer, the line says so and links the papers. Nothing is ranked, selected or matched to a ward (her q12 asked for the
// ward rule to be rethought).
function Decisions({ rows, councillors, councilName, meetingsUrl }: { rows: AgendaRow[]; councillors: { name: string; party_name: string | null }[]; councilName: string; meetingsUrl: string }) {
  if (!rows.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  const byMeeting = new Map<number, AgendaRow[]>();
  for (const r of rows) byMeeting.set(r.meeting_id, [...(byMeeting.get(r.meeting_id) ?? []), r]);
  const meetings = [...byMeeting.values()].map((rs) => ({ date: rs[0].meeting_date, body: rs[0].body, status: rs[0].meeting_status, url: rs[0].url, items: rs.filter((r) => r.kind !== "placeholder") }));
  const upcoming = meetings.filter((m) => m.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const recent = meetings.filter((m) => m.date < today).sort((a, b) => b.date.localeCompare(a.date));
  const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const key = (x: string) => x.toLowerCase().replace(/\b(cllrs?|councillors?|dr|mr|mrs|ms|miss)\.?\b/g, "").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  // A party is shown only when the name points to exactly one serving councillor: same surname, and the same first name or
  // initial where the agenda gives one. "Councillor Lamb" gets a party only if there is one Lamb on the council.
  const party = (who: string) => {
    const k = key(who).split(" ").filter(Boolean);
    if (!k.length) return null;
    const last = k[k.length - 1], first = k.length > 1 ? k[0] : null;
    const hits = councillors.filter((c) => { const n = key(c.name).split(" ").filter(Boolean); return n[n.length - 1] === last && (!first || n[0] === first || (first.length === 1 && n[0]?.startsWith(first))); });
    return hits.length === 1 ? hits[0].party_name : null;
  };
  const proposers = (raw: string) => raw.replace(/^(cllrs?|councillors?)\.?\s+/i, "").split(/\s*(?:,|\band\b|&)\s*/).filter(Boolean).map((n) => { if (/^the\b/i.test(n.trim())) return n.trim(); const p = party(n); return `Cllr ${n.trim()}${p ? ` (${p})` : ""}`; }).join(" and ");
  const Meeting = ({ m }: { m: (typeof meetings)[number] }) => (
    <li className="dec-meeting">
      <p className="dec-head"><a href={L(m.url)} rel="noopener"><b>{fmt(m.date)}</b> · {m.body}</a>{m.status && !/^confirmed$/i.test(m.status) ? <span className="meta"> · {m.status.replace(/^Confirmed;?\s*/i, "")}</span> : null}</p>
      {m.items.length ? (
        <ul className="dec-items">
          {m.items.map((it) => (
            <li key={it.item_id}>
              {it.kind === "motion" ? <span className="chip none">Motion</span> : null} {it.title}
              {it.kind === "motion" ? <span className="meta"> — {it.proposer ? `from ${proposers(it.proposer)}` : "proposer named in the council's papers"}</span> : null}
            </li>
          ))}
        </ul>
      ) : <p className="meta">Agenda not yet published.</p>}
    </li>
  );
  const retrieved = rows.reduce((a, r) => (r.retrieved_at > a ? r.retrieved_at : a), "");
  return (
    <section className="council-topic" aria-labelledby="decisions-heading">
      <h2 id="decisions-heading">What {councilName} is deciding</h2>
      <p className="meta">Every item on the agendas of Full Council and the Cabinet, as the council titled it, from about six months back to three months ahead. Left out: section headings, procedural items (apologies, minutes, declarations of interest, announcements, questions, appointments), anything about councillors&rsquo; attendance or allowances (which this site does not show), and private items the council itself withholds. Motions are shown with whoever the council&rsquo;s agenda says proposed them; a councillor&rsquo;s party is from Open Council Data.</p>
      {upcoming.length ? (<><h3>Coming up</h3><ul className="dec-list">{upcoming.slice(0, 4).map((m) => <Meeting key={m.url} m={m} />)}</ul></>) : null}
      {recent.length ? (<>
        <h3>Recently</h3>
        <ul className="dec-list">{recent.slice(0, 3).map((m) => <Meeting key={m.url} m={m} />)}</ul>
        {recent.length > 3 ? <details className="more"><summary className="meta">{recent.length - 3} earlier meetings</summary><ul className="dec-list">{recent.slice(3).map((m) => <Meeting key={m.url} m={m} />)}</ul></details> : null}
      </>) : null}
      <p className="meta">From the council&rsquo;s own <a href={L(meetingsUrl)} rel="noopener">meeting papers</a> (Modern.gov){retrieved ? `, read ${new Date(retrieved).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : ""}. Refreshed weekly. Results of motions are in each meeting&rsquo;s minutes, linked from the date.</p>
    </section>
  );
}

// ---- Lines kept current automatically from official registers (scripts/auto/*, refreshed daily or weekly) ----
type PlanRow = { entity: number; name: string | null; process: string | null; adopted_date: string | null; period_start: string | null; period_end: string | null; required_housing: number | null; documentation_url: string | null; entry_date: string | null };
type NoticeRow = { notice_id: string; notice_type: string | null; title: string | null; published: string | null; url: string };
type SchoolRow = { urn: number; name: string; status: string; phase: string | null; type: string | null; reason_opened: string | null; reason_closed: string | null; open_date: string | null; close_date: string | null; gias_url: string; la_name: string | null };
type Fmt = (d: string) => string;

function AutoBlock({ title, source, children }: { title: string; source: ReactNode; children: ReactNode }) {
  return (
    <div className="auto-block">
      <p className="auto-title">{title} <span className="auto-tag">Updated automatically</span></p>
      {children}
      <p className="meta">{source}</p>
    </div>
  );
}

function PlanLines({ rows, fmt }: { rows: PlanRow[]; fmt: Fmt }) {
  const live = rows.filter((r) => r.process !== "withdrawn");
  if (!live.length) return null;
  const yr = (d: string | null) => (d ? d.slice(0, 4) : null);
  return (
    <AutoBlock title="Local plans on the national planning register" source={<>MHCLG planning data platform (planning.data.gov.uk), as supplied by the council; Open Government Licence. Stages are as recorded there, and some entries are old: each shows when the council last updated it.</>}>
      <ul className="auto-list">
        {live.slice(0, 5).map((r) => (
          <li key={r.entity}>
            {r.documentation_url ? <ExtLink href={r.documentation_url}>{r.name}</ExtLink> : r.name}
            {r.process ? ` — ${r.process}` : ""}{r.adopted_date ? `, adopted ${fmt(r.adopted_date)}` : ""}
            {yr(r.period_start) || yr(r.period_end) ? `, plan period ${yr(r.period_start) ?? "?"}–${yr(r.period_end) ?? "?"}` : ""}
            {r.required_housing ? <>, housing requirement <b>{r.required_housing.toLocaleString("en-GB")}</b> homes</> : ""}
            {r.entry_date ? <span className="meta"> (entry updated {fmt(r.entry_date)})</span> : null}
          </li>
        ))}
      </ul>
    </AutoBlock>
  );
}

function GazetteLines({ rows, fmt }: { rows: NoticeRow[]; fmt: Fmt }) {
  if (!rows.length) return null;
  const clip = (t: string | null) => (t && t.length > 170 ? t.slice(0, 167).trimEnd() + "…" : t ?? "Notice");
  const item = (r: NoticeRow) => <li key={r.notice_id}><a href={L(r.url)} rel="noopener">{clip(r.title)}</a> <span className="meta">{r.notice_type}{r.published ? `, ${fmt(r.published)}` : ""}</span></li>;
  return (
    <AutoBlock title="Traffic and highways orders published in The Gazette (last four months)" source={<>The Gazette, the official public record (Open Government Licence). Titles are the orders&rsquo; own names. Councils outside London usually publish these in local newspapers instead, so an empty list here does not mean no orders were made.</>}>
      <ul className="auto-list">{rows.slice(0, 5).map(item)}</ul>
      {rows.length > 5 ? <details className="more"><summary className="meta">{rows.length - 5} more</summary><ul className="auto-list">{rows.slice(5).map(item)}</ul></details> : null}
    </AutoBlock>
  );
}

function SchoolLines({ rows, fmt, county }: { rows: SchoolRow[]; fmt: Fmt; county: boolean }) {
  if (!rows.length) return null;
  const proposed = rows.filter((r) => r.status === "Proposed to open" || r.status === "Open, but proposed to close");
  const opened = rows.filter((r) => r.status === "Open");
  const closed = rows.filter((r) => r.status === "Closed");
  const why = (r: SchoolRow) => (r.status === "Proposed to open" || r.status === "Open" ? r.reason_opened : r.reason_closed);
  const tally = (xs: SchoolRow[]) => {
    const m = new Map<string, number>();
    for (const x of xs) m.set(why(x) ?? "reason not recorded", (m.get(why(x) ?? "reason not recorded") ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} ${k.toLowerCase()}`).join(", ");
  };
  const line = (r: SchoolRow) => (
    <li key={`${r.urn}-${r.status}`}><a href={L(r.gias_url)} rel="noopener">{r.name}</a>{r.phase ? ` (${r.phase.toLowerCase()})` : ""} — {r.status.toLowerCase()}
      {why(r) ? `; reason recorded: ${why(r)!.toLowerCase()}` : ""}
      {r.status === "Open, but proposed to close" && r.close_date ? `; proposed date ${fmt(r.close_date)}` : ""}{r.status === "Proposed to open" && r.open_date ? `; proposed date ${fmt(r.open_date)}` : ""}
      {r.status === "Closed" && r.close_date ? `, ${fmt(r.close_date)}` : ""}{r.status === "Open" && r.open_date ? `, ${fmt(r.open_date)}` : ""}
    </li>
  );
  return (
    <AutoBlock title={county ? "Changes to schools recorded by the Department for Education" : "Changes to schools in this area recorded by the Department for Education"} source={<>Get Information about Schools, DfE&rsquo;s register of every school in England, refreshed daily (Open Government Licence). The register&rsquo;s own reason is shown: most closures and openings are a school becoming an academy, which changes who runs it, not whether it is there.</>}>
      {proposed.length ? <ul className="auto-list">{proposed.map(line)}</ul> : <p className="small">No school here is currently recorded as proposed to open or close.</p>}
      {opened.length || closed.length ? (
        <details className="more">
          <summary className="meta">In the last twelve months: {opened.length} opened{opened.length ? ` (${tally(opened)})` : ""}, {closed.length} closed{closed.length ? ` (${tally(closed)})` : ""}</summary>
          <ul className="auto-list">{[...closed, ...opened].map(line)}</ul>
        </details>
      ) : null}
    </AutoBlock>
  );
}
