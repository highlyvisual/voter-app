import { NextResponse, type NextRequest } from "next/server";
import { stopsNear } from "@/lib/transportStops";
import { wasteSitesNear } from "@/lib/wasteSites";
import { lpaAt, type PlaceFacts } from "@/lib/lifeAreas";
export const dynamic = "force-dynamic";
// Local issues around a point, from planning.data.gov.uk (Open Government Licence).
// Two kinds: areas you are inside (a conservation area, an Article 4 direction) and sites nearby you can tap
// (a housing site with a dwelling count, a school, an air-quality zone). Each links to its official record and to
// what candidates on this ballot have published on the topic it belongs to.
const H = { "User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)" };
// Layer colours are muted and deliberately unlike any UK party's colour (Barny, 24 Sept): no Conservative blue, Labour red,
// Lib Dem amber, Green lime, Reform cyan, SNP yellow, Plaid teal or UKIP purple, and no two layers share a family.
// 29 Oct (Romily's map design): each layer sits in one of five life areas (lib/lifeAreas.ts) and takes a shade of that
// area's hue where it can: browns for homes, olive and steel for the environment, rose and wine for getting around,
// lilac for education, slate for safety. Stations are wine, not the dark blue that read as Conservative; nothing is a
// party green or a strong blue.
type Layer = { dataset: string; label: string; colour: string; topic: string; note: string; mode: "area" | "site"; more: string; whatItMeans: string };
const LAYERS: Layer[] = [
  { dataset: "brownfield-land", label: "Land identified for homes", colour: "#7b3f00", topic: "housing_and_property", note: "On the council's brownfield register: land it considers suitable for housing, with the number of homes it estimates. Not all of it gets built.", mode: "site", more: "https://www.gov.uk/guidance/brownfield-land-registers", whatItMeans: "Previously developed land the council has put on its brownfield register as suitable for housing. Being on the register is not planning permission and not a plan to build; it is a list of where homes could go." },
  { dataset: "educational-establishment", label: "School or college", colour: "#7a6a9e", topic: "education_and_universities", note: "From the Department for Education's register.", mode: "site", more: "https://get-information-schools.service.gov.uk/", whatItMeans: "A school, college or nursery on the Department for Education's register. Shown because education policy lands here: admissions, funding, buildings, SEND." },
  { dataset: "air-quality-management-area", label: "Air quality management area", colour: "#757575", topic: "environment_climate_and_energy", note: "An area a council has declared because air pollution exceeds national limits.", mode: "area", more: "https://uk-air.defra.gov.uk/aqma/", whatItMeans: "An area the council has formally declared because air pollution (usually nitrogen dioxide from traffic) breaks national limits. The council must publish a plan to improve it." },
  { dataset: "ancient-woodland", label: "Ancient woodland", colour: "#4f6b3a", topic: "environment_climate_and_energy", note: "Woodland continuously present since 1600; strongly protected in planning decisions.", mode: "area", more: "https://www.gov.uk/guidance/ancient-woodland-ancient-trees-and-veteran-trees-advice-for-making-planning-decisions", whatItMeans: "Woodland that has existed continuously since at least 1600. National policy says development that would destroy it should be refused except in wholly exceptional circumstances." },
  { dataset: "green-belt", label: "Green belt", colour: "#9a9a4a", topic: "housing_and_property", note: "Land where building is tightly restricted to stop urban sprawl.", mode: "area", more: "https://www.gov.uk/guidance/green-belt", whatItMeans: "Land around a town where building is tightly restricted to stop it sprawling. Whether to release some for housing is a live argument in many councils." },
  { dataset: "conservation-area", label: "Conservation area", colour: "#a1887f", topic: "housing_and_property", note: "Extra planning controls on demolition, extensions and trees.", mode: "area", more: "https://www.gov.uk/guidance/conserving-and-enhancing-the-historic-environment", whatItMeans: "An area the council has designated for its architectural or historic character: a Victorian terrace, a village centre, a seafront. Inside it, demolition, some extensions and work to trees need permission that would not be needed elsewhere. It says nothing about wealth or house prices; many ordinary streets are in one." },
  { dataset: "article-4-direction-area", label: "Article 4 direction", colour: "#c08552", topic: "housing_and_property", note: "Some permitted development rights are withdrawn here, so works that normally need no permission do need it.", mode: "area", more: "https://www.gov.uk/guidance/when-is-permission-required", whatItMeans: "An area where the council has withdrawn some 'permitted development' rights, so changes that normally need no permission (a loft extension, turning a house into flats, replacing windows) do need it here. Often used to protect character or limit conversions to bedsits." },
  { dataset: "flood-risk-zone", label: "Flood risk zone", colour: "#6a8294", topic: "environment_climate_and_energy", note: "Mapped flood risk, used in planning decisions.", mode: "area", more: "https://www.gov.uk/guidance/flood-risk-and-coastal-change", whatItMeans: "Land the Environment Agency maps as at risk of flooding from rivers or the sea (zones 2 and 3), ignoring flood defences. It shapes what can be built and affects insurance." },
];
function bbox(lng: number, lat: number, d = 0.012) {
  return `POLYGON((${lng - d} ${lat - d},${lng + d} ${lat - d},${lng + d} ${lat + d},${lng - d} ${lat + d},${lng - d} ${lat - d}))`;
}
export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat")); const lng = Number(req.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: "bad point" }, { status: 400 });
  const out: (Layer & { geojson: unknown; count: number; capped?: boolean; month?: string; level?: string })[] = [];
  await Promise.all(LAYERS.map(async (l) => {
    try {
      const url = `https://www.planning.data.gov.uk/entity.geojson?dataset=${l.dataset}&geometry=${encodeURIComponent(bbox(lng, lat))}&geometry_relation=intersects&limit=${l.mode === "site" ? 60 : 12}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(6000), headers: H, next: { revalidate: 604800 } });
      if (!r.ok) return;
      const gj = await r.json();
      if (!gj?.features?.length) return;
      // Flood zones come as many fragments, so a count means nothing: the highest zone level present is what's shown.
      const level = l.dataset === "flood-risk-zone" ? String(Math.max(...gj.features.map((f: { properties?: Record<string, string> }) => Number(f.properties?.["flood-risk-level"]) || 0))) : undefined;
      out.push({ ...l, geojson: gj, count: gj.features.length, capped: gj.features.length >= (l.mode === "site" ? 60 : 12), ...(level && level !== "0" ? { level } : {}) });
    } catch { /* optional */ }
  }));
  // Who is responsible for each layer here (lib/lifeAreas.ts) is worked out from these facts, on the page.
  let facts: PlaceFacts | null = null;
  // Recorded crime (round eight q6: "crime rates" on the map). data.police.uk street-level crimes within about a mile of
  // the point for the latest published month, grouped by the anonymised location the police give (a street or a public
  // place, never an address). Open Government Licence. Counts, not rates: busy places record more.
  try {
    const month = (await fetch("https://data.police.uk/api/crimes-street-dates", { signal: AbortSignal.timeout(5000), headers: H, next: { revalidate: 86400 } }).then((r) => (r.ok ? r.json() : null)))?.[0]?.date as string | undefined;
    if (month) {
      const rows = await fetch(`https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${month}`, { signal: AbortSignal.timeout(6000), headers: H, next: { revalidate: 86400 } }).then((r) => (r.ok ? r.json() : null));
      if (Array.isArray(rows) && rows.length) {
        const by = new Map<string, { lat: number; lng: number; street: string; n: number; cats: Map<string, number> }>();
        for (const c of rows as { category: string; location?: { latitude: string; longitude: string; street?: { name?: string } } }[]) {
          if (!c.location) continue;
          const key = `${c.location.latitude},${c.location.longitude}`;
          const e = by.get(key) ?? { lat: Number(c.location.latitude), lng: Number(c.location.longitude), street: c.location.street?.name ?? "Near this point", n: 0, cats: new Map() };
          e.n++; e.cats.set(c.category, (e.cats.get(c.category) ?? 0) + 1); by.set(key, e);
        }
        const [y, m] = month.split("-").map(Number);
        const monthText = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
        const features = [...by.values()].map((e) => ({ type: "Feature", geometry: { type: "Point", coordinates: [e.lng, e.lat] }, properties: { name: `${e.street}: ${e.n} recorded in ${monthText}`, street: e.street, n: String(e.n), month: monthText, detail: [...e.cats.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k.replace(/-/g, " ")} ${v}`).join(", ") } }));
        out.push({ dataset: "police-crime", month: monthText, label: `Recorded crime, ${monthText}`, colour: "#4a5a68", topic: "crime_policing_and_justice", mode: "site", more: "https://data.police.uk/about/", note: "Crimes recorded by the police within about a mile, placed at the nearest anonymised point the police publish (a street or a public place, never an address). A count, not a rate: town centres and stations record more because more people pass through.", whatItMeans: "Crimes the police recorded in the latest month they have published, within about a mile of your postcode. Each dot is the anonymised point the police publish, not the scene of the crime. It reflects reporting and policing as well as offending.", geojson: { type: "FeatureCollection", features }, count: rows.length });
      }
    }
  } catch { /* optional */ }
  // Transport and waste (round eight q6, next batch, 29 Sept): public transport stops and stations from the DfT's NaPTAN
  // register, and permitted waste sites from each nation's regulator. Which nation the point is in comes from postcodes.io
  // (rounded point only, cached a week); the layers say what is there and link the regulator's own record, nothing more.
  // Colours, as above, unlike any party's and unlike each other: dusty rose for bus stops, wine for stations, dark moss for waste sites.
  try {
    const pc = await fetch(`https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}&limit=1&radius=600`, { signal: AbortSignal.timeout(5000), headers: H, next: { revalidate: 604800 } }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const p = pc?.result?.[0] ?? {};
    const place = { country: (p.country as string | null) ?? null, district: (p.admin_district as string | null) ?? null, county: (p.admin_county as string | null) ?? null };
    facts = { ...place, lad: p.codes?.admin_district ?? null, parish: p.parish ?? null, pfa: p.pfa ?? null, lpa: place.country === "England" ? await lpaAt(lat, lng) : null };
    const feature = (x: { name: string; detail: string; lat: number; lng: number; record: string; recordLabel?: string; polygon?: number[][][] }) => ({ type: "Feature", geometry: x.polygon ? { type: "Polygon", coordinates: x.polygon } : { type: "Point", coordinates: [x.lng, x.lat] }, properties: { name: x.name, detail: x.detail, record: x.record, recordLabel: x.recordLabel ?? "The official record" } });
    const [t, w] = await Promise.all([stopsNear(lat, lng, place), wasteSitesNear(lat, lng, place.country)]);
    const naptan = t?.source === "NaPTAN API" ? "the DfT's NaPTAN register (its file for this council area)" : "the DfT's NaPTAN register via planning.data.gov.uk";
    if (t?.stops.length) out.push({ dataset: "transport-stops", label: "Bus and coach stops", colour: "#c48a9a", topic: "transport", mode: "site", more: "https://www.gov.uk/government/publications/national-public-transport-access-node-schema", note: `Bus and coach stops within about 700 m, from ${naptan} (Open Government Licence). A stop on the register may have few or no services; timetables are the operators'.`, whatItMeans: "Every bus and coach stop the Department for Transport's national register lists near your postcode. It shows where buses are meant to stop, not how often they come: bus services and their funding are decided by the council, the combined authority and the operators.", geojson: { type: "FeatureCollection", features: t.stops.map(feature) }, count: t.stops.length });
    if (t?.stations.length) out.push({ dataset: "transport-stations", label: "Stations, tram stops, ferries and taxi ranks", colour: "#6d2e46", topic: "transport", mode: "site", more: "https://www.gov.uk/government/publications/national-public-transport-access-node-schema", note: `Railway, underground, metro and tram stations, ferry terminals, airports and taxi ranks within about 1.5 km, from ${naptan} (Open Government Licence). One dot per station.`, whatItMeans: "Where a train, tram, ferry or taxi journey starts near your postcode, from the Department for Transport's national register of access points. Rail services are franchised or run by the state; local decisions are about stations, access and the buses that reach them.", geojson: { type: "FeatureCollection", features: t.stations.map(feature) }, count: t.stations.length });
    if (w?.sites.length) {
      const reg = w.source === "SEPA" ? "the Scottish Environment Protection Agency" : w.source === "Natural Resources Wales" ? "Natural Resources Wales" : "the Environment Agency";
      out.push({ dataset: "waste-sites", label: "Permitted waste sites", colour: "#2f4f2f", topic: "environment_climate_and_energy", mode: "site", more: w.source === "SEPA" ? "https://www.sepa.org.uk/regulations/waste/" : w.source === "Natural Resources Wales" ? "https://naturalresources.wales/permits-and-permissions/waste-permitting/" : "https://www.gov.uk/guidance/waste-environmental-permits", note: `Sites within about 1.5 km that ${reg} has permitted, licensed or registered for handling waste (recycling, transfer, treatment, scrapyards, landfill), with the regulator's own description. Shaded areas are authorised landfill boundaries. Not every site is open to the public.`, whatItMeans: "Places near your postcode where the environmental regulator allows waste to be stored, sorted, treated, recycled or buried, from its public register. It says what is permitted, not what is happening today. Household bin collection and recycling centres are the council's business; the permits are the regulator's.", geojson: { type: "FeatureCollection", features: w.sites.map(feature) }, count: w.sites.length });
    }
  } catch { /* optional */ }
  return NextResponse.json({ layers: out, place: facts }, { headers: { "Cache-Control": "public, max-age=604800", "Netlify-Vary": "query" } });
}
