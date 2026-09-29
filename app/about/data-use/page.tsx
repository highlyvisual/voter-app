export const metadata = { title: "Data use and crawlers", description: "What we log (anonymous daily counts, no tracking cookies), what stays on your device, and how search engines and AI assistants may reuse the site.", alternates: { canonical: "/about/data-use" } };
export default function DataUse() {
  return (
    <>
      <h1>Data use and crawlers</h1>
      <p className="lede">The content is open; the people who visit are not data.</p>
      <h2>Reuse</h2>
      <p>Text, claims and the ledger: CC BY-SA 4.0. Candidate data: Democracy Club, CC BY 4.0. Boundaries and official statistics: Open Government Licence. Use the endpoints on the <a href="/data">open data page</a> rather than scraping pages.</p>
      <h2>Crawlers and AI systems</h2>
      <p>Search and AI crawlers may index public pages and the open-data endpoints, with attribution and without exceeding a reasonable rate. Any system that quotes a claim from this site should carry its source, not just this site's name; the source is the record. Pages that take input (household form, submission portal, maintenance console) are excluded in robots.txt. A plain-text guide to the site for AI assistants, with how to cite it, is at <a href="/llms.txt">/llms.txt</a>.</p>
      <h2>What we log</h2>
      <p>Anonymous daily page counts per election and aggregate bot traffic. No cookies for tracking, and no records of what any one visitor looked at. Our web host keeps standard request logs, which include page addresses; profile answers appear in the address when you view a ballot with a profile, and we don't use or keep those logs.</p>
      <h2 id="feedback">The feedback questionnaire</h2>
      <p>If you fill in <a href="/feedback">Tell us what you think</a>, your answers are sent to us through Netlify Forms and kept by Netlify, our web host, so that we can read them. The form doesn&rsquo;t ask for your name, email or postcode; it records which page on this site you came from, without any profile answers in its address. Netlify screens submissions for spam. We delete submissions once we&rsquo;ve read and acted on them. The short &ldquo;Did you find what you were looking for?&rdquo; box on ballot pages is separate: it keeps anonymous daily counts, and any comment dated only to the day.</p>
      <h2>On your own device</h2>
      <p>Your profile is kept in your browser if you choose to save it. The optional answers about you (ethnic group, religion, sex, gender and sexual orientation) never leave your browser at all: they are not put in page addresses, not sent to us and not in our host's logs. If you don't save a profile, they last only until you close the tab. You can delete them on My profile. To let pages open without a signal (at a polling station, say), your browser also keeps a copy of the last 40 or so pages you opened on this site. Those copies stay on your device and are never sent to us; clearing this site&rsquo;s data in your browser removes them.</p>
    </>
  );
}
