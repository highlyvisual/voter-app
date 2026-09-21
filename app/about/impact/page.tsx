import { publicClient } from "@/lib/data";
export const dynamic = "force-dynamic";
export const metadata = { title: "Impact" };
export default async function Impact() {
  const { data } = await publicClient().from("feedback_totals").select("*").order("day", { ascending: false });
  const rows = data ?? [];
  const sum = (k: string) => rows.reduce((a, r) => a + Number(r[k] ?? 0), 0);
  const { data: usage } = await publicClient().from("usage_totals").select("day, ballot_paper_id, lookups").order("day", { ascending: false }).limit(200);
  return (
    <>
      <h1>Impact</h1>
      <p className="lede">Everything we measure, published. Two questions asked on every ballot page; anonymous daily counts; nothing about individuals.</p>
      <h2>All time</h2>
      <table className="plain" style={{ maxWidth: "30rem" }}><tbody>
        <tr><th scope="row">Found what they were looking for</th><td className="num">{sum("found_yes")} yes · {sum("found_no")} no</td></tr>
        <tr><th scope="row">Effect on likelihood of voting</th><td className="num">{sum("more_likely")} more likely · {sum("less_likely")} less likely · {sum("no_difference")} no difference</td></tr>
        <tr><th scope="row">Ballot page views (daily counts)</th><td className="num">{(usage ?? []).reduce((a, r) => a + Number(r.lookups ?? 0), 0)}</td></tr>
      </tbody></table>
      <p className="meta">"Less likely" is reported as prominently as "more likely". We do not know why anyone answered as they did. Page-view counts include the developers' own testing during September 2026; treat them as an upper bound until launch.</p>
      <h2>By day and election</h2>
      <div className="scroll" tabIndex={0}><table className="plain"><thead><tr><th>Day</th><th>Election</th><th className="num">Found: yes / no</th><th className="num">More / less / same</th></tr></thead><tbody>
        {rows.map((r) => <tr key={r.day + r.ballot_paper_id}><td>{r.day}</td><td>{r.ballot_paper_id}</td><td className="num">{r.found_yes} / {r.found_no}</td><td className="num">{r.more_likely} / {r.less_likely} / {r.no_difference}</td></tr>)}
      </tbody></table></div>
    </>
  );
}
