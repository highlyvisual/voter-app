import Onboarding from "@/components/Onboarding";
import { findElection } from "../find/actions";

export const metadata = { title: "Build your profile" };
export const dynamic = "force-dynamic";

export default function Start() {
  return (
    <>
      <div className="start-intro">
      <p className="eyebrow">Let's make politics relevant to you</p>
      <h1 style={{ maxWidth: "16ch" }}>A few questions. No quiz, no score.</h1>
      <p className="lede">Each answer decides which published policies apply to a household like yours, so that what you read is about your life, not everyone's. Every question after the postcode can be skipped. We never ask who you support or how you voted, and we never will. We don't store your answers. They go into the page address so the page can show results for a household like yours, and if you choose, they're kept in this browser so you don't have to answer again.</p>
      </div>
      <Onboarding action={findElection} />
    </>
  );
}
