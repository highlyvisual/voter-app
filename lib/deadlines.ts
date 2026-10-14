// Key dates before a poll: register, postal vote, proxy vote and (where needed) free voter ID. Shared by the website
// (components/Deadlines.tsx) and the phone app's ballot route (app/api/app/v1/ballot/[id]), so both say the same thing.
// No imports, so it stays usable anywhere.
//
// Statutory timetable for UK Parliamentary elections in England (RPA 1983 Sch. 1; Elections Act 2022 for Voter Authority Certificates):
// register 12 working days before poll; postal vote 11 working days (5pm); proxy vote and Voter Authority Certificate 6 working days (5pm).
// Calculated, not scraped; the council's official notice is linked for confirmation.
// Bank holidays by nation (GOV.UK). The statutory timetable counts working days, which excludes these.
const BANK_HOLIDAYS: Record<string, Set<string>> = {
  E: new Set(["2026-12-25", "2026-12-28", "2027-01-01", "2027-03-26", "2027-03-29", "2027-05-03", "2027-05-31", "2027-08-30", "2027-12-27", "2027-12-28"]),
  W: new Set(["2026-12-25", "2026-12-28", "2027-01-01", "2027-03-26", "2027-03-29", "2027-05-03", "2027-05-31", "2027-08-30", "2027-12-27", "2027-12-28"]),
  S: new Set(["2026-11-30", "2026-12-25", "2026-12-28", "2027-01-01", "2027-01-04", "2027-03-26", "2027-05-03", "2027-05-31", "2027-08-02", "2027-11-30", "2027-12-27", "2027-12-28"]),
};
function isWorkingDay(d: Date, nation: string) { const day = d.getUTCDay(); return day !== 0 && day !== 6 && !(BANK_HOLIDAYS[nation] ?? BANK_HOLIDAYS.E).has(d.toISOString().slice(0, 10)); }
function workingDaysBefore(poll: string, n: number, nation: string): Date {
  const d = new Date(poll + "T00:00:00Z"); let c = 0;
  while (c < n) { d.setUTCDate(d.getUTCDate() - 1); if (isWorkingDay(d, nation)) c++; }
  return d;
}

// The subset of Democracy Club's EveryElection timetable these rules use (lib/democracyclub.ts Timetable).
export type TimetableDates = { registration?: string; postal?: string; proxy?: string; vac?: string; requiresId: boolean | null; source: string };

export type KeyDateKind = "register" | "postal" | "proxy" | "voter_id";
export type KeyDate = { kind: KeyDateKind; label: string; date: string; time: string; href: string };
export type KeyDates = { items: KeyDate[]; idRequired: boolean; fromTimetable: boolean; timetableSource: string | null };

// Where Democracy Club's EveryElection holds the timetable for this ballot, its dates are used (and whether photo ID is
// required); otherwise the dates are calculated from the statutory working-day rules above.
export function keyDates({ pollDate, gss, level, timetable }: { pollDate: string; gss?: string | null; level?: string; timetable?: TimetableDates | null }): KeyDates {
  const nation = (gss ?? "E").charAt(0).toUpperCase();
  // Same working-day rules across England, Scotland and Wales for these elections; photo ID is required at UK Parliament elections and
  // at council elections in England, but not at council elections in Scotland or Wales.
  const idRequired = timetable && timetable.requiresId !== null ? timetable.requiresId : level === "parliamentary" || nation === "E" || nation === "N";
  const pick = (iso: string | undefined, n: number) => (iso ?? workingDaysBefore(pollDate, n, nation).toISOString().slice(0, 10));
  const items: KeyDate[] = [
    { kind: "register", label: "Register", date: pick(timetable?.registration, 12), time: "", href: "https://www.gov.uk/register-to-vote" },
    { kind: "postal", label: "Postal vote", date: pick(timetable?.postal, 11), time: "5pm", href: "https://www.gov.uk/apply-postal-vote" },
    { kind: "proxy", label: "Proxy vote", date: pick(timetable?.proxy, 6), time: "5pm", href: "https://www.gov.uk/apply-proxy-vote" },
    ...(idRequired ? [{ kind: "voter_id" as const, label: "Free voter ID", date: pick(timetable?.vac, 6), time: "5pm", href: nation === "N" ? "https://www.eoni.org.uk/voting/electoral-identity-card/" : "https://www.gov.uk/apply-for-photo-id-voter-authority-certificate" }] : []),
  ];
  return { items, idRequired: !!idRequired, fromTimetable: !!timetable, timetableSource: timetable?.source ?? null };
}
