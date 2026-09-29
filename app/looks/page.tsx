import Link from "next/link";
import LookPicker from "@/components/LookPicker";

export const metadata = { title: "Try a colour direction", robots: { index: false } };

// For Romily (round eight q10-12): pick a direction here, then use the site as normal; it stays on in this browser.
export default function LooksPage() {
  return (
    <>
      <p className="eyebrow">For Romily</p>
      <h1>Try a colour direction</h1>
      <p className="lede">Pick one, then use the site as normal: the <Link href="/">home page</Link>, a <Link href="/ballot/parl.holborn-and-st-pancras.by.2026-10-08">ballot page</Link>, <Link href="/positions">Positions</Link> and <Link href="/learn">Learn</Link>. It stays on in this browser until you come back and change it. Nobody else sees it.</p>
      <LookPicker />
      <p className="meta">All three keep text at the highest contrast level (7:1 or better) and stay clear of the main UK parties&rsquo; colours (umber is the closest to a party red, so look at it next to Labour&rsquo;s panel before choosing). Dark mode keeps its own colours.</p>
    </>
  );
}
