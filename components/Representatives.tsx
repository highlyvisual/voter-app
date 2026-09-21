import { publicClient } from "@/lib/data";
import { previousResult } from "@/lib/democracyclub";
// Who represents you now (Romily's brief §22), as distinct from who is standing. Official sources only.
const H = { "User-Agent": "voter-app (github.com/highlyvisual/voter-app)" };
async function currentMp(constituency: string): Promise<{ name: string | null; party: string | null; id: number | null; vacant: boolean } | null> {
  try {
    const d = await fetch(`https://members-api.parliament.uk/api/Location/Constituency/Search?searchText=${encodeURIComponent(constituency)}&take=3`, { headers: H, next: { revalidate: 86400 } }).then((r) => (r.ok ? r.json() : null));
    const c = (d?.items ?? []).map((i: { value: unknown }) => i.value).find((v: { name: string }) => v.name.toLowerCase() === constituency.toLowerCase());
    if (!c) return null;
    const m = c.currentRepresentation?.member?.value;
    return m ? { name: m.nameDisplayAs, party: m.latestParty?.name ?? null, id: m.id, vacant: false } : { name: null, party: null, id: null, vacant: true };
  } catch { return null; }
}
export default async function Representatives({ areaName, level }: { areaName: string; level: string }) {
  if (level === "parliamentary") {
    const mp = await currentMp(areaName);
    if (!mp) return null;
    return (
      <section className="reps" aria-labelledby="reps-heading">
        <h2 id="reps-heading">Who represents you now</h2>
        {mp.vacant ? (
          <p><strong>The seat is vacant.</strong> {areaName} has no MP until this by-election is decided — which is why it is being held. Until then, constituents' cases go to neighbouring MPs or directly to government departments.</p>
        ) : (
          <p><strong>{mp.name}</strong>{mp.party ? `, ${mp.party}` : ""}, is the MP for {areaName}. <a href={`https://members.parliament.uk/member/${mp.id}/contact`} rel="noopener">How to contact them</a>.</p>
        )}
        <p className="meta">From the UK Parliament Members API.</p>
      </section>
    );
  }
  // Local: the councillors elected at the ward's last full election, from the official result.
  const db = publicClient();
  const { data: b } = await db.from("ballots").select("previous_ballot_paper_id").eq("area_name", areaName).not("previous_ballot_paper_id", "is", null).limit(1).maybeSingle();
  const prev = b?.previous_ballot_paper_id ? await previousResult(b.previous_ballot_paper_id) : null;
  const elected = (prev?.rows ?? []).filter((r) => r.elected);
  if (!elected.length) return null;
  return (
    <section className="reps" aria-labelledby="reps-heading">
      <h2 id="reps-heading">Who represents you now</h2>
      <p>At the last full election here, the ward elected: {elected.map((r, i) => <span key={r.name}>{i ? ", " : ""}<strong>{r.name}</strong> ({r.party})</span>)}. One of those seats is now empty — that is what this by-election fills.</p>
      <p className="meta">From the official result via Democracy Club. The council's own website lists current councillors and how to contact them.</p>
    </section>
  );
}
