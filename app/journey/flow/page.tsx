import { notFound } from "next/navigation";
import JourneyFlow from "@/components/JourneyFlow";
import { loadJourney } from "@/lib/journeyData";
import { DEFAULT_BALLOT, slots } from "../shared";
export const dynamic = "force-dynamic";
export const metadata = { title: "Journey prototype B: one page that opens up", robots: { index: false } };
export default async function FlowPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const ballot = typeof sp.ballot === "string" ? sp.ballot : DEFAULT_BALLOT;
  const d = await loadJourney(ballot, sp); if (!d) notFound();
  const { map, reps, office } = slots(d);
  return <JourneyFlow d={d} map={map} reps={reps} office={office} />;
}
