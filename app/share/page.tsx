import ShareTool from "@/components/ShareTool";
import { listBallots } from "@/lib/data";
export const dynamic = "force-dynamic";
export const metadata = { title: "Share or embed" };
export default async function Share() {
  const ballots = await listBallots();
  return (<><h1>Share or embed</h1><p className="lede">A canonical link for any ballot, topic or comparison, and a small embed showing a ballot's candidate list with a link to the full page. Embeds carry no household inputs and no analytics beyond our anonymous daily counts.</p><ShareTool ballots={ballots.map((b) => ({ id: b.ballot_paper_id, name: b.area_name }))} /></>);
}
