"use client";
import { useState } from "react";

// Round eight q19, third Learn visual: what happens when you vote, from registering to the declaration. Every step is
// in the list (readable without script); "one at a time" walks through them with Back and Next.
const STEPS: { title: string; text: string }[] = [
  { title: "You register", text: "Online at gov.uk/register-to-vote, before the deadline for that election. Your name goes on the electoral register for your address." },
  { title: "A poll card arrives", text: "It tells you the date and where your polling station is. You don't need to take it with you." },
  { title: "You go to the polling station", text: "Open 7am to 10pm on polling day. If you're in the queue at 10pm, you can still vote." },
  { title: "You show photo ID", text: "At UK Parliament elections, English council elections and all elections in Northern Ireland. Not needed at Scottish or Welsh council elections." },
  { title: "Staff check the register and give you a ballot paper", text: "They mark your name on the register. Each paper has a number, but the law keeps your vote secret." },
  { title: "You mark your paper in a booth", text: "At most elections, one cross in one box. Made a mistake? Ask for a new paper before you put it in the box." },
  { title: "You fold it and put it in the ballot box", text: "Nobody sees how you voted. If you need help, staff can mark the paper for you as you tell them, or you can bring someone." },
  { title: "Polls close and the boxes are sealed", text: "At 10pm the boxes are sealed and taken to the count, with postal votes that arrived in time." },
  { title: "The papers are checked, then counted", text: "First the number of papers in each box is checked against the records. Then they are counted by hand, watched by the candidates, their agents and accredited observers." },
  { title: "The result is declared", text: "The returning officer reads out every candidate's votes and declares the winner. For most elections that is overnight or the next day." },
];

export default function VoteSteps() {
  const [one, setOne] = useState(false);
  const [i, setI] = useState(0);
  return (
    <div className="vote-steps">
      <p><button type="button" className="link" onClick={() => { setOne((o) => !o); setI(0); }} aria-pressed={one}>{one ? "Show all the steps" : "Walk me through it, one step at a time"}</button></p>
      {one ? (
        <div className="vs-one" aria-live="polite">
          <p className="meta">Step {i + 1} of {STEPS.length}</p>
          <div className="vs-bar" aria-hidden><span style={{ width: `${((i + 1) / STEPS.length) * 100}%` }} /></div>
          <h3>{STEPS[i].title}</h3>
          <p>{STEPS[i].text}</p>
          <p className="vs-nav">
            <button type="button" onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>Back</button>
            <button type="button" onClick={() => setI((n) => Math.min(STEPS.length - 1, n + 1))} disabled={i === STEPS.length - 1}>Next</button>
          </p>
        </div>
      ) : (
        <ol className="vs-list">
          {STEPS.map((s) => <li key={s.title}><strong>{s.title}.</strong> {s.text}</li>)}
        </ol>
      )}
    </div>
  );
}
