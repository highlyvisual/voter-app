import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { publicClient } from "@/lib/data";

export const dynamic = "force-dynamic";

// Full public ledger as JSON with a SHA-256 over the canonical body. Publish this file before polling day.
export async function GET() {
  const db = publicClient();
  // PostgREST caps a response at 1,000 rows; page through every table so the snapshot is complete.
  async function all(table: string, select: string, order: string[]) {
    const out: unknown[] = [];
    for (let from = 0; ; from += 1000) {
      let q = db.from(table).select(select).range(from, from + 999);
      for (const o of order) q = q.order(o);
      const { data, error } = await q;
      if (error) throw error;
      out.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    return out;
  }
  const [claims, verifications, log, sources, grid] = await Promise.all([
    all("claims", "*", ["id"]),
    all("verifications", "*", ["id"]),
    all("change_log", "*", ["id"]),
    all("sources", "*", ["id"]),
    all("receipt_grid", "reform_set_id, party_ec_id, household_key, results, policyengine_version, computed_at", ["reform_set_id", "household_key"]),
  ]);
  const body = { claims, verifications, change_log: log, sources, receipt_grid: grid };
  const canonical = JSON.stringify(body);
  const sha256 = createHash("sha256").update(canonical).digest("hex");
  return NextResponse.json({ generated_at: new Date().toISOString(), sha256, ...body }, { headers: { "Cache-Control": "no-store" } });
}
