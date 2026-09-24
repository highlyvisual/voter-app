import Link from "next/link";
export const metadata = { title: "Two ways through: journey prototypes", robots: { index: false } };
// For Romily (round 5, q6): the same election and the same facts, in two shapes. Not linked from anywhere public.
export default function JourneyIndex() {
  return (
    <>
      <p className="eyebrow">For Romily · not linked from the site</p>
      <h1>Two ways through the same election.</h1>
      <p className="lede">Both use the Queen's Park by-election in Brighton and Hove, the same candidates, the same published positions and the same map. Only the shape differs. Try each on your phone as well as a laptop; answer the three "about you" questions in each so you see the topics reorder.</p>
      <div className="stakes">
        <Link href="/journey/steps" className="stake"><span className="stake-title">Prototype A</span><span className="stake-n" style={{ fontSize: "2rem" }}>Step by step</span><span className="stake-lead">One screen per stage, Back and Next, a trail along the top showing where you are. Like an app. Every screen has its own link.</span><span className="stake-go">Try A →</span></Link>
        <Link href="/journey/flow" className="stake"><span className="stake-title">Prototype B</span><span className="stake-n" style={{ fontSize: "2rem" }}>One page that opens up</span><span className="stake-lead">Each section appears once the one before is done, and details expand in place. "Show everything now" for anyone who wants the lot.</span><span className="stake-go">Try B →</span></Link>
      </div>
      <h2>What to look for</h2>
      <ul>
        <li>Which one makes you want to keep going?</li>
        <li>In which one would someone who never reads about politics get as far as the candidates?</li>
        <li>Which suits a phone; which suits a laptop? (You suggested steps for the app and the opening page for the web. Both are here so you can check.)</li>
        <li>What's missing from both, before either becomes the real journey?</li>
      </ul>
      <p className="meta">Neither replaces anything on the site yet. Answer on the <a href="https://romily-app-questions.netlify.app/round-5/">round-five page</a> ("Anything else" is fine) or tell Dad.</p>
    </>
  );
}
