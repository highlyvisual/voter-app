import Link from "next/link";
import { notFound } from "next/navigation";
import ThemeIcon from "@/components/ThemeIcon";
import { HomeLocal } from "@/components/HomeApp";
import { TOPICS } from "@/lib/types";
import { THEMES, themeBySlug } from "@/lib/themes";

// The nine life areas not yet rebuilt (Romily, round eleven q2 and q6: Your Home first). No dead ends: each says plainly
// that it is being redesigned and leads to the pages that cover it today.
export function generateStaticParams() {
  return THEMES.filter((t) => !t.built).map((t) => ({ theme: t.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ theme: string }> }) {
  const t = themeBySlug((await params).theme);
  return { title: t?.name ?? "Theme", robots: { index: false } };
}

export default async function ThemePage({ params }: { params: Promise<{ theme: string }> }) {
  const t = themeBySlug((await params).theme);
  if (!t || t.built) notFound();
  const label = Object.fromEntries(TOPICS) as Record<string, string>;
  return (
    <>
      <p className="eyebrow"><Link href="/themes">Parts of your life</Link></p>
      <h1 className="theme-h1"><ThemeIcon slug={t.slug} size={40} /> {t.name}</h1>
      {t.parts ? (
        <ul className="theme-parts">{t.parts.map((p) => <li key={p.name}><b>{p.name}</b>: {p.subs}</li>)}</ul>
      ) : <p className="lede">{t.subs}</p>}
      <p className="notice small theme-redesign"><b>Being redesigned.</b> We&rsquo;re rebuilding this area the way <Link href="/themes/your-home">Your Home</Link> works: what&rsquo;s happening, what it could mean for you, and what each party or candidate would do. Until then, it&rsquo;s all still here:</p>
      {t.slug === "your-area" ? (
        <div className="theme-links">
          <HomeLocal />
          <p className="nv-second"><Link href="/next">Every election coming up</Link></p>
        </div>
      ) : (
        <ul className="theme-links">
          {t.topics.map((k) => (
            <li key={k}><Link href={`/positions?topic=${k}`} className="card-link">What every party and candidate has published on {label[k]?.toLowerCase()} &rarr;</Link></li>
          ))}
        </ul>
      )}
      <p className="meta"><Link href="/themes">All parts of your life</Link></p>
    </>
  );
}
