// Life areas (Romily, round eleven q2: "Replace." Life areas become the main way in). Her ten themes, in her order, with
// her sub-topics. Only Your Home is built (round eleven q6); each of the others leads to the topic pages that already
// cover it, marked "Being redesigned", so no tile is a dead end. Every one of the ten existing topics is covered.
// No server code, so the phone app could share it later.
export type Theme = { slug: string; name: string; subs: string; topics: string[]; built: boolean; parts?: { name: string; subs: string }[] };

export const THEMES: Theme[] = [
  { slug: "your-area", name: "Your Area", subs: "Local decisions, councils, services", topics: [], built: false },
  { slug: "money-and-work", name: "Your Money & Work", subs: "Tax, wages, benefits, employment", topics: ["money_and_cost_of_living"], built: false },
  { slug: "your-home", name: "Your Home", subs: "Housing, renting, mortgages", topics: ["housing_and_property"], built: true },
  { slug: "education-and-family", name: "Education & Family", subs: "Schools, university, childcare", topics: ["education_and_universities"], built: false },
  { slug: "healthcare", name: "Healthcare", subs: "NHS, mental health, social care", topics: ["healthcare_and_social_care"], built: false },
  { slug: "transport", name: "Transport", subs: "Public transport, energy", topics: ["transport", "environment_climate_and_energy"], built: false },
  { slug: "safety-and-rights", name: "Safety & Rights", subs: "Crime, policing, equality, freedoms", topics: ["crime_policing_and_justice", "equality_and_rights"], built: false },
  { slug: "immigration", name: "Immigration", subs: "Migration, asylum, citizenship", topics: ["immigration_and_borders"], built: false },
  {
    slug: "uk-and-the-world", name: "The UK and the World", subs: "Europe and global affairs", topics: ["defence_foreign_affairs_and_eu"], built: false,
    parts: [
      { name: "Europe", subs: "EU relations, Brexit, trade, EU security, freedom of movement" },
      { name: "Global Affairs", subs: "International conflicts, foreign aid, defence, global trade, diplomacy and international law" },
    ],
  },
  // Added by Romily in a follow-up message; she gave no sub-topics yet (the ones in the round-eleven notes are proposed).
  { slug: "environment", name: "Environment", subs: "Climate, energy, nature, pollution, flooding", topics: ["environment_climate_and_energy"], built: false },
];

export const themeBySlug = (slug: string) => THEMES.find((t) => t.slug === slug) ?? null;
