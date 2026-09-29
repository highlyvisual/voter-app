import Link from "next/link";
import Words from "@/components/learn/Words";
import { WORDS } from "@/lib/words";

export const metadata = { title: "Election words, explained", description: "Tap a word: ward, constituency, precept, returning officer, proxy and more, in plain English.", alternates: { canonical: "/learn/words" } };

export default function WordsPage() {
  return (
    <>
      <p className="eyebrow"><Link href="/learn">Learn</Link></p>
      <h1>Election words, explained</h1>
      <p className="lede">The words you&rsquo;ll meet on a ballot page, in plain English. Tap one.</p>
      <Words />
      <h2>All the words</h2>
      <dl className="glossary">{WORDS.map(([w, d]) => <div key={w} id={w.toLowerCase().replace(/[^a-z]+/g, "-")}><dt>{w}</dt><dd>{d}</dd></div>)}</dl>
    </>
  );
}
