import { FINANCE_SOURCES, thousands, pounds, type CouncilFinance as CF } from "@/lib/councilFinance";

// "What the council plans to spend": each service's budgeted net spending as the council reported it to its government.
// Every council in a nation gets the same headings in the same order (the return's own), including services it doesn't
// run. No per-head figures, no shares, no comparison with other councils, no colour.
const MEASURE: Record<CF["nation"], string> = {
  England: "Net current expenditure: net of sales, fees and charges; spending funded by the NHS, such as through the Better Care Fund, is excluded.",
  Wales: "Revenue expenditure: the cost of running each service in the year, as the Welsh Government collects it.",
  Scotland: "Net revenue expenditure: spending less the service\u2019s own income.",
};
const RETURN: Record<CF["nation"], string> = {
  England: "the Ministry of Housing, Communities and Local Government",
  Wales: "the Welsh Government",
  Scotland: "the Scottish Government",
};

export function CouncilSpending({ fin, name }: { fin: CF | null; name: string }) {
  if (!fin) return null;
  const src = FINANCE_SOURCES[fin.nation.toLowerCase()];
  return (
    <section className="council-topic" aria-labelledby="spend-h">
      <h2 id="spend-h">What the council plans to spend, 2026&ndash;27</h2>
      {fin.spend ? (
        <>
          <p className="meta" style={{ marginTop: 0 }}>The budget for each service, as {name} reported it to {RETURN[fin.nation]}. The same headings, in the same order, for every council in {fin.nation}.</p>
                      <table className="plain spend-table">
              <caption className="sr-only">{name}: budget by service, 2026 to 2027</caption>
              <thead><tr><th scope="col">Service</th><th scope="col" className="num">Budget</th></tr></thead>
              <tbody>
                {fin.spend.lines.map(([label, v]) => (
                  <tr key={label}><th scope="row">{label}</th><td className="num">{thousands(v)}</td></tr>
                ))}
              </tbody>
              <tfoot><tr><th scope="row">{fin.spend.total[0]}</th><td className="num"><b>{thousands(fin.spend.total[1])}</b></td></tr></tfoot>
            </table>
                    <p className="meta">
            {MEASURE[fin.nation]} 
            A minus figure means the service&rsquo;s income is budgeted to be more than its spending. &ldquo;None budgeted&rdquo; usually means another body runs that service here.
            {" "}Source: <a href={src.page} rel="noopener">{src.publisher}, {src.title}</a>{src.updated ? `, updated ${src.updated}` : ""} (Open Government Licence).
          </p>
        </>
      ) : (
        <p className="empty">{src.publisher}&rsquo;s table has no figures for {name} for 2026&ndash;27: &ldquo;RA return not received in time for publication.&rdquo; <a href={src.page} rel="noopener" className="meta">The table</a></p>
      )}
    </section>
  );
}

/** Council tax for Wales and Scotland (England's comes from council_tax_2026, set out beside it on the page). */
export function CouncilTaxDevolved({ fin, name }: { fin: CF | null; name: string }) {
  const d = fin?.band_d;
  if (!fin || !d) return null;
  const src = d.source === "wales" ? FINANCE_SOURCES.wales_band_d : FINANCE_SOURCES.scotland_ctax;
  const bandsSrc = d.source === "wales" ? FINANCE_SOURCES.wales_bands : FINANCE_SOURCES.scotland_ctax;
  return (
    <>
      {d.source === "wales" ? (
        <p className="small">Average Band D council tax in {name} for 2026&ndash;27: <b>{pounds(d.total)}</b> a year. Of that, {pounds(d.council)} is set by the council, {pounds(d.police ?? 0)} by the police{d.community ? <> and, on average, {pounds(d.community)} by community councils</> : null}.</p>
      ) : (
        <p className="small">Band D council tax set by {name} for 2026&ndash;27: <b>{pounds(d.total)}</b> a year. {src.note ? `${src.note}.` : ""}</p>
      )}
      {fin.bands?.length ? (
        <details className="more">
          <summary className="meta">Every band</summary>
          <table className="plain spend-table">
            <caption className="sr-only">{name}: council tax by band, 2026 to 2027{d.source === "wales" ? ", including police and average community council" : ""}</caption>
            <thead><tr><th scope="col">Band</th><th scope="col" className="num">A year</th></tr></thead>
            <tbody>{fin.bands.map(([b, v]) => <tr key={b}><th scope="row">{b}</th><td className="num">{pounds(v)}</td></tr>)}</tbody>
          </table>
          <p className="meta">{d.source === "wales" ? "Including the police and the average community council charge; band A− is for homes in band A that qualify for disabled band reduction. " : ""}Source: <a href={bandsSrc.page} rel="noopener">{bandsSrc.publisher}, {bandsSrc.title}</a> (Open Government Licence).</p>
        </details>
      ) : null}
      <p className="meta">{bandsSrc !== src || !fin.bands?.length ? <>Source: <a href={src.page} rel="noopener">{src.publisher}, {src.title}</a> (Open Government Licence). </> : null}Your own bill depends on your band{d.source === "wales" ? ", your community council" : ""} and any discounts or reductions.</p>
    </>
  );
}
