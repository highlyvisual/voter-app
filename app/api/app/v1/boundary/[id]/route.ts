import { NextResponse } from "next/server";
import { getBallot } from "@/lib/data";
import { BOUNDARY_SOURCE, fetchBoundary, outerRings } from "@/lib/boundary";
import { OSM_CREDIT, fetchMapContext } from "@/lib/mapContext";
import type { BoundaryResponse } from "@/lib/appApi";
export const dynamic = "force-dynamic";

// Phone app, contract v1 (lib/appApi.ts: add optional fields only, never rename or remove). Added for app 0.3.0.
// The voting area's outline for the drawn map on Home. The same ONS boundary as the website's map (app/api/boundary),
// reduced to outer rings, with main roads and place names around it. Nothing about the viewer is sent or used.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ballotId = decodeURIComponent(id);
  // A full reply keeps a week; one without roads (OpenStreetMap didn't answer) only ten minutes, so they are filled in.
  const reply = (res: BoundaryResponse, status = 200) =>
    NextResponse.json(res, { status, headers: { "Cache-Control": status !== 200 ? "no-store" : res.ok && res.roads ? "public, max-age=604800, stale-while-revalidate=86400" : "public, max-age=600" } });
  if (!/^[a-z0-9.-]{3,200}$/i.test(ballotId)) return reply({ ok: false, message: "That isn't a ballot we know." }, 400);

  let ballot;
  try { ballot = await getBallot(ballotId); } catch { return reply({ ok: false, message: "We couldn't load this area just now." }, 503); }
  if (!ballot) return reply({ ok: false, message: "We don't have a page for this ballot yet." }, 404);
  const r = await fetchBoundary(ballot);
  if (!r.ok) return reply({ ok: false, message: "The area's outline isn't available just now." }, r.status);
  const rings = outerRings(r);
  if (!rings.length) return reply({ ok: false, message: "No outline was published for this area." }, 404);
  // Main roads and place names around it, so people can tell where it is (OpenStreetMap; optional).
  const pts = rings.flat();
  const ctx = await fetchMapContext([Math.min(...pts.map((q) => q[0])), Math.min(...pts.map((q) => q[1])), Math.max(...pts.map((q) => q[0])), Math.max(...pts.map((q) => q[1]))]);
  return reply({ ok: true, area: ballot.area_name, rings, source: BOUNDARY_SOURCE, ...(ctx ? { roads: ctx.roads, places: ctx.places } : {}), credits: [`Area outline: ${BOUNDARY_SOURCE}`, ...(ctx ? [OSM_CREDIT] : [])] });
}
