import { publicClient } from "@/lib/data";
import { currentMp } from "@/components/Representatives";
// Everyone who represents this postcode, layer by layer. Areas overlap rather than nest: a postcode has one MP, one or
// two councils, perhaps a parish, and a police area, each with different powers. Idea adapted from Beyond the Vote's
// "My place"; data from postcodes.io (ONS geography), UK Parliament and Open Council Data.
type Pc = { postcode: string; parliamentary_constituency: string | null; admin_district: string | null; admin_county: string | null; admin_ward: string | null; ced: string | null; parish: string | null; pfa: string | null; country: string | null };
const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
async function cllrs(council: string | null, ward: string | null) {
  if (!council || !ward) return [];
  const { data } = await publicClient().from("councillors").select("name, party_name, ward").ilike("council", council);
  return (data ?? []).filter((r) => norm(r.ward) === norm(ward));
}
export default async function Layers({ lat, lng, electionCouncil }: { lat: number; lng: number; electionCouncil: string | null }) {
  let pc: Pc | null = null;
  try { pc = (await fetch(`https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}&limit=1&radius=500`, { next: { revalidate: 604800 } }).then((r) => r.json()))?.result?.[0] ?? null; } catch { pc = null; }
  if (!pc) return null;
  const twoTier = Boolean(pc.admin_county);
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
      <p className="meta">Areas from the ONS via postcodes.io; MP from UK Parliament; councillors from Open Council Data as recorded after the May 2026 elections. Council responsibilities vary slightly by area; the council's own website is definitive.</p>
    </section>
  );
}
