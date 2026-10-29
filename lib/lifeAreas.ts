import chain from "@/lib/decision-chain.json";

// The five life areas on the map (Romily's design, 29 Oct 2026), used both as the map's category cards and as the
// headings of "Who makes decisions where you live" (components/Layers.tsx), so the two always match. Each map layer
// belongs to one area. Group colours are pale tints with a darker accent, chosen to be unlike any party's colour and
// unlike each other (Barny, 24 Sept): no Conservative blue, Labour red, Lib Dem amber, Green green, Reform cyan, SNP
// yellow, Plaid or Sinn Féin teal, UKIP purple. Environment is an olive, not a party green; nothing is a strong blue.
export type AreaKey = "safety" | "homes" | "environment" | "transport" | "education";
export const LIFE_AREAS: { key: AreaKey; title: string; topic: string; datasets: string[] }[] = [
  { key: "safety", title: "Safety", topic: "crime_policing_and_justice", datasets: ["police-crime"] },
  { key: "homes", title: "Homes & planning", topic: "housing_and_property", datasets: ["brownfield-land", "article-4-direction-area", "conservation-area", "green-belt"] },
  { key: "environment", title: "Environment & risk", topic: "environment_climate_and_energy", datasets: ["flood-risk-zone", "waste-sites", "storm-overflows", "air-quality-management-area", "ancient-woodland"] },
  { key: "transport", title: "Getting around", topic: "transport", datasets: ["transport-stops", "transport-stations"] },
  { key: "education", title: "Education", topic: "education_and_universities", datasets: ["educational-establishment"] },
];
export const areaOf = (dataset: string) => LIFE_AREAS.find((a) => a.datasets.includes(dataset))?.key ?? null;

// The card line for each layer: a count and a plain noun, singular and plural.
export const COUNT_NOUN: Record<string, [string, string]> = {
  "police-crime": ["recorded crime", "recorded crimes"],
  "brownfield-land": ["site identified for homes", "sites identified for homes"],
  "article-4-direction-area": ["Article 4 area", "Article 4 areas"],
  "conservation-area": ["conservation area", "conservation areas"],
  "green-belt": ["green belt area", "green belt areas"],
  "flood-risk-zone": ["flood risk area", "flood risk areas"],
  "waste-sites": ["permitted waste site", "permitted waste sites"],
  "storm-overflows": ["storm overflow", "storm overflows"],
  "air-quality-management-area": ["air quality management area", "air quality management areas"],
  "ancient-woodland": ["ancient woodland", "ancient woodlands"],
  "transport-stops": ["bus or coach stop", "bus and coach stops"],
  "transport-stations": ["station, tram stop, ferry or taxi rank", "stations, tram stops, ferries and taxi ranks"],
  "educational-establishment": ["school or college", "schools or colleges"],
};

// The facts about a place that decide who is responsible: postcodes.io (ONS geography) and planning.data.gov.uk's
// local planning authority boundaries.
export type PlaceFacts = { country: string | null; district: string | null; county: string | null; lad: string | null; parish: string | null; pfa: string | null; lpa: string | null };
export type Resp = { role: string; body: string; src: readonly [string, string]; note?: string };

const S = {
  council: ["GOV.UK, Understand how your council works", "https://www.gov.uk/understand-how-your-council-works/types-of-council"],
  police: ["House of Commons Library, Police and crime commissioners (July 2026)", "https://researchbriefings.files.parliament.uk/documents/SN06104/SN06104.pdf"],
  devo: ["GOV.UK, Devolution guidance for civil servants", "https://www.gov.uk/government/publications/devolution-guidance-for-civil-servants"],
  lpa: ["planning.data.gov.uk, Local planning authority boundaries", "https://www.planning.data.gov.uk/dataset/local-planning-authority"],
  consult: ["GOV.UK planning guidance, Consultation and pre-decision matters", "https://www.gov.uk/guidance/consultation-and-pre-decision-matters"],
  llfa: ["Flood and Water Management Act 2010, section 6", "https://www.legislation.gov.uk/ukpga/2010/29/section/6"],
  ea: ["GOV.UK, Environment Agency", "https://www.gov.uk/government/organisations/environment-agency"],
  permits: ["GOV.UK, Waste: environmental permits", "https://www.gov.uk/guidance/waste-environmental-permits"],
  aqma: ["Environment Act 1995, Part IV (air quality)", "https://www.legislation.gov.uk/ukpga/1995/25/part/IV"],
  overflows: ["GOV.UK, Storm overflows discharge reduction plan", "https://www.gov.uk/government/publications/storm-overflows-discharge-reduction-plan"],
  lta: ["Transport Act 2000, section 108 (local transport authorities)", "https://www.legislation.gov.uk/ukpga/2000/38/section/108"],
  london: ["Greater London Authority, Who we are", "https://www.london.gov.uk/who-we-are"],
  dft: ["GOV.UK, Department for Transport", "https://www.gov.uk/government/organisations/department-for-transport"],
  tscot: ["Transport Scotland", "https://www.transport.gov.scot/"],
  tfw: ["Transport for Wales", "https://tfw.wales/"],
  academies: ["GOV.UK, Types of school: academies", "https://www.gov.uk/types-of-school/academies"],
  ne: ["GOV.UK, Natural England", "https://www.gov.uk/government/organisations/natural-england"],
  scotBus: ["Transport (Scotland) Act 2001, Part 1 (local bus services)", "https://www.legislation.gov.uk/asp/2001/2/part/1"],
} as const;

// Combined authorities set up in 2026, after the ONS lookup in lib/decision-chain.json (May 2025). Each shares local
// transport planning with its councils, from its own regulations (Hampshire's bus functions too; its mayor's powers
// start on 8 May 2028). Matched on the constituent councils the regulations name.
const NEW_2026: { name: string; counties: string[]; unitaries: string[]; src: readonly [string, string] }[] = [
  { name: "Hampshire and the Solent Combined County Authority", counties: ["Hampshire"], unitaries: ["Isle of Wight", "Portsmouth", "Southampton"], src: ["The Hampshire and the Solent Combined County Authority Regulations 2026 (SI 2026/595)", "https://www.legislation.gov.uk/uksi/2026/595"] },
  { name: "Sussex and Brighton Combined County Authority", counties: ["East Sussex", "West Sussex"], unitaries: ["Brighton and Hove"], src: ["The Sussex and Brighton Combined County Authority Regulations 2026 (SI 2026/362)", "https://www.legislation.gov.uk/uksi/2026/362"] },
  { name: "Cheshire and Warrington Combined Authority", counties: [], unitaries: ["Cheshire East", "Cheshire West and Chester", "Warrington"], src: ["The Cheshire and Warrington Combined Authority Order 2026 (SI 2026/159)", "https://www.legislation.gov.uk/uksi/2026/159"] },
  { name: "Cumbria Combined Authority", counties: [], unitaries: ["Cumberland", "Westmorland and Furness"], src: ["The Cumbria Combined Authority Order 2026 (SI 2026/158)", "https://www.legislation.gov.uk/uksi/2026/158"] },
];

const NONE = /99999999$|^$/;
const isLondon = (p: PlaceFacts) => (p.lad ?? "").startsWith("E09");
const districtCouncil = (p: PlaceFacts) => (p.lad === "E09000001" ? "City of London Corporation" : p.district ? `${p.district} council` : "Your council");
// The council that runs schools, local flooding and waste planning: the county in a two-tier area, otherwise the one
// council (a unitary, a London borough, a metropolitan borough, every council in Scotland and Wales).
const upperCouncil = (p: PlaceFacts) => (p.county ? `${p.county} County Council` : districtCouncil(p));
const planningBody = (p: PlaceFacts) => {
  const n = (p.lpa ?? "").replace(/ LPA$/, "").trim();
  if (!n) return districtCouncil(p);
  if (/National Park/.test(n)) return `${n} Authority`;
  if (/Development Corporation|Corporation/.test(n)) return n;
  return `${n} council`;
};
const establishedCa = (p: PlaceFacts) => (chain.combined_authorities as { name: string; mayor: boolean; lads: string[] }[]).find((c) => p.lad && c.lads.includes(p.lad)) ?? null;
const newCa = (p: PlaceFacts) => NEW_2026.find((c) => (p.county && c.counties.includes(p.county)) || (!p.county && p.district && c.unitaries.includes(p.district))) ?? null;
const pcc = (p: PlaceFacts) => {
  const pfa = p.pfa ?? "";
  const byMayor = (chain.policing_by_mayor as Record<string, string>)[pfa];
  if (byMayor) return { body: byMayor, note: undefined };
  if (pfa === "London, City of") return { body: "City of London Corporation, as police authority", note: undefined };
  if (p.country === "Scotland") return { body: "Scottish Police Authority (appointed)", note: undefined };
  if (p.country === "Northern Ireland") return { body: "Northern Ireland Policing Board", note: undefined };
  const pfcc = ["Essex", "Northamptonshire", "Staffordshire"].includes(pfa);
  return { body: `${pfcc ? "Police, Fire and Crime Commissioner" : "Police and Crime Commissioner"}${pfa ? ` (${pfa} police area)` : ""}`, note: "Police and crime commissioners are due to be abolished in May 2028." };
};
const lawMaker = (p: PlaceFacts) => (p.country === "Scotland" ? "Scottish Parliament" : p.country === "Northern Ireland" ? "Northern Ireland Assembly" : "UK Parliament");

function buses(p: PlaceFacts): Resp {
  if (isLondon(p)) return { role: "Local bus services", body: "Transport for London, led by the Mayor of London", src: S.london };
  if (p.country === "Scotland") return { role: "Local bus services", body: districtCouncil(p), src: S.scotBus };
  if (p.country === "Wales") return { role: "Local bus services and transport planning", body: districtCouncil(p), src: S.lta };
  const ca = establishedCa(p);
  if (ca) return { role: "Local bus services and transport planning", body: `${ca.name} combined authority`, src: S.lta, note: "A combined authority is the local transport authority for its area." };
  const nc = newCa(p);
  if (nc) return { role: "Local bus services and transport planning", body: `${upperCouncil(p)}, with the ${nc.name}`, src: nc.src, note: "The new authority shares these powers with its councils." };
  return { role: "Local bus services and transport planning", body: upperCouncil(p), src: S.lta };
}
function planning(p: PlaceFacts, role = "Planning decisions"): Resp[] {
  const out: Resp[] = [{ role, body: planningBody(p), src: S.lpa, note: "The local planning authority for this point." }];
  if (p.parish && p.country === "England" && !/unparished/i.test(p.parish) && !NONE.test(p.parish)) out.push({ role: "Consulted on planning applications, not the decision-maker", body: p.parish, src: S.consult });
  return out;
}

export function responsible(dataset: string, p: PlaceFacts, extra: { company?: string } = {}): Resp[] {
  const reg = p.country === "Scotland" ? "Scottish Environment Protection Agency" : p.country === "Wales" ? "Natural Resources Wales" : "Environment Agency";
  switch (dataset) {
    case "police-crime": {
      const x = pcc(p);
      return [{ role: "Local police priorities and the police budget", body: x.body, src: S.police, note: x.note }, { role: "Criminal law", body: lawMaker(p), src: S.devo }];
    }
    case "brownfield-land": return [{ role: "Keeps the brownfield register", body: planningBody(p), src: S.lpa }, ...planning(p)];
    case "conservation-area": return planning(p, "Designates it, and decides planning applications inside it");
    case "article-4-direction-area": return planning(p, "Made the direction, and decides the applications it requires");
    case "green-belt": return planning(p, "Sets the boundary in its local plan, and decides planning applications");
    case "ancient-woodland": return [...planning(p, "Planning decisions that affect it"), { role: "Advises on planning applications", body: "Natural England", src: S.ne }];
    case "flood-risk-zone": return [{ role: "Flood risk from rivers and the sea", body: reg, src: S.ea }, { role: "Local flooding (surface water, groundwater, small watercourses)", body: upperCouncil(p), src: S.llfa, note: "The lead local flood authority." }];
    case "waste-sites": return [{ role: "Permits waste sites", body: reg, src: S.permits }, { role: "Planning for waste sites", body: /National Park/.test(p.lpa ?? "") ? planningBody(p) : upperCouncil(p), src: S.council }, { role: "Bin collections", body: districtCouncil(p), src: S.council }];
    case "storm-overflows": return [{ role: "Runs the overflow", body: extra.company ?? "Your water company", src: S.overflows }, { role: "Regulates discharges", body: reg, src: S.overflows }];
    case "air-quality-management-area": return [{ role: "Declares the area and must publish a plan to improve it", body: districtCouncil(p), src: S.aqma }];
    case "transport-stops": return [buses(p)];
    case "transport-stations": {
      const rail: Resp = isLondon(p) ? { role: "The Underground, Overground, DLR and trams", body: "Transport for London, led by the Mayor of London", src: S.london }
        : p.country === "Scotland" ? { role: "Rail services", body: "Transport Scotland (Scottish Government)", src: S.tscot }
        : p.country === "Wales" ? { role: "Wales and Borders rail services", body: "Transport for Wales (Welsh Government)", src: S.tfw }
        : { role: "Rail services", body: "Department for Transport (UK Government)", src: S.dft };
      return [rail, buses(p)];
    }
    case "educational-establishment": return p.country === "England"
      ? [{ role: "School places, council-run schools and SEND support", body: upperCouncil(p), src: S.council }, { role: "Academies and free schools", body: "Department for Education", src: S.academies }]
      : [{ role: "Schools", body: p.country === "Northern Ireland" ? "Education Authority (Northern Ireland)" : districtCouncil(p), src: S.devo }];
    default: return [];
  }
}

// For "Who makes decisions where you live": every distinct line for one life area, whether or not the map found that
// layer near this point.
export function areaResponsible(area: AreaKey, p: PlaceFacts): Resp[] {
  const seen = new Set<string>();
  const out: Resp[] = [];
  for (const d of LIFE_AREAS.find((a) => a.key === area)!.datasets) {
    for (const r of responsible(d, p)) { const k = `${r.role}|${r.body}`; if (!seen.has(k)) { seen.add(k); out.push(r); } }
  }
  return out;
}

// The local planning authority for a point, from planning.data.gov.uk (Open Government Licence). England only.
export async function lpaAt(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(`https://www.planning.data.gov.uk/entity.json?dataset=local-planning-authority&latitude=${lat}&longitude=${lng}&limit=1`, { signal: AbortSignal.timeout(5000), next: { revalidate: 604800 } });
    if (!r.ok) return null;
    return ((await r.json())?.entities?.[0]?.name as string | undefined) ?? null;
  } catch { return null; }
}
