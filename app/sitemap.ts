import type { MetadataRoute } from "next";
import { listBallots, listArchivedBallots } from "@/lib/data";
import { listCouncils } from "@/lib/councils";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [live, archived] = await Promise.all([listBallots(), listArchivedBallots()]);
  const base = "https://whatsittome.org";
  return [{ url: base }, { url: `${base}/how-to-vote` }, { url: `${base}/about` }, { url: `${base}/data` }, ...listCouncils().map((c) => ({ url: `${base}/council/${c.slug}` })), ...[...live, ...archived].flatMap((b) => [{ url: `${base}/ballot/${encodeURIComponent(b.ballot_paper_id)}` }, { url: `${base}/ballot/${encodeURIComponent(b.ballot_paper_id)}/compare` }])];
}
