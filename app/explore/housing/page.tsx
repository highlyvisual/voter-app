import Link from "next/link";
import { Suspense } from "react";
import ExplorePostcode from "@/components/ExplorePostcode";
import ProfileApply from "@/components/ProfileApply";
import ExtLink from "@/components/ExtLink";
import { FIELDS } from "@/lib/household";
import { councilBySlug, councilSlugFor } from "@/lib/councils";
import { publicClient } from "@/lib/data";
import { longDate } from "@/lib/dates";
import wider from "@/lib/widerBodies.json";

export const dynamic = "force-dynamic";
export const metadata = { title: "Housing: who decides what", description: "Housing from your front door to Parliament: what your council, any mayor, the devolved government and the UK Government each control, with sources.", alternates: { canonical: "/explore/housing" } };

// The scale explorer (Romily, round eight, point 8), Housing first. The same question asked at each level: You, your
// area, the wider area, the country. Each level says what it controls, where that comes from, what is published there,
// and where it touches the household described. Nothing is ranked, and no level is said to matter more.
type Src = { label: string; url: string };
const S: Record<string, Src> = {
  councilHousing: { label: "GOV.UK, Council housing", url: "https://www.gov.uk/council-housing" },
  homeless: { label: "GOV.UK, Help if you're homeless", url: "https://www.gov.uk/if-youre-homeless-at-risk-of-homelessness" },
  councils: { label: "GOV.UK, Understand how your council works", url: "https://www.gov.uk/understand-how-your-council-works/types-of-council" },
  planMaking: { label: "GOV.UK, Plan-making guidance (updated 27 November 2025)", url: "https://www.gov.uk/guidance/plan-making" },
  londonPlan: { label: "Greater London Authority Act 1999, section 334", url: "https://www.legislation.gov.uk/ukpga/1999/29/section/334" },
  mayors: { label: "Institute for Government, Regional mayors", url: "https://www.instituteforgovernment.org.uk/explainer/regional-mayors-devolution" },
  scot: { label: "Scottish Government, Housing", url: "https://www.gov.scot/housing/" },
  wales: { label: "Welsh Government, Housing", url: "https://www.gov.wales/housing" },
  ni: { label: "Department for Communities (Northern Ireland), Housing", url: "https://www.communities-ni.gov.uk/topics/housing" },
  renters: { label: "Renters' Rights Act 2025 (Royal Assent 27 October 2025; applies to England)", url: "https://www.legislation.gov.uk/ukpga/2025/26/contents" },
  nppf: { label: "GOV.UK, National Planning Policy Framework", url: "https://www.gov.uk/guidance/national-planning-policy-framework" },
  sdlt: { label: "GOV.UK, Stamp Duty Land Tax", url: "https://www.gov.uk/stamp-duty-land-tax" },
  lbtt: { label: "Revenue Scotland, Land and Buildings Transaction Tax", url: "https://revenue.scot/taxes/land-buildings-transaction-tax" },
  ltt: { label: "Welsh Government, Land Transaction Tax guide", url: "https://www.gov.wales/land-transaction-tax-guide" },
  hb: { label: "GOV.UK, Housing Benefit: what you'll get", url: "https://www.gov.uk/housing-benefit/what-youll-get" },
  uc: { label: "GOV.UK, Housing costs and Universal Credit", url: "https://www.gov.uk/housing-and-universal-credit" },
};
type Item = { text: string; src: Src; you?: string };
type Level = { key: string; title: string; body: string; items: Item[]; extra?: React.ReactNode };

type Pc = { outcode: string; country: string; admin_district: string | null; admin_county: string | null; codes?: { admin_district?: string } };
type Wider = { combined_authority: Record<string, { code: string; name: string; mayor: boolean | null }>; gla: string[] };
const W = wider as unknown as Wider;

function tenureLabel(t: string | undefined) {
  return (FIELDS.tenure.options as readonly (readonly [string, string])[]).find(([k]) => k === t)?.[1] ?? null;
}

export default async function HousingExplorer({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const m = typeof sp.loc === "string" ? sp.loc.match(/^(-?\d{1,2}\.\d{1,3}),(-?\d{1,3}\.\d{1,3})$/) : null;
  const loc = m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
  const tenure = typeof sp.tenure === "string" ? sp.tenure : undefined;
  const renting = tenure === "private_rent" || tenure === "student_halls";
  const social = tenure === "social_rent";
  const owning = tenure === "own_mortgage" || tenure === "own_outright";
  const benefits = sp.benefits === "yes";

  let pc: Pc | null = null;
  if (loc) {
    try { pc = (await fetch(`https://api.postcodes.io/postcodes?lon=${loc.lng}&lat=${loc.lat}&limit=1&radius=600`, { signal: AbortSignal.timeout(5000), next: { revalidate: 604800 } }).then((r) => r.json()))?.result?.[0] ?? null; } catch { pc = null; }
  }
  const country = pc?.country ?? null;
  const england = !country || country === "England";
  const lad = pc?.codes?.admin_district ?? null;
  const twoTier = Boolean(pc?.admin_county);
  const slug = await councilSlugFor(pc?.admin_district);
  const council = slug ? await councilBySlug(slug) : null;
  const fact = council?.facts.find((f) => f.topic === "housing" && f.quote) ?? null;
  const plans = slug ? ((await publicClient().from("local_plans").select("name, required_housing, period_start, period_end, documentation_url").eq("council_slug", slug).order("period_end", { ascending: false, nullsFirst: false }).limit(1)).data ?? []) : [];
  const plan = plans[0] as { name: string | null; required_housing: number | null; period_start: string | null; period_end: string | null; documentation_url: string | null } | undefined;
  const london = lad ? W.gla.includes(lad) : false;
  const ca = lad ? W.combined_authority[lad] ?? null : null;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]).toString();

  const councilName = pc?.admin_district ? `${pc.admin_district} council` : "Your council";
  const levels: Level[] = [
    {
      key: "you", title: "You and your household",
      body: tenure ? `You told us: ${tenureLabel(tenure)?.toLowerCase()}. The lines marked "you" below are the ones that touch that.` : "Add your profile and the lines that touch your household are marked below. Nothing is assumed if you don't.",
      items: [],
      extra: tenure ? null : <p className="small"><Link href="/start">Start with you &rarr;</Link></p>,
    },
    {
      key: "area", title: `Your area: ${councilName}`,
      body: twoTier ? `Where there are two councils, housing and planning applications sit with the district (${pc?.admin_district}); the county (${pc?.admin_county}) plans roads, schools and waste.` : "Your council is the housing authority and the planning authority for your area.",
      items: [
        ...(england ? [
          { text: "Runs the waiting list for council housing and decides who is offered a home, by points or bands based on need.", src: S.councilHousing, you: social ? "You rent from a council or housing association." : undefined },
          { text: "Must help if you are legally homeless, or will become homeless within the next 8 weeks.", src: S.homeless },
          { text: "Decides planning applications, and writes the local plan that sets how many homes are needed and where they go.", src: S.planMaking },
        ] : [
          { text: `Councils run housing services and planning locally; the rules are set by the ${country === "Scotland" ? "Scottish Government" : country === "Wales" ? "Welsh Government" : "Northern Ireland Executive"}.`, src: country === "Scotland" ? S.scot : country === "Wales" ? S.wales : S.ni },
        ]),
      ],
      extra: (
        <>
          {plan ? <p className="small">Its local plan{plan.name ? `, ${plan.name}` : ""}{plan.required_housing ? `, records a requirement of ${plan.required_housing.toLocaleString("en-GB")} homes` : ""}{plan.period_start && plan.period_end ? ` for ${plan.period_start.slice(0, 4)}–${plan.period_end.slice(0, 4)}` : ""}. {plan.documentation_url ? <ExtLink href={plan.documentation_url}>The plan</ExtLink> : null} <span className="meta">From planning.data.gov.uk.</span></p> : null}
          {fact ? <blockquote className="quote small">{fact.quote}<span className="meta"> — {fact.publisher}{fact.published_on ? `, ${longDate(fact.published_on)}` : ""}{fact.url ? <> · <ExtLink href={fact.url}>source</ExtLink></> : null}</span></blockquote> : null}
          {slug ? <p className="small"><Link href={`/council/${slug}`}>Everything {pc?.admin_district} council is deciding &rarr;</Link></p> : pc ? <p className="meta">We don&rsquo;t have a page for {pc.admin_district} council yet.</p> : null}
        </>
      ),
    },
    {
      key: "wider", title: "The wider area",
      body: london ? "In London, the Mayor publishes the planning strategy for the whole city." : country && country !== "England" ? `Housing is devolved: the ${country === "Scotland" ? "Scottish" : country === "Wales" ? "Welsh" : "Northern Ireland"} government sets housing law and policy here.` : ca?.mayor ? `There is an elected Mayor of ${ca.name}, whose powers vary by devolution deal.` : "There is no mayor or combined authority with housing powers here; housing decisions sit with your council and the government.",
      items: london ? [
        { text: "The Mayor must publish a spatial development strategy (the London Plan) setting general policies for the development and use of land in Greater London.", src: S.londonPlan },
      ] : country === "Scotland" ? [{ text: "Housing policy in Scotland is set by the Scottish Government and Parliament.", src: S.scot }]
        : country === "Wales" ? [{ text: "Housing policy in Wales is set by the Welsh Government and the Senedd.", src: S.wales }]
        : country === "Northern Ireland" ? [{ text: "Housing policy in Northern Ireland is set by the Department for Communities and the Assembly.", src: S.ni }]
        : ca?.mayor ? [{ text: "Regional mayors' powers \u201ctypically include aspects of transport, skills, housing, and local infrastructure investment, and in some case spatial planning\u201d.", src: S.mayors }] : [],
    },
    {
      key: "country", title: england ? "The country: UK Government and Parliament" : "The country",
      body: england ? "For England, housing law, national planning policy and the taxes on buying a home are set nationally." : "Some housing matters are set for the whole UK, including help with rent through Universal Credit.",
      items: [
        ...(england ? [
          { text: "The Renters' Rights Act 2025 changes the law about rented homes in England, including abolishing assured shorthold tenancies.", src: S.renters, you: renting ? "You rent privately." : undefined },
          { text: "The National Planning Policy Framework (new edition, 17 August 2026) sets out the government's policies for plan-making and for deciding planning applications in England.", src: S.nppf },
        ] : []),
        { text: country === "Scotland" ? "Buying a home in Scotland: Land and Buildings Transaction Tax, set by the Scottish Parliament." : country === "Wales" ? "Buying a home in Wales: Land Transaction Tax, set by the Senedd." : "Buying a home in England or Northern Ireland: Stamp Duty Land Tax, set by the UK Parliament.", src: country === "Scotland" ? S.lbtt : country === "Wales" ? S.ltt : S.sdlt, you: owning ? "You own your home (it applies when you buy)." : undefined },
        { text: "Universal Credit can include money towards housing costs.", src: S.uc, you: benefits ? "You receive a means-tested benefit." : undefined },
        { text: "For private renters on Housing Benefit, the rent it covers is the Local Housing Allowance rate or the actual rent, whichever is lower.", src: S.hb, you: renting && benefits ? "You rent privately and receive a means-tested benefit." : undefined },
      ],
      extra: <p className="small"><Link href="/positions?topic=housing_and_property">What candidates and parties have published on housing &rarr;</Link></p>,
    },
  ];

  return (
    <>
      <Suspense fallback={null}><ProfileApply /></Suspense>
      <p className="eyebrow">Housing{pc ? ` · ${pc.outcode}` : ""}</p>
      <h1>Housing. Who decides what?</h1>
      <p className="lede">From your front door to Parliament: what each level controls, where that comes from, and where it touches your household. No level is ranked; each is just a different part of the answer.</p>
      <Suspense fallback={null}><ExplorePostcode /></Suspense>
      <ol className="chain scale">
        {levels.map((l, i) => (
          <li key={l.key} className="chain-step">
            <details open={i < 2 || undefined}>
              <summary>
                <span className="layer-name">{["You", "Your area", "Wider area", "Country"][i]}</span>
                <span className="layer-area">{l.title}</span>
              </summary>
              <p className="small" style={{ margin: "0.35rem 0" }}>{l.body}</p>
              {l.items.length ? (
                <ul className="scale-items">
                  {l.items.map((it) => (
                    <li key={it.text} className={it.you ? "touches" : undefined}>
                      {it.you ? <span className="layer-tag">You</span> : null} {it.text}{it.you ? <span className="meta"> {it.you}</span> : null}
                      <span className="meta"> Source: <a href={it.src.url} rel="noopener">{it.src.label}</a></span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {l.extra}
            </details>
          </li>
        ))}
      </ol>
      <p className="meta">Housing first; other topics will follow the same four steps. Descriptions come from the sources linked beside each line; the council&rsquo;s own website is definitive for how it works locally. {qs ? null : null}</p>
    </>
  );
}
