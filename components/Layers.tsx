import { publicClient } from "@/lib/data";
import { currentMp } from "@/components/Representatives";
import Link from "next/link";
import wider from "@/lib/widerBodies.json";
import { councilSlugFor } from "@/lib/councils";
import chain from "@/lib/decision-chain.json";
// Everyone who represents this postcode, layer by layer. Areas overlap rather than nest: a postcode has one MP, one or
// two councils, perhaps a parish, and a police area, each with different powers. Idea adapted from Beyond the Vote's
// "My place"; data from postcodes.io (ONS geography), UK Parliament and Open Council Data.
type Pc = { postcode: string; parliamentary_constituency: string | null; admin_district: string | null; admin_county: string | null; admin_ward: string | null; ced: string | null; parish: string | null; pfa: string | null; country: string | null; region: string | null; icb: string | null; national_park: string | null; senedd_constituency: string | null; codes?: { admin_district?: string | null } };
// Wider bodies from ONS lookups (Open Government Licence): combined authorities and the GLA (elected mayors), fire and rescue authorities. See lib/widerBodies.json for sources.
type Wider = { combined_authority: Record<string, { code: string; name: string; mayor: boolean | null }>; gla: string[]; fire_authority: Record<string, { code: string; name: string; governance: string | null }> };
const W = wider as unknown as Wider;
const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
async function cllrs(council: string | null, ward: string | null) {
  if (!council || !ward) return [];
  const { data } = await publicClient().from("councillors").select("name, party_name, ward").ilike("council", council);
  return (data ?? []).filter((r) => norm(r.ward) === norm(ward));
}
export default async function Layers({ lat, lng, electionCouncil }: { lat: number; lng: number; electionCouncil: string | null }) {
  let pc: Pc | null = null;
  try { pc = (await fetch(`https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}&limit=1&radius=500`, { signal: AbortSignal.timeout(5000), next: { revalidate: 604800 } }).then((r) => r.json()))?.result?.[0] ?? null; } catch { pc = null; }
  if (!pc) return null;
  const twoTier = Boolean(pc.admin_county);
  const lad = pc.codes?.admin_district ?? null;
  const ca = lad ? W.combined_authority[lad] ?? null : null;
  const fra = lad ? W.fire_authority[lad] ?? null : null;
  const councilSlug = await councilSlugFor(pc.admin_district);
  const [mp, district, county] = await Promise.all([
    pc.parliamentary_constituency ? currentMp(pc.parliamentary_constituency) : Promise.resolve(null),
    cllrs(pc.admin_district, pc.admin_ward),
    twoTier ? cllrs(pc.admin_county, pc.ced) : Promise.resolve([]),
  ]);
  const list = (xs: { name: string; party_name: string | null }[]) => xs.length ? xs.map((c) => `${c.name}${c.party_name ? ` (${c.party_name})` : ""}`).join(", ") : "not listed";
  const isThis = (name: string | null) => electionCouncil && name && norm(electionCouncil).includes(norm(name));
  // "Who makes decisions where you live?" (Romily, round eight, point 7): the elected chain from the most local body to
  // Parliament, each with what it decides and where that description comes from.
  const SRC = {
    council: ["GOV.UK, Understand how your council works", "https://www.gov.uk/understand-how-your-council-works/types-of-council"],
    police: ["House of Commons Library, Police and crime commissioners (July 2026)", "https://researchbriefings.files.parliament.uk/documents/SN06104/SN06104.pdf"],
    london: ["Greater London Authority, Who we are", "https://www.london.gov.uk/who-we-are"],
    mayor: ["Institute for Government, Regional mayors", "https://www.instituteforgovernment.org.uk/explainer/regional-mayors-devolution"],
    devo: ["GOV.UK, Devolution factsheet", "https://www.gov.uk/government/publications/devolution-guidance-for-civil-servants"],
  } as const;
  type Row = { layer: string; area: string; who: string; does: string; now?: boolean; src?: readonly [string, string]; link?: { href: string; text: string } };
  const pfa = pc.pfa ?? "";
  const mayorPolicing = (chain.policing_by_mayor as Record<string, string>)[pfa];
  const PFCC = ["Essex", "Northamptonshire", "Staffordshire"];
  const policingElected = pc.country === "England" || pc.country === "Wales";
  const rows: Row[] = [
    ...(pc.parish && !/unparished/i.test(pc.parish) ? [{ layer: "Parish or town council", area: pc.parish, who: "Parish or town councillors, elected", does: "Allotments, bus shelters, community centres, play areas, grants to local groups, and a say on neighbourhood planning.", src: SRC.council }] : []),
    { layer: twoTier ? "District council" : "Council", area: `${pc.admin_district ?? "—"}${pc.admin_ward ? ` · ${pc.admin_ward} ward` : ""}`, who: list(district), does: twoTier ? "Rubbish and recycling, council tax collection, housing and planning applications." : "All the services a county and a district provide between them: education, social care, planning, housing, libraries, rubbish and recycling, and more.", now: Boolean(isThis(pc.admin_district)), src: SRC.council, link: councilSlug ? { href: `/council/${councilSlug}`, text: `What ${pc.admin_district} council is deciding` } : undefined },
    ...(twoTier ? [{ layer: "County council", area: `${pc.admin_county}${pc.ced ? ` · ${pc.ced} division` : ""}`, who: list(county), does: "Education, transport, planning, social care, libraries, waste management and trading standards across the county.", now: Boolean(isThis(pc.admin_county)), src: SRC.council }] : []),
    // Romily, round six (q10-11): whatever sits between the council and Westminster, elected bodies first.
    ...(lad && W.gla.includes(lad) ? [{ layer: "Greater London Authority", area: "Greater London", who: "The Mayor of London and the London Assembly, both elected", does: "The Mayor leads London-wide policy (transport, policing, planning, housing money); the Assembly holds the Mayor to account.", src: SRC.london }] : []),
    ...(ca && ca.mayor ? [{ layer: "Combined authority", area: ca.name, who: "A directly elected mayor, with the leaders of the member councils", does: "Transport, adult skills, strategic planning and housing money across the area; the powers vary by deal.", src: SRC.mayor }] : []),
    ...(policingElected && pfa ? [{ layer: "Policing", area: pfa, who: mayorPolicing ? `${mayorPolicing}, elected` : PFCC.includes(pfa) ? "The Police, Fire and Crime Commissioner, elected" : "The Police and Crime Commissioner, elected", does: `How the area is policed, the police budget and its share of council tax, and appointing the chief constable. Does not run operations.${mayorPolicing ? "" : " Police and crime commissioners are due to be abolished in May 2028; a mayor takes on the role where there is one."}`, src: SRC.police }] : []),
    ...(pc.country === "Wales" ? [{ layer: "Senedd Cymru", area: pc.senedd_constituency ?? "Wales", who: "Members of the Senedd, elected", does: "Makes laws for Wales on everything not reserved to Westminster, including health, education, housing and transport.", src: SRC.devo }] : []),
    ...(pc.country === "Scotland" ? [{ layer: "Scottish Parliament", area: "Your Holyrood constituency and region", who: "MSPs, elected", does: "Makes laws for Scotland on everything not reserved to Westminster, including health, education, justice, housing and income tax rates.", src: SRC.devo }] : []),
    ...(pc.country === "Northern Ireland" && pc.parliamentary_constituency ? [{ layer: "Northern Ireland Assembly", area: pc.parliamentary_constituency, who: "MLAs, elected", does: "Makes laws on transferred matters, including health, education, justice and agriculture.", src: SRC.devo }] : []),
    { layer: "UK Parliament", area: pc.parliamentary_constituency ?? "—", who: mp ? (mp.vacant ? "Seat vacant" : `${mp.name}${mp.party ? ` (${mp.party})` : ""}`) : "—", does: pc.country === "England" ? "National laws, taxes and benefits, the NHS and schools in England, immigration, defence and foreign policy." : "Laws on reserved matters for the whole UK: most taxes and benefits, immigration, defence and foreign policy.", src: SRC.devo },
  ];
  // Unelected bodies, behind "Who else runs things here" (Romily, round six q11): named, with what they decide, never in the elected list.
  const unelected: { layer: string; area: string; who: string; does: string }[] = [
    ...(!policingElected && pfa ? [{ layer: "Policing", area: pfa === "Scotland" ? "Police Scotland" : pfa, who: pc.country === "Scotland" ? "The Scottish Police Authority, appointed" : "The Northern Ireland Policing Board: some members nominated from the Assembly, the rest appointed", does: "Oversees the police service and holds the chief constable to account." }] : []),
    ...(pfa === "London, City of" ? [{ layer: "Policing", area: "City of London", who: "The City of London Corporation, as police authority", does: "Oversees the City of London Police." }] : []),
    ...(pc.icb && !/pseudo|non-/i.test(pc.icb) ? [{ layer: "NHS integrated care board", area: pc.icb, who: "An appointed board", does: "Plans and pays for most NHS services in its area." }] : []),
    ...(fra && fra.governance !== "mayor" && !(lad && W.gla.includes(lad)) ? [{ layer: "Fire and rescue authority", area: fra.name, who: fra.governance === "pfcc" ? "The elected Police, Fire and Crime Commissioner" : fra.governance === "county" ? "The county council" : "A board of councillors nominated by the member councils", does: "Runs the fire and rescue service and sets its share of council tax." }] : []),
    ...(ca && !ca.mayor ? [{ layer: "Combined authority", area: ca.name, who: "The leaders of the member councils; no directly elected mayor yet", does: "Transport, skills and strategic planning across the area." }] : []),
    ...(pc.national_park && !/non-National Park|non national/i.test(pc.national_park) ? [{ layer: "National park authority", area: pc.national_park, who: "An appointed authority with some councillors", does: "Planning decisions inside the park." }] : []),
  ];
  return (
    <section className="layers" aria-labelledby="layers-heading">
      <h2 id="layers-heading">Who makes decisions where you live?</h2>
      <p className="meta">Your address sits inside several areas at once, each with different people and different powers. From the most local to the most national{electionCouncil ? "; the one this election is for is marked" : ""}.</p>
      <p className="small"><Link href={`/explore/housing?pc=${encodeURIComponent(pc.postcode.split(" ")[0])}&loc=${lat.toFixed(3)},${lng.toFixed(3)}`}>Housing here: who decides what, from your front door to Parliament &rarr;</Link></p>
      <ol className="chain">
        {rows.filter((r) => !(r.layer === "Policing" && pfa === "London, City of")).map((r) => (
          <li key={r.layer} className={`chain-step${r.now ? " now" : ""}`}>
            <details open={r.now || undefined}>
              <summary>
                <span className="layer-name">{r.layer}{r.now ? <span className="layer-tag">This election</span> : null}</span>
                <span className="layer-area">{r.area}</span>
                <span className="small chain-who">{r.who}</span>
              </summary>
              <p className="small" style={{ margin: "0.35rem 0 0.2rem" }}>{r.does}</p>
              {r.link ? <p className="small" style={{ margin: "0.2rem 0" }}><Link href={r.link.href}>{r.link.text} &rarr;</Link></p> : null}
              {r.src ? <p className="meta" style={{ margin: 0 }}>Source: <a href={r.src[1]} rel="noopener">{r.src[0]}</a></p> : null}
            </details>
          </li>
        ))}
      </ol>
      {unelected.length ? (
        <details className="more">
          <summary className="meta">Who else runs things here</summary>
          <div className="layers-grid" style={{ marginTop: "0.5rem" }}>
            {unelected.map((r) => (
              <div key={r.layer} className="layer">
                <p className="layer-name">{r.layer}<span className="layer-tag">Not elected</span></p>
                <p className="layer-area">{r.area}</p>
                <p className="small" style={{ margin: "0.2rem 0" }}><strong>{r.who}</strong></p>
                <p className="meta" style={{ margin: 0 }}>{r.does}</p>
              </div>
            ))}
          </div>
        </details>
      ) : null}
      <p className="meta">Areas from the ONS via postcodes.io; MP from UK Parliament; councillors from Open Council Data as recorded after the May 2026 elections; combined and fire authorities from ONS lookups (2025). Council responsibilities vary slightly by area; the council's own website is definitive.</p>
    </section>
  );
}
