import { TOPICS, type Topic } from "@/lib/data";
import type { Household } from "@/lib/household";

// Orders the nine topics for one household: the ones that touch something the
// person told us come first, each with the reason in their own terms; the rest
// follow in the fixed order. Uses only household facts, never anything political,
// and never changes the order of candidates. Romily, round 5, question 11.
export type TopicReason = { topic: Topic; label: string; reason: string | null };

const REASONS: [Topic, (h: Household) => string | null][] = [
  ["housing_and_property", (h) =>
    h.tenure === "private_rent" || h.tenure === "social_rent" ? "because you told us you rent"
    : h.tenure === "own_mortgage" ? "because you told us you have a mortgage"
    : null],
  ["education_and_universities", (h) =>
    h.student && h.student !== "no" ? "because you told us you're studying"
    : h.children === "under_5" || h.children === "school_age" ? "because your household includes a child"
    : null],
  ["healthcare_and_social_care", (h) =>
    h.disability === "yes" && h.carer === "yes" ? "because you told us about disability and caring"
    : h.disability === "yes" ? "because you told us about disability in your household"
    : h.carer === "yes" ? "because you told us you're a carer"
    : null],
  ["money_and_cost_of_living", (h) =>
    h.benefits === "yes" ? "because you told us your household receives benefits"
    : h.employment === "unemployed" ? "because you told us you're out of work"
    : h.employment === "retired" || h.age_band === "65_plus" ? "because you told us you're retired or 65 or over"
    : null],
  ["immigration_and_borders", (h) => (h.visa === "yes" ? "because you told us someone in your household is on a visa" : null)],
  ["defence_foreign_affairs_and_eu", (h) => (h.veteran === "yes" ? "because you told us you're a veteran" : null)],
];

export function topicsForHousehold(h: Household): { relevant: TopicReason[]; all: TopicReason[] } {
  const label = Object.fromEntries(TOPICS) as Record<Topic, string>;
  const reasons = new Map<Topic, string>();
  for (const [t, f] of REASONS) { const r = f(h); if (r) reasons.set(t, r); }
  const relevant: TopicReason[] = REASONS.filter(([t]) => reasons.has(t)).map(([t]) => ({ topic: t, label: label[t], reason: reasons.get(t)! }));
  const rest: TopicReason[] = TOPICS.filter(([t]) => !reasons.has(t)).map(([t, l]) => ({ topic: t, label: l, reason: null }));
  return { relevant, all: [...relevant, ...rest] };
}
