import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { BillProgress, RecessStrip } from "@/components/ParliamentNow";
import { breadcrumbs, faqPage, graph } from "@/lib/schema";
export const metadata = { title: "Learn", description: "Plain thirty-second answers: what an MP and a councillor do, first past the post, manifestos, by-elections, voter ID and more.", alternates: { canonical: "/learn" } };
// Recess dates and the bill tracker are fetched from Parliament and cached for an hour.
export const revalidate = 3600;
// The bill that would change the rules for elections themselves (Bills API id 4080), tracked stage by stage.
const ELECTIONS_BILL = 4080;
// Thirty-second answers to the questions people are too embarrassed to ask. Neutral, sourced where a source exists.
const Q: [string, string][] = [
  ["What does an MP actually do?", "An MP represents one constituency in the House of Commons. They vote on national laws and budgets, can question ministers, sit on committees that examine policy, and take up constituents' problems with government bodies. They do not run local services, and they cannot overturn a council's planning decision."],
  ["What does a councillor do?", "A councillor is one of several elected to run a council. Together they set the council's budget and council tax, decide planning applications, and oversee services: bins, streets, parks, libraries, housing and, in county and unitary councils, social care. They have no power over the NHS, income tax or immigration."],
  ["What is a manifesto?", "A party's published programme for an election, setting out what it says it would do if it won. There is no legal obligation to deliver it. Manifestos are the main published source for party positions, which is why so much of this site quotes them."],
  ["What is first past the post?", "The voting system used for UK Parliament and most English council elections. You mark one cross; the candidate with the most votes wins, even if most people voted for someone else. It tends to favour parties whose support is concentrated in particular places."],
  ["What is proportional representation?", "A family of voting systems that try to make seats match votes more closely. Scotland's councils and the Scottish Parliament, the Senedd and Northern Ireland use forms of it; Westminster does not."],
  ["What is a marginal seat?", "A seat won last time by a small margin, so a modest change in votes could change the result. It is a description of the past, not a prediction: boundaries change, candidates change, and people change their minds."],
  ["What do left and right mean?", "Broad labels, not exact ones. Roughly: the left tends to favour more state action to reduce economic inequality; the right tends to favour lower taxes, smaller government and market solutions. Many important questions — Europe, immigration, civil liberties, the environment — cut across the line, and parties contain a range of views."],
  ["What is a by-election?", "An election for a single seat between scheduled elections, usually because the sitting member has died, resigned or been disqualified. Turnout is usually lower than at a general election."],
  ["Can I vote if I have no photo ID?", "Yes, but you need to sort it out in advance: apply free for a Voter Authority Certificate, or use a postal vote, which needs no ID. Photo ID is required at UK Parliament elections and English council elections, not at Scottish or Welsh council elections."],
  ["What happens to my ballot paper?", "It is counted by hand, in public, with candidates' agents watching. A paper that is unclear or marked for too many candidates is set aside as spoilt, and spoilt papers are counted and reported. Your paper has a number, but the law protects the secrecy of your vote."],
  ["Does my vote actually matter?", "Council by-elections are frequently decided by tens of votes, and the ward result on this site's Lambeth pages was decided by 88. We cannot tell you your vote will decide the result; we can tell you that small margins are common and that non-voting is itself counted and noticed by parties."],
];
export default async function Learn() {
  return (
    <>
      <JsonLd data={graph(faqPage("/learn", "The questions nobody wants to ask out loud", Q), breadcrumbs([["Learn", "/learn"]]))} />
      <p className="eyebrow">Thirty seconds each</p>
      <h1>The questions nobody wants to ask out loud</h1>
      <p className="lede">Plain answers, no politics. If a term on this site is unfamiliar, look for the "Explain this" link beneath any quotation.</p>
      <RecessStrip />
      <div className="learn">
        {Q.map(([q, a]) => (
          <details key={q}><summary>{q}</summary><p>{a}</p></details>
        ))}
      </div>
      <BillProgress billId={ELECTIONS_BILL} why="A bill before Parliament that would change the rules for UK elections; its long title, below, lists what it covers, starting with votes at 16 and 17." />
      <p className="meta">Sources: UK Parliament and Local Government Association descriptions of each role, and the <a href="https://www.electoralcommission.org.uk/voting-and-elections" rel="noopener">Electoral Commission</a>. More on how to vote: <Link href="/how-to-vote">the plain guide</Link>.</p>
    </>
  );
}
