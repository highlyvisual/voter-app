"use client";
import { useState } from "react";
import { FIELDS, FIELD_KEYS, OPTIONAL_FIELDS, OPTIONAL_KEYS } from "@/lib/household";
import { readProfile, writeProfile } from "@/lib/profile";
import { useEffect } from "react";

// One question at a time. Every question says why it is asked and can be skipped. Nothing is sent anywhere until the
// postcode lookup, and nothing is kept by us (the optional profile lives in the browser only). We never ask who you support or how you voted.
const WHY: Record<string, string> = {
  age_band: "Some published policies name an age: a pension rise, a youth bus fare, a training guarantee.",
  household: "Tax and benefit figures depend on whether an income is shared.",
  children: "Child benefit, the two-child limit, school and childcare policies all depend on it.",
  tenure: "Renting, owning with a mortgage and owning outright are affected by completely different policies.",
  income_band: "Tax and benefit figures cannot be calculated without a band. We use bands, never a figure.",
  employment: "National Insurance, Universal Credit conditions and pension policies differ by work status.",
  student: "Fees, loans and maintenance policies apply only to students.",
  disability: "Disability benefits, PIP assessments and equality policies refer to it.",
  carer: "Carer's Allowance and social-care policies refer to it.",
  visa: "Immigration policies refer to visa and asylum status.",
  benefits: "Means-tested benefit policies refer to it.",
  drives: "Fuel duty, parking and road policies refer to it.",
  veteran: "Veterans' policies refer to it.",
};

export default function Onboarding({ action }: { action: (fd: FormData) => void }) {
  const steps = ["postcode", ...FIELD_KEYS, "optional"] as const;
  const [i, setI] = useState(0);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [pc, setPc] = useState("");
  const [why, setWhy] = useState(false);
  const [keep, setKeep] = useState(true);
  // Editing an existing profile starts from what is already saved
  useEffect(() => { const p = readProfile(); if (p) { const { postcode, ...rest } = p; if (postcode) setPc(postcode); setVals(rest); } }, []);
  const step = steps[i];
  const next = () => { setWhy(false); setI((n) => Math.min(n + 1, steps.length - 1)); };
  const back = () => { setWhy(false); setI((n) => Math.max(n - 1, 0)); };
  const pct = Math.round((i / (steps.length - 1)) * 100);
  return (
    <form action={action} className="onboard" data-step={i} onSubmit={() => { if (keep) writeProfile({ ...vals, postcode: pc.trim().toUpperCase() }); }}>
      <input type="hidden" name="postcode" value={pc} />
      {FIELD_KEYS.map((k) => <input key={k} type="hidden" name={k} value={vals[k] ?? ""} />)}
      {OPTIONAL_KEYS.map((k) => <input key={k} type="hidden" name={k} value={vals[k] ?? ""} />)}
      <div className="onboard-progress" aria-hidden><span style={{ width: `${pct}%` }} /></div>
      <p className="meta">Step {i + 1} of {steps.length} · we never ask who you support or how you voted</p>

      {step === "postcode" ? (
        <div className="onboard-step" key={i}>
          {/* Not "where do you live?": Romily (round 5, q4) asked that the first step not be framed that way. */}
          <h2>Which elections can you vote in?</h2>
          <p className="lede">A postcode finds them. We use it once to look them up and don't keep it, and you can look at any election, not only your own.</p>
          <input className="big-input" type="text" inputMode="text" autoCapitalize="characters" autoComplete="postal-code" value={pc} onChange={(e) => setPc(e.target.value)} placeholder="e.g. WC1H 9JE" aria-label="Your postcode" />
          <div className="onboard-actions"><button type="button" onClick={next} disabled={pc.trim().length < 5}>Next</button></div>
        </div>
      ) : step === "optional" ? (
        <div className="onboard-step" key={i}>
          <h2>Anything else that applies?</h2>
          <p className="lede">Optional, and each exists only because published policies refer to it. Leave any blank and nothing is assumed.</p>
          {OPTIONAL_KEYS.map((k) => (
            <fieldset key={k} className="onboard-optional">
              <legend>{OPTIONAL_FIELDS[k].label}</legend>
              <div className="pills">
                {OPTIONAL_FIELDS[k].options.map(([code, text]) => (
                  <button key={code} type="button" aria-pressed={vals[k] === code} className={`pill${vals[k] === code ? " on" : ""}`} onClick={() => setVals((v) => ({ ...v, [k]: v[k] === code ? "" : code }))}>{text}</button>
                ))}
              </div>
              <p className="meta">{WHY[k]}</p>
            </fieldset>
          ))}
          <label className="keep"><input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} /> Keep this as my profile on this device, so I don't have to answer again. <span className="meta">Saved only in this browser. You can edit or delete it at any time.</span></label>
          <div className="onboard-actions"><button type="submit">See my election</button><button type="button" className="secondary" onClick={back}>Back</button></div>
        </div>
      ) : (
        <div className="onboard-step" key={i}>
          <h2>{FIELDS[step as keyof typeof FIELDS].label}</h2>
          <div className="onboard-cards">
            {FIELDS[step as keyof typeof FIELDS].options.map(([code, text]) => (
              <button key={code} type="button" aria-pressed={vals[step] === code} className={`card-option${vals[step] === code ? " on" : ""}`} onClick={() => { setVals((v) => ({ ...v, [step]: code })); setTimeout(next, 120); }}>{text}</button>
            ))}
          </div>
          <p><button type="button" className="link" onClick={() => setWhy((w) => !w)} aria-expanded={why}>Why are we asking this?</button></p>
          {why ? <p className="keypoint" style={{ fontSize: "0.95rem" }}>{WHY[step] ?? "It changes which published positions apply to a household like yours."}</p> : null}
          <div className="onboard-actions">
            <button type="button" className="secondary" onClick={next}>Skip</button>
            <button type="button" className="secondary" onClick={back}>Back</button>
          </div>
        </div>
      )}
    </form>
  );
}
