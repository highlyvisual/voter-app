import { NextResponse, type NextRequest } from "next/server";
export const dynamic = "force-dynamic";
import { getBallot } from "@/lib/data";
import { fetchBoundary } from "@/lib/boundary";

// Boundary of the voting area from the ONS Open Geography Portal (Open Government Licence). No key, cached a day.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("ballot") ?? "";
  const b = await getBallot(id);
  if (!b) return NextResponse.json({ error: "unknown ballot" }, { status: 404 });
  const r = await fetchBoundary(b);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json(r.geojson, { headers: { "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400", "Netlify-Vary": "query" } });
}
