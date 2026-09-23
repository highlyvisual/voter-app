import Link from "next/link";
import { submitStatement } from "./actions";
import { TOPICS } from "@/lib/data";
import { adminClient } from "@/lib/admin";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submit a candidate statement", robots: { index: false, follow: false } };

// WP-A5: candidates (or agents) submit a sourced statement per topic using a token issued by maintainers. No self-registration.
export default async function Submit({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const done = sp.done === "1";
  let inv: { id: number; candidate: { name: string; party_name_on_ballot: string }; ballot_paper_id: string } | null = null;
  if (token) {
    const hash = createHash("sha256").update(token).digest("hex");
    const { data } = await adminClient().from("candidate_invitations").select("id, ballot_paper_id, candidates(name, party_name_on_ballot)").eq("token_hash", hash).maybeSingle();
    if (data) inv = { id: data.id, ballot_paper_id: data.ballot_paper_id, candidate: (data as unknown as { candidates: { name: string; party_name_on_ballot: string } }).candidates };
  }
  return (
    <>
      <h1>Submit a candidate statement</h1>
      {!inv ? (
        <>
          <p className="lede">Candidates and their agents can send us a statement on each of the nine topics, with a source, and it is published as written once we have confirmed it appears at the source you give.</p>
          <p>Submission needs an invitation link, which we send to every nominated candidate for whom we can find a contact address. If you are a candidate and have not received one, email <a href="mailto:hello@whatsittome.org?subject=Candidate%20statement%20invitation">hello@whatsittome.org</a> with your name and ward or constituency, and we will send a link. There is no self-registration, so that statements can only come from candidates.</p>
          <p className="meta">What we check: that the statement exists at the URL you cite. What we do not check: whether it is true. Every published statement carries the label "Candidate statement". See <Link href="/about/moderation">what is refused or held</Link>.</p>
          {token ? <p className="small" role="alert">That link isn't recognised or has been used. Contact the maintainers for a fresh one.</p> : null}
        </>
      ) : done ? (
        <div className="notice"><p>Received. Your statements are marked "being checked". They are published, as written, once a maintainer confirms each appears at its source URL. Your candidate page shows the status.</p></div>
      ) : (
        <>
          <p className="lede">For <strong>{inv.candidate.name}</strong> ({inv.candidate.party_name_on_ballot}), {inv.ballot_paper_id}.</p>
          <form action={submitStatement} className="household">
            <input type="hidden" name="token" value={token} />
            {TOPICS.map(([k, l]) => (
              <fieldset key={k} style={{ marginTop: "0.9rem" }}>
                <legend>{l}</legend>
                <label><span>Your statement (up to 600 characters). Published as written.</span><textarea name={`statement_${k}`} maxLength={600} style={{ width: "100%", minHeight: "4rem" }} /></label>
                <label><span>Where this statement is published (a URL on your site, your party's site, or a leaflet archived at electionleaflets.org)</span><input type="text" name={`source_${k}`} placeholder="https://" style={{ width: "100%" }} /></label>
              </fieldset>
            ))}
            <div className="actions"><button type="submit">Send for checking</button><span className="meta">Leave any topic blank to skip it. We will not summarise or reword; hedged or conditional wording is published verbatim without a summary.</span></div>
          </form>
        </>
      )}
    </>
  );
}
