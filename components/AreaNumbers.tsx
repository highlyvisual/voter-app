import { localStats } from "@/lib/localStats";

// The same official figures, in the same order, for every council area; each with its period and its producer.
// Values only: no colours, no "better or worse than average", no comparison with other councils.
export default async function AreaNumbers({ gss, name }: { gss: string | null | undefined; name: string }) {
  const stats = await localStats(gss);
  if (!stats.length) return null;
  return (
    <section className="council-topic area-numbers" aria-labelledby="area-numbers-h">
      <h2 id="area-numbers-h">{name} in numbers</h2>
      <p className="meta" style={{ marginTop: 0 }}>Official statistics for the whole council area. Each figure is the latest published, with the period it covers.</p>
      <dl className="stat-list">
        {stats.map((s) => (
          <div key={s.slug}>
            <dt>{s.label}</dt>
            <dd><b>{s.display}</b> <span className="meta">{s.period}{s.source ? <> · <a href={s.source.href} rel="noopener">{s.source.name}</a></> : null}</span><span className="meta sub">{s.subtitle}</span></dd>
          </div>
        ))}
      </dl>
      <p className="meta">Gathered by the Office for National Statistics in <a href={`https://www.ons.gov.uk/explore-local-statistics/areas/${gss}`} rel="noopener">Explore Local Statistics</a> (Open Government Licence), refreshed daily. Some figures aren&rsquo;t published for every nation, so the list can be shorter outside England.</p>
    </section>
  );
}
