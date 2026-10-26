import type { HomeSub } from "@/lib/homeTopics";
import { TENURE_WORDS } from "@/lib/homeTopics";

// The sourced lines behind "What does this mean for you?" and "Who has the power?" on the Your Home pages (Romily,
// 26 Oct points 1 and 7). Each line is written from the page it links to, and most are the same lines already live on
// /explore/housing ("Housing: who decides what"), which now reads its sources from here too. Romily, round eleven q4:
// outside money, sourced examples only, no new figures. A line is marked as touching the reader only by a fixed rule on
// the one or two profile answers it names. No server code.
export type Src = { label: string; url: string };
export const HOUSING_SRC: Record<string, Src> = {
  councilHousing: { label: "GOV.UK, Council housing", url: "https://www.gov.uk/council-housing" },
  homeless: { label: "GOV.UK, Help if you're homeless", url: "https://www.gov.uk/if-youre-homeless-at-risk-of-homelessness" },
  councils: { label: "GOV.UK, Understand how your council works", url: "https://www.gov.uk/understand-how-your-council-works/types-of-council" },
  planMaking: { label: "GOV.UK, Plan-making guidance (updated 27 November 2025)", url: "https://www.gov.uk/guidance/plan-making" },
  planningPermission: { label: "GOV.UK, Planning permission (England and Wales)", url: "https://www.gov.uk/planning-permission-england-wales" },
  londonPlan: { label: "Greater London Authority Act 1999, section 334", url: "https://www.legislation.gov.uk/ukpga/1999/29/section/334" },
  mayors: { label: "Institute for Government, Regional mayors", url: "https://www.instituteforgovernment.org.uk/explainer/regional-mayors-devolution" },
  scot: { label: "Scottish Government, Housing", url: "https://www.gov.scot/housing/" },
  wales: { label: "Welsh Government, Housing", url: "https://www.gov.wales/housing" },
  ni: { label: "Department for Communities (Northern Ireland), Housing", url: "https://www.communities-ni.gov.uk/topics/housing" },
  renters: { label: "Renters' Rights Act 2025 (Royal Assent 27 October 2025; applies to England)", url: "https://www.legislation.gov.uk/ukpga/2025/26/contents" },
  leasehold: { label: "Leasehold and Freehold Reform Act 2024", url: "https://www.legislation.gov.uk/ukpga/2024/22/contents" },
  nppf: { label: "GOV.UK, National Planning Policy Framework", url: "https://www.gov.uk/guidance/national-planning-policy-framework" },
  sdlt: { label: "GOV.UK, Stamp Duty Land Tax", url: "https://www.gov.uk/stamp-duty-land-tax" },
  lbtt: { label: "Revenue Scotland, Land and Buildings Transaction Tax", url: "https://revenue.scot/taxes/land-buildings-transaction-tax" },
  ltt: { label: "Welsh Government, Land Transaction Tax guide", url: "https://www.gov.wales/land-transaction-tax-guide" },
  hb: { label: "GOV.UK, Housing Benefit: what you'll get", url: "https://www.gov.uk/housing-benefit/what-youll-get" },
  uc: { label: "GOV.UK, Housing costs and Universal Credit", url: "https://www.gov.uk/housing-and-universal-credit" },
};
const S = HOUSING_SRC;

export type Place = { country: string | null; london: boolean; mayor: string | null };
export type Who = { tenure?: string; benefits?: string };
export type Line = { text: string; src: Src; because: string | null };

const renter = (t?: string) => t === "private_rent" || t === "social_rent" || t === "student_halls";
const owner = (t?: string) => t === "own_mortgage" || t === "own_outright";
const told = (t?: string) => (t && TENURE_WORDS[t] ? `you told us you're ${TENURE_WORDS[t]}` : null);
const devolvedSrc = (c: string | null) => (c === "Scotland" ? S.scot : c === "Wales" ? S.wales : S.ni);
const devolvedGov = (c: string | null) => (c === "Scotland" ? "the Scottish Government" : c === "Wales" ? "the Welsh Government" : "the Northern Ireland Executive");

/** "What does this mean for you?": the sourced lines for one sub-topic, the ones that touch this profile first. */
export function meansForYou(sub: HomeSub, place: Place, who: Who): Line[] {
  const england = !place.country || place.country === "England";
  const t = who.tenure;
  const ben = who.benefits === "yes";
  const out: Line[] = [];
  if (sub === "renting") {
    if (england) out.push({ text: "The Renters' Rights Act 2025 changes the law about rented homes in England, including abolishing assured shorthold tenancies.", src: S.renters, because: t === "private_rent" ? told(t) : null });
    else out.push({ text: `Renting law here is set by ${devolvedGov(place.country)}, not the UK Parliament.`, src: devolvedSrc(place.country), because: renter(t) ? told(t) : null });
    out.push({ text: "For private renters on Housing Benefit, the rent it covers is the Local Housing Allowance rate or the actual rent, whichever is lower.", src: S.hb, because: t === "private_rent" && ben ? "you told us you rent privately and receive a means-tested benefit" : null });
    out.push({ text: "Universal Credit can include money towards housing costs.", src: S.uc, because: ben && renter(t) ? "you told us you rent and receive a means-tested benefit" : null });
    if (england) out.push({ text: "Your council runs the waiting list for council housing and decides who is offered a home, by points or bands based on need.", src: S.councilHousing, because: t === "social_rent" ? told(t) : null });
    if (england) out.push({ text: "Your council must help if you are legally homeless, or will become homeless within the next 8 weeks.", src: S.homeless, because: null });
  } else if (sub === "owning") {
    out.push({
      text: place.country === "Scotland" ? "Buying a home in Scotland: Land and Buildings Transaction Tax, set by the Scottish Parliament." : place.country === "Wales" ? "Buying a home in Wales: Land Transaction Tax, set by the Senedd." : "Buying a home in England or Northern Ireland: Stamp Duty Land Tax, set by the UK Parliament.",
      src: place.country === "Scotland" ? S.lbtt : place.country === "Wales" ? S.ltt : S.sdlt, because: owner(t) ? `${told(t)} (it applies when you buy)` : null,
    });
    out.push({ text: "You'll probably need planning permission to make a major change to your home, such as building an extension; you apply to your council.", src: S.planningPermission, because: owner(t) ? told(t) : null });
  } else {
    if (england) out.push({ text: "Your council decides planning applications, and writes the local plan that sets how many homes are needed and where they go.", src: S.planMaking, because: null });
    else out.push({ text: `Councils decide planning locally; the rules are set by ${devolvedGov(place.country)}.`, src: devolvedSrc(place.country), because: null });
    if (england) out.push({ text: "The National Planning Policy Framework (new edition, 17 August 2026) sets out the government's policies for plan-making and for deciding planning applications in England.", src: S.nppf, because: null });
  }
  return [...out.filter((l) => l.because), ...out.filter((l) => !l.because)];
}

// "Who has the power?" (Romily, 26 Oct point 7): one compact row, the same three boxes on every sub-topic. Body names
// come from the decision chain for the postcode (lib/decisionChain.ts); what each decides comes from the sources here.
export type PowerBox = { key: "parliament" | "council" | "other"; title: string; body: string; lines: { text: string; src: Src }[] };
export function whoHasPower(sub: HomeSub, place: Place, councilName: string | null): PowerBox[] {
  const england = !place.country || place.country === "England";
  const devolvedBody = place.country === "Scotland" ? "Scottish Parliament" : place.country === "Wales" ? "Senedd Cymru" : place.country === "Northern Ireland" ? "Northern Ireland Assembly" : null;
  // No place yet (no postcode): the boxes say what each level does in England, and that the names depend on the address.
  const known = place.country !== null;
  const council = councilName ?? "The council for your address";
  const parl: PowerBox = { key: "parliament", title: "Parliament", body: devolvedBody ? `UK Parliament and the ${devolvedBody}` : "UK Parliament", lines: [] };
  const coun: PowerBox = { key: "council", title: "Your council", body: council, lines: [] };
  const other: PowerBox = { key: "other", title: "Other bodies", body: !known ? "Depends on your address: a mayor, where there is one" : place.london ? "Mayor of London" : place.mayor ?? (devolvedBody ? devolvedGov(place.country).replace(/^the /, "The ") : "No mayor or combined authority with housing powers here"), lines: [] };
  if (sub === "renting") {
    if (england) parl.lines.push({ text: "Renting law: tenancies, evictions and rent rules", src: S.renters });
    else parl.lines.push({ text: `Renting law is made by the ${devolvedBody}`, src: devolvedSrc(place.country) });
    parl.lines.push({ text: "Help with rent, through Universal Credit", src: S.uc });
    if (england) coun.lines.push({ text: "The council housing waiting list", src: S.councilHousing }, { text: "Help if you're homeless", src: S.homeless });
    else coun.lines.push({ text: "Housing services, under the national rules", src: devolvedSrc(place.country) });
  } else if (sub === "owning") {
    parl.lines.push(place.country === "Scotland" ? { text: "Land and Buildings Transaction Tax, set by the Scottish Parliament", src: S.lbtt } : place.country === "Wales" ? { text: "Land Transaction Tax, set by the Senedd", src: S.ltt } : { text: "Stamp Duty Land Tax", src: S.sdlt });
    if (england) parl.lines.push({ text: "Leasehold law", src: S.leasehold });
    coun.lines.push({ text: "Planning permission for major changes, such as an extension", src: S.planningPermission });
  } else {
    if (england) parl.lines.push({ text: "National planning policy for England", src: S.nppf });
    else parl.lines.push({ text: `Planning law is made by the ${devolvedBody}`, src: devolvedSrc(place.country) });
    coun.lines.push({ text: "Planning applications, and the local plan", src: S.planMaking });
  }
  if (sub === "housing" && place.london) other.lines.push({ text: "The London Plan: how land across London is developed and used", src: S.londonPlan });
  else if (sub === "housing" && place.mayor) other.lines.push({ text: "Regional mayors' powers “typically include aspects of transport, skills, housing, and local infrastructure investment, and in some case spatial planning”", src: S.mayors });
  else if (!england) other.lines.push({ text: "Housing policy for the nation", src: devolvedSrc(place.country) });
  return [parl, coun, other];
}
