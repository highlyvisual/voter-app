"use client";
import { useEffect, useState, type FormEvent } from "react";
import { FEEDBACK_FORM_NAME, FEEDBACK_SECTIONS, type Question } from "@/lib/feedbackForm";

// The questionnaire people fill in after trying the site. It posts to the static copy Netlify detected at deploy
// time (public/__forms.html); Netlify Forms keeps the answers for Romily and Barny to read. Without JavaScript the
// same form posts there directly and Netlify shows its own thank-you page. No netlify attributes here on purpose: the
// Next.js adapter refuses to build when it finds them in React code.
export default function FeedbackForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [from, setFrom] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search).get("from");
      const r = document.referrer ? new URL(document.referrer) : null;
      const path = q && q.startsWith("/") ? q : r && r.origin === location.origin ? r.pathname : "";
      // Only the page, never its query: a ballot address can carry household answers.
      setFrom(path.slice(0, 200));
    } catch {}
  }, []);
  const set = (name: string, v: string) => setValues((o) => ({ ...o, [name]: v }));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    try {
      const body = new URLSearchParams(new FormData(e.currentTarget) as unknown as Record<string, string>).toString();
      const res = await fetch("/__forms.html", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
      setState(res.ok ? "sent" : "error");
      if (res.ok) window.scrollTo({ top: 0 });
    } catch { setState("error"); }
  }

  if (state === "sent") {
    return (
      <div className="fb-done" role="status">
        <h2>Thank you</h2>
        <p>Your answers have reached Romily and Barny. Every one gets read, and the site changes because of them.</p>
        <p><a href="/">Back to the home page</a></p>
      </div>
    );
  }

  const field = (q: Question) => {
    if (q.kind === "text") {
      if (q.showIf && values[q.showIf.name] !== q.showIf.value) return null;
      const id = `fb-${q.name}`;
      return (
        <div key={q.name} className="fb-q">
          <label htmlFor={id} className="fb-label">{q.q}</label>
          {q.hint ? <p className="meta fb-hint" id={`${id}-hint`}>{q.hint}</p> : null}
          {q.long
            ? <textarea id={id} name={q.name} rows={3} maxLength={2000} aria-describedby={q.hint ? `${id}-hint` : undefined} />
            : <input id={id} name={q.name} type="text" maxLength={300} autoComplete="off" aria-describedby={q.hint ? `${id}-hint` : undefined} />}
        </div>
      );
    }
    const opts = q.kind === "choice" ? q.options : ["1", "2", "3", "4", "5", ...(q.skip ? [q.skip] : [])];
    return (
      <fieldset key={q.name} className={`fb-q ${q.kind === "scale" ? "fb-scale" : "fb-choice"}`}>
        <legend className="fb-label">{q.q}</legend>
        {q.kind === "scale" ? <p className="meta fb-ends" aria-hidden><span>1 = {q.low}</span><span>5 = {q.high}</span></p> : null}
        <div className="fb-opts">
          {opts.map((o) => (
            <label key={o} className={`fb-opt${o.length > 1 && q.kind === "scale" ? " wide" : ""}`}>
              <input type="radio" name={q.name} value={o} checked={values[q.name] === o} onChange={() => set(q.name, o)} />
              <span>{q.kind === "scale" && o.length === 1 ? <>{o}<span className="sr-only">{o === "1" ? `, ${q.low}` : o === "5" ? `, ${q.high}` : ""}</span></> : o}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  };

  return (
    <form className="fb-form" name={FEEDBACK_FORM_NAME} method="POST" action="/__forms.html" onSubmit={submit}>
      <input type="hidden" name="form-name" value={FEEDBACK_FORM_NAME} />
      <input type="hidden" name="from" value={from} />
      <p className="fb-trap" aria-hidden><label>Leave this empty <input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
      {FEEDBACK_SECTIONS.map((s, i) => (
        <section key={s.title} className="fb-sec" aria-labelledby={`fb-s${i}`}>
          <h2 id={`fb-s${i}`}><span className="fb-n" aria-hidden>{i + 1}</span>{s.title}</h2>
          {s.questions.map(field)}
        </section>
      ))}
      <div className="fb-send">
        <button type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send my answers"}</button>
        {state === "error" ? <p className="fb-err" role="alert">That didn&rsquo;t send. Please try again in a moment, or email <a href="mailto:hello@whatsittome.org?subject=Feedback">hello@whatsittome.org</a>.</p> : null}
      </div>
    </form>
  );
}
