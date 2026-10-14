import { NextResponse, type NextRequest } from "next/server";
import { getReceiptSet, listReceiptSets } from "@/lib/data";
import { RECEIPT_FIELDS } from "@/lib/receipts";
import type { ReceiptSetResponse } from "@/lib/appApi";
export const dynamic = "force-dynamic";

// Phone app, contract v1: every household in one reform set, for the money layer. The app downloads the sets named by the
// ballot route, keeps them on the phone, and looks up its own household's row there, so the household's answers never
// leave the phone (not even as a key in a URL). The reply is the same for everyone, so it is cached hard: the ?v= query
// (the PolicyEngine version) changes the URL whenever the figures are recomputed.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const setId = decodeURIComponent(id);
  const fail = (message: string, status: number) => NextResponse.json({ ok: false, message } satisfies ReceiptSetResponse, { status, headers: { "Cache-Control": "no-store" } });
  if (!/^[A-Za-z0-9._-]{1,120}$/.test(setId)) return fail("That isn't a set of figures we know.", 400);

  let meta;
  try { meta = (await listReceiptSets()).find((s) => s.reform_set_id === setId); } catch { return fail("We couldn't load these figures just now. Please try again in a minute.", 503); }
  if (!meta) return fail("That isn't a set of figures we know.", 404);

  let rows;
  try { rows = await getReceiptSet(setId); } catch { return fail("We couldn't load these figures just now. Please try again in a minute.", 503); }
  const body: ReceiptSetResponse = {
    ok: true, id: meta.reform_set_id, party_ec_id: meta.party_ec_id, label: meta.label, year: meta.year, version: meta.policyengine_version,
    computed_at: meta.computed_at, fields: [...RECEIPT_FIELDS],
    rows: Object.fromEntries(rows.map((r) => [r.household_key, RECEIPT_FIELDS.map((f) => Number(r.results[f] ?? 0))])),
  };
  // Long cache only when the caller asked for the current version; otherwise a short one, so a stale link corrects itself.
  const current = req.nextUrl.searchParams.get("v") === meta.policyengine_version;
  const cache = current ? "public, max-age=31536000, immutable" : "public, max-age=300";
  return NextResponse.json(body, { headers: { "Cache-Control": cache, "Netlify-CDN-Cache-Control": cache } });
}
