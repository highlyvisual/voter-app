"use client";
import { useState } from "react";

// Round eight q19, second Learn visual: a make-believe first-past-the-post count. Four invented candidates with no party,
// no colours and no real names; the reader sets the votes and sees who wins and how many voted for someone else.
const NAMES = ["Candidate A", "Candidate B", "Candidate C", "Candidate D"];
const START = [310, 280, 240, 170];

export default function FptpDemo() {
  const [votes, setVotes] = useState<number[]>(START);
  const total = votes.reduce((a, b) => a + b, 0);
  const top = Math.max(...votes);
  const winners = votes.map((v, i) => (v === top ? i : -1)).filter((i) => i >= 0);
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const set = (i: number, v: number) => setVotes((vs) => vs.map((x, j) => (j === i ? v : x)));
  return (
    <div className="fptp">
      <ul className="fptp-rows">
        {votes.map((v, i) => (
          <li key={i} className={winners.length === 1 && winners[0] === i ? "win" : ""}>
            <label htmlFor={`fptp-${i}`}>{NAMES[i]}</label>
            <span className="fptp-bar" aria-hidden><span style={{ width: `${top ? (v / top) * 100 : 0}%` }} /></span>
            <span className="fptp-n">{v.toLocaleString("en-GB")} <span className="meta">({pct(v)}%)</span></span>
            <input id={`fptp-${i}`} type="range" min={0} max={600} step={10} value={v} onChange={(e) => set(i, Number(e.target.value))} aria-valuetext={`${v} votes`} />
          </li>
        ))}
      </ul>
      <p className="fptp-result" aria-live="polite">
        {total === 0 ? "Nobody has voted yet." : winners.length > 1
          ? `A tie on ${top.toLocaleString("en-GB")} votes. In a real count a tie is settled by drawing lots.`
          : <><strong>{NAMES[winners[0]]} wins</strong> with {top.toLocaleString("en-GB")} of {total.toLocaleString("en-GB")} votes ({pct(top)}%). {total - top > top ? <>More people ({(total - top).toLocaleString("en-GB")}, or {100 - pct(top)}%) voted for someone else, but that doesn&rsquo;t change the result.</> : total - top === top ? <>Exactly as many people voted for someone else.</> : <>That is more than everyone else put together.</>}</>}
      </p>
      <p><button type="button" className="link" onClick={() => setVotes(START)}>Start again</button></p>
    </div>
  );
}
