import { listBallots } from "@/lib/data";
export const dynamic = "force-dynamic";
// RSS of elections covered, newest polling day last; for anyone who wants to follow what appears here.
export async function GET() {
  const ballots = await listBallots();
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const items = ballots.map((b) => `<item><title>${esc(b.area_name)} (${b.level === "parliamentary" ? "UK Parliament" : "Council"}, ${b.poll_date})</title><link>https://whatsittome.org/ballot/${encodeURIComponent(b.ballot_paper_id)}</link><guid>https://whatsittome.org/ballot/${encodeURIComponent(b.ballot_paper_id)}</guid><pubDate>${new Date(b.retrieved_at).toUTCString()}</pubDate><description>${esc(`Polling day ${b.poll_date}. Every candidate, in ballot-paper order, with sourced positions.`)}</description></item>`).join("");
  const built = new Date(Math.max(0, ...ballots.map((b) => new Date(b.retrieved_at).getTime()))).toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>What's It To Me?: elections covered</title><link>https://whatsittome.org/</link><atom:link href="https://whatsittome.org/feed.xml" rel="self" type="application/rss+xml"/><description>Upcoming UK elections with every candidate and their sourced positions.</description><language>en-gb</language><lastBuildDate>${built}</lastBuildDate>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
