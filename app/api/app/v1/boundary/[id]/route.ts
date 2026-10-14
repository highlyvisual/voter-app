import { NextResponse } from "next/server";
import { getBallot } from "@/lib/data";
import { BOUNDARY_SOURCE, fetchBoundary, outerRings } from "@/lib/boundary";
import type { BoundaryResponse } from "@/lib/appApi";
export const dynamic = "force-dynamic";

// Phone app, contract v1 (lib/appApi.ts: add optional fields only, never rename or remove). Added for app 0.3.0.
// The voting area's outline for the drawn map on Home. The same ONS boundary as the website's map (app/api/boundary),
// reduced to outer rings. Nothing about the viewer is sent or used.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ballotId = decodeURIComponent(id);
  const reply = (res: BoundaryResponse, status = 200) =>
    NextResponse.json(res, { status, headers: { "Cache-Control": status === 200 ? "public, max-age=604800, stale-while-revalidate=86400" : "no-store" } });
  if (!/^[a-z0-9.-]{3,200}$/i.test(ballotId)) return reply({ ok: false, message: "That isn't a ballot we know." }, 400);

  let ballot;
  try { ballot = await getBallot(ballotId); } catch { return reply({ ok: false, message: "We couldn't load this area just now." }, 503); }
  if (!ballot) return reply({ ok: false, message: "We don't have a page for this ballot yet." }, 404);
  const r = await fetchBoundary(ballot);
  if (!r.ok) return reply({ ok: false, message: "The area's outline isn't available just now." }, r.status);
  const rings = outerRings(r);
  if (!rings.length) return reply({ ok: false, message: "No outline was published for this area." }, 404);
  return reply({ ok: true, area: ballot.area_name, rings, source: BOUNDARY_SOURCE });
}
