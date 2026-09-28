import { publicClient } from "@/lib/data";
import { councilFinanceByName, pounds } from "@/lib/councilFinance";
// "Of your council tax, how much does this council set?" Makes concrete what a council election controls.
// Official figures: MHCLG, Council Tax levels set by local authorities in England 2026 to 2027 (Open Government Licence).
export default async function CouncilTax({ areaName }: { areaName: string }) {
  const raw = areaName.split(":")[0].trim();
  const stripped = raw.replace(/\s+(Borough|District|City|County|Council)(?=\s|$)/g, "").trim();
  const db = publicClient();
  let row: { authority: string; kind: string; own_band_d: number; area_band_d: number | null } | null = null;
  for (const n of [raw, stripped]) {
    const { data } = await db.from("council_tax_2026").select("*").ilike("authority", n).maybeSingle();
    if (data) { row = data; break; }
  }
  if (!row) return <Devolved name={stripped || raw} />;
  const gbp = (n: number) => "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const own = Number(row.own_band_d), total = row.area_band_d ? Number(row.area_band_d) : null;
  const share = total ? Math.round((own / total) * 100) : null;
  return (
    <section className="ctax" aria-labelledby="ctax-heading">
      <h2 id="ctax-heading">How much of your council tax this council sets</h2>
      {total ? (
        <>
          <p>On an average Band D home in {row.authority}, the council tax bill for 2026–27 is <b>{gbp(total)}</b> a year. Of that, <b>{row.authority} council sets {gbp(own)}</b>{share !== null ? ` (${share}%)` : ""}; the rest goes to {row.kind === "district" ? "the county council, police, fire service and any parish council" : "the police, fire service or mayor, and any parish council"}.</p>
          <div className="ctax-bar" role="img" aria-label={`${share}% set by this council`}><span style={{ width: `${Math.max(3, share ?? 0)}%` }} /></div>
        </>
      ) : (
        <p>{row.authority} council's part of an average Band D council tax bill for 2026–27 is <b>{gbp(own)}</b> a year. Your full bill also includes your district or borough council, police, fire service and any parish council.</p>
      )}
      <p className="meta">Averages for a Band D home, including the adult social care precept. The area total includes the average parish precept{row.kind === "district" ? "; the council\u2019s own figure excludes it" : ""}. Your own bill depends on your band and parish. Source: Ministry of Housing, Communities and Local Government, Council Tax levels set by local authorities in England 2026 to 2027 (Open Government Licence). England only.</p>
    </section>
  );
}

// Wales and Scotland: each government's own council tax statistics (lib/council_finance.json).
function Devolved({ name }: { name: string }) {
  const fin = councilFinanceByName(name);
  const d = fin?.band_d;
  if (!fin || !d) return null;
  return (
    <section className="ctax" aria-labelledby="ctax-heading">
      <h2 id="ctax-heading">How much of your council tax this council sets</h2>
      {d.source === "wales" ? (
        <p>On an average Band D home in {fin.source_name}, council tax for 2026–27 is <b>{pounds(d.total)}</b> a year. Of that, <b>the council sets {pounds(d.council)}</b>; {pounds(d.police ?? 0)} goes to the police{d.community ? <> and, on average, {pounds(d.community)} to community councils</> : null}.</p>
      ) : (
        <p>Band D council tax set by {fin.source_name} for 2026–27 is <b>{pounds(d.total)}</b> a year, all of it set by the council. It excludes water and sewerage charges.</p>
      )}
      <p className="meta">Your own bill depends on your band{d.source === "wales" ? ", your community council" : ""} and any discounts or reductions. Source: {d.source === "wales" ? "Welsh Government, Composition of average band D council tax by billing authority" : "Scottish Government, Council Tax by band 2026-27"} (Open Government Licence).</p>
    </section>
  );
}
