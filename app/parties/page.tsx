import Link from "next/link";
import { publicClient } from "@/lib/data";
import { img } from "@/lib/site";
export const dynamic = "force-dynamic";
export const metadata = { title: "Explore the parties" };

// Parties as their own exploration mode: what each currently says, whenever you visit, not only during an election.
export default async function Parties() {
  const db = publicClient();
  const [{ data: parties }, { data: claims }] = await Promise.all([
    db.from("parties").select("ec_id, name, colour_hex, emblem_url, official_site_url"),
    db.from("current_claims").select("party_ec_id, topic, source_quote").eq("status", "verified").is("candidate_id", null),
  ]);
  const counts = new Map<string, number>();
  // The same party position is recorded once per election it applies to; count it once, as the party's own page does.
  const seen = new Set<string>();
  for (const c of claims ?? []) {
    if (!c.party_ec_id) continue;
    const k = `${c.party_ec_id}|${c.topic}|${c.source_quote}`;
    if (seen.has(k)) continue; seen.add(k);
    counts.set(c.party_ec_id, (counts.get(c.party_ec_id) ?? 0) + 1);
  }
  const rows = (parties ?? []).filter((p) => counts.get(p.ec_id)).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <p className="eyebrow">Between elections too</p>
      <h1>Explore the parties</h1>
      <p className="lede">What each party has published, by topic, with the date it was published and the date we last checked. Listed alphabetically. Parties whose published positions we have not yet sourced are not shown; that is a gap in our work, not a judgement of them.</p>
      <ul className="party-grid">
        {rows.map((p) => (
          <li key={p.ec_id}>
            <Link href={`/parties/${encodeURIComponent(p.ec_id)}`} className="party-card" style={{ borderColor: p.colour_hex ?? "var(--ink)" }}>
              {p.emblem_url ? <img src={img(p.emblem_url)} alt="" loading="lazy" /> : null}
              <strong>{p.name}</strong>
              <span className="meta">{counts.get(p.ec_id)} published positions</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
