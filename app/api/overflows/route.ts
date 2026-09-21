import { NextResponse, type NextRequest } from "next/server";
import { overflowsNear } from "@/lib/overflows";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat")); const lng = Number(req.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: "bad point" }, { status: 400 });
  const overflows = await overflowsNear(lat, lng);
  return NextResponse.json({ overflows }, { headers: { "Cache-Control": "public, max-age=900", "Netlify-Vary": "query" } });
}
