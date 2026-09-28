import Onboarding from "@/components/Onboarding";
import { checkPostcode, findElection } from "../find/actions";
import { FIELD_KEYS, OPTIONAL_KEYS } from "@/lib/household";

export const metadata = { title: "Build your profile", description: "A few quick questions, starting with your postcode, so you see which candidates' published policies apply to a household like yours. Nothing is stored.", alternates: { canonical: "/start" } };
export const dynamic = "force-dynamic";

export default async function Start({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // After a failed lookup, findElection sends people back here with the message and their answers (never the postcode).
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const error = one(sp.error).slice(0, 200) || null;
  const initial: Record<string, string> = {};
  for (const k of [...FIELD_KEYS, ...OPTIONAL_KEYS] as string[]) { const v = one(sp[k]); if (/^[a-z0-9_]{1,24}$/.test(v)) initial[k] = v; }
  return (
    <>
      <div className="start-intro">
      <p className="eyebrow">Let's make politics relevant to you</p>
      <h1 style={{ maxWidth: "16ch" }}>A few questions. No quiz, no score.</h1>
      <p className="lede">Each answer decides which published policies apply to a household like yours, so that what you read is about your life, not everyone's. Every question after the postcode can be skipped. We never ask who you support or how you voted, and we never will. We don't store your answers. They go into the page address so the page can show results for a household like yours, and if you choose, they're kept in this browser so you don't have to answer again.</p>
      </div>
      <Onboarding action={findElection} check={checkPostcode} error={error} initial={initial} />
    </>
  );
}
