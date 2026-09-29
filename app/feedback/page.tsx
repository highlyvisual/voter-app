import FeedbackForm from "@/components/FeedbackForm";

// Before Romily sends the site out for people to critique (29 Sept 2026). Share whatsittome.org/feedback, or it opens
// from "Tell us what you think" at the foot of every page.
export const metadata = {
  title: "Tell us what you think",
  description: "A two-minute questionnaire about What's It To Me: what worked, what didn't, and whether anything felt unfair.",
  alternates: { canonical: "/feedback" },
  robots: { index: false, follow: false },
};

export default function FeedbackPage() {
  return (
    <div className="fb-page">
      <p className="eyebrow">Help us get it right</p>
      <h1>Tell us what you think</h1>
      <p className="lede">About two minutes. Answer as many or as few as you like: every question is optional, and honest beats kind.</p>
      <p className="fb-privacy meta">Anonymous: please don&rsquo;t include your name, postcode or anything else that identifies you or anyone else. Your answers go to Romily and Barny, who run the site, and are kept by Netlify, our web host, until we&rsquo;ve read them. <a href="/about/data-use#feedback">More on this</a>.</p>
      <FeedbackForm />
    </div>
  );
}
