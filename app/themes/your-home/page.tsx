import Link from "next/link";
import HomeSubCards from "@/components/HomeSubCards";
import ThemeIcon from "@/components/ThemeIcon";

export const metadata = { title: "Your Home", description: "Housing, renting, and owning a home: what's happening, what it could mean for you, and what each party or candidate would do.", alternates: { canonical: "/themes/your-home" }, robots: { index: false } };

// Level two of Romily's three (round eleven q2: "once you click on it it takes you to choose the sub topics").
export default function YourHome() {
  return (
    <>
      <p className="eyebrow"><Link href="/themes">Parts of your life</Link></p>
      <h1 className="theme-h1"><ThemeIcon slug="your-home" size={40} /> Your Home</h1>
      <p className="lede">Choose one.</p>
      <HomeSubCards />
      <p className="meta"><Link href="/explore/housing">Housing: who decides what, from your front door to Parliament</Link></p>
    </>
  );
}
