import type { MetadataRoute } from "next";
import { TOPICS, listBallots, listArchivedBallots, listCandidates, publicClient } from "@/lib/data";
import { listCouncils } from "@/lib/councils";

// Rebuilt hourly. Advertised in robots.txt only once ALLOW_INDEXING is set.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://whatsittome.org";
  const [live, archived, parties] = await Promise.all([
    listBallots(), listArchivedBallots(),
    publicClient().from("parties").select("ec_id").then((r) => (r.data ?? []) as { ec_id: string }[]),
  ]);
  const statics = ["", "/start", "/how-to-vote", "/learn", "/positions", "/parties", "/place", "/about", "/about/accuracy", "/about/data-use", "/about/moderation", "/about/parties-standing", "/who-we-are", "/ledger", "/status", "/data", "/accessibility"]
    .map((p) => ({ url: `${base}${p}` }));
  const liveEntries = (await Promise.all(live.map(async (b) => {
    const id = encodeURIComponent(b.ballot_paper_id);
    const lastModified = b.retrieved_at ? new Date(b.retrieved_at) : undefined;
    const cands = await listCandidates(b.ballot_paper_id).catch(() => []);
    return [
      { url: `${base}/ballot/${id}`, lastModified },
      { url: `${base}/ballot/${id}/compare`, lastModified },
      ...TOPICS.map(([t]) => ({ url: `${base}/ballot/${id}/topic/${t}`, lastModified })),
      ...cands.map((c) => ({ url: `${base}/ballot/${id}/candidate/${c.id}`, lastModified })),
    ];
  }))).flat();
  return [
    ...statics,
    ...listCouncils().map((c) => ({ url: `${base}/council/${c.slug}` })),
    ...parties.map((p) => ({ url: `${base}/parties/${encodeURIComponent(p.ec_id)}` })),
    ...liveEntries,
    ...archived.map((b) => ({ url: `${base}/ballot/${encodeURIComponent(b.ballot_paper_id)}` })),
  ];
}
