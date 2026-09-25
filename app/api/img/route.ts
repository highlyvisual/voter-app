import { NextResponse, type NextRequest } from "next/server";
export const dynamic = "force-dynamic";
// Image proxy for candidate photos and party emblems: only Democracy Club hosts, cached a week. Removes hotlink dependence and lets pages stay self-contained.
const ALLOWED = ["candidates.democracyclub.org.uk", "images.electionleaflets.org", "static-candidates.democracyclub.org.uk"];
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u") ?? "";
  let target: URL;
  try { target = new URL(u); } catch { return new NextResponse("bad url", { status: 400 }); }
  if (!ALLOWED.includes(target.hostname)) return new NextResponse("host not allowed", { status: 403 });
  let r: Response; let body: ArrayBuffer;
  try {
    r = await fetch(target.toString(), { headers: { "User-Agent": "voter-app image proxy" }, signal: AbortSignal.timeout(8000), next: { revalidate: 604800 } });
    if (!r.ok) return new NextResponse("upstream", { status: 502 });
    body = await r.arrayBuffer();
  } catch { return new NextResponse("upstream timed out", { status: 504 }); }
  return new NextResponse(body, { headers: { "Content-Type": r.headers.get("content-type") ?? "image/jpeg", "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400", "Netlify-Vary": "query" } });
}
