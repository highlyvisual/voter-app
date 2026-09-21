"use client";
import { useState } from "react";
// Which elections can I vote in? Rules as published by the Electoral Commission; nothing stored, computed in the browser.
type Cit = "british" | "irish" | "commonwealth" | "eu" | "other";
type Nation = "england" | "scotland" | "wales" | "ni";
export default function Eligibility() {
  const [cit, setCit] = useState<Cit | "">(""); const [age, setAge] = useState<"" | "u16" | "16-17" | "18+">(""); const [nation, setNation] = useState<Nation | "">("");
  const ready = cit && age && nation;
  const lines: string[] = [];
  if (ready) {
    const adult = age === "18+"; const teen = age === "16-17";
    const ukParl = (cit === "british" || cit === "irish" || cit === "commonwealth") && adult;
    lines.push(ukParl ? "UK Parliament: yes." : cit === "eu" || cit === "other" ? "UK Parliament: no (British, Irish and qualifying Commonwealth citizens only)." : "UK Parliament: not until you are 18.");
    if (nation === "england") {
      const local = adult && (cit !== "other") && !(cit === "eu" && false);
      lines.push(local ? (cit === "eu" ? "Local council: yes if you have kept EU-citizen voting rights (settled or pre-settled status arranged before 2021, or a citizen of a country with a reciprocal agreement); otherwise no." : "Local council: yes.") : teen ? "Local council: not until you are 18 in England." : "Local council: no.");
    } else if (nation === "scotland" || nation === "wales") {
      const local = (adult || teen) && cit !== "other" || ((adult || teen) && cit === "other");
      lines.push(local ? `Local council and ${nation === "scotland" ? "Scottish Parliament" : "Senedd"}: yes from age 16, for anyone legally resident with permission to stay.` : "Local council and devolved parliament: from age 16.");
    } else {
      lines.push(adult && cit !== "other" ? "Northern Ireland Assembly and local council: yes." : teen ? "Northern Ireland: not until you are 18." : "Northern Ireland: no.");
    }
    lines.push("In every case you must be registered to vote at a UK address: gov.uk/register-to-vote.");
  }
  const Pill = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => <button type="button" className={`pill${on ? " on" : ""}`} onClick={onClick} aria-pressed={on}>{children}</button>;
  return (
    <div className="household" style={{ marginTop: "0.5rem" }}>
      <p style={{ margin: "0 0 0.4rem" }}><strong>Which elections can I vote in?</strong> <span className="meta">Answered in your browser; nothing is sent.</span></p>
      <p className="meta" style={{ margin: "0.4rem 0 0.2rem" }}>Citizenship</p>
      <div className="pills">{([["british", "British"], ["irish", "Irish"], ["commonwealth", "Commonwealth (incl. Cyprus, Malta)"], ["eu", "EU citizen"], ["other", "Other"]] as [Cit, string][]).map(([v, l]) => <Pill key={v} on={cit === v} onClick={() => setCit(v)}>{l}</Pill>)}</div>
      <p className="meta" style={{ margin: "0.6rem 0 0.2rem" }}>Age on polling day</p>
      <div className="pills">{([["u16", "Under 16"], ["16-17", "16 or 17"], ["18+", "18 or over"]] as const).map(([v, l]) => <Pill key={v} on={age === v} onClick={() => setAge(v)}>{l}</Pill>)}</div>
      <p className="meta" style={{ margin: "0.6rem 0 0.2rem" }}>Where you live</p>
      <div className="pills">{([["england", "England"], ["scotland", "Scotland"], ["wales", "Wales"], ["ni", "Northern Ireland"]] as [Nation, string][]).map(([v, l]) => <Pill key={v} on={nation === v} onClick={() => setNation(v)}>{l}</Pill>)}</div>
      {ready ? <ul className="small" style={{ marginTop: "0.8rem" }}>{lines.map((l) => <li key={l}>{l}</li>)}</ul> : null}
      <p className="meta" style={{ marginTop: "0.6rem" }}>Summary of the Electoral Commission's rules; the <a href="https://www.electoralcommission.org.uk/voting-and-elections/who-can-vote" rel="noopener">official page</a> has the detail and the exceptions.</p>
    </div>
  );
}
