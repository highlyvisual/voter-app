import Link from "next/link";
import PositionsExplorer, { type Election, type Row } from "@/components/PositionsExplorer";
import { TOPICS, TOPIC_SHORT, listBallots, listArchivedBallots, publicClient } from "@/lib/data";
import { layerOf, layerKey } from "@/lib/claims";
import { whenText } from "@/components/ClaimLayers";
import { fixLink, linkFixes } from "@/lib/links";

export const dynamic = "force-dynamic";
export const metadata = { title: "Every position", description: "Find what each candidate and party has said on the topics you care about, election by election, with the exact words and the source. Nothing is ranked.", alternates: { canonical: "/positions" } };

// Every sourced position on the site, to explore by election, topic or words (Romily, 29 Sept: "more interactive, less
// confusing and more accessible"). Grouped by election, then by who said it in ballot-paper order; nothing is ranked.
export default async function Positions({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const [live, archived] = await Promise.all([listBallots(), listArchivedBallots()]);
  const ballots = [...live, ...archived];
  const db = publicClient();
  const [{ data }, { data: cands }, { data: parties }] = await Promise.all([
    db.from("current_claims").select("*, sources(title, url, publisher, published_on, layer, archive_url)").eq("status", "verified").order("ballot_paper_id").order("topic"),
    db.from("candidates").select("id, name, party_name_on_ballot, ballot_paper_id, surname_sort").is("withdrawn_at", null),
    db.from("parties").select("ec_id, name"),
  ]);
  const byId = new Map((cands ?? []).map((c) => [c.id, c]));
  const partyName = new Map((parties ?? []).map((p) => [p.ec_id, p.name]));
  const ballotOf = new Map(ballots.map((b) => [b.ballot_paper_id, b]));
  const topicLabel = Object.fromEntries(TOPICS) as Record<string, string>;
  const fixes = await linkFixes();
  const rows: Row[] = ((data ?? []) as Parameters<typeof layerOf>[0][]).map((c) => {
    const cand = c.candidate_id ? byId.get(c.candidate_id) : null;
    const pname = c.party_ec_id ? partyName.get(c.party_ec_id) ?? null : null;
    return {
      id: c.id,
      who: cand ? cand.name : pname ? pname : "Party position",
      whoKind: cand ? "candidate" : "party",
      party: cand ? cand.party_name_on_ballot ?? "" : "",
      // Ballot-paper order is alphabetical by surname; party material sits after the candidates, by party name.
      sortKey: cand ? `0 ${cand.surname_sort ?? cand.name}` : `1 ${pname ?? ""}`,
      ballot: c.ballot_paper_id,
      candidateId: c.candidate_id,
      topic: topicLabel[c.topic] ?? c.topic,
      topicShort: TOPIC_SHORT[c.topic] ?? topicLabel[c.topic] ?? c.topic,
      topicKey: c.topic,
      layer: layerOf(c),
      layerKey: layerKey(c),
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
  const today = new Date().toISOString().slice(0, 10);
  const withRows = new Set(rows.map((r) => r.ballot));
  const elections: Election[] = [...withRows].map((id) => {
    const b = ballotOf.get(id);
    return { id, name: b?.area_name ?? id, date: b?.poll_date ?? null, upcoming: Boolean(b && !b.archived && b.poll_date >= today) };
  }).sort((a, b) => (a.upcoming === b.upcoming ? (a.upcoming ? (a.date ?? "").localeCompare(b.date ?? "") || a.name.localeCompare(b.name) : (b.date ?? "").localeCompare(a.date ?? "") || a.name.localeCompare(b.name)) : a.upcoming ? -1 : 1));
  const topicParam = one("topic");
  return (
    <>
      <p className="eyebrow">Everything, in one place</p>
      <h1>What they say</h1>
      <p className="lede">Every position we have sourced, from candidates and parties, with the exact words and where they come from. Pick an election, a topic, or both, or search for a word. Nobody is ranked: people appear in ballot-paper order.</p>
      <PositionsExplorer
        rows={rows}
        elections={elections}
        topics={TOPICS.map(([k, l]) => ({ key: k, label: l, short: TOPIC_SHORT[k] ?? l }))}
        initial={{ election: one("election"), topic: topicLabel[topicParam] ? topicParam : "", q: one("q"), kind: one("kind"), past: one("past") === "1" }}
      />
      <p className="meta">The quotation is the record; the short version is a reading aid. Reuse this list as JSON from <Link href="/data">the open data page</Link>.</p>
    </>
  );
}
