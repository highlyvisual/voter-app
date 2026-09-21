import { NextResponse, type NextRequest } from "next/server";
import { publicClient } from "@/lib/data";
export const dynamic = "force-dynamic";
// Local issues around a point, from planning.data.gov.uk (Open Government Licence).
// Two kinds: areas you are inside (a conservation area, an Article 4 direction) and sites nearby you can tap
// (a housing site with a dwelling count, a school, an air-quality zone). Each links to its official record and to
// what candidates on this ballot have published on the topic it belongs to.
const H = { "User-Agent": "voter-app" };
type Layer = { dataset: string; label: string; colour: string; topic: string; note: string; mode: "area" | "site" };
const LAYERS: Layer[] = [
  { dataset: "brownfield-land", label: "Land identified for homes", colour: "#b3541e", topic: "housing_and_property", note: "On the council's brownfield register: land it considers suitable for housing, with the number of homes it estimates. Not all of it gets built.", mode: "site" },
  { dataset: "educational-establishment", label: "School or college", colour: "#0087DC", topic: "education_and_universities", note: "From the Department for Education's register.", mode: "site" },
  { dataset: "air-quality-management-area", label: "Air quality management area", colour: "#6d3177", topic: "environment_climate_and_energy", note: "An area a council has declared because air pollution exceeds national limits.", mode: "area" },
  { dataset: "ancient-woodland", label: "Ancient woodland", colour: "#02a95b", topic: "environment_climate_and_energy", note: "Woodland continuously present since 1600; strongly protected in planning decisions.", mode: "area" },
  { dataset: "green-belt", label: "Green belt", colour: "#1f7a3f", topic: "housing_and_property", note: "Land where building is tightly restricted to stop urban sprawl.", mode: "area" },
  { dataset: "conservation-area", label: "Conservation area", colour: "#8b5e34", topic: "housing_and_property", note: "Extra planning controls on demolition, extensions and trees.", mode: "area" },
  { dataset: "article-4-direction-area", label: "Article 4 direction", colour: "#b8860b", topic: "housing_and_property", note: "Some permitted development rights are withdrawn here, so works that normally need no permission do need it.", mode: "area" },
  { dataset: "flood-risk-zone", label: "Flood risk zone", colour: "#1f6feb", topic: "environment_climate_and_energy", note: "Mapped flood risk, used in planning decisions.", mode: "area" },
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
      const r = await fetch(url, { headers: H, next: { revalidate: 604800 } });
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
