import data from "./councils.json";
import snapshot from "../scripts/sql/council_register.json";
import { publicClient } from "./data";
// Council facts: quotations from each council's own publications, gathered 24 Sept 2026 (docs/research/00-BRIEF-round-2.md, q9).
// Kept in git rather than the ledger so every change is a reviewable diff; the ledger is for claims about candidates and parties.
//
// Since 27 Sept 2026 (docs/automation/open-data-mysociety.md, section 2) every current UK council has a page, not just the
// 29 with hand-checked facts: the rest come from council_register (mySociety's UK Local Authorities list, CC BY 4.0, joined
// to the WhatDoTheyKnow authorities list, CC BY-SA 4.0). The 29 keep their facts and links; a register-only council gets
// the same template with empty facts, and the page says plainly that its publications have not been read yet.
export type CouncilFact = { topic: string; summary: string; quote: string; url: string | null; publisher: string; published_on: string | null; note?: string | null };
export type RegisterRow = { code: string; official_name: string; nice_name: string; slug: string; gss_code: string | null; ons_gss_code: string | null; nation: string | null; region: string | null; la_type: string | null; la_type_name: string | null; powers: string | null; county_la: string | null; combined_authority: string | null; current: boolean; gov_uk_slug: string | null; open_council_data_id: number | null; home_page: string | null; publication_scheme: string | null; disclosure_log: string | null; in_mysociety: boolean; note: string | null; source_versions: string | null; retrieved_at: string; alt_names?: string | null; home_page_source?: string | null; govuk_tier?: string | null; govuk_parent_name?: string | null; govuk_parent_slug?: string | null };
export type Council = { slug: string; name: string; gss: string | null; site: string; system: string | null; links: Record<string, string | null>; facts: CouncilFact[]; notes: string | null; checked: string; register?: RegisterRow | null; handBuilt: boolean };
export const TOPIC_ORDER = ["housing", "transport", "council_tax", "environment", "education"] as const;
export const REGISTER_ATTRIBUTION = "Council list: mySociety, UK Local Authorities (CC BY 4.0) and WhatDoTheyKnow authorities (CC BY-SA 4.0); council websites, tiers and service links: GOV.UK (Open Government Licence); codes: ONS Code History Database (Open Government Licence).";
// The everyday services shown under "Do it online" on every council page, from GOV.UK's Local Links Manager export: a
// fixed list of Local Government Service List and Interaction List numbers, in this order for every council, with the
// export's own wording as the link text. Nothing is chosen per council.
export const EVERYDAY_SERVICES: [number, number][] = [[524, 8], [524, 17], [528, 0], [530, 8], [533, 8], [587, 17], [557, 17], [564, 17], [412, 17], [57, 8], [57, 2], [59, 0], [63, 0], [69, 8], [364, 8], [364, 0], [13, 0], [14, 0], [437, 8], [474, 8], [516, 8], [358, 8], [353, 8]];
const NOT_COUNCILS = new Set(["COMB", "SRA"]);   // combined and strategic authorities are in the register but have no council page
const HAND: Council[] = (data as { councils: Omit<Council, "handBuilt">[] }).councils.map((c) => ({ ...c, handBuilt: true }));
const norm = (x: string) => x.toLowerCase().replace(/\s+(borough|district|city|county|council)(?=\s|$)/g, "").replace(/^(royal borough of|london borough of|city of|comhairle nan)\s+/, "").replace(/[^a-z0-9]/g, "");
const REGISTER_FIELDS = "code, official_name, nice_name, slug, gss_code, ons_gss_code, nation, region, la_type, la_type_name, powers, county_la, combined_authority, current, gov_uk_slug, open_council_data_id, home_page, home_page_source, govuk_tier, govuk_parent_name, govuk_parent_slug, publication_scheme, disclosure_log, in_mysociety, note, source_versions, retrieved_at, alt_names";
// The job also writes scripts/sql/council_register.json (current rows, the same fields): the fallback when the database
// cannot be read, so every council page still exists. The database copy is newer whenever the two differ.
const SNAPSHOT: RegisterRow[] = ((snapshot as { rows: RegisterRow[] }).rows ?? []).filter((r) => r.current && !NOT_COUNCILS.has(r.la_type ?? ""));

// The register is small (about 400 current rows) and changes weekly, so one read an hour per server is plenty.
let cache: { at: number; rows: RegisterRow[] } | null = null;
let inflight: Promise<RegisterRow[]> | null = null;
export async function registerRows(): Promise<RegisterRow[]> {
  if (cache && Date.now() - cache.at < 3600_000) return cache.rows;
  if (!inflight) {
    inflight = (async () => {
      try {
        const { data: rows, error } = await publicClient().from("council_register").select(REGISTER_FIELDS).eq("current", true).order("nice_name");
        if (error) throw error;
        const out = ((rows ?? []) as RegisterRow[]).filter((r) => !NOT_COUNCILS.has(r.la_type ?? ""));
        cache = { at: Date.now(), rows: out };
        return out;
      } catch {
        return cache?.rows ?? SNAPSHOT;   // the table may not exist yet, or the database may be unreachable: use the job's snapshot
      } finally { inflight = null; }
    })();
  }
  return inflight;
}

function fromRegister(r: RegisterRow): Council {
  return {
    slug: r.slug, name: r.nice_name, gss: r.gss_code, site: r.home_page ?? (r.gov_uk_slug ? `https://www.gov.uk/find-local-council/${r.gov_uk_slug}` : ""), system: null,
    links: { plan: null, budget: null, meetings: null, councillors: null, interests: null, consultations: null },
    facts: [], notes: r.note, checked: r.retrieved_at.slice(0, 10), register: r, handBuilt: false,
  };
}

/** The council for a page slug: one of the 29 hand-built pages first, then any current council in the register. */
export async function councilBySlug(slug: string): Promise<Council | null> {
  const hand = HAND.find((c) => c.slug === slug);
  const reg = (await registerRows()).find((r) => r.slug === slug) ?? null;
  if (hand) return { ...hand, register: reg };
  return reg ? fromRegister(reg) : null;
}

/** The slug for a council named the way ballots ("Camden: Ward"), postcodes.io ("Camden") or Open Council Data name it, or null if no page exists. */
export async function councilSlugFor(name: string | null | undefined): Promise<string | null> {
  if (!name) return null;
  const n = norm(name.split(":")[0]);
  const hand = HAND.find((c) => norm(c.name) === n);   // exact: "Aberdeenshire" must not match "Aberdeen City"
  if (hand) return hand.slug;
  const rows = await registerRows();
  const hit = rows.find((r) => norm(r.nice_name) === n) ?? rows.find((r) => norm(r.official_name) === n) ?? rows.find((r) => r.alt_names?.split(",").some((a) => norm(a) === n));
  return hit?.slug ?? null;
}

/** Every council with a page: the 29 hand-built ones plus the rest of the register, one entry per slug, by name. */
export async function listAllCouncils(): Promise<Council[]> {
  const rows = await registerRows();
  const seen = new Set(HAND.map((c) => c.slug));
  const rest = rows.filter((r) => !seen.has(r.slug)).map(fromRegister);
  return [...HAND.map((c) => ({ ...c, register: rows.find((r) => r.slug === c.slug) ?? null })), ...rest].sort((a, b) => a.name.localeCompare(b.name, "en-GB"));
}

/** The 29 hand-built councils only (synchronous; for places that must not wait on the database). */
export function listCouncils(): Council[] { return HAND; }
