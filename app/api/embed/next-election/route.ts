import { NextResponse, type NextRequest } from "next/server";
import { checkPostcode } from "@/app/find/actions";
import { ballotsForPostcode } from "@/lib/democracyclub";
import { listBallots } from "@/lib/data";
import { longDate } from "@/lib/dates";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

// The "Your next election" box (Romily, round ten, q8). The postcode arrives in the POST body, never in an address, and
// is never logged or stored: it is used for the two lookups below and then discarded, as on /find. Both lookups are
// cached per postcode for an hour (lib/democracyclub.ts), which keeps the Democracy Club key's 1,000 a day for people
// rather than repeat visits. The response is never cached by the edge.
export type EmbedElection = { name: string; place: string; date: string; dateLabel: string; daysToGo: number; href: string };
export type EmbedResult =
  | { status: "ok"; elections: EmbedElection[] }
  | { status: "none" }
  | { status: "invalid"; message: string }
  | { status: "unavailable" };

const NO_STORE = { "Cache-Control": "no-store", "Netlify-CDN-Cache-Control": "no-store" };
const reply = (body: EmbedResult) => NextResponse.json(body, { headers: NO_STORE });

const londonToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const dayDiff = (from: string, to: string) => Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000);

export async function POST(req: NextRequest) {
  let postcode = "";
  try {
    const body = (await req.json()) as { postcode?: unknown };
    postcode = typeof body.postcode === "string" ? body.postcode.slice(0, 16) : "";
  } catch { /* an empty or broken body is treated as no postcode */ }
  const raw = postcode.replace(/\s+/g, "").toUpperCase();

  const check = await checkPostcode(raw);
  if (!check.ok) return reply({ status: "invalid", message: check.message ?? "Please check the postcode and try again." });

  const dc = await ballotsForPostcode(raw);
  if (!dc) return reply({ status: "unavailable" });

  const today = londonToday();
  const outcode = raw.slice(0, -3);
  // A ballot we hold links to its full page; any other goes to the place page for the outward code (never the full postcode).
  let covered = new Set<string>();
  try { covered = new Set((await listBallots()).map((b) => b.ballot_paper_id)); } catch { /* links fall back to the place page */ }
  const elections = dc
    .filter((b) => b.election_date >= today)
    .sort((x, y) => x.election_date.localeCompare(y.election_date) || x.election_name.localeCompare(y.election_name))
    .map((b) => ({
      name: b.election_name,
      place: b.post_label,
      date: b.election_date,
      dateLabel: longDate(b.election_date),
      daysToGo: dayDiff(today, b.election_date),
      href: covered.has(b.ballot_paper_id) ? `${SITE.url}/ballot/${encodeURIComponent(b.ballot_paper_id)}` : `${SITE.url}/place?pc=${encodeURIComponent(outcode)}`,
    }));
  return reply(elections.length ? { status: "ok", elections } : { status: "none" });
}
