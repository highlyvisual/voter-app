import Link from "next/link";

export const metadata = { title: "Accessibility", description: "How this site meets WCAG 2.2 AA, what we test with, known issues and how to tell us if something doesn't work for you.", alternates: { canonical: "/accessibility" } };

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
      <h3 id="high-contrast">High contrast, to WCAG 2.2 AAA</h3>
      <p>Switching on <strong>High</strong> contrast, in light or dark, takes the display to the enhanced (AAA) level of WCAG 2.2 for everything a display setting can change:</p>
      <ul>
        <li>Text is at least 7 to 1 against its background, and large text at least 4.5 to 1 (1.4.6). Party labels become black or white text inside a border in the party&rsquo;s colour, because text on some party colours can&rsquo;t reach 7 to 1.</li>
        <li>Lines are spaced one and a half apart, paragraphs are spaced out, lines are no longer than about 70 characters and text is never justified (1.4.8).</li>
        <li>Nothing moves or slides (2.3.3), and the scrolling news strip stops.</li>
        <li>The keyboard focus is a thick black (or white) ring with a gap around it (2.4.13), and the page scrolls so the header and the bars at the foot of the screen never cover what has focus (2.4.12).</li>
        <li>Everything you tap is at least 44 by 44 pixels, apart from links inside a sentence (2.5.5).</li>
      </ul>
      <p>Links in text are always underlined. Some AAA criteria are about the writing rather than the display, such as writing that needs no more than a lower-secondary-school reading level (3.1.5) and link text that makes sense on its own (2.4.9); we work towards those across the whole site, but don&rsquo;t yet claim them.</p>

      <h2>How we check</h2>
      <p>We run the axe accessibility checker over the main pages and check them at phone and desktop widths. High contrast is checked separately against the AAA rules, in light and dark, on 31 pages at phone and desktop widths, with every tab stop checked for a visible, uncovered focus ring (last on 29 September 2026). The last full check of the site was the platform review of 25 September 2026; what it found, and what we fixed, is recorded in our <Link href="/ledger">public ledger</Link> and the project&rsquo;s open-source code.</p>

      <h2>Things we know are not right yet</h2>
      <p>Maps are an extra: they need JavaScript and a pointer or touch screen to explore. The candidates, their positions and the sources never depend on a map. Some official documents we link to, such as council PDFs, are not accessible, and we cannot change them; where we quote them, the words are on our page as text.</p>

      <h2>Tell us when something doesn&rsquo;t work</h2>
      <p>If anything on this site is hard to use with the way you browse, email <a href="mailto:hello@whatsittome.org">hello@whatsittome.org</a> with the page address and what happened. We read every message, and fix what we can before the next election on the site.</p>
    </>
  );
}
