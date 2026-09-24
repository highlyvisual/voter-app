import Onboarding from "@/components/Onboarding";
import { findElection } from "../find/actions";

export const metadata = { title: "Build your profile" };
export const dynamic = "force-dynamic";

export default function Start() {
  return (
    <>
      <p className="eyebrow">Let's make politics relevant to you</p>
      <h1 style={{ maxWidth: "16ch" }}>A few questions. No quiz, no score.</h1>
      <p className="lede">Each answer decides which published policies apply to a household like yours, so that what you read is about your life, not everyone's. Skip anything. We never ask who you support or how you voted, and we never will. Nothing you enter is sent to us; if you choose, your answers are kept in this browser only, so you don't have to answer again.</p>
      <Onboarding action={findElection} />
    </>
  );
}
