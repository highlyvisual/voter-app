import { SITE } from "@/lib/site";
import type { Ballot, Candidate } from "@/lib/data";

// Structured data (schema.org JSON-LD) that tells search engines and AI assistants what each page is. The same rules
// apply here as on the page: every candidate gets exactly the same template, candidates are listed only in ballot-paper
// order (alphabetical by surname, as printed), and nothing ranks, scores or recommends anyone. Only facts already shown
// on the page go in.
const U = SITE.url;
export const ORG_ID = `${U}/#org`;
export const SITE_ID = `${U}/#site`;
export const PEOPLE = {
  romily: { "@type": "Person", "@id": `${U}/who-we-are#romily`, name: "Romily Johnson", jobTitle: "Founder and Product Lead", url: `${U}/who-we-are#romily`, worksFor: { "@id": ORG_ID } },
  barny: { "@type": "Person", "@id": `${U}/who-we-are#barny`, name: "Barny Trevelyan-Johnson", jobTitle: "Technical Lead", url: `${U}/who-we-are#barny`, worksFor: { "@id": ORG_ID } },
};

export function siteGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization", "@id": ORG_ID, name: "What's It To Me?", alternateName: "What’s It To Me", url: U,
        logo: { "@type": "ImageObject", url: `${U}/icons/icon-512.png`, width: 512, height: 512 },
        email: SITE.email,
        description: "An independent, non-partisan UK voter-information project. For any UK election it covers, it lists every candidate in ballot-paper order with what each has published, quoted exactly and sourced, and what it could mean for a household like yours. It never recommends, ranks or scores any candidate or party.",
        founder: [{ "@id": PEOPLE.romily["@id"] }, { "@id": PEOPLE.barny["@id"] }],
        areaServed: { "@type": "Country", name: "United Kingdom" },
        knowsAbout: ["UK elections", "Candidates standing in UK elections", "UK local council elections", "UK Parliament elections", "How to vote in the UK", "Voter ID", "Postal and proxy voting", "Party manifestos"],
        contactPoint: { "@type": "ContactPoint", contactType: "corrections and complaints", email: SITE.email, url: `${U}/contact`, availableLanguage: "en-GB" },
        publishingPrinciples: `${U}/about`,
        correctionsPolicy: `${U}/about/accuracy`,
        verificationFactCheckingPolicy: `${U}/about/accuracy`,
        actionableFeedbackPolicy: `${U}/contact`,
        ownershipFundingInfo: `${U}/who-we-are#interests`,
      },
      PEOPLE.romily,
      PEOPLE.barny,
      { "@type": "WebSite", "@id": SITE_ID, name: "What's It To Me?", url: U, inLanguage: "en-GB", publisher: { "@id": ORG_ID }, description: SITE.tagline },
    ],
  };
}

export type Crumb = [string, string]; // [name, path]
export function breadcrumbs(items: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [["Home", "/"] as Crumb, ...items].map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${U}${path}` })),
  };
}

export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

export function webPage(path: string, name: string, description: string | undefined, extra: Record<string, unknown> = {}) {
  return { "@type": "WebPage", "@id": `${U}${path}#page`, url: `${U}${path}`, name, ...(description ? { description } : {}), inLanguage: "en-GB", isPartOf: { "@id": SITE_ID }, publisher: { "@id": ORG_ID }, ...extra };
}

export function faqPage(path: string, name: string, qa: [string, string][]) {
  return {
    "@type": "FAQPage", "@id": `${U}${path}#faq`, url: `${U}${path}`, name, inLanguage: "en-GB", isPartOf: { "@id": SITE_ID }, publisher: { "@id": ORG_ID },
    mainEntity: qa.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

const kindOf = (b: Pick<Ballot, "level" | "ballot_paper_id">) => b.level === "parliamentary"
  ? (b.ballot_paper_id.includes(".by.") ? "UK Parliament by-election" : "UK Parliament general election")
  : (b.ballot_paper_id.includes(".by.") ? "council by-election" : "council election");
export const electionName = (b: Pick<Ballot, "level" | "ballot_paper_id" | "area_name">) => `${b.area_name} ${kindOf(b)}`;
export const officeOf = (b: Pick<Ballot, "level">) => b.level === "parliamentary" ? "Member of Parliament" : "councillor";
const longDate = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const partyOf = (c: Candidate) => c.party_name_on_ballot && c.party_name_on_ballot !== "[blank]" ? c.party_name_on_ballot : null;
const isIndependent = (p: string | null) => !p || /^independent$/i.test(p.trim());

// One candidate, the same template for everyone. Photos are left out (their licences vary).
export function candidatePerson(b: Ballot, c: Candidate, position: number, total: number) {
  const url = `${U}/ballot/${encodeURIComponent(b.ballot_paper_id)}/candidate/${c.id}`;
  const party = partyOf(c);
  const sameAs = [c.dc_person_url ? c.dc_person_url.replace("/api/next/people/", "/person/") : null, c.homepage_url, c.wikipedia_url].filter((x): x is string => !!x && /^https?:\/\//.test(x));
  return {
    "@type": "Person", "@id": `${url}#person`, name: c.name, url,
    description: `Candidate for ${officeOf(b)} in the ${electionName(b)}, polling day ${longDate(b.poll_date)}${party ? `, standing as ${party}` : ""}. Number ${position} of ${total} on the ballot paper, which lists candidates alphabetically by surname.`,
    ...(party && !isIndependent(party) ? { affiliation: { "@type": "Organization", name: party } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

// An election as a dated event in a place, with its candidates as a list in ballot-paper order (not a ranking).
export function electionEvent(b: Ballot, candidates: Candidate[]) {
  const url = `${U}/ballot/${encodeURIComponent(b.ballot_paper_id)}`;
  const isPast = b.archived || b.poll_date < new Date().toISOString().slice(0, 10);
  return {
    "@type": "Event", "@id": `${url}#election`, name: `${electionName(b)}, ${longDate(b.poll_date)}`, url,
    description: b.uncontested ? `Uncontested: elected without a poll, because the number of valid nominations did not exceed the number of seats.` : `Polling stations are open from 7am to 10pm on ${longDate(b.poll_date)}. ${candidates.length} ${candidates.length === 1 ? "candidate is" : "candidates are"} standing${b.winner_count && b.winner_count > 1 ? ` for ${b.winner_count} seats` : ""}.`,
    startDate: `${b.poll_date}T07:00:00+${isBst(b.poll_date) ? "01:00" : "00:00"}`,
    endDate: `${b.poll_date}T22:00:00+${isBst(b.poll_date) ? "01:00" : "00:00"}`,
    ...(b.cancelled ? { eventStatus: "https://schema.org/EventCancelled" } : b.postponed ? { eventStatus: "https://schema.org/EventPostponed" } : isPast ? {} : { eventStatus: "https://schema.org/EventScheduled" }),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: b.area_name, address: { "@type": "PostalAddress", addressRegion: b.area_name.split(":")[0].trim(), addressCountry: "GB" } },
    isAccessibleForFree: true,
    subjectOf: { "@id": `${url}#page` },
  };
}

export function candidateList(b: Ballot, candidates: Candidate[]) {
  const url = `${U}/ballot/${encodeURIComponent(b.ballot_paper_id)}`;
  return {
    "@type": "ItemList", "@id": `${url}#candidates`, name: `Candidates in the ${electionName(b)}, in ballot-paper order`,
    description: "In the order printed on the ballot paper (alphabetical by surname). The order is not a ranking.",
    itemListOrder: "https://schema.org/ItemListOrderAscending", numberOfItems: candidates.length,
    itemListElement: candidates.map((c, i) => ({ "@type": "ListItem", position: i + 1, item: { "@id": `${url}/candidate/${c.id}#person`, "@type": "Person", name: c.name, url: `${url}/candidate/${c.id}`, ...(partyOf(c) && !isIndependent(partyOf(c)) ? { affiliation: { "@type": "Organization", name: partyOf(c) } } : {}) } })),
  };
}

// British Summer Time runs from the last Sunday in March to the last Sunday in October (01:00 UTC both times).
function isBst(d: string): boolean {
  const y = Number(d.slice(0, 4));
  const lastSunday = (m: number) => { const x = new Date(Date.UTC(y, m + 1, 0)); x.setUTCDate(x.getUTCDate() - x.getUTCDay()); return x.toISOString().slice(0, 10); };
  return d >= lastSunday(2) && d < lastSunday(9);
}

export const jsonLd = (x: object) => JSON.stringify(x).replace(/</g, "\\u003c");
