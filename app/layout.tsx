import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "./enhance.css";
import JsonLd from "@/components/JsonLd";
import { siteGraph } from "@/lib/schema";
import { SITE } from "@/lib/site";
import Settings from "@/components/Settings";
import MobileNav from "@/components/MobileNav";
import PrintOpen from "@/components/PrintOpen";
import SwRegister from "@/components/SwRegister";
import HowDoYouKnow from "@/components/HowDoYouKnow";
import FreshnessLine from "@/components/FreshnessLine";
import { Suspense } from "react";

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" as const, colorScheme: "light dark" as const, themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#16161a" }] };

// Search engines are kept out until the launch date. Set ALLOW_INDEXING=1 in Netlify and redeploy to let them in (robots.ts reads the same switch).
const INDEXING = process.env.ALLOW_INDEXING === "1";

export const metadata: Metadata = {
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  metadataBase: new URL(SITE.url),
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
  description: "See who is on your ballot and what each candidate winning would change for a household like yours. Impartial, sourced, never a recommendation.",
  robots: INDEXING ? { index: true, follow: true } : { index: false, follow: false },
  // Search Console ownership (URL-prefix property https://whatsittome.org/, added 29 Sept 2026). Public by design; not a secret.
  verification: { google: "d3qV3vMOeAu9dPMM7heqXFRLOm6po6Rh5CnYxoUF7yA" },
  twitter: { card: "summary_large_image", title: `${SITE.name} — see who is asking for your vote`, description: "Every candidate, in ballot-paper order, with what they have actually published and what it could mean for you. Every claim sourced. No recommendations." },
  openGraph: { title: `${SITE.name} — see who is asking for your vote`, siteName: SITE.name, description: "Every candidate, in ballot-paper order, with what they have actually published and what it could mean for you. Every claim sourced. No recommendations.", type: "website", url: SITE.url },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="stylesheet" href="/fonts/fonts-v2.css" />
        <JsonLd data={siteGraph()} />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);var s=localStorage.getItem('textsize');if(s)document.documentElement.style.fontSize=s+'%';if(localStorage.getItem('contrast')==='high')document.documentElement.classList.add('high-contrast');if(localStorage.getItem('lite')==='1')document.documentElement.classList.add('lite');var k=localStorage.getItem('look');if(k==='warm'||k==='brass'||k==='umber')document.documentElement.setAttribute('data-look',k)}catch(e){}" }} />
        <script id="img-error-guard" dangerouslySetInnerHTML={{ __html: "addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='IMG'){t.classList.add('gone');var p=t.parentElement;if(p&&!p.querySelector('.avatar-fallback')){var s=document.createElement('span');s.className='avatar-fallback';s.style.width=(t.width||24)+'px';s.style.height=(t.height||24)+'px';s.setAttribute('aria-hidden','true');p.insertBefore(s,t);}}},true)" }} />
        <script id="img-fallback" dangerouslySetInnerHTML={{ __html: "addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='IMG'){t.classList.add('gone');var p=t.parentElement;if(p){p.classList.add('gone-parent');if(!p.dataset.initials&&t.dataset.initials)p.dataset.initials=t.dataset.initials;}}},true)" }} />
        <div className="progress-rail" aria-hidden><span /></div>
        <a className="skip" href="#main">Skip to content</a>
        <header className="site-header">
          <div className="inner">
            <Link href="/" prefetch={false} className="wordmark" aria-label={`${SITE.name}, home`}>
              <img className="brand brand-light" src="/brand/mark-light.webp" alt="" width={44} height={39} />
              <img className="brand brand-dark" src="/brand/mark-dark.webp" alt="" width={44} height={39} loading="lazy" />
              <span className="brand-name">What&rsquo;s It To Me?</span>
            </Link>
            <MobileNav>
              <Settings />
            </MobileNav>
          </div>
        </header>
        <main id="main">{children}</main>
        <HowDoYouKnow />
        <footer className="imprint">
          <p>
            An independent, non-partisan voter-information project. It does not recommend, rank or score any candidate or party.
            Every claim shown is a quotation from a named, dated, linked source.
          </p>
          <p>
            Candidate and election data from <a href="https://democracyclub.org.uk/">Democracy Club</a> (CC BY 4.0). Tax and benefit calculations use the open-source{" "}
            <a href="https://policyengine.org/uk">PolicyEngine UK</a> model. Code is open source under AGPL-3.0:{" "}
            <a href={SITE.repo}>our source code on GitHub</a>. {SITE.name}, {SITE.url.replace("https://", "")}.
          </p>
          <Suspense fallback={null}><FreshnessLine /></Suspense>
          <p className="foot-brand"><img className="brand-light" src="/brand/mark-light.webp" alt="" width={30} height={27} loading="lazy" /><img className="brand-dark" src="/brand/mark-dark.webp" loading="lazy" alt="" width={30} height={27} /><span><strong>What&rsquo;s It To Me?</strong> Politics, in your context.</span></p>
          <nav className="foot-nav" aria-label="About this site">
            <ul>
              <li><Link href="/who-we-are" prefetch={false}>Who we are</Link></li>
              <li><Link href="/contact" prefetch={false}>Contact and corrections</Link></li>
              <li><Link href="/about" prefetch={false}>How this works</Link></li>
              <li><Link href="/about/accuracy" prefetch={false}>How we check</Link></li>
              <li><Link href="/ledger" prefetch={false}>Public ledger</Link></li>
              <li><Link href="/data" prefetch={false}>Open data</Link></li>
              <li><Link href="/about/data-use" prefetch={false}>Privacy</Link></li>
              <li><Link href="/accessibility" prefetch={false}>Accessibility</Link></li>
              <li><Link href="/status" prefetch={false}>Is this up to date?</Link></li>
            </ul>
          </nav>
          <p className="small">Contact, corrections and complaints: <a href="mailto:hello@whatsittome.org">hello@whatsittome.org</a>. <Link href="/about#contact">How we handle complaints</Link>.</p>
        </footer>
        <PrintOpen />
        <SwRegister />
      </body>
    </html>
  );
}
