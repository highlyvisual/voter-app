import type { Ballot } from "@/lib/data";

// The voting area's boundary from the ONS Open Geography Portal (Open Government Licence), as GeoJSON. No key. Used by
// the website's map (app/api/boundary) and the phone app (app/api/app/v1/boundary). Server only.
const BASE = "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services";
export const BOUNDARY_SOURCE = "ONS Open Geography Portal (Open Government Licence)";

export type BoundaryResult = { ok: true; geojson: { features?: { geometry?: { type: string; coordinates: unknown } }[] } } | { ok: false; status: number; error: string };

export async function fetchBoundary(b: Pick<Ballot, "level" | "area_name" | "area_gss">): Promise<BoundaryResult> {
  let svc = "Westminster_Parliamentary_Constituencies_July_2024_Boundaries_UK_BGC", field = "PCON24NM", code = "PCON24CD", name = b.area_name;
  if (b.level === "local") { svc = "Wards_December_2024_Boundaries_UK_BGC"; field = "WD24NM"; code = "WD24CD"; name = b.area_name.replace(/^.*?:\s*/, "").replace(/\s+ward$/i, ""); }
  // Prefer the official code: ward names repeat across the country.
  const where = b.area_gss ? `${code}='${b.area_gss}'` : `${field}='${name.replace(/'/g, "''")}'`;
  const url = `${BASE}/${svc}/FeatureServer/0/query?where=${encodeURIComponent(where)}&outFields=${field}&outSR=4326&f=geojson`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 604800 } });
    if (!r.ok) return { ok: false, status: 502, error: "boundary unavailable" };
    return { ok: true, geojson: await r.json() };
  } catch { return { ok: false, status: 504, error: "boundary timed out" }; }
}

// Outer rings only, as [lng, lat] pairs rounded to 5 decimal places (about 1 m), which is all a drawn outline needs.
export function outerRings(gj: BoundaryResult & { ok: true }): [number, number][][] {
  const rings: [number, number][][] = [];
  const round = (p: unknown): [number, number] => { const [x, y] = p as number[]; return [Math.round(x * 1e5) / 1e5, Math.round(y * 1e5) / 1e5]; };
  for (const f of gj.geojson.features ?? []) {
    const g = f.geometry;
    if (g?.type === "Polygon") rings.push(((g.coordinates as unknown[][])[0] ?? []).map(round));
    else if (g?.type === "MultiPolygon") for (const poly of g.coordinates as unknown[][][]) rings.push((poly[0] ?? []).map(round));
  }
  return rings.filter((r) => r.length >= 4);
}
