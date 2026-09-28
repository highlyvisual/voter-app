"use client";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { FIELDS, FIELD_KEYS, OPTIONAL_FIELDS, OPTIONAL_KEYS } from "@/lib/household";
import { readProfile, writeProfile } from "@/lib/profile";

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

// Shows that the lookup is under way. In the persona test the button sometimes seemed to do nothing on the first press;
// now it says so while the lookup runs, and can't be pressed twice.
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} aria-busy={pending || undefined}>{pending ? "Finding your election…" : "See my election"}</button>;
}

export default function Onboarding({ action, check, error = null, initial = {} }: { action: (fd: FormData) => void; check?: (pc: string) => Promise<{ ok: boolean; message?: string }>; error?: string | null; initial?: Record<string, string> }) {
  const steps = ["postcode", ...FIELD_KEYS, "optional"] as const;
  const [i, setI] = useState(0);
  const [vals, setVals] = useState<Record<string, string>>(initial);
  const [pc, setPc] = useState("");
  const [why, setWhy] = useState(false);
  const [keep, setKeep] = useState(true);
  const [pcError, setPcError] = useState<string | null>(error);
  const [checking, setChecking] = useState(false);
  const pcRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  // Editing an existing profile starts from what is already saved; answers carried back after a failed lookup win.
  // Persona test (28 Sept): on a slow connection people type their postcode before the page's script has loaded, and the
  // box then showed their postcode while the component's state was still empty, so Next stayed greyed out for good.
  // Whatever is already in the box when the script starts is taken as the postcode.
  useEffect(() => {
    const typed = pcRef.current?.value ?? "";
    const p = readProfile();
    if (p) { const { postcode, ...rest } = p; if (postcode && !typed) setPc(postcode); setVals({ ...rest, ...initial }); }
    if (typed) setPc(typed);
  }, []);
  // Screen readers: each step replaces the question, so move focus to the new question's heading and it is read out.
  useEffect(() => {
    if (!moved.current) { moved.current = true; return; }
    headingRef.current?.focus();
  }, [i]);
  const step = steps[i];
  const next = () => { setWhy(false); setI((n) => Math.min(n + 1, steps.length - 1)); };
  const back = () => { setWhy(false); setI((n) => Math.max(n - 1, 0)); };
  const pct = Math.round((i / (steps.length - 1)) * 100);
  // The postcode is checked before the questions, so a typo is caught on step one rather than after all nine.
  const postcodeNext = async () => {
    if (checking) return;
    const value = (pcRef.current?.value ?? pc).trim();
    if (value !== pc) setPc(value);
    const compact = value.replace(/\s+/g, "").toUpperCase();
    if (!compact) { setPcError("Enter your postcode to find your elections."); pcRef.current?.focus(); return; }
    if (/^[A-Z]{1,2}\d[A-Z\d]?$/.test(compact)) { setPcError("That's the first half of a postcode. Enter the whole postcode, for example NG31 6SF."); pcRef.current?.focus(); return; }
    if (!/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact)) { setPcError("That doesn't look like a UK postcode. Check it and try again, for example WC1H 9JE."); pcRef.current?.focus(); return; }
    if (check) {
      setChecking(true);
      try { const r = await check(value); if (!r.ok) { setPcError(r.message ?? "We can't find that postcode. Please check it and try again."); pcRef.current?.focus(); return; } }
      catch { /* the lookup at the end still checks it */ }
      finally { setChecking(false); }
    }
    setPcError(null);
    next();
  };
  return (
    <form action={action} className="onboard" data-step={i} onSubmit={(e) => {
      // Pressing Enter in the postcode box used to submit the whole form, skipping every question (persona test, 28 Sept).
      if (step !== "optional") { e.preventDefault(); if (step === "postcode") void postcodeNext(); return; }
      if (keep) writeProfile({ ...vals, postcode: pc.trim().toUpperCase() });
    }}>
      <input type="hidden" name="postcode" value={pc} />
      <input type="hidden" name="from" value="start" />
      {FIELD_KEYS.map((k) => <input key={k} type="hidden" name={k} value={vals[k] ?? ""} />)}
      {OPTIONAL_KEYS.map((k) => <input key={k} type="hidden" name={k} value={vals[k] ?? ""} />)}
      <div className="onboard-progress" aria-hidden><span style={{ width: `${pct}%` }} /></div>
      <p className="meta">Step {i + 1} of {steps.length} · we never ask who you support or how you voted</p>

      {step === "postcode" ? (
        <div className="onboard-step" key={i}>
          {/* Not "where do you live?": Romily (round 5, q4) asked that the first step not be framed that way. */}
          <h2 ref={headingRef} tabIndex={-1}>Which elections can you vote in?</h2>
          <p className="lede" id="pc-hint">A postcode finds them. We use it once to look them up and don't keep it, and you can look at any election, not only your own.</p>
          <input ref={pcRef} className="big-input" type="text" inputMode="text" autoCapitalize="characters" autoComplete="postal-code" enterKeyHint="next" value={pc} onChange={(e) => { setPc(e.target.value); if (pcError) setPcError(null); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void postcodeNext(); } }} placeholder="e.g. WC1H 9JE" aria-label="Your postcode" aria-invalid={pcError ? true : undefined} aria-describedby={pcError ? "pc-error pc-hint" : "pc-hint"} />
          {pcError ? <p id="pc-error" className="notice small" role="alert" style={{ marginTop: "0.6rem" }}>{pcError}</p> : null}
          <div className="onboard-actions"><button type="button" onClick={() => void postcodeNext()} aria-busy={checking || undefined}>{checking ? "Checking…" : "Next"}</button></div>
        </div>
      ) : step === "optional" ? (
        <div className="onboard-step" key={i}>
          <h2 ref={headingRef} tabIndex={-1}>Anything else that applies?</h2>
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
          <div className="onboard-actions"><SubmitButton /><button type="button" className="secondary" onClick={back}>Back</button></div>
        </div>
      ) : (
        <div className="onboard-step" key={i}>
          <h2 ref={headingRef} tabIndex={-1}>{FIELDS[step as keyof typeof FIELDS].label}</h2>
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
