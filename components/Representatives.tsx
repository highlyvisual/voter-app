import { publicClient } from "@/lib/data";
import { previousResult } from "@/lib/democracyclub";
// Who represents you now (Romily's brief §22), as distinct from who is standing. Official sources only.
const H = { "User-Agent": "voter-app (github.com/highlyvisual/voter-app)" };
export async function currentMp(constituency: string): Promise<{ name: string | null; party: string | null; id: number | null; vacant: boolean } | null> {
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
  // Local: the ward's councillors and the council's control, from Open Council Data (public domain), as recorded after
  // the May 2026 elections. A by-election means one seat has since fallen vacant, so the list is labelled accordingly.
  const db = publicClient();
  const [rawCouncil, rawWard = ""] = areaName.split(":").map((x) => x.trim());
  const ward = rawWard.replace(/\s+ward$/i, "");
  const stripped = rawCouncil.replace(/\s+(Borough|District|City|County|Council)(?=\s|$)/g, "").trim();
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
  let cllrs: { name: string; party_name: string | null; next_election: string | null }[] = [];
  let councilName = rawCouncil;
  for (const c of [rawCouncil, stripped]) {
    const { data } = await db.from("councillors").select("name, party_name, next_election, ward, council").ilike("council", c);
    const hit = (data ?? []).filter((r) => norm(r.ward) === norm(ward));
    if (hit.length) { cllrs = hit; councilName = hit[0].council; break; }
  }
  const { data: control } = await db.from("council_control").select("*").ilike("authority", councilName).eq("year", 2026).maybeSingle();
  const prevIsBy = true; void prevIsBy;
  if (!cllrs.length && !control) {
    const { data: b } = await db.from("ballots").select("previous_ballot_paper_id").eq("area_name", areaName).not("previous_ballot_paper_id", "is", null).limit(1).maybeSingle();
    const prev = b?.previous_ballot_paper_id ? await previousResult(b.previous_ballot_paper_id) : null;
    const elected = (prev?.rows ?? []).filter((r) => r.elected);
    if (!elected.length) return null;
    return (
      <section className="reps" aria-labelledby="reps-heading">
        <h2 id="reps-heading">Who represents you now</h2>
        <p>At the last full election here, the ward elected: {elected.map((r, i) => <span key={r.name}>{i ? ", " : ""}<strong>{r.name}</strong> ({r.party})</span>)}.</p>
        <p className="meta">From the official result via Democracy Club.</p>
      </section>
    );
  }
  const seats = control ? ([["Conservative", control.con], ["Labour", control.lab], ["Liberal Democrat", control.ld], ["Green", control.green], ["Reform UK", control.ref], ["Plaid Cymru", control.pc], ["SNP", control.snp], ["UKIP", control.ukip], ["Other", control.other]] as [string, number | null][]).filter(([, n]) => n) : [];
  return (
    <section className="reps" aria-labelledby="reps-heading">
      <h2 id="reps-heading">Who represents you now</h2>
      {cllrs.length ? (
        <>
          <p style={{ marginBottom: "0.3rem" }}>Councillors for {ward}, as recorded after the May 2026 elections:</p>
          <ul className="small" style={{ marginTop: 0 }}>{cllrs.map((c) => <li key={c.name}><strong>{c.name}</strong>{c.party_name ? `, ${c.party_name}` : ""}</li>)}</ul>
          <p className="meta">This by-election fills a seat that has fallen vacant since then, so one of those listed may no longer hold it.</p>
        </>
      ) : null}
      {control ? (
        <p className="small">Across the whole of {councilName} council ({control.total} seats in 2026): {seats.map(([p, n]) => `${p} ${n}`).join(", ")}. Run by: <strong>{describeControl(control.majority)}</strong>.</p>
      ) : null}
      <p className="meta">Councillors and council make-up from Open Council Data (public domain). The council's own website lists current councillors and how to contact them.</p>
    </section>
  );
}

// "LAB", "GRN min", "LD/IND" → plain words. Party control is a fact about the council, not a judgement of it.
function describeControl(m: string | null): string {
  if (!m) return "not recorded";
  if (/^\s*NOC\s*$/i.test(m)) return "no overall control: no single party or group has a majority";
  const names: Record<string, string> = { CON: "Conservatives", LAB: "Labour", LD: "Liberal Democrats", GRN: "Greens", REF: "Reform UK", PC: "Plaid Cymru", SNP: "SNP", IND: "independents", UKIP: "UKIP", NOC: "no overall control" };
  const parts = m.replace(/\s*min$/i, "").split("/").map((x) => names[x.trim().toUpperCase()] ?? x.trim());
  const minority = /min$/i.test(m.trim());
  if (parts.length === 1) return minority ? `${parts[0]}, as a minority administration` : `${parts[0]}, with a majority`;
  return `a coalition or arrangement of ${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}
