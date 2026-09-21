// "You're voting for" — what this office decides and what it does not. Prevents the commonest mistake in political
// understanding: blaming or crediting a candidate for things the office they are contesting does not control.
const OFFICES: Record<string, { title: string; what: string; controls: [string, string][]; not: [string, string][] }> = {
  parliamentary: {
    title: "Your Member of Parliament",
    what: "One MP represents this constituency in the House of Commons. They vote on national laws, taxes and budgets, and take up constituents' problems with government bodies.",
    controls: [["Tax and benefits", "Income tax, National Insurance, Universal Credit and pensions are set by Parliament"], ["The NHS", "Its budget and the law it runs under, in England"], ["Immigration and borders", "Who may come, stay and work"], ["Crime and justice", "Criminal law and sentencing"], ["Defence and foreign affairs", "Armed forces, treaties, aid"], ["National housing law", "Renting rules, planning law, building targets"]],
    not: [["Bin collections", "Your council"], ["Local planning decisions", "Your council's planning committee"], ["Council tax levels", "Your council"], ["Local road repairs", "Your council or the county"], ["Devolved matters", "In Scotland and Wales, health and education are decided there"]],
  },
  local: {
    title: "Your local councillor",
    what: "Councillors sit on the council that runs services where you live. They set the council's budget and council tax, and decide local planning applications.",
    controls: [["Planning", "Whether new homes, extensions and developments get permission"], ["Waste and streets", "Bins, recycling, street cleaning, fly-tipping"], ["Council tax", "The level you pay, within limits set nationally"], ["Social care", "In county and unitary councils, care for older and disabled people"], ["Parks and libraries", "Opening, funding, closing"], ["Council housing", "Repairs, allocations and, in many areas, homelessness"]],
    not: [["NHS policy and waiting times", "Parliament and the NHS"], ["Income tax and benefits", "Parliament"], ["Immigration", "Parliament"], ["Policing policy", "The Home Office and your Police and Crime Commissioner or mayor"], ["Schools' curriculum", "Government and, for academies, their trusts"]],
  },
  mayoral: {
    title: "Your mayor",
    what: "A directly elected mayor leads the authority across a whole area, with powers handed down from government.",
    controls: [["Transport", "Buses, trams and fares in most mayoral areas"], ["Housing and regeneration", "Strategic housing investment"], ["Skills budgets", "Adult education funding"], ["In some areas, policing", "Where the mayor holds the Police and Crime Commissioner role"]],
    not: [["National tax and benefits", "Parliament"], ["NHS policy", "Parliament and the NHS"], ["Individual planning applications", "Usually the borough or district council"]],
  },
  devolved: {
    title: "Your representative in the devolved parliament",
    what: "The Scottish Parliament, Senedd and Northern Ireland Assembly decide many things that Westminster decides for England.",
    controls: [["Health", "The NHS in that nation"], ["Education", "Schools, curriculum, university fees"], ["Housing and planning law", "In that nation"], ["Some taxes", "Income tax rates in Scotland, for example"], ["Justice", "In Scotland and Northern Ireland"]],
    not: [["Immigration", "Parliament at Westminster"], ["Defence and foreign affairs", "Westminster"], ["Most benefits", "Westminster, with exceptions"]],
  },
};

export default function OfficeExplainer({ level, areaName, seats = 1, generalElection = false, parties = [] }: { level: string; areaName: string; seats?: number; generalElection?: boolean; parties?: { ec_id: string; name: string; colour: string | null }[] }) {
  const o = OFFICES[level] ?? OFFICES.local;
  return (
    <section className="office" aria-labelledby="office-heading">
      <p className="eyebrow">You're voting for</p>
      <h2 id="office-heading" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>{o.title}{seats > 1 ? ` (${seats} seats)` : ""}</h2>
      <p>{o.what} Here, for {areaName}.</p>
      <div className="office-cols">
        <div>
          <h3>What this office decides</h3>
          <ul className="small">{o.controls.map(([k, v]) => <li key={k}><strong>{k}.</strong> {v}.</li>)}</ul>
        </div>
        <div>
          <h3>What it does not</h3>
          <ul className="small">{o.not.map(([k, v]) => <li key={k}><strong>{k}.</strong> {v}.</li>)}</ul>
        </div>
      </div>
      {generalElection ? (
        <div className="ge-note">
          <h3>At a general election you are choosing twice over</h3>
          <p>Your cross elects one MP for {areaName}. Across all 650 constituencies, the same crosses decide which party can command a majority and form a government. Both happen with one mark, and they can pull in different directions: people often like a local candidate from one party and prefer another to govern, or the reverse. Nothing here tells you how to weigh that; it is one of the real choices in front of you.</p>
          <p className="meta">Which is why positions on this page are labelled by whose they are: <strong>what this candidate says</strong> (their own words, which may differ from their party's), <strong>what was done in office</strong> (the record, where there is one), and <strong>what their party says</strong> (the manifesto they stand on, which is the programme a government would be formed to deliver).</p>
          {parties.length ? <p className="meta">The parties standing here: {parties.map((p, i) => <span key={p.ec_id}>{i ? " · " : ""}<a href={`/parties/${encodeURIComponent(p.ec_id)}`}>{p.name}</a></span>)}.</p> : null}
        </div>
      ) : null}
      <p className="meta">Candidates often campaign on things their office cannot change. That is not dishonest in itself — an MP can press a council, a councillor can lobby government — but it is worth knowing which is which. Summarised from the Local Government Association and UK Parliament descriptions of each role.</p>
    </section>
  );
}
