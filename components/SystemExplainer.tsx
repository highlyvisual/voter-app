// WP-B8: how this ballot's voting system works, with a worked example, directly above the candidate list.
export default function SystemExplainer({ system, seats }: { system: string | null; seats: number }) {
  const s = (system ?? "FPTP").toUpperCase();
  if (s === "STV") return (
    <details className="household explainer">
      <summary><span className="summary-line"><b>How this vote is counted: single transferable vote.</b> You rank candidates 1, 2, 3… as far as you like.</span><span className="change">Worked example</span></summary>
      <p>Each ballot starts with its first choice. To win, a candidate needs a quota: votes ÷ (seats + 1), plus one. {seats > 1 ? `Here there ${seats === 1 ? "is" : "are"} ${seats} seat${seats > 1 ? "s" : ""}.` : ""} If nobody reaches the quota, the candidate with fewest votes is excluded and their ballots move to each voter's next choice. If someone passes the quota, their surplus moves on in the same way. It continues until the seats are filled.</p>
      <p><em>Example:</em> 1,000 votes, one seat, quota 501. Round one: A 400, B 350, C 250. Nobody has 501, so C is excluded; C's ballots go to their second choices, say 150 to B and 100 to A. B now has 500, A 500, and the count continues on remaining preferences. A second choice is never wasted and never harms your first.</p>
    </details>
  );
  if (s === "AMS") return (
    <details className="household explainer">
      <summary><span className="summary-line"><b>How this vote is counted: additional member system.</b> Two votes: one for a constituency candidate, one for a party list.</span><span className="change">Worked example</span></summary>
      <p>The constituency vote works like first past the post. The list vote tops up each party's seats so the overall result is closer to its share of the list vote, using a formula (d'Hondt) that divides each party's list votes by one more than the seats it already has.</p>
    </details>
  );
  return (
    <details className="household explainer">
      <summary><span className="summary-line"><b>How this vote is counted: first past the post.</b> One cross; the candidate with the most votes wins.</span><span className="change">Worked example</span></summary>
      <p>Every ballot with one cross is counted for that candidate. The one with the most votes wins, even without a majority. <em>Example:</em> A 4,000, B 3,900, C 2,100. A wins with 40% of the vote; the 60% cast for others elect nobody. {seats > 1 ? `Here there are ${seats} seats: you may mark up to ${seats} crosses, and the ${seats} candidates with the most votes win.` : ""} There are no second preferences; a vote for a candidate who does not win has no further effect.</p>
    </details>
  );
}
