import ThemeGrid from "@/components/ThemeGrid";

export const metadata = { title: "Parts of your life", description: "Choose a part of your life to see what's happening, what it could mean for you, and what each party or candidate would do.", alternates: { canonical: "/themes" }, robots: { index: false } };

// Romily, round eleven q2: life areas replace topics as the main way in. Level one: the ten themes as icons.
export default function Themes() {
  return (
    <>
      <p className="eyebrow">Explore</p>
      <h1>What part of your life?</h1>
      <p className="lede">Pick one to see what&rsquo;s happening, what it could mean for you, and what each party or candidate would do.</p>
      <ThemeGrid notes />
      <p className="meta">Your Home is the first area built the new way. The others still lead to the pages that cover them now, while we redesign them.</p>
    </>
  );
}
