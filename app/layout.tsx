import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SITE } from "@/lib/site";
import Settings from "@/components/Settings";
import MobileNav from "@/components/MobileNav";
import PrintOpen from "@/components/PrintOpen";
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
  twitter: { card: "summary_large_image", title: `${SITE.name} — see who is asking for your vote`, description: "Every candidate, in ballot-paper order, with what they have actually published and what it could mean for you. Every claim sourced. No recommendations." },
  openGraph: { title: `${SITE.name} — see who is asking for your vote`, siteName: SITE.name, description: "Every candidate, in ballot-paper order, with what they have actually published and what it could mean for you. Every claim sourced. No recommendations.", type: "website", url: SITE.url },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": [
          { "@type": "Organization", "@id": `${SITE.url}/#org`, name: "What's It To Me?", url: SITE.url, email: "hello@whatsittome.org", founder: [{ "@type": "Person", name: "Romily Johnson" }, { "@type": "Person", name: "Barny Trevelyan-Johnson" }], description: "An independent, non-partisan UK voter-information project. It never recommends, ranks or scores any candidate or party." },
          { "@type": "WebSite", "@id": `${SITE.url}/#site`, name: "What's It To Me?", url: SITE.url, inLanguage: "en-GB", publisher: { "@id": `${SITE.url}/#org` } },
        ] }) }} />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);var s=localStorage.getItem('textsize');if(s)document.documentElement.style.fontSize=s+'%';if(localStorage.getItem('contrast')==='high')document.documentElement.classList.add('high-contrast');if(localStorage.getItem('lite')==='1')document.documentElement.classList.add('lite')}catch(e){}" }} />
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
            <a href="https://policyengine.org/uk">PolicyEngine UK</a> model. Code is open source under AGPL-3.0 at{" "}
            <a href={SITE.repo}>{SITE.repo.replace("https://", "")}</a>. {SITE.name}, {SITE.url.replace("https://", "")}.
          </p>
          <Suspense fallback={null}><FreshnessLine /></Suspense>
          <p className="foot-brand"><img className="brand-light" src="/brand/mark-light.webp" alt="" width={30} height={27} loading="lazy" /><img className="brand-dark" src="/brand/mark-dark.webp" loading="lazy" alt="" width={30} height={27} /><span><strong>What&rsquo;s It To Me?</strong> Politics, in your context.</span></p>
          <p><Link href="/who-we-are" prefetch={false}>Who we are</Link> · contact, corrections and complaints: <a href="mailto:hello@whatsittome.org">hello@whatsittome.org</a> · <Link href="/about#contact">How we handle complaints</Link> · <Link href="/about/data-use" prefetch={false}>Privacy</Link> · <Link href="/accessibility" prefetch={false}>Accessibility</Link>.</p>
        </footer>
        <PrintOpen />
      </body>
    </html>
  );
}
