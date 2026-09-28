import Link from "next/link";
import type { Ballot } from "@/lib/data";

// Persona test (28 Sept): a 16-year-old in England went through the whole journey without being told she can't vote in
// the election in front of her. Voting ages, from the Electoral Commission ("Who can vote in UK elections"): 18 for the
// UK Parliament everywhere, and for council elections in England and Northern Ireland; 16 for council elections in
// Scotland and Wales. Registration opens at 16 in England and Northern Ireland and at 14 in Scotland and Wales (GOV.UK).
const EC = "https://www.electoralcommission.org.uk/voting-and-elections/who-can-vote";
const REGISTER = "https://www.gov.uk/register-to-vote";

export default function AgeNote({ ageBand, ballot }: { ageBand?: string; ballot: Pick<Ballot, "level" | "area_gss" | "archived"> }) {
  if (ageBand !== "16_17" || ballot.archived) return null;
  const nation = ballot.area_gss?.[0] ?? null; // E, S, W or N from the official area code
  const sources = <> Source: <a href={EC} rel="noopener">Electoral Commission, who can vote</a>.</>;
  if (ballot.level === "local" && (nation === "S" || nation === "W")) {
    return <p className="notice small"><strong>At 16 or 17 you can vote in this one.</strong> The voting age for council elections in {nation === "S" ? "Scotland" : "Wales"} is 16, as long as you&rsquo;re on the electoral register. <a href={REGISTER} rel="noopener">Register to vote</a> (it takes about five minutes).{sources}</p>;
  }
  if (ballot.level === "local" && !nation) {
    return <p className="notice small"><strong>Can you vote in this one?</strong> The voting age for council elections is 16 in Scotland and Wales and 18 in England and Northern Ireland. <a href={REGISTER} rel="noopener">Register to vote</a>.{sources}</p>;
  }
  const what = ballot.level === "local" ? `council elections in ${nation === "N" ? "Northern Ireland" : "England"}` : "UK Parliament elections";
  return <p className="notice small"><strong>You can&rsquo;t vote in this one yet.</strong> The voting age for {what} is 18. You can still read everything here, and you can register now, from 16, so you&rsquo;re ready: <a href={REGISTER} rel="noopener">register to vote</a>. A bill before Parliament would lower the voting age to 16; <Link href="/learn">see where it has got to</Link>.{sources}</p>;
}
