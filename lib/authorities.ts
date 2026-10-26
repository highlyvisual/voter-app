import data from "./authorities.json";

// Combined authorities, their mayors and the Greater London Authority (Romily, round ten, q3: "Start now. Combined
// authorities and mayors first, parishes later"). Everything comes from lib/authorities.json, written weekly by
// scripts/loaders/authorities.py from ONS, GOV.UK, Democracy Club, mySociety and Wikidata; nothing here is typed in.
export type Block = { p?: string; list?: string[] };
export type Mayor = { name: string; party: string; party_id: string | null; elected_on: string; election: string; ballot_id: string; source: string; person_page: string | null; retrieved: string };
export type AuthLink = { url: string; words?: string; source: string; ref?: string | null; checked: string; opened?: boolean };
export type Authority = {
  code: string; name: string; kind: "combined" | "gla"; slug: string; factsheet_anchor: string | null;
  councils: { gss: string; name: string; tier: "lad" | "county" }[];
  what: string | null; what_more?: Block[]; formal_name: string; tier: string | null; mayoral: boolean | null;
  election_note: string | null; members_quote: string | null;
  police: Block[] | null; fire: Block[] | null; distinctive: Block[] | null;
  competences: { tier_title: string; url: string; headings: string[] } | null;
  ee_org: string | null; next_election: { date: string; election_id: string; title: string | null; url: string } | null;
  mayor: Mayor | null; links: Partial<Record<"website" | "meetings" | "budget" | "mayor_page", AuthLink>>;
};
export type Source = { name: string; url: string; publisher: string; licence: string; retrieved: string; updated?: string };

const D = data as unknown as { retrieved_at: string; sources: Record<string, Source>; ifg_quotes: string[]; authorities: Authority[] };
export const AUTHORITIES: Authority[] = D.authorities;
export const AUTH_SOURCES = D.sources;
export const IFG_QUOTES = D.ifg_quotes;
export const AUTH_RETRIEVED = D.retrieved_at.slice(0, 10);

export const authorityBySlug = (slug: string) => AUTHORITIES.find((a) => a.slug === slug) ?? null;
/** The authority with this ONS code (E47..., or E61000001 for the GLA). */
export const authorityByCode = (code: string | null | undefined) => (code ? AUTHORITIES.find((a) => a.code === code) ?? null : null);
/** The authority a council belongs to, by any of the council's ONS codes. */
export function authorityForCouncil(codes: (string | null | undefined)[]): Authority | null {
  const want = new Set(codes.filter((c): c is string => Boolean(c)));
  return AUTHORITIES.find((a) => a.councils.some((c) => want.has(c.gss))) ?? null;
}
/** Democracy Club's party id ("party:53", "joint-party:53-119") as the parties table keys it ("PP53", unchanged). */
export const partyKey = (id: string | null | undefined) => (id ? id.replace(/^party:/, "PP") : null);
