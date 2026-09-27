import Link from "next/link";

export const metadata = { title: "Accessibility", alternates: { canonical: "/accessibility" } };

// Accessibility statement. Says only what has been checked, and how to tell us when something doesn't work.
export default function Accessibility() {
  return (
    <>
      <p className="eyebrow">About this site</p>
      <h1>Accessibility</h1>
      <p className="lede">This site should work for everyone who can vote, on any device, with or without assistive technology.</p>

      <h2>What we aim for</h2>
      <p>We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. Pages are built to work with a keyboard alone and to reflow on a small phone screen without sideways scrolling. The pages that matter most on polling day (your ballot, each candidate and their sourced positions) are sent as complete pages, so they still work if JavaScript fails to load; building a profile step by step needs JavaScript.</p>

      <h2>What you can change</h2>
      <p>The <strong>Aa</strong> button in the header changes the text size (up to 150%), switches to high contrast, sets light or dark mode (or follows your device), and offers a low-data version with no photos or maps. Any page can be printed in full: folded sections open for printing.</p>

      <h2>How we check</h2>
      <p>We run the axe accessibility checker over the main pages and check them at phone and desktop widths. The last full check was the platform review of 25 September 2026; what it found, and what we fixed, is recorded in our <Link href="/ledger">public ledger</Link> and the project&rsquo;s open-source code.</p>

      <h2>Things we know are not right yet</h2>
      <p>Maps are an extra: they need JavaScript and a pointer or touch screen to explore. The candidates, their positions and the sources never depend on a map. Some official documents we link to, such as council PDFs, are not accessible, and we cannot change them; where we quote them, the words are on our page as text.</p>

      <h2>Tell us when something doesn&rsquo;t work</h2>
      <p>If anything on this site is hard to use with the way you browse, email <a href="mailto:hello@whatsittome.org">hello@whatsittome.org</a> with the page address and what happened. We read every message, and fix what we can before the next election on the site.</p>
    </>
  );
}
