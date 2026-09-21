import { publicClient } from "@/lib/data";
// Reported funding for a party over the latest full year, from the Electoral Commission's register. Private donations
// and public funds are kept separate because they mean different things. Shown identically for every party.
export default async function PartyFunding({ ecId, partyName }: { ecId: string; partyName: string }) {
  const { data: f } = await publicClient().from("party_funding").select("*").eq("ec_id", ecId).maybeSingle();
  const gbp = (n: number) => "£" + Math.round(n).toLocaleString("en-GB");
  const d = (s: string) => new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <section className="funding" aria-labelledby="funding-heading">
      <h2 id="funding-heading">Who funds {partyName}</h2>
      {f ? (
        <>
          <p>Between {d(f.period_start)} and {d(f.period_end)}, {partyName} reported accepting <b>{gbp(Number(f.private_total))}</b> in donations ({f.private_count} reported {f.private_count === 1 ? "donation" : "donations"}){Number(f.public_total) > 0 ? <>, and <b>{gbp(Number(f.public_total))}</b> in public funding</> : ""}.</p>
          {Array.isArray(f.top_donors) && f.top_donors.length ? (
            <>
              <p className="meta" style={{ marginBottom: "0.2rem" }}>Largest reported donors in that period:</p>
              <ol className="small donors">{(f.top_donors as { name: string; total: number; kind: string | null }[]).map((x) => <li key={x.name}>{x.name}{x.kind ? <span className="meta"> · {x.kind}</span> : null} — {gbp(x.total)}</li>)}</ol>
            </>
          ) : null}
        </>
      ) : <p>No donations to {partyName} were reported to the Electoral Commission for the latest full year.</p>}
      <p className="meta">From the Electoral Commission's register of political finance, including local party branches. Parties must report donations over £11,180 (£2,230 for local branches), so smaller gifts do not appear. Public funds include grants such as opposition parties' parliamentary funding. <a href="https://search.electoralcommission.org.uk/" rel="noopener">Search the full register</a>.</p>
    </section>
  );
}
