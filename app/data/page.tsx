import Link from "next/link";
import { listBallots, listArchivedBallots } from "@/lib/data";
import JsonLd from "@/components/JsonLd";
import { breadcrumbs, graph, ORG_ID } from "@/lib/schema";
export const dynamic = "force-dynamic";
export const metadata = { title: "Open data", description: "Download the site's election data: every ballot, candidate, sourced claim and change, as JSON under CC BY-SA 4.0.", alternates: { canonical: "/data" } };
export default async function Data() {
  const [live, archived] = await Promise.all([listBallots(), listArchivedBallots()]);
  return (
    <>
      <JsonLd data={graph({
        "@type": "Dataset", "@id": "https://whatsittome.org/data#dataset", name: "What's It To Me? UK election candidates and sourced positions",
        description: "Every UK election ballot covered by What's It To Me?, its candidates in ballot-paper order, and every sourced candidate and party position (summary, verbatim quotation, source, publication and retrieval dates), with the full append-only change log.",
        url: "https://whatsittome.org/data", license: "https://creativecommons.org/licenses/by-sa/4.0/", isAccessibleForFree: true, inLanguage: "en-GB",
        creator: { "@id": ORG_ID }, publisher: { "@id": ORG_ID }, spatialCoverage: { "@type": "Place", name: "United Kingdom" },
        keywords: ["UK elections", "candidates", "council elections", "by-elections", "manifesto pledges", "open data"],
        isBasedOn: ["https://candidates.democracyclub.org.uk/"],
        distribution: [
          { "@type": "DataDownload", name: "Whole ledger snapshot", encodingFormat: "application/json", contentUrl: "https://whatsittome.org/ledger/snapshot" },
          ...[...live, ...archived].map((b) => ({ "@type": "DataDownload", name: `${b.area_name}, ${b.poll_date}`, encodingFormat: "application/json", contentUrl: `https://whatsittome.org/api/data/${encodeURIComponent(b.ballot_paper_id)}` })),
        ],
      }, breadcrumbs([["Open data", "/data"]]))} />
      <h1>Open data</h1>
      <p className="lede">Everything on this site is reusable under CC BY-SA 4.0 (candidate and election data from Democracy Club is CC BY 4.0; boundaries and statistics are Open Government Licence).</p>
      <p className="small">Council list: mySociety, UK Local Authorities (CC BY 4.0) and WhatDoTheyKnow authorities (CC BY-SA 4.0). Deprivation: English Indices of Deprivation 2025 (MHCLG), Welsh Index of Multiple Deprivation 2025 (Welsh Government), Scottish Index of Multiple Deprivation 2020v2 (Scottish Government) and Northern Ireland Multiple Deprivation Measure 2017 (NISRA), all Open Government Licence.</p>
      <h2>Endpoints</h2>
      <ul>
        <li><code>/ledger/snapshot</code>: the whole ledger (claims, sources, change log, receipt grid) as JSON with a SHA-256.</li>
        <li><code>/api/data/&lt;ballot_paper_id&gt;</code>: one ballot with its candidates and live claims, as JSON.</li>
        <li><code>/api/boundary?ballot=&lt;ballot_paper_id&gt;</code>: the voting-area boundary as GeoJSON (ONS, OGL).</li>
      </ul>
      <h2>Ballots</h2>
      <ul className="small spaced-links">{[...live, ...archived].map((b) => <li key={b.ballot_paper_id}><Link href={`/api/data/${encodeURIComponent(b.ballot_paper_id)}`}>{b.ballot_paper_id}</Link></li>)}</ul>
      <h2>Schema</h2>
      <p className="small">A <code>claim</code> has <code>topic</code>, <code>tier</code> (computed or documented), <code>precision</code> (measurable or aspiration), <code>claim_text</code> (summary), <code>source_quote</code> (verbatim), <code>applies_if</code> (household conditions), <code>candidate_id</code> (null for party-level), <code>party_ec_id</code>, and a <code>sources</code> object with publisher, title, url, published_on, retrieved_at and layer. Rows are never edited; a correction is a new row whose <code>supersedes</code> points at the old one.</p>
      <p className="meta">Please attribute "What's It To Me" with a link, and Democracy Club for candidate data. See <Link href="/about/data-use">data use and crawlers</Link>.</p>
    </>
  );
}
