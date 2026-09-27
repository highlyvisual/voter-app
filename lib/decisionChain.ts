import data from "@/lib/decision-chain.json";

// "Who makes decisions where you live?" (Romily, round eight, point 7): the chain of bodies for one postcode, from the
// most local to the national. Groundwork only: no page shows this yet. How to show bodies that are not directly
// elected is Romily's call (round-eight question 16), so each link records how it is chosen and nothing more.
export type Link = { level: "parish" | "council" | "county" | "region" | "policing" | "devolved" | "national"; body: string; elected: "direct" | "indirect" | "appointed"; note?: string };

// The postcodes.io fields this needs (see app/find/actions.ts).
export type PostcodeFacts = { country: string; admin_district: string | null; admin_county: string | null; parish: string | null; pfa: string | null; codes: { admin_district?: string; admin_county?: string; parish?: string } };

const NONE = /99999999$/;

export function decisionChain(p: PostcodeFacts): Link[] {
  const out: Link[] = [];
  const lad = p.codes.admin_district ?? "";
  if (p.country === "England" && p.parish && p.codes.parish && !NONE.test(p.codes.parish) && !/unparished/i.test(p.parish)) {
    out.push({ level: "parish", body: p.parish, elected: "direct" });
  }
  if (p.admin_district) out.push({ level: "council", body: p.codes.admin_district === "E09000001" ? "City of London Corporation" : `${p.admin_district} council`, elected: "direct" });
  if (p.admin_county && p.codes.admin_county && !NONE.test(p.codes.admin_county)) out.push({ level: "county", body: `${p.admin_county} County Council`, elected: "direct" });
  if (lad.startsWith(data.london.lad_prefix)) {
    for (const b of data.london.bodies) out.push({ level: "region", body: b.name, elected: b.elected as "direct", note: b.what });
  } else {
    const ca = data.combined_authorities.find((c) => c.lads.includes(lad));
    if (ca) out.push(ca.mayor
      ? { level: "region", body: `Mayor of ${ca.name}`, elected: "direct", note: `Leads the ${ca.name} combined authority, whose board also includes the leaders of its councils` }
      : { level: "region", body: `${ca.name} combined authority`, elected: "indirect", note: "Made up of the area's council leaders; no directly elected mayor" });
  }
  const pfa = p.pfa ?? "";
  const byMayor = (data.policing_by_mayor as Record<string, string>)[pfa];
  const other = (data.policing_other as Record<string, string>)[pfa] ?? (data.policing_other as Record<string, string>)[p.country];
  if (byMayor) out.push({ level: "policing", body: byMayor, elected: "direct", note: "The mayor holds the police and crime commissioner's role" });
  else if (other) out.push({ level: "policing", body: other.split(" (")[0], elected: /Corporation/.test(other) ? "indirect" : "appointed", note: other });
  else if (p.country === "England" || p.country === "Wales") out.push({ level: "policing", body: `Police and crime commissioner for ${pfa}`, elected: "direct", note: "Police and crime commissioners are due to be abolished in May 2028" });
  for (const b of (data.national as Record<string, { name: string; elected: string }[]>)[p.country] ?? []) {
    out.push({ level: b.name === "UK Parliament" ? "national" : "devolved", body: b.name, elected: "direct" });
  }
  return out;
}
