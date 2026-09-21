import type { Metadata } from "next";
import { getBallot, listCandidates } from "@/lib/data";
import { SITE } from "@/lib/site";

// Share metadata for every page of an election (the ballot, its stages, candidate pages, compare): the preview names
// the election and states the facts, never a candidate. The image comes from opengraph-image.tsx in this segment.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params; const ballotId = decodeURIComponent(id);
  const b = await getBallot(ballotId);
  if (!b) return {};
  const n = (await listCandidates(ballotId)).length;
  const kind = b.level === "parliamentary" ? (ballotId.includes(".by.") ? "by-election" : "general election") : ballotId.includes(".by.") ? "council by-election" : "council election";
  const date = new Date(b.poll_date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const title = `${b.area_name} ${kind}, ${date}`;
  const description = `All ${n} candidates, in ballot-paper order, with their published positions and sources — and what each could mean for a household like yours. No recommendations.`;
  return {
    openGraph: { title, description, siteName: SITE.name, type: "website", url: `${SITE.url}/ballot/${encodeURIComponent(ballotId)}` },
    twitter: { card: "summary_large_image", title, description },
    description,
  };
}

export default function BallotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
