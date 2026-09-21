import Link from "next/link";
export const metadata = { title: "Why isn't my party standing here?" };
export default function PartiesStanding() {
  return (
    <>
      <h1>Why isn't my party standing here?</h1>
      <p className="lede">Parties do not stand everywhere. This page explains how nominations work and how to find out whether a party stands nearby. It does not give reasons for any party's choices; we don't know them.</p>
      <h2>How a name gets on the ballot</h2>
      <p>Anyone eligible can stand for a council seat with a small number of local nominations (ten for most English councils) and no deposit; for Parliament, a £500 deposit and ten nominations. A party's candidate also needs a certificate from the party's nominating officer. Nominations close about a month before polling day; after that the list is fixed and published as the Statement of Persons Nominated, which every ballot page here links to.</p>
      <h2>Why a party might not appear</h2>
      <p>Parties choose where to stand. Reasons vary and are usually not published: local organisation, money, a decision to concentrate on other areas, an agreement with another party, or simply nobody willing to stand. We list what is on the ballot and do not speculate.</p>
      <h2>How to find out whether your party stands nearby</h2>
      <ul>
        <li>Check the neighbouring wards on the <Link href="/#elections">elections map</Link>.</li>
        <li>The party's own site usually lists its candidates; each candidate row here links to the party site where one exists.</li>
        <li><a href="https://whocanivotefor.co.uk/" rel="noopener">WhoCanIVoteFor</a> (Democracy Club) shows every candidate for any postcode.</li>
      </ul>
      <h2>What you can do if nobody you'd choose is standing</h2>
      <p>You can still vote for the candidate you least object to, or spoil your ballot deliberately (spoilt ballots are counted and reported), or stand yourself next time. Each is a legitimate choice; none is recommended here.</p>
    </>
  );
}
