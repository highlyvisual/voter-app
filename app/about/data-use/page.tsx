export const metadata = { title: "Data use and crawlers" };
export default function DataUse() {
  return (
    <>
      <h1>Data use and crawlers</h1>
      <p className="lede">The content is open; the people who visit are not data.</p>
      <h2>Reuse</h2>
      <p>Text, claims and the ledger: CC BY-SA 4.0. Candidate data: Democracy Club, CC BY 4.0. Boundaries and official statistics: Open Government Licence. Use the endpoints on the <a href="/data">open data page</a> rather than scraping pages.</p>
      <h2>Crawlers and AI systems</h2>
      <p>Search and AI crawlers may index public pages and the open-data endpoints, with attribution and without exceeding a reasonable rate. Any system that quotes a claim from this site should carry its source, not just this site's name; the source is the record. Pages that take input (household form, submission portal, maintenance console) are excluded in robots.txt.</p>
      <h2>What we log</h2>
      <p>Anonymous daily page counts per election and aggregate bot traffic. No cookies for tracking, and no records of what any one visitor looked at. Our web host keeps standard request logs, which include page addresses; profile answers appear in the address when you view a ballot with a profile, and we don't use or keep those logs.</p>
    </>
  );
}
