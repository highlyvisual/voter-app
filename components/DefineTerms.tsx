"use client";
import { useId, useState, type ReactNode } from "react";

// "Define these terms" (Romily, 14 Oct): wherever definitions are listed in bulk, they and their sources sit behind one
// small toggle, closed by default, so the panel shows the thing itself first. A real <button> with aria-expanded and
// aria-controls, so it works from the keyboard and screen readers announce whether it is open.
export type Term = { term: string; meaning: string; more?: { href: string; label: string } };

export default function DefineTerms({ terms, sources, label = "Define these terms" }: { terms: Term[]; sources?: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!terms.length && !sources) return null;
  return (
    <div className="define-terms">
      <button type="button" className="define-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {label}
      </button>
      <div id={id} className="define-body" hidden={!open}>
        {terms.length ? (
          <dl>
            {terms.map((t) => (
              <div key={t.term}>
                <dt>{t.term}</dt>
                <dd>{t.meaning}{t.more ? <> <a href={t.more.href} target="_blank" rel="noopener">{t.more.label}</a></> : null}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {sources ? <p className="meta define-sources">{sources}</p> : null}
      </div>
    </div>
  );
}
