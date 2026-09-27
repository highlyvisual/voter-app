import type { ReceiptRow } from "@/lib/data";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
// The review (25 Sept) found the lines did not add up to the total: PolicyEngine's net income counts earnings and every
// tax and benefit it models, and only four are listed. The first line is the remainder, so the table sums exactly.
export function otherItems(r: Record<string, unknown>): number {
  const n = (k: string) => Number(r[k] ?? 0);
  return n("household_net_income") + n("income_tax") + n("national_insurance") - n("universal_credit") - n("child_benefit");
}
const LABELS: Record<string, string> = {
  other: "Earnings, and other income, taxes and benefits the model counts",
  income_tax: "Income tax paid",
  national_insurance: "National Insurance paid",
  universal_credit: "Universal Credit received",
  child_benefit: "Child Benefit received",
  household_net_income: "Net income after tax and benefits",
};

export default function CurrentLaw({ rows, complete, anyModelled, baselineId = "baseline", year }: { rows: ReceiptRow[]; complete: boolean; anyModelled: boolean; baselineId?: string; year?: string }) {
  if (!complete) return null;
  const baseline = rows.find((r) => r.reform_set_id === baselineId);
  const other = rows.find((r) => r.reform_set_id === (baselineId === "baseline" ? "baseline-2024" : "baseline"));
  if (!baseline) return <p className="muted small">No calculation is available for this combination of bands.</p>;
  return (
    <section className="receipt" aria-labelledby="current-law">
      <h2 id="current-law" style={{ marginTop: "1.25rem" }}>A household like this one, under {year ? `the law as it stood in ${year}` : "current law"}</h2>
      <p className="meta">Per year, for a representative household in these bands, calculated with PolicyEngine UK {baseline.policyengine_version}. The starting point each candidate's pledges are measured against. These figures describe a typical household in your bands, not you, and they are not a voting guide.</p>
      <div className="scroll"><table>
        <tbody>
          {Object.keys(LABELS).map((k) => (
            <tr key={k}><th scope="row">{LABELS[k]}</th><td className="num">{k === "income_tax" || k === "national_insurance" ? "\u2212" : k === "other" ? "" : "+"}{gbp.format(k === "other" ? otherItems(baseline.results) : Number(baseline.results[k] ?? 0))}</td></tr>
          ))}
        </tbody>
      </table></div>
      <p className="meta" style={{ margin: "0.3rem 0 0" }}>The first line is worked out as the net income, plus the tax and National Insurance paid, less the two benefits listed, so the lines add up to the total. It is mostly earnings or pension, and also includes any other taxes and benefits the model counts.</p>
      {other ? <details className="small" style={{ marginTop: "0.4rem" }}><summary>Compare with the law as it stood in {baselineId === "baseline" ? "2024" : "2026"}</summary><p className="meta" style={{ margin: "0.3rem 0 0" }}>Net income after tax and benefits for the same household: {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(Number(other.results.household_net_income ?? 0))} under {baselineId === "baseline" ? "2024" : "2026"} law, against {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(Number(baseline.results.household_net_income ?? 0))} now. Differences reflect thresholds, rates and benefit levels changing between the two years, not any candidate.</p></details> : null}
      <details className="small" style={{ marginTop: "0.5rem" }}>
        <summary>What this model can and cannot turn into a number</summary>
        <p className="meta" style={{ margin: "0.3rem 0 0" }}>
          Modelled here: pledges that change a tax or benefit parameter the household bands describe (an income-tax allowance, a National Insurance rate or threshold, a benefit rate). Not modelled, and shown as text only: pledges that need something the bands do not hold, such as energy consumption (a VAT cut on bills), a house purchase (stamp duty), assets (a wealth tax), or spending on services (police, hospitals, schools). Current law here is the 2026 tax and benefit system as encoded in PolicyEngine UK {"2.98.0"}, including changes from Budget 2025 that had taken effect by April 2026. The absence of a figure means the pledge could not be modelled honestly, never that it has no effect.
        </p>
      </details>
      {anyModelled ? null : <p className="meta" style={{ marginTop: "0.5rem" }}>No party's tax and benefit pledges have been modelled for this ballot yet. When they are, each candidate's Money section will show the difference from these figures.</p>}
      <details className="small">
        <summary className="muted">Assumptions behind this calculation</summary>
        <ul>
          <li>Income is placed at the midpoint of the band (over £100,000 uses £130,000), split 60/40 between adults in a couple.</li>
          <li>Employed: employment income. Self-employed: self-employment income. Retired: private pension income. Not working: no earned income, so the income band is not applied.</li>
          <li>One representative age per band (17, 21, 30, 42, 57, 70). "Youngest under 5" is one child aged 3; "school age" is one child aged 10. An adult dependant is not modelled.</li>
          <li>Rent: private renters £15,600 a year (single, no children) or £21,600; social renters £9,000; owners nil. Mortgage interest is not modelled. Region: London.</li>
          <li>Universal Credit and Child Benefit are claimed where there is entitlement. Student finance is outside the model.</li>
          <li>Every figure is reproducible from the open-source code and model version shown.</li>
        </ul>
      </details>
    </section>
  );
}
