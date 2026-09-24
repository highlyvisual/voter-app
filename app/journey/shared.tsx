import { Suspense } from "react";
import AreaMap from "@/components/AreaMap";
import Representatives from "@/components/Representatives";
import OfficeExplainer from "@/components/OfficeExplainer";
import type { JourneyData } from "@/lib/journeyData";
// Server-rendered pieces both prototypes share, handed to the client shells as slots.
export const DEFAULT_BALLOT = "local.brighton-and-hove.queens-park.by.2026-09-24";
export function slots(d: JourneyData) {
  const levelLabel = d.ballot.level === "local" ? "ward" : "constituency";
  return {
    map: <AreaMap ballotId={d.ballot.id} areaName={d.ballot.area} lat={d.ballot.lat} lng={d.ballot.lng} levelLabel={levelLabel} />,
    reps: <Suspense fallback={<p className="meta">Looking up who represents you…</p>}><Representatives areaName={d.ballot.area} level={d.ballot.level} /></Suspense>,
    office: <OfficeExplainer level={d.ballot.level} areaName={d.ballot.area} seats={d.ballot.seats} />,
  };
}
