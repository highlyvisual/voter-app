// One way of writing dates across the site. Browsers and servers disagree on "Sep" and "Sept" for en-GB short
// months, so short months come from this list rather than the runtime.
export const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
export const shortMonth = (d: Date) => SHORT_MONTHS[d.getUTCMonth()];
const LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// "2026-10-08" or an ISO timestamp → "8 October 2026". Anything unparseable is returned as given.
export function longDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${Number(m[3])} ${LONG[Number(m[2]) - 1]} ${m[1]}` : iso;
}
