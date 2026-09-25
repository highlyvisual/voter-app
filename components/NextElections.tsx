import { publicClient } from "@/lib/data";
import { SCHEDULED } from "@/lib/scheduled";
// When this postcode next votes. Council dates come from the scheduled next-election date recorded against sitting
// councillors (Open Council Data); national dates come from the scheduled list, each with its source.
export default async function NextElections({ lat, lng }: { lat: number | null; lng: number | null }) {
  let district: string | null = null, county: string | null = null;
  if (lat !== null && lng !== null) {
    try {
      const r = await fetch(`https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}&limit=1&radius=600`, { signal: AbortSignal.timeout(5000), next: { revalidate: 604800 } }).then((x) => x.json());
      district = r?.result?.[0]?.admin_district ?? null; county = r?.result?.[0]?.admin_county ?? null;
    } catch { /* optional */ }
  }
  const db = publicClient();
  const council = async (name: string | null) => {
    if (!name) return null;
    const { data } = await db.from("councillors").select("next_election").ilike("council", name).not("next_election", "is", null).order("next_election").limit(1);
    return data?.[0]?.next_election ?? null;
  };
  const [d, c] = await Promise.all([council(district), council(county)]);
  let country: string | null = null;
  if (lat !== null && lng !== null) {
    try {
      const r = await fetch(`https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}&limit=1&radius=600`, { signal: AbortSignal.timeout(5000), next: { revalidate: 604800 } }).then((x) => x.json());
      country = r?.result?.[0]?.country ?? null;
    } catch { /* optional */ }
  }
  const fmt = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const rows: { when: string; what: string; note: string }[] = [];
  if (d && district) rows.push({ when: fmt(d), what: `${district} council`, note: "Next scheduled election for your council, from the terms of the councillors now serving." });
  if (c && county) rows.push({ when: fmt(c), what: `${county} County Council`, note: "Your county council runs schools, social care and main roads." });
  // Every council in Scotland, Wales and NI votes in May 2027, but only some English ones. If this council's own next
  // election is known and is not in 2027, saying "local elections in May 2027" here would be wrong for this postcode.
  const ownDates = [d, c].filter(Boolean) as string[];
  for (const s of SCHEDULED) {
    if (s.id === "local-2027" && ownDates.length) continue;   // the council's own date above is more precise
    if (s.id === "nia-2027" && country !== "Northern Ireland") continue;
    rows.push({ when: s.when, what: s.title, note: s.detail });
  }
  rows.sort((a, b2) => (a.when.match(/\d{4}/)?.[0] ?? "9999").localeCompare(b2.when.match(/\d{4}/)?.[0] ?? "9999"));
  return (
    <section className="next-elections" aria-labelledby="next-el">
      <h2 id="next-el">When you next get a vote</h2>
      {rows.length ? (
        <ol className="next-list">
          {rows.map((r) => (
            <li key={r.what}>
              <span className="next-when">{r.when}</span>
              <span className="next-what">{r.what}</span>
              <span className="meta">{r.note}</span>
            </li>
          ))}
        </ol>
      ) : <p>We could not work out your council from that postcode. Every council in Scotland, Wales and Northern Ireland, and 216 in England, holds elections on 6 May 2027.</p>}
      <p className="meta">Dates can move: by-elections happen whenever a seat falls vacant, and a general election can be called sooner than its deadline. This page updates as soon as an election is called at your postcode.</p>
    </section>
  );
}
