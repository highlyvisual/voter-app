import { GLOSSARY, findTerms } from "@/lib/glossary";
// "Explain this": plain-English definitions of any political terms in a quotation. Neutral, never a judgement of the policy.
export default function ExplainThis({ text }: { text: string }) {
  const terms = findTerms(text);
  if (!terms.length) return null;
  return (
    <details className="explain">
      <summary>Explain this <span className="meta">({terms.length === 1 ? "1 term" : `${terms.length} terms`})</span></summary>
      <dl>
        {terms.map((t) => (
          <div key={t}><dt>{t.replace(/\b\w/g, (c) => c.toUpperCase())}</dt><dd>{GLOSSARY[t]}</dd></div>
        ))}
      </dl>
      <p className="meta">Plain-English definitions of what the term means, not whether the policy is a good idea.</p>
    </details>
  );
}
