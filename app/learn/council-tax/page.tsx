import Link from "next/link";
import data from "@/lib/council_finance.json";
import { FINANCE_SOURCES, FINANCE_YEAR, type CouncilFinance } from "@/lib/councilFinance";
import { publicClient } from "@/lib/data";
import { councilSlugFor, registerRows } from "@/lib/councils";

export const metadata = { title: "Where your council tax goes", description: "Pick a council and see what its council tax bill pays for and how the council's budget is shared between services, from official figures.", alternates: { canonical: "/learn/council-tax" } };

// Round eight q19, fifth Learn visual. Two official pictures for any council in England, Scotland or Wales: who gets the
// Band D bill, and how the council's budget is shared between services, as pounds out of every £100. The same list and
// order for every council; nothing is compared or ranked. Northern Ireland has domestic rates, not council tax.
const COUNCILS = (data as unknown as { councils: Record<string, CouncilFinance> }).councils;
const OPTIONS = Object.entries(COUNCILS).filter(([, c]) => c.spend).map(([code, c]) => ({ code, name: c.source_name, nation: c.nation })).sort((a, b) => a.name.localeCompare(b.name));
const gbp = (n: number) => "£" + Math.round(n).toLocaleString("en-GB");

export default async function CouncilTaxLearn({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const code = typeof sp.c === "string" && COUNCILS[sp.c] ? sp.c : "";
  const c = code ? COUNCILS[code] : null;
  let bill: { label: string; value: number }[] = [];
  let billNote = "";
  if (c?.band_d) {
    const b = c.band_d;
    bill = [{ label: `${c.source_name} council`, value: b.council }, ...(b.police ? [{ label: "Police", value: b.police }] : []), ...(b.community ? [{ label: "Community councils (average)", value: b.community }] : [])];
    billNote = c.nation === "Scotland" ? "In Scotland, water and sewerage charges are collected with council tax but are not part of it." : "Averages for a Band D home.";
  } else if (c && c.nation === "England") {
    const { data: row } = await publicClient().from("council_tax_2026").select("authority, kind, own_band_d, area_band_d").eq("ons_code", code).maybeSingle();
    if (row?.area_band_d) {
      const own = Number(row.own_band_d), total = Number(row.area_band_d);
      bill = [{ label: `${row.authority} council`, value: own }, { label: row.kind === "district" ? "County council, police, fire and parish" : "Police, fire, the mayor or GLA where there is one, and parish", value: total - own }];
      billNote = "Averages for a Band D home, including the adult social care precept and the average parish precept.";
    }
  }
  const slug = c ? ((await registerRows()).find((r) => r.gss_code === code || r.ons_gss_code === code)?.slug ?? (await councilSlugFor(c.source_name))) : null;
  const billTotal = bill.reduce((a, b) => a + b.value, 0);
  const lines = c?.spend ? c.spend.lines.filter(([, v]) => v > 0) : [];
  const spendTotal = lines.reduce((a, [, v]) => a + v, 0);
  const src = c?.spend ? FINANCE_SOURCES[c.spend.source] : null;
  return (
    <>
      <p className="eyebrow"><Link href="/learn">Learn</Link></p>
      <h1>Where your council tax goes</h1>
      <p className="lede">Pick a council to see who your council tax bill pays, and how the council shares its budget between services. Official figures for {FINANCE_YEAR}.</p>
      <form method="get" className="ct-pick">
        <label htmlFor="ct-c">Council</label>
        <select id="ct-c" name="c" defaultValue={code}>
          <option value="">Choose a council…</option>
          {(["England", "Scotland", "Wales"] as const).map((n) => (
            <optgroup key={n} label={n}>{OPTIONS.filter((o) => o.nation === n).map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}</optgroup>
          ))}
        </select>
        <button type="submit">Show me</button>
      </form>
      {c ? (
        <>
          {bill.length ? (
            <section aria-labelledby="ct-bill">
              <h2 id="ct-bill">Who your bill pays</h2>
              <p>An average Band D bill in {c.source_name} is <b>{gbp(billTotal)}</b> a year.</p>
              <ul className="ct-stack">{bill.map((b) => <li key={b.label}><span className="ct-lbl">{b.label}</span><span className="ct-bar" aria-hidden><span style={{ width: `${(b.value / billTotal) * 100}%` }} /></span><span className="ct-val">{gbp(b.value)}</span></li>)}</ul>
              <p className="meta">{billNote} Your own bill depends on your band and any discounts.</p>
            </section>
          ) : null}
          <section aria-labelledby="ct-spend">
            <h2 id="ct-spend">For every £100 {c.source_name} council spends on services</h2>
            <ul className="ct-stack">{lines.map(([name, v]) => {
              const per = (v / spendTotal) * 100;
              return <li key={name}><span className="ct-lbl">{name}</span><span className="ct-bar" aria-hidden><span style={{ width: `${per}%` }} /></span><span className="ct-val">{per < 1 ? "under £1" : `£${Math.round(per)}`}</span></li>;
            })}</ul>
            <p className="meta">Council tax is only one way this is paid for: government grants, business rates, and fees and charges pay for much of it, and school budgets are mostly a government grant passed through the council. Services with nothing budgeted are left out. Source: {src ? <a href={src.page} rel="noopener">{src.publisher}, {src.title}</a> : "official statistics"} (Open Government Licence).</p>
          </section>
          {slug ? <p><Link href={`/council/${slug}`}>What {c.source_name} council is deciding &rarr;</Link></p> : null}
        </>
      ) : <p className="meta">Northern Ireland has no council tax: households pay domestic rates, set partly by the council and partly by the Executive.</p>}
    </>
  );
}
