// Search that behaves the way people expect: word forms, hyphens, punctuation, plain typos and everyday synonyms.
// Deliberately simple and local — it runs in the browser over text already on the page, so nothing about a search
// is ever sent anywhere. Every rule here is symmetric: it can never favour one candidate's words over another's.

/** Lowercase, strip accents, turn every non-letter into a space. "two-child limit" → "two child limit". */
export function normalise(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9£%]+/g, " ").trim();
}

/** Crude but predictable suffix stripping: policing → polic, renters → renter → rent, homes → home. */
export function stem(w: string): string {
  let x = w;
  if (x.length > 4 && x.endsWith("ies")) x = x.slice(0, -3) + "y";
  else if (x.length > 4 && x.endsWith("es")) x = x.slice(0, -2);
  else if (x.length > 3 && x.endsWith("s") && !x.endsWith("ss")) x = x.slice(0, -1);
  if (x.length > 5 && x.endsWith("ing")) x = x.slice(0, -3);
  else if (x.length > 4 && x.endsWith("ed")) x = x.slice(0, -2);
  if (x.length > 4 && x.endsWith("er")) x = x.slice(0, -2);
  if (x.length > 4 && x.endsWith("ly")) x = x.slice(0, -2);
  return x;
}

/** Everyday words for the same thing. Bidirectional: each group's members find each other, and nothing else. */
const GROUPS: string[][] = [
  ["gp", "doctor", "surgery", "practice"],
  ["nhs", "health", "hospital", "healthcare", "waiting", "ward"],
  ["police", "policing", "crime", "officer", "antisocial", "asb"],
  ["rent", "renter", "tenant", "landlord", "letting", "tenancy"],
  ["house", "housing", "home", "homes", "property", "dwelling"],
  ["bin", "waste", "rubbish", "recycling", "refuse", "flytipping"],
  ["pothole", "road", "highway", "pavement", "street"],
  ["school", "education", "pupil", "teacher", "classroom"],
  ["bus", "transport", "train", "rail", "cycling", "travel"],
  ["tax", "taxes", "taxation", "income", "allowance", "threshold"],
  ["benefit", "welfare", "credit", "universal", "payment"],
  ["climate", "environment", "green", "carbon", "emission", "net zero"],
  ["immigration", "migration", "asylum", "border", "visa", "refugee"],
  ["council", "councillor", "ward", "local"],
  ["care", "carer", "social care", "elderly", "disability", "disabled"],
  ["planning", "development", "greenbelt", "brownfield", "build"],
  ["energy", "bills", "electricity", "gas", "fuel"],
  ["pension", "pensioner", "retirement", "retired"],
  ["defence", "military", "army", "nato", "ukraine"],
];
const SYN = new Map<string, Set<string>>();
for (const g of GROUPS) {
  const stems = new Set(g.flatMap((w) => normalise(w).split(" ").map(stem)));
  for (const s of stems) SYN.set(s, new Set([...(SYN.get(s) ?? []), ...stems]));
}

/** Levenshtein distance, capped: only used to forgive a single typo. */
export function editDistance(a: string, b: string, max = 1): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0]; prev[0] = i; let best = prev[0];
    for (let j = 1; j <= b.length; j++) {
      const t = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = t; best = Math.min(best, prev[j]);
    }
    if (best > max) return max + 1;
  }
  return prev[b.length];
}

export type Haystack = { stems: Set<string>; words: Set<string>; text: string };
export function index(text: string): Haystack {
  const words = normalise(text).split(" ").filter(Boolean);
  const stems = new Set<string>();
  for (const w of words) { stems.add(w); stems.add(stem(w)); }
  // words is the vocabulary people actually see, so "did you mean" never offers a stem like "polic"
  return { stems, words: new Set(words), text: text.toLowerCase() };
}

export function queryTokens(q: string): string[] {
  return normalise(q).split(" ").filter((w) => w.length > 1).map(stem);
}

/** Every token must match something: exact stem, synonym, prefix, or one typo away. Phrases work because the
 *  query is tokenised the same way the text is, so hyphens and punctuation stop mattering on both sides. */
export function matches(tokens: string[], h: Haystack): boolean {
  if (!tokens.length) return true;
  return tokens.every((t) => {
    if (h.stems.has(t)) return true;
    const syn = SYN.get(t);
    if (syn) for (const s of syn) if (h.stems.has(s)) return true;
    for (const s of h.stems) {
      if (s.length > 3 && (s.startsWith(t) || t.startsWith(s))) return true;
      if (t.length >= 5 && editDistance(t, s) <= 1) return true;
    }
    return false;
  });
}

/** For "did you mean": the closest words that actually occur in the corpus. */
export function suggest(token: string, vocabulary: Set<string>, limit = 3): string[] {
  if (token.length < 4) return [];
  const scored: [string, number][] = [];
  for (const w of vocabulary) {
    if (w.length < 4) continue;
    const d = editDistance(token, w, 2);
    if (d <= 2) scored.push([w, d]);
  }
  return scored.sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([w]) => w);
}
