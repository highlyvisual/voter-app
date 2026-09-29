import { localStats, PLAIN, REGION_GSS, NATION_GSS, UK_GSS } from "@/lib/localStats";
import AreaFigures, { type Level } from "@/components/AreaFigures";

// The same official figures, in the same order, for every council area; each with its period and its producer.
// Values only: no colours, no "better or worse than average", no comparison with other councils.
// Round eight (Romily, 29 Sept): q25 plain names and a line on what each figure means; q7 the option to see the same
// figures for a wider area (region, nation, UK), one area at a time, so nothing is set against anything else.
export default async function AreaNumbers({ gss, name, region }: { gss: string | null | undefined; name: string; region?: string | null }) {
  const nation = gss ? NATION_GSS[gss[0]] : undefined;
  const regionGss = region ? REGION_GSS[region] : undefined;
  const wanted: { key: string; label: string; gss: string | null | undefined }[] = [
    { key: "council", label: name, gss },
    ...(regionGss ? [{ key: "region", label: region as string, gss: regionGss }] : []),
    ...(nation ? [{ key: "nation", label: nation[1], gss: nation[0] }] : []),
    { key: "uk", label: "United Kingdom", gss: UK_GSS },
  ];
  const results = await Promise.all(wanted.map((w) => localStats(w.gss)));
  if (!results[0].length) return null;
  const levels: Level[] = wanted.map((w, i) => ({
    key: w.key, label: w.label, gss: w.gss ?? "",
    stats: results[i].map((s) => ({ slug: s.slug, name: PLAIN[s.slug]?.name ?? s.label, means: PLAIN[s.slug]?.means ?? s.subtitle, display: s.display, period: s.period, source: s.source })),
  })).filter((l) => l.stats.length);
  return (
    <section className="council-topic area-numbers" aria-labelledby="area-numbers-h">
      <h2 id="area-numbers-h">Life in {name}: the official facts</h2>
      <p className="meta" style={{ marginTop: 0 }}>Facts about the people who live here: their pay, homes, health and more, from official statistics. They describe the place, not you, and every council gets the same list. Each shows when it was measured.</p>
      <AreaFigures levels={levels} />
      <p className="meta">Gathered by the Office for National Statistics in Explore Local Statistics (Open Government Licence), refreshed daily. Some figures aren&rsquo;t published for every nation, so the list can be shorter outside England.</p>
    </section>
  );
}
