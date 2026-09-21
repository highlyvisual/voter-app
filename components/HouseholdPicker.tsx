"use client";
import { useMemo, useState } from "react";
import { FIELDS, FIELD_KEYS, OPTIONAL_FIELDS, OPTIONAL_KEYS, type Household } from "@/lib/household";

// Tappable pill groups instead of dropdowns. Still a plain GET form: state lives in the URL, nothing is stored.
export default function HouseholdPicker({ household, complete }: { household: Household; complete: boolean }) {
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries([...FIELD_KEYS, ...OPTIONAL_KEYS].map((k) => [k, (household as Record<string, string | undefined>)[k] ?? ""])));
  const chosen = useMemo(() => FIELD_KEYS.filter((k) => vals[k]).length, [vals]);
  const total = FIELD_KEYS.length;
  return (
    <form method="get" className="picker">
      <div className="picker-progress" aria-live="polite">
        <span className="meta">{chosen} of {total} chosen</span>
        <span className="bar" aria-hidden><span style={{ width: `${(100 * chosen) / total}%` }} /></span>
      </div>
      {FIELD_KEYS.map((k) => (
        <fieldset key={k} className={vals[k] ? "done" : undefined}>
          <legend>{FIELDS[k].label}</legend>
          <div className="pills" role="radiogroup" aria-label={FIELDS[k].label}>
            {FIELDS[k].options.map(([code, text]) => (
              <label key={code} className={`pill${vals[k] === code ? " on" : ""}`}>
                <input type="radio" name={k} value={code} checked={vals[k] === code} onChange={() => setVals((v) => ({ ...v, [k]: code }))} required />
                {text}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <details className="optional" open={OPTIONAL_KEYS.some((k) => vals[k])}>
        <summary className="meta">Optional: a few more things some policies refer to. Leave blank and nothing is assumed.</summary>
        {OPTIONAL_KEYS.map((k) => (
          <fieldset key={k} className={vals[k] ? "done" : undefined}>
            <legend>{OPTIONAL_FIELDS[k].label}</legend>
            <div className="pills" role="radiogroup" aria-label={OPTIONAL_FIELDS[k].label}>
              {OPTIONAL_FIELDS[k].options.map(([code, text]) => (
                <label key={code} className={`pill${vals[k] === code ? " on" : ""}`}>
                  <input type="radio" name={k} value={code} checked={vals[k] === code} onChange={() => setVals((v) => ({ ...v, [k]: code }))} />
                  {text}
                </label>
              ))}
              {vals[k] ? <button type="button" className="link small" onClick={() => setVals((v) => ({ ...v, [k]: "" }))}>clear</button> : null}
            </div>
          </fieldset>
        ))}
      </details>
      <div className="actions">
        <button type="submit" disabled={chosen < total}>{complete ? "Update" : chosen < total ? `Choose ${total - chosen} more` : "Show what applies"}</button>
        {complete ? <a className="muted small" href="?">Clear</a> : null}
        <span className="meta">Bands only. Nothing is sent to us.</span>
      </div>
    </form>
  );
}
