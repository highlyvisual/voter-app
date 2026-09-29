import Link from "next/link";

export const metadata = { title: "Colour direction", robots: { index: false } };

// Round eight (q10-12) offered three colour directions to try here. On 29 Sept Romily chose from five app-feel design
// directions instead: direction C's colours and type, with A's sand and raspberry and E's apricot and aubergine. That
// is now the site's own look, so there is nothing left to try; any trial choice stored in a browser is cleared.
export default function LooksPage() {
  return (
    <>
      <p className="eyebrow">For Romily</p>
      <h1>Your colours are now the site&rsquo;s</h1>
      <p className="lede">You chose the latte, cocoa and rose of direction C, with the sand and raspberry from A and the apricot and aubergine from E, and Fraunces and Public Sans for the type. Every page now uses them, in light and dark. The three trial directions that were here have gone, and any you had switched on in this browser has been cleared.</p>
      <p><Link href="/">See the home page</Link> · <Link href="/ballot/parl.holborn-and-st-pancras.by.2026-10-08">A ballot page</Link> · <Link href="/positions">Positions</Link></p>
    </>
  );
}
