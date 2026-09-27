import type { Metadata } from "next";
import { getBallot, listCandidates } from "@/lib/data";

// Page titles for the pages of an election, so each tab, bookmark and search result says what it is.
// Share previews (layout.tsx in the ballot segment) still name only the election, never a candidate.
export async function ballotPageTitle(id: string, page: string, path = ""): Promise<Metadata> {
  const b = await getBallot(decodeURIComponent(id));
  if (!b) return { title: page };
  const date = new Date(b.poll_date + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
  return { title: `${page} · ${b.area_name}, ${date}`, alternates: { canonical: `/ballot/${encodeURIComponent(b.ballot_paper_id)}${path}` } };
}

export async function candidatePageTitle(id: string, cid: string): Promise<Metadata> {
  const ballotId = decodeURIComponent(id);
  const [b, cands] = await Promise.all([getBallot(ballotId), listCandidates(ballotId)]);
  const c = cands.find((x) => String(x.id) === cid);
  if (!b || !c) return { title: "Candidate" };
  const date = new Date(b.poll_date + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
  return { title: `${c.name} (${c.party_name_on_ballot}) · ${b.area_name}, ${date}`, alternates: { canonical: `/ballot/${encodeURIComponent(ballotId)}/candidate/${cid}` } };
}
