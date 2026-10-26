import { TITLE_TOPICS } from "@/lib/parliament";
import { personalMatchers, type PersonalMatch } from "@/lib/personal";
import { topicsForHousehold, type TopicReason } from "@/lib/topicOrder";
import type { Household } from "@/lib/household";

// Council business sorted for one household (Romily, round ten q13: "items that relate to the household come first", the
// same applies-to-you / applies-to-others split as the app). We never judge what matters. An agenda item counts as "about
// your household" only by one of two published, mechanical rules, and the page shows which one behind a small (i):
//   1. Its title contains a word from the fixed list for a topic that the profile puts first (lib/topicOrder.ts: renting
//      puts housing first, a child puts education first, and so on). The words are the ones used to file Commons votes
//      under topics (lib/parliament.ts TITLE_TOPICS), plus the few council words below.
//   2. Its title names a group the person chose in the optional "about you" questions, by the same words that put a
//      party's position under "names your group" (lib/personal.ts, the names tier only, never the general one). Barny,
//      round ten: allowed only where the text itself names the group; nothing is ranked or judged; the answer never leaves
//      the device. So this runs in the browser only, on titles already on the page.
// Everything else is listed below it, in the same date order. Nothing is hidden.

// Council words the Commons list lacks, filed under the same topics. Fixed; changing them is a published decision.
export const COUNCIL_TITLE_TOPICS: [RegExp, string][] = [
  [/local plan|temporary accommodation|\btenan(t|ts|cy|cies)\b|landlord|affordable homes?|council homes?/, "housing_and_property"],
  [/\bysgol\b|\bysgolion\b|\bpupils?\b|special educational needs/, "education_and_universities"],
  [/\bparking\b|\btraffic\b/, "transport"],
];

/** Every topic whose words appear in a title (lower-cased), Commons list first. */
export function titleTopics(title: string): string[] {
  const t = title.toLowerCase();
  const out: string[] = [];
  for (const [re, k] of [...TITLE_TOPICS, ...COUNCIL_TITLE_TOPICS]) if (re.test(t) && !out.includes(k)) out.push(k);
  return out;
}

// Street and place names are not people: "Church Street car park" does not name Christians, "Black Lane" no one.
const PLACE = /\b[a-z][\w']*\s+(?:road|street|lane|avenue|way|close|hill|green|park|square|place|gardens|drive|court|terrace|walk|row)\b/gi;

export type Lens = { topics: TopicReason[]; groups: PersonalMatch[] };
export type Why = { kind: "topic"; label: string; reason: string } | { kind: "group"; label: string; answer: string };

/** What the profile puts first: topics from the household answers, groups from the optional answers. Null when neither. */
export function lensFor(profile: Record<string, string> | null, personal: Record<string, string> | null): Lens | null {
  const topics = profile ? topicsForHousehold(profile as Household).relevant : [];
  const groups = personalMatchers(personal).filter((m) => m.names);
  return topics.length || groups.length ? { topics, groups } : null;
}

/** Why an item is "about your household"; empty when it is not. */
export function whyFirst(title: string, lens: Lens): Why[] {
  const why: Why[] = [];
  const ts = titleTopics(title);
  for (const r of lens.topics) if (ts.includes(r.topic)) why.push({ kind: "topic", label: r.label, reason: r.reason ?? "" });
  const named = title.replace(PLACE, " ");
  for (const m of lens.groups) if (m.names && m.names.re.test(named)) why.push({ kind: "group", label: m.names.label, answer: m.answerText });
  return why;
}
