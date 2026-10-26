import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { publicClient } from "@/lib/data";
import { partyFill } from "@/lib/partyColour";
import { breadcrumbs, graph, webPage } from "@/lib/schema";
import { AUTHORITIES, AUTH_SOURCES as SRC, partyKey } from "@/lib/authorities";
import { longDate } from "@/lib/dates";

// Romily, round ten, q3: every combined authority and the Greater London Authority, in alphabetical order, the same
// line for each. Parish and town councils come later.
export const revalidate = 3600;
export const metadata = { title: "Mayors and combined authorities", description: "England's combined authorities and the Greater London Authority: who the mayor is, what each decides and which councils are in it, with sources.", alternates: { canonical: "/authority" } };

export default async function AuthorityIndex() {
  const ids = [...new Set(AUTHORITIES.map((a) => partyKey(a.mayor?.party_id)).filter((x): x is string => Boolean(x)))];
  const { data } = ids.length ? await publicClient().from("parties").select("ec_id, colour_hex").in("ec_id", ids) : { data: [] };
  const colour = new Map(((data ?? []) as { ec_id: string; colour_hex: string | null }[]).map((p) => [p.ec_id, p.colour_hex]));
  const list = [...AUTHORITIES].sort((x, y) => x.name.localeCompare(y.name, "en-GB"));
  return (
    <>
      <JsonLd data={graph(webPage("/authority", "Mayors and combined authorities", undefined), breadcrumbs([["Mayors and combined authorities", "/authority"]]))} />
      <p className="eyebrow"><Link href="/learn/who-decides">Who decides what</Link></p>
      <h1>Mayors and combined authorities</h1>
      <p className="lede">In parts of England, neighbouring councils work together on things like buses, skills and housing, often with a mayor everyone in the area votes for. Here is each one.</p>
      <ul className="auth-index">
        {list.map((a) => {
          const hex = colour.get(partyKey(a.mayor?.party_id) ?? "") ?? null;
          return (
            <li key={a.slug}>
              <Link href={`/authority/${a.slug}`}><strong>{a.name}</strong></Link>
              <span className="small">
                {a.mayoral === false ? "No elected mayor" : a.mayor ? <>Mayor: {a.mayor.name} <span className={`party-pill${hex ? " filled" : ""}`} style={partyFill(hex)}>{a.mayor.party}</span></> : "Mayor: not yet read"}
              </span>
              <span className="meta">{a.councils.length} councils in its area</span>
            </li>
          );
        })}
      </ul>
      <p className="meta">
        Authorities from the <a href={SRC.ons_ca.url} rel="noopener">{SRC.ons_ca.name}</a> and, for London, the <a href={SRC.ons_rgn.url} rel="noopener">{SRC.ons_rgn.name}</a> ({SRC.ons_ca.licence}); mayors from <a href={SRC.dc_candidates.url} rel="noopener">{SRC.dc_candidates.name}</a> ({SRC.dc_candidates.licence}); whether there is a mayor from <a href={SRC.factsheets.url} rel="noopener">{SRC.factsheets.name}</a>. Read {longDate(SRC.ons_ca.retrieved)}.
        An authority appears here once the ONS has mapped it. Parish and town councils are not covered yet.
      </p>
    </>
  );
}
