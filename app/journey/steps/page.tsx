import { notFound } from "next/navigation";
import JourneySteps from "@/components/JourneySteps";
import { loadJourney } from "@/lib/journeyData";
import { DEFAULT_BALLOT, slots } from "../shared";
export const dynamic = "force-dynamic";
export const metadata = { title: "Journey prototype A: step by step", robots: { index: false } };
export default async function StepsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const ballot = typeof sp.ballot === "string" ? sp.ballot : DEFAULT_BALLOT;
  const d = await loadJourney(ballot, sp); if (!d) notFound();
  const step = Number(typeof sp.s === "string" ? sp.s : "0") || 0;
  const { map, reps, office } = slots(d);
  return <JourneySteps d={d} step={step} map={map} reps={reps} office={office} />;
}
