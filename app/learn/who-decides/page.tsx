import Link from "next/link";
import WhoDecides from "@/components/learn/WhoDecides";

export const metadata = { title: "Who decides what", description: "Bins, schools, the NHS, police, buses, income tax: which level of government decides each, in England, Scotland, Wales and Northern Ireland.", alternates: { canonical: "/learn/who-decides" } };

export default function WhoDecidesPage() {
  return (
    <>
      <p className="eyebrow"><Link href="/learn">Learn</Link></p>
      <h1>Who decides what</h1>
      <p className="lede">A lot of politics is blaming the wrong people. Here is who decides the everyday things, from your council to Parliament. Pick where you live.</p>
      <WhoDecides />
      <p className="meta">Simplified: the details differ between areas, and some things are shared. For your own address, your ballot page shows every body that covers it, elected and not. Sources: GOV.UK, <a href="https://www.gov.uk/understand-how-your-council-works" rel="noopener">Understand how your council works</a>, and the devolution guidance for <a href="https://www.gov.uk/guidance/devolution-settlement-scotland" rel="noopener">Scotland</a>, <a href="https://www.gov.uk/guidance/devolution-settlement-wales" rel="noopener">Wales</a> and <a href="https://www.gov.uk/guidance/devolution-settlement-northern-ireland" rel="noopener">Northern Ireland</a>.</p>
    </>
  );
}
