// Shared data shapes with no server code (no Supabase, no Node APIs), so the phone app (mobile/) can import them as well
// as the website. lib/data.ts re-exports everything here; website code can keep importing from "@/lib/data".

export const TOPICS = [
  ["money_and_cost_of_living", "Money and cost of living"],
  ["housing_and_property", "Housing and property"],
  ["healthcare_and_social_care", "Healthcare and social care"],
  ["education_and_universities", "Education and universities"],
  ["environment_climate_and_energy", "Environment, climate and energy"],
  // Tenth topic, added 29 Sept 2026 at Romily's request (round eight q17).
  ["transport", "Transport and roads"],
  ["immigration_and_borders", "Immigration and borders"],
  ["crime_policing_and_justice", "Crime, policing and justice"],
  ["defence_foreign_affairs_and_eu", "Defence, foreign affairs and the EU"],
  ["equality_and_rights", "Equality and rights"],
] as const;
export type Topic = (typeof TOPICS)[number][0];
// The one set of short topic names, used wherever space is tight (chips, cards). Full names are in TOPICS.
export const TOPIC_SHORT: Record<string, string> = { money_and_cost_of_living: "Money", housing_and_property: "Housing", healthcare_and_social_care: "Health and care", education_and_universities: "Education", environment_climate_and_energy: "Environment", transport: "Transport", immigration_and_borders: "Immigration", crime_policing_and_justice: "Crime and policing", defence_foreign_affairs_and_eu: "Defence and the EU", equality_and_rights: "Equality and rights" };

export type Claim = {
  id: number;
  ballot_paper_id: string;
  candidate_id: number | null;
  party_ec_id: string | null;
  topic: Topic;
  tier: "computed" | "documented";
  claim_text: string;
  source_quote: string;
  applies_if: Record<string, unknown>;
  status: string;
  drafted_by: string;
  created_at: string;
  precision?: "measurable" | "aspiration";
  sources?: { id: number; title: string; url: string; publisher: string; published_on: string | null; retrieved_at: string; layer?: string | null; archive_url?: string | null } | null;
};

export type ReceiptRow = {
  reform_set_id: string;
  party_ec_id: string | null;
  household_key: string;
  results: Record<string, number | string>;
  policyengine_version: string;
  computed_at: string;
};
