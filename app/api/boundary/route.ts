import { NextResponse, type NextRequest } from "next/server";
export const dynamic = "force-dynamic";
import { getBallot } from "@/lib/data";

// Boundary of the voting area from the ONS Open Geography Portal (Open Government Licence). No key, cached a day.
const BASE = "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services";
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("ballot") ?? "";
  const b = await getBallot(id);
  if (!b) return NextResponse.json({ error: "unknown ballot" }, { status: 404 });
  let svc = "Westminster_Parliamentary_Constituencies_July_2024_Boundaries_UK_BGC", field = "PCON24NM", code = "PCON24CD", name = b.area_name;
  if (b.level === "local") { svc = "Wards_December_2024_Boundaries_UK_BGC"; field = "WD24NM"; code = "WD24CD"; name = b.area_name.replace(/^.*?:\s*/, "").replace(/\s+ward$/i, ""); }
  // Prefer the official code: ward names repeat across the country.
  const where = b.area_gss ? `${code}='${b.area_gss}'` : `${field}='${name.replace(/'/g, "''")}'`;
  const url = `${BASE}/${svc}/FeatureServer/0/query?where=${encodeURIComponent(where)}&outFields=${field}&outSR=4326&f=geojson`;
  let gj: unknown;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 604800 } });
    if (!r.ok) return NextResponse.json({ error: "boundary unavailable" }, { status: 502 });
    gj = await r.json();
  } catch { return NextResponse.json({ error: "boundary timed out" }, { status: 504 }); }
  return NextResponse.json(gj, { headers: { "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400", "Netlify-Vary": "query" } });
}
