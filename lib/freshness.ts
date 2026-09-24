import { publicClient } from "@/lib/data";

// When each kind of data was last refreshed. Read straight from the records themselves, so the page cannot claim to be
// up to date when it isn't: every figure is the newest timestamp actually stored against that kind of row.
export type Freshness = {
  now: string;
  ballots: string | null; candidates: string | null; leaflets: string | null; claims: string | null; ledger: string | null;
  liveBallots: number; stale: { id: string; area: string; at: string | null }[];
};
const max = (rows: { t: string | null }[] | null) => (rows ?? []).map((r) => r.t).filter(Boolean).sort().at(-1) ?? null;

export async function freshness(): Promise<Freshness> {
  const db = publicClient();
  const cutoff = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
  const [b, c, l, cl, lg] = await Promise.all([
    db.from("ballots").select("ballot_paper_id, area_name, retrieved_at").eq("archived", false),
    db.from("candidates").select("retrieved_at").order("retrieved_at", { ascending: false }).limit(1),
    db.from("leaflets").select("retrieved_at").order("retrieved_at", { ascending: false }).limit(1),
    db.from("claims").select("created_at").order("created_at", { ascending: false }).limit(1),
    db.from("change_log").select("created_at").order("created_at", { ascending: false }).limit(1),
  ]);
  const ballots = b.data ?? [];
  return {
    now: new Date().toISOString(),
    ballots: max(ballots.map((r) => ({ t: r.retrieved_at }))),
    candidates: (c.data ?? [])[0]?.retrieved_at ?? null,
    leaflets: (l.data ?? [])[0]?.retrieved_at ?? null,
    claims: (cl.data ?? [])[0]?.created_at ?? null,
    ledger: (lg.data ?? [])[0]?.created_at ?? null,
    liveBallots: ballots.length,
    stale: ballots.filter((r) => !r.retrieved_at || r.retrieved_at < cutoff).map((r) => ({ id: r.ballot_paper_id, area: r.area_name, at: r.retrieved_at })),
  };
}

export function ago(iso: string | null, now: string): string {
  if (!iso) return "never";
  const mins = Math.max(0, Math.round((new Date(now).getTime() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}
export const stamp = (iso: string | null) => (iso ? `${new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC` : "—");
