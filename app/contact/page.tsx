import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbs, graph, webPage } from "@/lib/schema";

export const metadata = {
  title: "Contact and corrections",
  description: "How to reach What's It To Me: corrections, complaints, accessibility problems, candidates, press and partners. Every complaint is logged publicly.",
  alternates: { canonical: "/contact" },
};

const mail = (subject: string) => `mailto:hello@whatsittome.org?subject=${encodeURIComponent(subject)}`;

export default function Contact() {
  return (
    <>
      <JsonLd data={graph(
        webPage("/contact", "Contact and corrections", metadata.description, { "@type": "ContactPage", about: { "@id": "https://whatsittome.org/#org" } }),
        breadcrumbs([["Contact and corrections", "/contact"]]),
      )} />
      <p className="eyebrow">Contact</p>
      <h1>Contact and corrections</h1>
      <p className="lede">One address for everything: <a href="mailto:hello@whatsittome.org">hello@whatsittome.org</a>. We are a small, self-funded team, so a reply can take a few days, and longer in the week before polling day.</p>

      <ul className="contact-cards">
        <li>
          <h2>Something is wrong</h2>
          <p>A claim that is wrong, unfair or attributed to the wrong person. Tell us the page, the claim and what you think is wrong, with a source if you have one. Every complaint is logged publicly with its outcome, whether or not we change anything.</p>
          <a className="button" href={mail("Correction or complaint")}>Email a correction</a>
        </li>
        <li>
          <h2>You are a candidate</h2>
          <p>We don&rsquo;t take statements from candidates directly; everything on your page is quoted from what you, your party or an official record has already published. If something is missing, send us where you published it. Your name, party and photo come from <a href="https://candidates.democracyclub.org.uk/" rel="noopener">Democracy Club</a>, where you can correct them yourself.</p>
          <a className="button secondary" href={mail("Candidate: missing or wrong information")}>Email as a candidate</a>
        </li>
        <li>
          <h2>Something doesn&rsquo;t work for you</h2>
          <p>A page you can&rsquo;t use with your screen reader, keyboard, zoom or device. Tell us what you were trying to do; we treat these as bugs.</p>
          <a className="button secondary" href={mail("Accessibility problem")}>Report an access problem</a>
        </li>
        <li>
          <h2>Press, schools and partners</h2>
          <p>Questions about the project, using the site in a classroom, or reusing our data. The data itself is reusable under an open licence from the <Link href="/data">open data page</Link>.</p>
          <a className="button secondary" href={mail("Press or partnership")}>Get in touch</a>
        </li>
      </ul>

      <h2>What we can&rsquo;t help with</h2>
      <p>We can&rsquo;t tell you who to vote for, and we can&rsquo;t register you or change your registration. For registration, your poll card or a postal vote, contact your council&rsquo;s electoral services team; <Link href="/how-to-vote">how voting works</Link> links to the official services.</p>

      <p className="meta">Who runs this site and how it is funded: <Link href="/who-we-are">who we are</Link> · The rules we follow: <Link href="/about">how this works</Link> · How we check our data: <Link href="/about/accuracy">accuracy checks</Link></p>
    </>
  );
}
