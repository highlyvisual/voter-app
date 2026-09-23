import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SITE } from "@/lib/site";
import Settings from "@/components/Settings";
import HowDoYouKnow from "@/components/HowDoYouKnow";

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" as const };

export const metadata: Metadata = {
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  metadataBase: new URL(SITE.url),
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
  description: "See who is on your ballot and what each candidate winning would change for a household like yours. Impartial, sourced, never a recommendation.",
  robots: { index: false, follow: false },
  twitter: { card: "summary_large_image", title: `${SITE.name} — see who is asking for your vote`, description: "Every candidate, in ballot-paper order, with what they have actually published and what it could mean for you. Every claim sourced. No recommendations." },
  openGraph: { title: `${SITE.name} — see who is asking for your vote`, siteName: SITE.name, description: "Every candidate, in ballot-paper order, with what they have actually published and what it could mean for you. Every claim sourced. No recommendations.", type: "website", url: SITE.url },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);var s=localStorage.getItem('textsize');if(s)document.documentElement.style.fontSize=s+'%';if(localStorage.getItem('contrast')==='high')document.documentElement.classList.add('high-contrast');if(localStorage.getItem('lite')==='1')document.documentElement.classList.add('lite')}catch(e){}" }} />
        <script id="img-error-guard" dangerouslySetInnerHTML={{ __html: "addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='IMG'){t.classList.add('gone');var p=t.parentElement;if(p&&!p.querySelector('.avatar-fallback')){var s=document.createElement('span');s.className='avatar-fallback';s.style.width=(t.width||24)+'px';s.style.height=(t.height||24)+'px';s.setAttribute('aria-hidden','true');p.insertBefore(s,t);}}},true)" }} />
        <script id="img-fallback" dangerouslySetInnerHTML={{ __html: "addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='IMG'){t.classList.add('gone');var p=t.parentElement;if(p)p.classList.add('gone-parent');}},true)" }} />
        <div className="progress-rail" aria-hidden><span /></div>
        <a className="skip" href="#main">Skip to content</a>
        <header className="site-header">
          <div className="inner">
            <Link href="/" className="wordmark" aria-label={`${SITE.name}, home`}>
              <img className="brand brand-light" src="/brand/mark-light.png" alt="" width={34} height={40} />
              <img className="brand brand-dark" src="/brand/mark-dark.png" alt="" width={34} height={40} />
              <img className="brand-word brand-light" src="/brand/word-light.png" alt="What’s It To Me?" width={150} height={25} />
              <img className="brand-word brand-dark" src="/brand/word-dark.png" alt="What’s It To Me?" width={150} height={25} />
            </Link>
            <nav aria-label="Site">
              <Link href="/how-to-vote">How to vote</Link>
              <Link href="/learn">Learn</Link>
              <Link href="/about">How this works</Link>
              <Link href="/positions">Positions</Link>
              <Link href="/parties">Parties</Link>
              <Link href="/profile">My profile</Link>
              <Settings />
            </nav>
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
          <p><Link href="/who-we-are">Who we are</Link> · contact, corrections and complaints: <a href="mailto:hello@whatsittome.org">hello@whatsittome.org</a> · <Link href="/about#contact">How we handle complaints</Link>.</p>
        </footer>
      </body>
    </html>
  );
}
