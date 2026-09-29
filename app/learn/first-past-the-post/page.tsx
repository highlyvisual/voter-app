import Link from "next/link";
import FptpDemo from "@/components/learn/FptpDemo";

export const metadata = { title: "First past the post, in a minute", description: "Try a make-believe count: move the votes and see how first past the post picks a winner, and how many people voted for someone else.", alternates: { canonical: "/learn/first-past-the-post" } };

export default function FptpPage() {
  return (
    <>
      <p className="eyebrow"><Link href="/learn">Learn</Link></p>
      <h1>First past the post, in a minute</h1>
      <p className="lede">UK Parliament elections and most council elections in England use first past the post: one cross, and whoever gets the most votes wins. They don&rsquo;t need more than half. Try it with four make-believe candidates.</p>
      <FptpDemo />
      <p className="meta">The candidates here are invented and stand for no party. Scottish and Northern Irish council elections, the Scottish Parliament and the Senedd use other systems; your ballot page says which one applies. Source: <a href="https://www.electoralcommission.org.uk/voting-and-elections/how-elections-work/types-elections" rel="noopener">Electoral Commission</a>.</p>
    </>
  );
}
