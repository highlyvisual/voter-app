import { NextResponse, type NextRequest } from "next/server";
import { publicClient } from "@/lib/data";
export const dynamic = "force-dynamic";
// Local issues around a point, from planning.data.gov.uk (Open Government Licence).
// Two kinds: areas you are inside (a conservation area, an Article 4 direction) and sites nearby you can tap
// (a housing site with a dwelling count, a school, an air-quality zone). Each links to its official record and to
// what candidates on this ballot have published on the topic it belongs to.
const H = { "User-Agent": "voter-app" };
// Layer colours are muted and deliberately unlike any UK party's colour (Barny, 24 Sept): no Conservative blue, Labour red,
// Lib Dem amber, Green lime, Reform cyan, SNP yellow, Plaid teal or UKIP purple, and no two layers share a family.
type Layer = { dataset: string; label: string; colour: string; topic: string; note: string; mode: "area" | "site"; more: string; whatItMeans: string };
const LAYERS: Layer[] = [
  { dataset: "brownfield-land", label: "Land identified for homes", colour: "#7b3f00", topic: "housing_and_property", note: "On the council's brownfield register: land it considers suitable for housing, with the number of homes it estimates. Not all of it gets built.", mode: "site", more: "https://www.gov.uk/guidance/brownfield-land-registers", whatItMeans: "Previously developed land the council has put on its brownfield register as suitable for housing. Being on the register is not planning permission and not a plan to build; it is a list of where homes could go." },
  { dataset: "educational-establishment", label: "School or college", colour: "#111111", topic: "education_and_universities", note: "From the Department for Education's register.", mode: "site", more: "https://get-information-schools.service.gov.uk/", whatItMeans: "A school, college or nursery on the Department for Education's register. Shown because education policy lands here: admissions, funding, buildings, SEND." },
  { dataset: "air-quality-management-area", label: "Air quality management area", colour: "#757575", topic: "environment_climate_and_energy", note: "An area a council has declared because air pollution exceeds national limits.", mode: "area", more: "https://uk-air.defra.gov.uk/aqma/", whatItMeans: "An area the council has formally declared because air pollution (usually nitrogen dioxide from traffic) breaks national limits. The council must publish a plan to improve it." },
  { dataset: "ancient-woodland", label: "Ancient woodland", colour: "#3f5a36", topic: "environment_climate_and_energy", note: "Woodland continuously present since 1600; strongly protected in planning decisions.", mode: "area", more: "https://www.gov.uk/guidance/ancient-woodland-ancient-trees-and-veteran-trees-advice-for-making-planning-decisions", whatItMeans: "Woodland that has existed continuously since at least 1600. National policy says development that would destroy it should be refused except in wholly exceptional circumstances." },
  { dataset: "green-belt", label: "Green belt", colour: "#7c7c1e", topic: "housing_and_property", note: "Land where building is tightly restricted to stop urban sprawl.", mode: "area", more: "https://www.gov.uk/guidance/green-belt", whatItMeans: "Land around a town where building is tightly restricted to stop it sprawling. Whether to release some for housing is a live argument in many councils." },
  { dataset: "conservation-area", label: "Conservation area", colour: "#7d6b91", topic: "housing_and_property", note: "Extra planning controls on demolition, extensions and trees.", mode: "area", more: "https://www.gov.uk/guidance/conserving-and-enhancing-the-historic-environment", whatItMeans: "An area the council has designated for its architectural or historic character: a Victorian terrace, a village centre, a seafront. Inside it, demolition, some extensions and work to trees need permission that would not be needed elsewhere. It says nothing about wealth or house prices; many ordinary streets are in one." },
  { dataset: "article-4-direction-area", label: "Article 4 direction", colour: "#2f6f6a", topic: "housing_and_property", note: "Some permitted development rights are withdrawn here, so works that normally need no permission do need it.", mode: "area", more: "https://www.gov.uk/guidance/when-is-permission-required", whatItMeans: "An area where the council has withdrawn some 'permitted development' rights, so changes that normally need no permission (a loft extension, turning a house into flats, replacing windows) do need it here. Often used to protect character or limit conversions to bedsits." },
  { dataset: "flood-risk-zone", label: "Flood risk zone", colour: "#5b7c99", topic: "environment_climate_and_energy", note: "Mapped flood risk, used in planning decisions.", mode: "area", more: "https://www.gov.uk/guidance/flood-risk-and-coastal-change", whatItMeans: "Land the Environment Agency maps as at risk of flooding from rivers or the sea (zones 2 and 3), ignoring flood defences. It shapes what can be built and affects insurance." },
];
function bbox(lng: number, lat: number, d = 0.012) {
  return `POLYGON((${lng - d} ${lat - d},${lng + d} ${lat - d},${lng + d} ${lat + d},${lng - d} ${lat + d},${lng - d} ${lat - d}))`;
}
export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat")); const lng = Number(req.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: "bad point" }, { status: 400 });
  const out: (Layer & { geojson: unknown; count: number })[] = [];
  await Promise.all(LAYERS.map(async (l) => {
    try {
      const url = `https://www.planning.data.gov.uk/entity.geojson?dataset=${l.dataset}&geometry=${encodeURIComponent(bbox(lng, lat))}&geometry_relation=intersects&limit=${l.mode === "site" ? 60 : 12}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(6000), headers: H, next: { revalidate: 604800 } });
      if (!r.ok) return;
      const gj = await r.json();
      if (gj?.features?.length) out.push({ ...l, geojson: gj, count: gj.features.length });
    } catch { /* optional */ }
  }));
  const ballot = req.nextUrl.searchParams.get("ballot");
  const published: Record<string, number> = {};
  if (ballot) {
    const [{ data: cl }, { data: cands }] = await Promise.all([
      publicClient().from("current_claims").select("topic, candidate_id, party_ec_id").eq("ballot_paper_id", ballot).eq("status", "verified"),
      publicClient().from("candidates").select("id, party_ec_id").eq("ballot_paper_id", ballot),
    ]);
    const byTopic = new Map<string, Set<number>>();
    for (const c of cl ?? []) for (const cand of cands ?? []) if (c.candidate_id === cand.id || (c.candidate_id === null && c.party_ec_id && c.party_ec_id === cand.party_ec_id)) { const s2 = byTopic.get(c.topic) ?? new Set(); s2.add(cand.id); byTopic.set(c.topic, s2); }
    for (const [t, s2] of byTopic) published[t] = s2.size;
  }
  return NextResponse.json({ layers: out, published }, { headers: { "Cache-Control": "public, max-age=604800", "Netlify-Vary": "query" } });
}
