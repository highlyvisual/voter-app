import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ExtLink from "@/components/ExtLink";
import JsonLd from "@/components/JsonLd";
import CiteThis from "@/components/CiteThis";
import { publicClient } from "@/lib/data";
import { listAllCouncils } from "@/lib/councils";
import { longDate } from "@/lib/dates";
import { partyFill } from "@/lib/partyColour";
import { breadcrumbs, graph, webPage } from "@/lib/schema";
import { AUTHORITIES, AUTH_SOURCES as SRC, IFG_QUOTES, authorityBySlug, partyKey, type Authority, type Block } from "@/lib/authorities";

// Romily, round ten, q3 ("Start now. Combined authorities and mayors first, parishes later"): one page per combined
// authority and the Greater London Authority, the council page's template made short, one idea per section. Every
// sentence about the authority is quoted from the source named under it; where a fact couldn't be read, the page says so.
export const revalidate = 3600;
export function generateStaticParams() { return AUTHORITIES.map((a) => ({ slug: a.slug })); }

const title = (a: Authority) => (a.kind === "gla" ? "Greater London Authority: the Mayor of London" : `${a.name}: ${a.mayoral ? "the mayor and " : ""}the combined authority`);
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = authorityBySlug((await params).slug);
  return a ? { title: title(a), description: `Who the ${a.kind === "gla" ? "Mayor of London is" : a.mayoral ? `Mayor of ${a.name} is` : `${a.name} combined authority is`}, what ${a.kind === "gla" ? "the GLA" : "it"} decides, and the councils in it, with sources.`, alternates: { canonical: `/authority/${a.slug}` } } : {};
}

const NOT_READ = "Not yet read.";

function Quote({ blocks, cite }: { blocks: Block[]; cite?: ReactNode }) {
  return (
    <blockquote className="auth-quote">
      {blocks.map((b, i) => b.list ? <ul key={i}>{b.list.map((li) => <li key={li}>{li}</li>)}</ul> : <p key={i}>{b.p}</p>)}
      {cite ? <footer className="meta">{cite}</footer> : null}
    </blockquote>
  );
}

export default async function AuthorityPage({ params }: { params: Promise<{ slug: string }> }) {
  const a = authorityBySlug((await params).slug);
  if (!a) notFound();
  const fs = SRC.factsheets;
  const fsUrl = `${fs.url}${a.factsheet_anchor ? `#${a.factsheet_anchor}` : ""}`;
  const fsCite = <><a href={fsUrl} rel="noopener">{fs.name}</a>{fs.updated ? `, updated ${longDate(fs.updated)}` : ""}; read {longDate(fs.retrieved)}.</>;
  // Council pages: matched on the ONS code, never on the name.
  const councils = await listAllCouncils();
  const slugFor = (gss: string) => councils.find((c) => [c.gss, c.register?.gss_code, c.register?.ons_gss_code].includes(gss)) ?? null;
  // The party's own colour, beside the party's own name only.
  const pk = partyKey(a.mayor?.party_id);
  const { data: party } = pk ? await publicClient().from("parties").select("colour_hex").eq("ec_id", pk).maybeSingle() : { data: null };
  const colour = (party as { colour_hex: string | null } | null)?.colour_hex ?? null;
  const counties = a.councils.filter((c) => c.tier === "county");
  const lads = a.councils.filter((c) => c.tier === "lad");
  const L = a.links;
  const dc = SRC.dc_candidates, ee = SRC.everyelection;
  // For the GLA, one idea on screen (the bodies the Mayor oversees: the last list and the sentence before it); the rest
  // of the government's description sits behind a tap.
  const more = a.what_more ?? [];
  const lastList = more.map((b) => Boolean(b.list)).lastIndexOf(true);
  const cut = lastList > 0 && more[lastList - 1].p ? lastList - 1 : lastList;
  const gla = cut >= 0 ? { shown: more.slice(cut, lastList + 1), rest: [...more.slice(0, cut), ...more.slice(lastList + 1)] } : { shown: more, rest: [] as Block[] };

  return (
    <>
      <JsonLd data={graph(
        webPage(`/authority/${a.slug}`, title(a), undefined, { about: { "@type": "GovernmentOrganization", name: a.formal_name, ...(L.website ? { url: L.website.url } : {}), identifier: a.code } }),
        breadcrumbs([["Mayors and combined authorities", "/authority"], [a.name, `/authority/${a.slug}`]]),
      )} />
      <p className="eyebrow"><Link href="/authority">Mayors and combined authorities</Link></p>
      <h1>{a.kind === "gla" ? "Greater London Authority" : a.name}</h1>
      <p className="lede">
        {a.kind === "gla"
          ? <>London&rsquo;s own government, above the {lads.length} councils: the Mayor of London and the London Assembly.</>
          : <>Councils in {a.name} working together on things that cross their borders{a.mayoral ? ", led by a mayor everyone in the area can vote for" : a.mayoral === false ? ". There is no elected mayor here" : ""}.</>}
      </p>
      {a.what ? <Quote blocks={[{ p: a.what }]} cite={fsCite} /> : <p className="empty">We haven&rsquo;t read the government&rsquo;s description of this authority yet.</p>}

      {/* The mayor: one idea, then when the next vote is. */}
      <section className="auth-sec" aria-labelledby="mayor-h">
        <h2 id="mayor-h">{a.kind === "gla" ? "The Mayor of London" : "The mayor"}</h2>
        {a.mayoral === false ? (
          <p className="small">This authority has no directly elected mayor. <span className="meta">From the government&rsquo;s description quoted above.</span></p>
        ) : a.mayor ? (
          <>
            <p className="auth-mayor"><strong>{a.mayor.name}</strong> <span className={`party-pill${colour ? " filled" : ""}`} style={partyFill(colour)}>{a.mayor.party}</span></p>
            <p className="small">Elected on {longDate(a.mayor.elected_on)}{/by-election/i.test(a.mayor.election) ? " at a by-election" : ""}.</p>
            <p className="meta">Source: <a href={a.mayor.source} rel="noopener">{dc.publisher}, {a.mayor.election}</a> ({dc.licence}), read {longDate(a.mayor.retrieved)}. This is who won the most recent mayoral election; if the post has changed hands since without an election, this page won&rsquo;t know yet.</p>
          </>
        ) : <p className="empty">We haven&rsquo;t been able to read who the mayor is yet.</p>}
        {a.mayoral !== false ? (
          a.next_election ? (
            <p className="small">Next mayoral election: <b>{longDate(a.next_election.date)}</b>. <span className="meta">Source: <a href={a.next_election.url} rel="noopener">{ee.name}</a>.</span></p>
          ) : (
            <>
              <p className="small">Next mayoral election: Democracy Club hasn&rsquo;t listed it yet.</p>
              {a.election_note ? (
                <details className="more"><summary className="meta">What the government says about the next election</summary>
                  <Quote blocks={[{ p: a.election_note }]} cite={fsCite} />
                </details>
              ) : null}
            </>
          )
        ) : null}
      </section>

      {/* What it decides. The headings are the law's, for this authority's tier; police and fire are this authority's own. */}
      <section className="auth-sec" aria-labelledby="does-h">
        <h2 id="does-h">What it decides</h2>
        {a.kind === "gla" ? (
          gla.shown.length ? (
            <>
              <Quote blocks={gla.shown} cite={fsCite} />
              {gla.rest.length ? <details className="more"><summary className="meta">How the government describes the rest of the GLA</summary><Quote blocks={gla.rest} cite={fsCite} /></details> : null}
            </>
          ) : <p className="empty">{NOT_READ}</p>
        ) : a.competences?.headings.length ? (
          <>
            <p className="small">The law gives every authority of this kind powers under these headings:</p>
            <ul className="auth-chips">{a.competences.headings.map((h) => <li key={h}>{h}</li>)}</ul>
            <p className="meta">Headings as printed in the government&rsquo;s <a href={a.competences.url} rel="noopener">{a.competences.tier_title}</a> ({SRC.explainers.licence}), which lists each power under them. Which of them this authority uses, and how, is in its own papers.</p>
          </>
        ) : <p className="empty">We haven&rsquo;t read the list of this authority&rsquo;s powers yet.</p>}
        {a.kind === "combined" && IFG_QUOTES[1] ? (
          <details className="more"><summary className="meta">Do all combined authorities do the same things?</summary>
            <Quote blocks={[{ p: IFG_QUOTES[1] }]} cite={<><a href={SRC.ifg.url} rel="noopener">{SRC.ifg.name}</a>, read {longDate(SRC.ifg.retrieved)}.</>} />
          </details>
        ) : null}
        <h3 className="auth-h3">Police</h3>
        {a.police ? <Quote blocks={a.police} cite={fsCite} /> : <p className="empty">{NOT_READ}</p>}
        <h3 className="auth-h3">Fire and rescue</h3>
        {a.fire ? <Quote blocks={a.fire} cite={fsCite} /> : <p className="empty">{NOT_READ}</p>}
        {a.distinctive ? (
          <details className="more"><summary className="meta">What&rsquo;s different about how it is run</summary>
            <Quote blocks={a.distinctive} cite={fsCite} />
          </details>
        ) : null}
      </section>

      {/* The councils in it, each linked to its own page. */}
      <section className="auth-sec" aria-labelledby="councils-h">
        <h2 id="councils-h">{a.kind === "gla" ? "The councils in London" : "Councils in its area"}</h2>
        {/* Where county and district councils share an area, not every council in it is a member: the government's
            own list of members comes first. */}
        {a.members_quote ? <Quote blocks={[{ p: a.members_quote }]} cite={fsCite} /> : null}
        {a.kind === "combined" ? <p className="small">Every council in its area:</p> : null}
        <ul className="auth-councils">
          {[...counties, ...lads].map((c) => {
            const page = slugFor(c.gss);
            return <li key={c.gss}>{page ? <Link href={`/council/${page.slug}`}>{page.name}</Link> : c.name}{c.tier === "county" ? <span className="meta"> (county council)</span> : null}</li>;
          })}
        </ul>
        <p className="meta">
          From the <a href={(a.kind === "gla" ? SRC.ons_rgn : SRC.ons_ca).url} rel="noopener">{(a.kind === "gla" ? SRC.ons_rgn : SRC.ons_ca).name}</a> ({SRC.ons_ca.licence}), read {longDate(SRC.ons_ca.retrieved)}.
          {counties.length ? <> A county council is listed when every district in it is in the authority and the government&rsquo;s factsheet names it as a member.</> : null}
        </p>
      </section>

      {/* Its own pages. A link the job found on the home page keeps the words it was found under. */}
      <section className="auth-sec" aria-labelledby="links-h">
        <h2 id="links-h">Its own pages</h2>
        <dl className="auth-links">
          <div>
            <dt>Website</dt>
            <dd>{L.website ? <><ExtLink href={L.website.url}>{L.website.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</ExtLink> <span className="meta">(from {L.website.source === "wikidata" && L.website.ref ? <a href={L.website.ref} rel="noopener">Wikidata</a> : L.website.source === "wikidata" ? "Wikidata" : "mySociety"}{L.website.opened === false ? "; the site turned our reader away, so the links below couldn't be read" : ""})</span></> : NOT_READ}</dd>
          </div>
          {([["meetings", "Meetings and decisions"], ["budget", "Budget"], ["mayor_page", a.kind === "gla" ? "The Mayor's page" : "The mayor's page"]] as const).filter(([k]) => k !== "mayor_page" || a.mayoral !== false).map(([k, label]) => {
            const l = L[k];
            return (
              <div key={k}>
                <dt>{label}</dt>
                <dd>{l ? <><ExtLink href={l.url}>{l.words}</ExtLink> <span className="meta">(the link of that name on its home page, {longDate(l.checked)})</span></> : NOT_READ}</dd>
              </div>
            );
          })}
          {a.mayor?.person_page ? (<div><dt>The mayor on Democracy Club</dt><dd><a href={a.mayor.person_page} rel="noopener">{a.mayor.name}</a></dd></div>) : null}
        </dl>
      </section>

      <CiteThis title={title(a)} />
      <p className="meta">
        Every authority page has the same sections in the same order. Sources: {[SRC.factsheets, SRC.explainers, SRC.ons_ca, SRC.ons_cty, SRC.everyelection, SRC.dc_candidates, SRC.register, SRC.wikidata].map((s, i) => <span key={s.url}>{i ? "; " : ""}<a href={s.url} rel="noopener">{s.name}</a> ({s.licence})</span>)}. Parish and town councils are not covered yet. Corrections: hello@whatsittome.org.
      </p>
    </>
  );
}
