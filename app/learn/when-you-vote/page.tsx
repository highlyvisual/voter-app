import Link from "next/link";
import VoteSteps from "@/components/learn/VoteSteps";

export const metadata = { title: "What happens when you vote", description: "From registering to the declaration, the ten steps of a UK election, one at a time.", alternates: { canonical: "/learn/when-you-vote" } };

export default function WhenYouVotePage() {
  return (
    <>
      <p className="eyebrow"><Link href="/learn">Learn</Link></p>
      <h1>What happens when you vote</h1>
      <p className="lede">From putting your name on the register to the result being read out. Ten steps.</p>
      <VoteSteps />
      <p className="meta">Sources: <a href="https://www.electoralcommission.org.uk/voting-and-elections" rel="noopener">Electoral Commission</a>, <a href="https://www.gov.uk/how-to-vote" rel="noopener">GOV.UK: How to vote</a>. More detail, including postal and proxy votes: <Link href="/how-to-vote">How voting works</Link>.</p>
    </>
  );
}
