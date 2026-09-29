"use client";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { FIELDS, FIELD_KEYS, OPTIONAL_FIELDS, OPTIONAL_KEYS } from "@/lib/household";
import { readProfile, writeProfile, writeSessionPersonal } from "@/lib/profile";
import { PERSONAL_FIELDS, PERSONAL_KEYS, PERSONAL_WHY } from "@/lib/personal";

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

const STEP_NAME: Record<string, string> = {
  postcode: "Your elections", age_band: "Your age", household: "Who lives with you", children: "Children", tenure: "Your home",
  income_band: "Income", employment: "Work", student: "Studying", personal: "About you (optional)", optional: "Anything else (optional)",
};

type ChatItem = { key: string; label: string; options: readonly (readonly [string, string])[]; why: string };
// The optional questions as a conversation (design C): the site asks, one question at a time; each answer appears on
// the right and can be changed with one tap; "Skip this one" is always there. Nothing leaves the browser from here.
function Chat({ intro, items, vals, set }: { intro: string; items: ChatItem[]; vals: Record<string, string>; set: (k: string, v: string) => void }) {
  const [at, setAt] = useState(0);
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const askRef = useRef<HTMLParagraphElement>(null);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } askRef.current?.focus(); }, [at]);
  const answer = (k: string, v: string, n: number) => { set(k, v); setSkipped((x) => ({ ...x, [k]: false })); setAt(Math.max(at, n + 1)); };
  const skip = (k: string, n: number) => { set(k, ""); setSkipped((x) => ({ ...x, [k]: true })); setAt(Math.max(at, n + 1)); };
  return (
    <ol className="chat">
      <li className="bub app"><img src="/brand/mark-light.webp" alt="" width={26} height={23} className="bub-av brand-light" /><img src="/brand/mark-dark.webp" alt="" width={26} height={23} className="bub-av brand-dark" /><p>{intro}</p></li>
      {items.slice(0, Math.min(at + 1, items.length)).map((it, n) => {
        const chosen = it.options.find(([c]) => c === vals[it.key]);
        const done = n < at;
        return (
          <li key={it.key} className="chat-q">
            <div className="bub app"><img src="/brand/mark-light.webp" alt="" width={26} height={23} className="bub-av brand-light" /><img src="/brand/mark-dark.webp" alt="" width={26} height={23} className="bub-av brand-dark" /><p ref={n === at ? askRef : undefined} tabIndex={n === at ? -1 : undefined}><strong>{it.label}</strong><span className="bub-why">{it.why}</span></p></div>
            {done ? (
              <button type="button" className="bub me" onClick={() => setAt(n)} aria-label={`${it.label}: ${chosen ? chosen[1] : "skipped"}. Change`}>
                {chosen ? chosen[1] : skipped[it.key] ? "Skipped" : "No answer"} <svg viewBox="0 0 24 24" aria-hidden><path d="M4 20h4l10-10-4-4L4 16zM13 7l4 4" /></svg>
              </button>
            ) : (
              <div className="chat-answers" role="group" aria-label={it.label}>
                {it.options.map(([code, text]) => <button key={code} type="button" className={`chip-answer${vals[it.key] === code ? " on" : ""}`} aria-pressed={vals[it.key] === code} onClick={() => answer(it.key, code, n)}>{text}</button>)}
                <button type="button" className="link" onClick={() => skip(it.key, n)}>Skip this one</button>
              </div>
            )}
          </li>
        );
      })}
      {at >= items.length ? <li className="bub app"><img src="/brand/mark-light.webp" alt="" width={26} height={23} className="bub-av brand-light" /><img src="/brand/mark-dark.webp" alt="" width={26} height={23} className="bub-av brand-dark" /><p ref={askRef} tabIndex={-1}>Thank you. Tap any answer above to change it.</p></li> : null}
    </ol>
  );
}

// Shows that the lookup is under way. In the persona test the button sometimes seemed to do nothing on the first press;
// now it says so while the lookup runs, and can't be pressed twice.
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} aria-busy={pending || undefined}>{pending ? "Finding your election…" : "See what applies to me"}</button>;
}

export default function Onboarding({ action, check, error = null, initial = {} }: { action: (fd: FormData) => void; check?: (pc: string) => Promise<{ ok: boolean; message?: string }>; error?: string | null; initial?: Record<string, string> }) {
  const steps = ["postcode", ...FIELD_KEYS, "personal", "optional"] as const;
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
  const skippable = step !== "postcode";
  const nextName = i + 1 < steps.length ? STEP_NAME[steps[i + 1]] : null;
  return (
    <form action={action} className="onboard ob" data-step={i} onSubmit={(e) => {
      // Pressing Enter in the postcode box used to submit the whole form, skipping every question (persona test, 28 Sept).
      if (step !== "optional") { e.preventDefault(); if (step === "postcode") void postcodeNext(); return; }
      if (keep) writeProfile({ ...vals, postcode: pc.trim().toUpperCase() }); else writeSessionPersonal(vals);
    }}>
      <input type="hidden" name="postcode" value={pc} />
      <input type="hidden" name="from" value="start" />
      {FIELD_KEYS.map((k) => <input key={k} type="hidden" name={k} value={vals[k] ?? ""} />)}
      {OPTIONAL_KEYS.map((k) => <input key={k} type="hidden" name={k} value={vals[k] ?? ""} />)}

      {/* Row 4, design A6-A7 (Romily, 29 Sept): a step header, the length of the journey shown as segments, one question per screen. */}
      <div className="ob-head">
        {i === 0 ? <a href="/" className="ob-back" aria-label="Back to the home page"><svg viewBox="0 0 24 24" aria-hidden><path d="M15 5l-7 7 7 7" /></svg></a>
          : <button type="button" className="ob-back" aria-label="Back to the previous question" onClick={back}><svg viewBox="0 0 24 24" aria-hidden><path d="M15 5l-7 7 7 7" /></svg></button>}
        <span className="ob-title">Personalise my politics</span>
        {skippable && step !== "optional" ? <button type="button" className="link ob-skip" onClick={next}>Skip</button> : null}
      </div>
      <div className="ob-progress" aria-hidden>{steps.map((s2, n) => <i key={s2} className={n <= i ? "on" : undefined} />)}</div>
      <p className="meta ob-count">Step {i + 1} of {steps.length} · {STEP_NAME[step]}</p>

      {step === "postcode" ? (
        <div className="onboard-step" key={i}>
          {/* Not "where do you live?": Romily (round 5, q4) asked that the first step not be framed that way. */}
          <h2 ref={headingRef} tabIndex={-1}>Which elections can you vote in?</h2>
          <p className="lede" id="pc-hint">A postcode finds them. We use it once to look them up and don&rsquo;t keep it, and you can look at any election, not only your own.</p>
          <label htmlFor="ob-pc" className="ob-label">Postcode</label>
          <input id="ob-pc" ref={pcRef} className="big-input" type="text" inputMode="text" autoCapitalize="characters" autoComplete="postal-code" enterKeyHint="next" value={pc} onChange={(e) => { setPc(e.target.value); if (pcError) setPcError(null); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void postcodeNext(); } }} placeholder="e.g. WC1H 9JE" aria-invalid={pcError ? true : undefined} aria-describedby={pcError ? "pc-error pc-hint" : "pc-hint"} />
          {pcError ? <p id="pc-error" className="notice small" role="alert" style={{ marginTop: "0.6rem" }}>{pcError}</p> : null}
        </div>
      ) : step === "personal" || step === "optional" ? (
        <div className="onboard-step" key={i}>
          <h2 ref={headingRef} tabIndex={-1}>{step === "personal" ? "A bit more about you, if you like" : "Anything else that applies?"}</h2>
          {/* Row 4 (Romily): the extra, non-essential questions as a conversation (design C): one question at a time, your
              answers on the right where one tap changes them, and "Skip this one" beside every question. */}
          <Chat
            key={step}
            intro={step === "personal"
              ? "Entirely optional. Parties publish positions on race, religion, sex, gender and sexual orientation; answer any of these and we put every party’s own words on it first. We never say whether a policy is good or bad for you. These answers stay in this browser: never in a page address, never sent to us, never used to calculate anything."
              : "Optional, and each exists only because published policies refer to it. Leave any blank and nothing is assumed."}
            items={step === "personal"
              ? PERSONAL_KEYS.map((k) => ({ key: k as string, label: PERSONAL_FIELDS[k].label, options: PERSONAL_FIELDS[k].options, why: PERSONAL_WHY[k] }))
              : OPTIONAL_KEYS.map((k) => ({ key: k as string, label: OPTIONAL_FIELDS[k].label, options: OPTIONAL_FIELDS[k].options, why: WHY[k] }))}
            vals={vals}
            set={(k, v) => setVals((x) => ({ ...x, [k]: v }))}
          />
          {step === "optional" ? <label className="keep"><input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} /> Keep this as my profile on this device, so I don&rsquo;t have to answer again. <span className="meta">Saved only in this browser. You can edit or delete it at any time.</span></label> : null}
        </div>
      ) : (
        <div className="onboard-step" key={i}>
          <h2 ref={headingRef} tabIndex={-1} id={`q-${step}`}>{FIELDS[step as keyof typeof FIELDS].label}</h2>
          {/* Design A8: radio cards, one tap to choose, the chosen card marked in raspberry. */}
          <div className="ob-cards" role="radiogroup" aria-labelledby={`q-${step}`}>
            {FIELDS[step as keyof typeof FIELDS].options.map(([code, text]) => (
              <label key={code} className={`ob-card${vals[step] === code ? " on" : ""}`}>
                <input type="radio" name={`q-${step}`} value={code} checked={vals[step] === code} onChange={() => setVals((v) => ({ ...v, [step]: code }))} />
                <span className="ob-radio" aria-hidden />
                <span>{text}</span>
              </label>
            ))}
          </div>
          <p><button type="button" className="link" onClick={() => setWhy((w) => !w)} aria-expanded={why}>Why are we asking this?</button></p>
          {why ? <p className="keypoint" style={{ fontSize: "0.95rem" }}>{WHY[step] ?? "It changes which published positions apply to a household like yours."}</p> : null}
        </div>
      )}

      <p className="ob-privacy"><svg viewBox="0 0 24 24" aria-hidden><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>Kept in this browser only. We never ask who you support or how you voted.</p>
      {/* Design A9: Back and Next fixed at the foot of the screen, Next naming what comes after. */}
      <div className="ob-bar">
        {i > 0 ? <button type="button" className="secondary" onClick={back}>Back</button> : null}
        {step === "postcode" ? <button type="button" onClick={() => void postcodeNext()} aria-busy={checking || undefined}>{checking ? "Checking…" : `Next: ${nextName?.toLowerCase()}`}</button>
          : step === "optional" ? <SubmitButton />
          : <button type="button" onClick={next}>{nextName ? `Next: ${nextName.toLowerCase()}` : "Next"}</button>}
      </div>
    </form>
  );
}
