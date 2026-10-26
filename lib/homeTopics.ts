// "Your Home", the first life area (Romily, round eleven, q2 and q6). Three sub-topics, and the fixed, published word
// lists that file things under each. Nothing here judges what matters: a position, a bill, an agenda item or a
// consultation is filed under a sub-topic only because its own words contain one of these words. Changing a list is a
// published decision (record it in the round notes); tests/homeTopics.test.mjs pins real examples.
// No server code, so the phone app could share it later.

export type HomeSub = "housing" | "renting" | "owning";

export const HOME_SUBS: { key: HomeSub; title: string; short: string; blurb: string }[] = [
  { key: "housing", title: "Housing: building and planning", short: "Housing", blurb: "New homes, planning and the local plan" },
  { key: "renting", title: "Renting", short: "Renting", blurb: "Tenants, landlords, rents and evictions" },
  { key: "owning", title: "Owning and mortgages", short: "Owning", blurb: "Buying, mortgages, stamp duty and leasehold" },
];
export const isHomeSub = (s: string): s is HomeSub => HOME_SUBS.some((x) => x.key === s);

// The word lists. Matched on lower-cased text. A thing can sit under more than one sub-topic (the Right to Buy is about
// renting and owning). "Ground rent" is a leaseholder's charge, so it is filed under owning, not renting.
export const SUB_WORDS: Record<HomeSub, RegExp[]> = {
  renting: [
    /(?<!ground )\brent(s|ed|ing|al|als)?\b/, /\brenters?\b/, /\btenan(t|ts|cy|cies)\b/, /\blandlords?\b/,
    /\bevict(ion|ions|ed|ing)?\b/, /\bsection 21\b/, /\bno[- ]fault\b/, /\blettings?\b/, /\bletting agents?\b/,
    /\bsocial (housing|homes?|houses|landlords?)\b/, /\bcouncil (housing|homes?|houses)\b/, /\bhousing associations?\b/,
    /\bright to buy\b/, /\btemporary accommodation\b/, /\bhomeless(ness)?\b/,
  ],
  owning: [
    /\bmortgages?\b/, /\bhome ?owners?(hip)?\b/, /\bowner[- ]occupi(er|ers|ed)\b/, /\bfirst[- ]time buyers?\b/,
    /\b(buy|buying|bought) (a |your |their |first )*(home|homes|house|houses|property)\b/, /\bstamp duty\b/,
    /\bland (and buildings )?transaction tax\b/, /\bleasehold(s|ers?)?\b/, /\bfreehold(s|ers?)?\b/, /\bcommonhold\b/,
    /\bleases?\b/, /\bmarriage value\b/, /\bground rents?\b/, /\bservice charges?\b/, /\bhelp to buy\b/,
    /\bshared ownership\b/, /\bright to buy\b/, /\bhouse prices?\b/, /\bsecond homes?\b/,
  ],
  housing: [
    /\bbuild(s|ing)?\b/, /\bbuilt\b/, /\bhousebuild(ing|ers?)\b/, /\bconstruction\b/,
    /\bnew (homes?|houses|towns?|housing|dwellings?)\b/, /\b(homes?|houses) (a|per|each|every) year\b/,
    /\b\d[\d,.]*( million)? (new |more |additional |affordable |social )*(homes|houses)\b/, /\baffordable (homes?|housing|houses)\b/, /\bmore (\w+ )?homes\b/,
    /\bplanning\b/, /\bplanners?\b/, /\blocal plans?\b/, /\bgreen ?belt\b/, /\bgrey ?belt\b/, /\bbrownfield\b/, /\bgreenfield\b/,
    /\bover-?development\b/, /\bdevelopments?\b/, /\bdevelopers?\b/, /\binfrastructure\b/, /\bhouses in multiple occupation\b/,
    /\bsocial homes?\b/, /\bhousing (bill|act)\b/,
  ],
};

// Titles from outside our claims (bills, council agendas, consultations) are about everything, not just housing, so a
// title must also contain one of these words before it is filed under a sub-topic. "House of" is Parliament, not a home.
export const HOUSING_WORDS: RegExp[] = [
  /\bhousing\b/, /\bhomes?\b/, /\bhouses?\b(?! of )/, /\bdwellings?\b/, /\bplanning\b/, /\blocal plans?\b/, /\brent/, /\btenan/,
  /\blandlord/, /\bleasehold/, /\bfreehold/, /\bcommonhold\b/, /\bmortgage/, /\bhomeless/, /\btemporary accommodation\b/,
];

// The same lists in plain words, as the page publishes them under "How this page works". Keep in step with the lists
// above: the tests check that every word shown here is caught by its own list.
export const SUB_WORDS_SHOWN: Record<HomeSub, string[]> = {
  renting: ["rent, rents, rented, renting, rental (not ground rent)", "renter, renters", "tenant, tenancy", "landlord", "eviction, evict", "Section 21", "no-fault", "letting, letting agent", "social housing, social homes, social landlord", "council housing, council homes", "housing association", "right to buy", "temporary accommodation", "homeless, homelessness"],
  owning: ["mortgage", "homeowner, home ownership", "owner-occupier", "first-time buyer", "buy a home, buying a house", "stamp duty", "land transaction tax", "leasehold, leaseholder", "freehold", "commonhold", "lease", "marriage value", "ground rent", "service charge", "help to buy", "shared ownership", "right to buy", "house prices", "second homes"],
  housing: ["build, building, built", "housebuilding", "construction", "new homes, new houses, new towns", "homes a year", "1.5 million homes (any number of homes)", "affordable homes, affordable housing", "more homes", "planning, planners", "local plan", "green belt, grey belt", "brownfield, greenfield", "overdevelopment, development, developers", "infrastructure", "houses in multiple occupation", "social homes", "Housing Bill, Housing Act"],
};
export const HOUSING_WORDS_SHOWN = ["housing", "home, homes", "house, houses (not “House of”)", "dwelling", "planning", "local plan", "rent…", "tenan…", "landlord", "leasehold", "freehold", "commonhold", "mortgage", "homeless…", "temporary accommodation"];

/** Does this text (a claim's summary and quotation) belong under the sub-topic? */
export function matchesSub(text: string, sub: HomeSub): boolean {
  const t = text.toLowerCase();
  return SUB_WORDS[sub].some((re) => re.test(t));
}

/** A title from Parliament or a council: it must be about housing at all, and then about this sub-topic. */
export function titleMatchesSub(title: string, sub: HomeSub): boolean {
  const t = title.toLowerCase();
  return HOUSING_WORDS.some((re) => re.test(t)) && matchesSub(t, sub);
}

/** Every sub-topic a text belongs under, in the fixed order. */
export function subsOf(text: string): HomeSub[] {
  return HOME_SUBS.map((s) => s.key).filter((k) => matchesSub(text, k));
}

// The profile's one housing answer, and the sub-topic it puts first (Romily, round ten q29: the reason goes behind a
// small (i), not on the card). Only the housing answer is used; nothing political.
export function profileSub(tenure: string | undefined | null): HomeSub | null {
  if (tenure === "private_rent" || tenure === "social_rent" || tenure === "student_halls") return "renting";
  if (tenure === "own_mortgage" || tenure === "own_outright") return "owning";
  return null;
}
export function subReason(tenure: string | undefined | null): string | null {
  if (tenure === "private_rent") return "because you told us you rent privately";
  if (tenure === "social_rent") return "because you told us you rent from a council or housing association";
  if (tenure === "student_halls") return "because you told us you live in student accommodation";
  if (tenure === "own_mortgage") return "because you told us you have a mortgage";
  if (tenure === "own_outright") return "because you told us you own your home";
  return null;
}

/** The three sub-topics for one profile: the one its housing answer points to first, with the reason; else fixed order. */
export function subOrder(tenure: string | undefined | null): { key: HomeSub; reason: string | null }[] {
  const first = profileSub(tenure);
  const fixed = HOME_SUBS.map((s) => s.key);
  const order = first ? [first, ...fixed.filter((k) => k !== first)] : fixed;
  return order.map((k) => ({ key: k, reason: k === first ? subReason(tenure) : null }));
}

// The few words "Showing this for:" uses for each housing answer.
export const TENURE_WORDS: Record<string, string> = {
  private_rent: "renting privately", social_rent: "renting from a council or housing association", own_mortgage: "owning with a mortgage",
  own_outright: "owning outright", student_halls: "living in student accommodation", other: "living with family or other housing",
};

/** "Applies to you because you told us…" (round eleven): the reason in the reader's own terms, where the claim's only
 *  condition is about housing. Null otherwise; the page then repeats the claim's own condition instead. */
export function becauseText(appliesIf: unknown, tenure: string | undefined | null): string | null {
  if (!appliesIf || typeof appliesIf !== "object" || !tenure || !TENURE_WORDS[tenure]) return null;
  const keys = Object.keys(appliesIf).filter((k) => !k.startsWith("_"));
  return keys.length && keys.every((k) => k === "tenure" || k === "rents" || k === "owns") ? `you told us you're ${TENURE_WORDS[tenure]}` : null;
}

// "What's happening?" (Romily, 26 Oct point 6, and round eleven q7): items touching the profile first, then newest first.
// An item touches the profile when its own words fall under the sub-topic the housing answer points to. Nothing else
// changes the order, and the order says nothing about importance.
export type NowLabel = "decision" | "proposal" | "consultation";
export const NOW_LABEL: Record<NowLabel, string> = { decision: "Decision made", proposal: "Proposal", consultation: "Consultation open" };
export type NowItem = { id: string; title: string; date: string; label: NowLabel | null; where: string; text: string };
export function sortNow<T extends Pick<NowItem, "text" | "date">>(items: T[], tenure: string | undefined | null): (T & { touches: boolean })[] {
  const p = profileSub(tenure);
  return items
    .map((it) => ({ ...it, touches: p ? matchesSub(it.text, p) : false }))
    .sort((a, b) => Number(b.touches) - Number(a.touches) || b.date.localeCompare(a.date));
}

// A bill's label, only where Parliament's own record says which (Romily, 26 Oct point 6). Royal Assent: the bill has
// become law, a decision made. A Government Bill still going through: Parliament's own description of that bill type
// calls it "a formal proposal for a new law" (Bills API, bill types). Anything else (a private member's bill, a bill
// that has fallen) gets no label.
export type BillLike = { isAct: boolean; billTypeId: number; isDefeated: boolean; billWithdrawn: string | null };
export const GOVERNMENT_BILL = 1;
export function billLabel(b: BillLike): NowLabel | null {
  if (b.isAct) return "decision";
  if (b.isDefeated || b.billWithdrawn) return null;
  return b.billTypeId === GOVERNMENT_BILL ? "proposal" : null;
}

// A council result, in the council's own outcome word as read from its minutes (council_item_outcomes). Only a result is
// a decision made; "noted", "deferred" and "withdrawn" are not.
export function outcomeLabel(outcome: string): NowLabel | null {
  return ["agreed", "carried", "lost"].includes(outcome) ? "decision" : null;
}

// Outside an election (Romily, round eleven q5): the parties that stood where you live at the last general election,
// alphabetical. A Democracy Club ballot id for 4 July 2024 is "parl.<constituency slug>.2024-07-04"; the slug is the
// constituency's name, lower-cased, accents and apostrophes dropped, everything else turned into single hyphens.
export const GE2024 = "2024-07-04";
export function constituencySlug(name: string): string {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['\u2019]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
export const ge2024Ballot = (slug: string) => `parl.${slug}.${GE2024}`;
