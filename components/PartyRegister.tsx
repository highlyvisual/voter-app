import { LOAN_QUARTERS, REGISTER_RETRIEVED, type PartyEntry } from "@/lib/partyRegister";

// The same sections, in the same order and the Commission's own headings, for every party. Figures as published; no
// ranking, no comparison with other parties, no judgement of whether an amount is large.
const gbp = (n: number) => (n < 0 ? "\u2212£" : "£") + Math.abs(Math.round(n)).toLocaleString("en-GB");
const day = (s: string | null) => (s ? new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "date not given");
const checked = day(REGISTER_RETRIEVED.slice(0, 10));
const joinList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/** Register facts: registration date, officers, where it stands candidates, its registered ballot-paper descriptions. */
export function PartyRegisterEntry({ p }: { p: PartyEntry | null }) {
  if (!p) return null;
  return (
    <section className="council-topic" aria-labelledby="register-h">
      <h2 id="register-h">On the Electoral Commission&rsquo;s register</h2>
      <p className="small">
        Registered as <b>{p.name}</b> on the {p.register} register{p.registered_on ? <> since {day(p.registered_on)}</> : null}.
        {p.fields_candidates_in.length ? <> It is registered to stand candidates in {joinList(p.fields_candidates_in)}.</> : null}
        {p.minor_party ? <> It is a minor party: registered for parish and community council elections only.</> : null}
      </p>
      {p.officers.length ? <p className="small">Registered officers: {p.officers.map(([role, name], i) => <span key={role + name}>{i ? "; " : ""}{role}, {name}</span>)}.</p> : null}
      {p.descriptions.length ? (
        <details className="more">
          <summary className="meta">The {p.descriptions.length} {p.descriptions.length === 1 ? "description" : "descriptions"} it may use on ballot papers</summary>
          <ul className="small">{p.descriptions.map((d) => <li key={d}>{d}</li>)}</ul>
        </details>
      ) : null}
      <p className="meta">As registered with <a href={p.page} rel="noopener">the Electoral Commission</a>, checked {checked}.</p>
    </section>
  );
}

/** Latest statement of accounts (central party), loans reported in the last four quarters, 2024 campaign spending. */
export function PartyMoney({ p, partyName }: { p: PartyEntry | null; partyName: string }) {
  if (!p) return null;
  const a = p.accounts;
  const s = p.ge2024_spending;
  return (
    <>
      <section className="council-topic" aria-labelledby="accounts-h">
        <h2 id="accounts-h">{partyName}&rsquo;s accounts</h2>
        {a ? (
          <>
            <p className="small">In its statement of accounts for {a.year} (the central party), {partyName} reported income of <b>{gbp(a.total_income)}</b> and spending of <b>{gbp(a.total_expenditure)}</b>{a.net_assets !== null ? <>, with net assets of {gbp(a.net_assets)} at the end of the year</> : null}.</p>
            <details className="more">
              <summary className="meta">Income and spending, line by line</summary>
                              <table className="plain spend-table">
                  <caption className="sr-only">{partyName}: income, {a.year}</caption>
                  <thead><tr><th scope="col">Income</th><th scope="col" className="num">{a.year}</th></tr></thead>
                  <tbody>{a.income.map(([l, v]) => <tr key={l}><th scope="row">{l}</th><td className="num">{gbp(v)}</td></tr>)}</tbody>
                  <tfoot><tr><th scope="row">Total income</th><td className="num"><b>{gbp(a.total_income)}</b></td></tr></tfoot>
                </table>
                <table className="plain spend-table">
                  <caption className="sr-only">{partyName}: expenditure, {a.year}</caption>
                  <thead><tr><th scope="col">Expenditure</th><th scope="col" className="num">{a.year}</th></tr></thead>
                  <tbody>{a.expenditure.map(([l, v]) => <tr key={l}><th scope="row">{l}</th><td className="num">{gbp(v)}</td></tr>)}</tbody>
                  <tfoot><tr><th scope="row">Total expenditure</th><td className="num"><b>{gbp(a.total_expenditure)}</b></td></tr></tfoot>
                </table>
                          </details>
            <p className="meta">The central party only: local branches and other accounting units above a set size file their own. {a.basis ? `Prepared on an ${a.basis.toLowerCase()} basis. ` : ""}Published by the Commission on {day(a.published)}. <a href={a.page} rel="noopener">The statement</a>{a.document ? <> · <a href={a.document} rel="noopener">the accounts as filed (PDF)</a></> : null}.</p>
          </>
        ) : (
          <p className="empty">The Electoral Commission has no statement of accounts for {partyName}&rsquo;s central party for the last two years in its register search. <a href={p.page} rel="noopener" className="meta">Its register entry</a></p>
        )}
      </section>

      <section className="council-topic" aria-labelledby="loans-h">
        <h2 id="loans-h">Loans to {partyName}</h2>
        {p.loans.count ? (
          <>
            <p className="small">{p.loans.count} {p.loans.count === 1 ? "loan was" : "loans were"} reported to the Electoral Commission in {LOAN_QUARTERS[0]} to {LOAN_QUARTERS[LOAN_QUARTERS.length - 1]}, worth <b>{gbp(p.loans.total)}</b> in all.{p.loans.count > p.loans.largest.length ? ` The ${p.loans.largest.length} largest:` : ""}</p>
            <ul className="small">
              {p.loans.largest.map((l) => (
                <li key={l.ref}>{l.lender} <span className="meta">({l.lender_type.toLowerCase()})</span>: {gbp(l.value)} from {day(l.start)}, to {l.unit === "Central Party" ? "the central party" : l.unit}; {l.status.toLowerCase()}{l.status === "Outstanding" && l.outstanding !== l.value ? `, ${gbp(l.outstanding)} still owed` : ""}.</li>
              ))}
            </ul>
          </>
        ) : <p className="small">No loans to {partyName} were reported to the Electoral Commission in {LOAN_QUARTERS[0]} to {LOAN_QUARTERS[LOAN_QUARTERS.length - 1]}.</p>}
        <p className="meta">Parties report loans and credit facilities over £11,180 (£2,230 for local branches), including to local branches. From <a href="https://search.electoralcommission.org.uk/" rel="noopener">the Commission&rsquo;s register</a>, checked {checked}.</p>
      </section>

      <section className="council-topic" aria-labelledby="ge-spend-h">
        <h2 id="ge-spend-h">Campaign spending at the 2024 general election</h2>
        {s ? (
          <>
            <p className="small">{partyName} reported campaign spending of <b>{gbp(s.total)}</b> for the UK Parliament general election on 4 July 2024.</p>
            <ul className="small">{s.by_category.map(([k, v]) => <li key={k}>{k}: {gbp(v)}</li>)}</ul>
          </>
        ) : <p className="small">The Electoral Commission has no national campaign spending return from {partyName} for the 2024 UK general election.</p>}
        <p className="meta">The party&rsquo;s national campaign, in the Commission&rsquo;s categories; each candidate&rsquo;s own local spending is reported separately. From <a href="https://search.electoralcommission.org.uk/" rel="noopener">the Commission&rsquo;s register</a>, checked {checked}.</p>
      </section>
    </>
  );
}
