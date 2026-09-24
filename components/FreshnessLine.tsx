import Link from "next/link";
import { ago, freshness, stamp } from "@/lib/freshness";
// One line in the footer of every page: when the election data was last refreshed, and a link to the detail.
export default async function FreshnessLine() {
  try {
    const f = await freshness();
    const hours = f.ballots ? (Date.now() - new Date(f.ballots).getTime()) / 3600000 : Infinity;
    const late = hours >= 36;
    return (
      <p className={late ? "fresh-line late" : "fresh-line"}>
        Election data last refreshed <strong title={stamp(f.ballots)}>{ago(f.ballots, f.now)}</strong>
        {late ? " — longer ago than usual" : ""}. <Link href="/status">Is this up to date?</Link>
      </p>
    );
  } catch { return null; }
}
