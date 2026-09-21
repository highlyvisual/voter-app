// Elections fixed by law or officially stated, before Democracy Club lists their candidates. Each carries its source.
// Checked 21 September 2026. Update as candidates are confirmed: the nightly ingest adds real ballots automatically,
// and these entries then become the summary line above them rather than the only thing shown.
export type Scheduled = { id: string; date: string; when: string; title: string; detail: string; certainty: string; sources: [string, string][] };
export const SCHEDULED: Scheduled[] = [
  {
    id: "local-2027", date: "2027-05-06", when: "Thursday 6 May 2027",
    title: "Local elections across the UK",
    detail: "Every council in Scotland, Wales and Northern Ireland, and 216 councils in England. Candidates are usually confirmed about a month before polling day.",
    certainty: "Scheduled",
    sources: [["City of Edinburgh Council (Scotland, 6 May 2027)", "https://www.edinburgh.gov.uk/local-government-election"], ["Keith Edkins' UK local government tracker (216 English authorities)", "https://www.theedkins.co.uk/uklocalgov/elec2027.htm"]],
  },
  {
    id: "nia-2027", date: "2027-05-06", when: "Expected May 2027",
    title: "Northern Ireland Assembly election",
    detail: "Expected on the same day as Northern Ireland's council elections.",
    certainty: "Expected",
    sources: [["Irish in Britain election guidance", "https://www.irishinbritain.org/what-we-do/policy-and-representation/election-resources/may-election-information"]],
  },
  {
    id: "ge-2029", date: "2029-08-15", when: "On or before 15 August 2029",
    title: "UK general election",
    detail: "Parliament dissolves automatically on 9 July 2029 unless the Prime Minister calls an election sooner; polling day must follow within 25 working days. The date shown is the latest it can be.",
    certainty: "Latest possible date",
    sources: [["The Highland Council, Returning Officer", "https://www.highland.gov.uk/elections-voting/uk-parliamentary-election"]],
  },
];
