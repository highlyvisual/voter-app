import { NextResponse } from "next/server";
import { getBallot, listCandidates, listVerifiedClaims } from "@/lib/data";
// WP-B14: read-only JSON per ballot. CC BY-SA 4.0.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ballotId = decodeURIComponent(id);
  const ballot = await getBallot(ballotId); if (!ballot) return NextResponse.json({ error: "unknown ballot" }, { status: 404 });
  const [candidates, claims] = await Promise.all([listCandidates(ballotId), listVerifiedClaims(ballotId)]);
  return NextResponse.json({ licence: "CC BY-SA 4.0", attribution: "What's It To Me (whatsittome.org); candidate data Democracy Club CC BY 4.0", generated_at: new Date().toISOString(), ballot, candidates, claims }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
