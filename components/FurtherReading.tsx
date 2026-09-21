import type { Resource } from "@/lib/data";

// Independent sources for going deeper. Each carries a plain-words label of what it is; anything with a declared position says so.
export default function FurtherReading({ resources, heading = "Go deeper: independent sources" }: { resources: Resource[]; heading?: string }) {
  if (!resources.length) return null;
  const general = resources.filter((r) => r.topic === "all");
  const specific = resources.filter((r) => r.topic !== "all");
  const Item = ({ r }: { r: Resource }) => (
    <li><a href={r.url} rel="noopener">{r.title}</a> <span className="meta">— {r.publisher}. {r.kind}.</span></li>
  );
  return (
    <section className="further" aria-labelledby="further-heading">
      <h2 id="further-heading">{heading}</h2>
      <p className="meta">None of these is affiliated with a party. Where a source campaigns for a position, the label says so. Links open the original site.</p>
      {specific.length ? <ul>{specific.map((r) => <Item key={r.id} r={r} />)}</ul> : null}
      {general.length ? <details><summary className="meta">Cross-cutting: polling, fact-checking, parliamentary research</summary><ul>{general.map((r) => <Item key={r.id} r={r} />)}</ul></details> : null}
    </section>
  );
}
