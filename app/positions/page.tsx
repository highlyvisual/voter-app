import Link from "next/link";
import PositionsTable from "@/components/PositionsTable";
import { TOPICS, listBallots, listArchivedBallots, publicClient } from "@/lib/data";
import { layerOf, layerKey } from "@/lib/claims";
import { whenText } from "@/components/ClaimLayers";
import { fixLink, linkFixes } from "@/lib/links";

export const dynamic = "force-dynamic";
export const metadata = { title: "Every position" };

// Every sourced position on the site, searchable and filterable. Ballot-paper order within each election; no ranking anywhere.
export default async function Positions({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const [live, archived] = await Promise.all([listBallots(), listArchivedBallots()]);
  const ballots = [...live, ...archived];
  const { data } = await publicClient().from("current_claims").select("*, sources(title, url, publisher, published_on, layer, archive_url)").eq("status", "verified").order("ballot_paper_id").order("candidate_id", { nullsFirst: true }).order("topic");
  const { data: cands } = await publicClient().from("candidates").select("id, name, party_name_on_ballot, ballot_paper_id, surname_sort").is("withdrawn_at", null);
  const byId = new Map((cands ?? []).map((c) => [c.id, c]));
  const areaOf = new Map(ballots.map((b) => [b.ballot_paper_id, b.area_name]));
  const topicLabel = Object.fromEntries(TOPICS);
  const fixes = await linkFixes();
  const rows = ((data ?? []) as Parameters<typeof layerOf>[0][]).map((c) => {
    const cand = c.candidate_id ? byId.get(c.candidate_id) : null;
    return {
      id: c.id,
      who: cand ? cand.name : (c.party_ec_id ? "Party position" : "—"),
      party: cand ? cand.party_name_on_ballot : "",
      election: areaOf.get(c.ballot_paper_id) ?? c.ballot_paper_id,
      ballot: c.ballot_paper_id,
      candidateId: c.candidate_id,
      topic: topicLabel[c.topic] ?? c.topic,
      topicKey: c.topic,
      layer: layerOf(c),
      precision: c.precision ?? "measurable",
      claim: c.claim_text,
      quote: c.source_quote,
      source: c.sources?.title ?? "",
      publisher: c.sources?.publisher ?? "",
      url: fixLink(fixes, c.sources?.url)?.href ?? "",
      urlArchived: fixLink(fixes, c.sources?.url)?.archived ?? false,
      published: c.sources?.published_on ?? null,
      archive: c.sources?.archive_url ?? null,
      applies: whenText(c.applies_if),
      record: layerKey(c) === "enacted_record",
    };
  });
  return (
    <>
      <p className="eyebrow">Everything, in one list</p>
      <h1>Every position on this site</h1>
      <p className="lede">{rows.length} sourced positions across {new Set(rows.map((r) => r.ballot)).size} elections, current and past. Search the words, filter by election, topic or kind of source, and open any source. Order is by election, then ballot paper; nothing here is ranked.</p>
      <PositionsTable rows={rows} elections={[...new Set(rows.map((r) => r.election))].sort()} topics={[...new Set(rows.map((r) => r.topic))]} layers={[...new Set(rows.map((r) => r.layer))]} initialTopic={typeof sp.topic === "string" ? (topicLabel[sp.topic] ?? "") : ""} />
      <p className="meta">The quotation is the record; the short version is a reading aid. Reuse this list as JSON from <Link href="/data">the open data page</Link>.</p>
    </>
  );
}
