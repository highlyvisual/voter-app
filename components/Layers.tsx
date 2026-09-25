import { publicClient } from "@/lib/data";
import { currentMp } from "@/components/Representatives";
import Link from "next/link";
import wider from "@/lib/widerBodies.json";
import { councilSlugFor } from "@/lib/councils";
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
  const councilSlug = councilSlugFor(pc.admin_district);
  const [mp, district, county] = await Promise.all([
    pc.parliamentary_constituency ? currentMp(pc.parliamentary_constituency) : Promise.resolve(null),
    cllrs(pc.admin_district, pc.admin_ward),
    twoTier ? cllrs(pc.admin_county, pc.ced) : Promise.resolve([]),
  ]);
  const list = (xs: { name: string; party_name: string | null }[]) => xs.length ? xs.map((c) => `${c.name}${c.party_name ? ` (${c.party_name})` : ""}`).join(", ") : "not listed";
  const isThis = (name: string | null) => electionCouncil && name && norm(electionCouncil).includes(norm(name));
  const rows: { layer: string; area: string; who: string; does: string; now?: boolean }[] = [
    { layer: "UK Parliament", area: pc.parliamentary_constituency ?? "—", who: mp ? (mp.vacant ? "Seat vacant" : `${mp.name}${mp.party ? ` (${mp.party})` : ""}`) : "—", does: "National laws, taxes, benefits, the NHS in England, immigration, defence." },
    { layer: twoTier ? "District council" : "Council", area: `${pc.admin_district ?? "—"}${pc.admin_ward ? ` · ${pc.admin_ward} ward` : ""}`, who: list(district), does: twoTier ? "Bins, planning applications, housing, council tax collection, local parks, licensing." : "Almost all local services: schools, social care, bins, planning, housing, roads, libraries.", now: Boolean(isThis(pc.admin_district)) },
    ...(twoTier ? [{ layer: "County council", area: `${pc.admin_county}${pc.ced ? ` · ${pc.ced} division` : ""}`, who: list(county), does: "Schools, adult and children's social care, roads and transport, libraries, waste disposal.", now: Boolean(isThis(pc.admin_county)) }] : []),
    ...(pc.parish && !/unparished/i.test(pc.parish) ? [{ layer: "Parish or town council", area: pc.parish, who: "See the parish council", does: "Very local matters: allotments, village halls, footpaths, some play areas." }] : []),
    ...(pc.pfa ? [{ layer: "Policing", area: pc.pfa, who: pc.pfa === "Metropolitan Police" ? "The Mayor of London" : "Police and Crime Commissioner (or mayor, where one holds the role)", does: "Sets police priorities and budget; does not run operations." }] : []),
    // Romily, round six (q10-11): whatever sits between the council and Westminster, elected bodies first.
    ...(lad && W.gla.includes(lad) ? [{ layer: "Greater London Authority", area: "Greater London", who: "The Mayor of London and the London Assembly, both elected", does: "Transport for London, policing priorities, the London Plan, fire, some housing money." }] : []),
    ...(ca && ca.mayor ? [{ layer: "Combined authority", area: ca.name, who: "A directly elected mayor, with the leaders of the member councils", does: "Transport, adult skills, strategic planning and housing money across the area; varies by deal." }] : []),
    ...(pc.senedd_constituency ? [{ layer: "Senedd", area: pc.senedd_constituency, who: "Members of the Senedd, elected", does: "Health, education, transport, housing and the environment in Wales." }] : []),
    ...(pc.country === "Scotland" ? [{ layer: "Scottish Parliament", area: "Your Holyrood constituency and region", who: "MSPs, elected", does: "Health, education, justice, transport, housing and income tax rates in Scotland." }] : []),
    ...(pc.country === "Northern Ireland" && pc.parliamentary_constituency ? [{ layer: "Northern Ireland Assembly", area: pc.parliamentary_constituency, who: "MLAs, elected", does: "Health, education, justice, agriculture and most domestic matters in Northern Ireland." }] : []),
  ];
  // Unelected bodies, behind "Who else runs things here" (Romily, round six q11): named, with what they decide, never in the elected list.
  const unelected: { layer: string; area: string; who: string; does: string }[] = [
    ...(pc.icb && !/pseudo|non-/i.test(pc.icb) ? [{ layer: "NHS integrated care board", area: pc.icb, who: "An appointed board", does: "Plans and pays for most NHS services in its area." }] : []),
    ...(fra && fra.governance !== "mayor" && !(lad && W.gla.includes(lad)) ? [{ layer: "Fire and rescue authority", area: fra.name, who: fra.governance === "pfcc" ? "The elected Police, Fire and Crime Commissioner" : fra.governance === "county" ? "The county council" : "A board of councillors nominated by the member councils", does: "Runs the fire and rescue service and sets its share of council tax." }] : []),
    ...(ca && !ca.mayor ? [{ layer: "Combined authority", area: ca.name, who: "The leaders of the member councils; no directly elected mayor yet", does: "Transport, skills and strategic planning across the area." }] : []),
    ...(pc.national_park && !/non-National Park|non national/i.test(pc.national_park) ? [{ layer: "National park authority", area: pc.national_park, who: "An appointed authority with some councillors", does: "Planning decisions inside the park." }] : []),
  ];
  return (
    <section className="layers" aria-labelledby="layers-heading">
      <h2 id="layers-heading">Everyone who represents {pc.postcode.split(" ")[0]}</h2>
      <p className="meta">Your address sits inside several areas at once, each with different people and different powers. {electionCouncil ? "The one this election is for is marked." : ""}</p>
      <div className="layers-grid">
        {rows.map((r) => (
          <div key={r.layer} className={`layer${r.now ? " now" : ""}`}>
            <p className="layer-name">{r.layer}{r.now ? <span className="layer-tag">This election</span> : null}</p>
            <p className="layer-area">{r.area}</p>
            <p className="small" style={{ margin: "0.2rem 0" }}><strong>{r.who}</strong></p>
            <p className="meta" style={{ margin: 0 }}>{r.does}</p>
          </div>
        ))}
      </div>
      {councilSlug ? <p className="small"><Link href={`/council/${councilSlug}`}>What&rsquo;s happening at {pc.admin_district} council &rarr;</Link> <span className="meta">housing, transport, council tax, environment and schools, from the council&rsquo;s own papers.</span></p> : null}
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
