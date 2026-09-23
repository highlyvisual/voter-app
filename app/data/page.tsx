import Link from "next/link";
import { listBallots, listArchivedBallots } from "@/lib/data";
export const dynamic = "force-dynamic";
export const metadata = { title: "Open data" };
export default async function Data() {
  const [live, archived] = await Promise.all([listBallots(), listArchivedBallots()]);
  return (
    <>
      <h1>Open data</h1>
      <p className="lede">Everything on this site is reusable under CC BY-SA 4.0 (candidate and election data from Democracy Club is CC BY 4.0; boundaries and statistics are Open Government Licence).</p>
      <h2>Endpoints</h2>
      <ul>
        <li><code>/ledger/snapshot</code>: the whole ledger (claims, sources, change log, receipt grid) as JSON with a SHA-256.</li>
        <li><code>/api/data/&lt;ballot_paper_id&gt;</code>: one ballot with its candidates and live claims, as JSON.</li>
        <li><code>/api/boundary?ballot=&lt;ballot_paper_id&gt;</code>: the voting-area boundary as GeoJSON (ONS, OGL).</li>
      </ul>
      <h2>Ballots</h2>
      <ul className="small">{[...live, ...archived].map((b) => <li key={b.ballot_paper_id}><Link href={`/api/data/${encodeURIComponent(b.ballot_paper_id)}`}>{b.ballot_paper_id}</Link></li>)}</ul>
      <h2>Schema</h2>
      <p className="small">A <code>claim</code> has <code>topic</code>, <code>tier</code> (computed or documented), <code>precision</code> (measurable or aspiration), <code>claim_text</code> (summary), <code>source_quote</code> (verbatim), <code>applies_if</code> (household conditions), <code>candidate_id</code> (null for party-level), <code>party_ec_id</code>, and a <code>sources</code> object with publisher, title, url, published_on, retrieved_at and layer. Rows are never edited; a correction is a new row whose <code>supersedes</code> points at the old one.</p>
      <p className="meta">Please attribute "What's It To Me" with a link, and Democracy Club for candidate data. See <Link href="/about/data-use">data use and crawlers</Link>.</p>
    </>
  );
}
