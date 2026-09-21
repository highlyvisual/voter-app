import Link from "next/link";
import { adminClient } from "@/lib/admin";
import { currentReviewer, reviewers } from "@/lib/session";
import { amend, issueInvitation, logComplaint, publishSubmission, signIn, signOut, withdraw } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

const MSG: Record<string, string> = {
  notdraft: "That claim is no longer live, so this action does not apply.",
  needreason: "A reason is required; it is published in the ledger.",
  badjson: "applies_if must be valid JSON.",
};

type Row = {
  id: number; ballot_paper_id: string; candidate_id: number | null; party_ec_id: string | null; topic: string; tier: string; claim_text: string; source_quote: string;
  applies_if: unknown; status: string; drafted_by: string; created_at: string; supersedes: number | null;
  sources: { title: string; url: string; publisher: string; published_on: string | null } | null;
  candidates: { name: string; party_name_on_ballot: string } | null;
};

export default async function Review({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const who = await currentReviewer();
  const configured = reviewers().length >= 1;

  if (!who) {
    return (
      <>
        <h1>Maintainer sign-in</h1>
        {!configured ? <div className="notice small"><p style={{ margin: 0 }}>No maintainer passcodes are configured (environment variable REVIEWERS, format Name:passcode).</p></div> : null}
        <form action={signIn} className="household" style={{ maxWidth: "24rem" }}>
          <label htmlFor="passcode"><span>Passcode</span></label>
          <input id="passcode" name="passcode" type="password" autoComplete="current-password" required style={{ marginTop: "0.4rem" }} />
          {sp.error ? <p className="small" role="alert">That passcode isn't recognised.</p> : null}
          <button type="submit" style={{ marginTop: "0.8rem" }}>Sign in</button>
        </form>
        <p className="small muted">Claims publish on the strength of their source. This console is for corrections, withdrawals and logging complaints; every action is written to the <Link href="/ledger">public ledger</Link> with the maintainer's name.</p>
      </>
    );
  }

  const db = adminClient();
  const sel = "*, sources(title, url, publisher, published_on), candidates(name, party_name_on_ballot)";
  const { data: live } = await db.from("current_claims").select(sel).eq("status", "verified").order("ballot_paper_id").order("candidate_id").order("topic");
  const [{ data: pending }, { data: cands }] = await Promise.all([
    db.from("candidate_submissions").select("*, candidate_invitations(candidate_id, ballot_paper_id, candidates(name, party_name_on_ballot))").eq("status", "pending").order("submitted_at"),
    db.from("candidates").select("id, name, party_name_on_ballot, ballot_paper_id, ballots(poll_date, archived)").order("ballot_paper_id").order("surname_sort"),
  ]);
  const liveCands = (cands ?? []).filter((c) => { const b = (c as unknown as { ballots: { poll_date: string; archived: boolean } | null }).ballots; return b && !b.archived && b.poll_date >= new Date().toISOString().slice(0, 10); });
  const newToken = typeof sp.token === "string" ? sp.token : null;
  const msg = typeof sp.msg === "string" ? MSG[sp.msg] : null;
  const rows = (live ?? []) as Row[];
  const ballots = [...new Set(rows.map((r) => r.ballot_paper_id))];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem", flexWrap: "wrap" }}>
        <h1>Maintenance</h1>
        <form action={signOut}><span className="small muted">Signed in as {who}. </span><button type="submit" className="secondary small" style={{ padding: "0.3rem 0.7rem" }}>Sign out</button></form>
      </div>
      {msg ? <div className="notice small" role="alert"><p style={{ margin: 0 }}>{msg}</p></div> : null}
      <p className="lede">Every live claim, by ballot. Read the summary against its quotation. If a summary overreaches, correct it (published at once, with your reason). If the quotation is not a position on the topic, or the source is disputed, withdraw it. Reasons are public.</p>

      {ballots.map((b) => (
        <section key={b}>
          <h2>{b} ({rows.filter((r) => r.ballot_paper_id === b).length})</h2>
          {rows.filter((r) => r.ballot_paper_id === b).map((r) => (
            <article key={r.id} className="claim" style={{ marginBottom: "1rem" }}>
              <p style={{ margin: 0 }}>
                <strong>{r.candidates?.name ?? "Party position"}</strong> <span className="muted">· {r.candidates?.party_name_on_ballot ?? r.party_ec_id} · {r.topic.replace(/_/g, " ")} · {r.sources?.publisher}{r.sources?.published_on ? `, ${r.sources.published_on}` : ""}</span>
              </p>
              <blockquote style={{ margin: "0.4rem 0", paddingLeft: "0.75rem", borderLeft: "2px solid var(--rule)" }}>{r.source_quote}</blockquote>
              <p style={{ margin: "0 0 0.3rem" }}>In short: {r.claim_text}</p>
              <p className="small muted" style={{ margin: 0 }}>
                <a href={r.sources?.url} rel="noopener">{r.sources?.title}</a>. applies_if: <code>{JSON.stringify(r.applies_if)}</code>. Drafted by {r.drafted_by.split(" (")[0]}. Claim #{r.id}{r.supersedes ? ` (supersedes #${r.supersedes})` : ""}.
              </p>
              <details style={{ marginTop: "0.5rem" }}>
                <summary>Correct or withdraw</summary>
                <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <form action={amend} className="small">
                    <input type="hidden" name="claim_id" value={r.id} />
                    <label>Summary<textarea name="claim_text" defaultValue={r.claim_text} required style={{ width: "100%", minHeight: "3.5rem" }} /></label>
                    <label>Exact quotation<textarea name="source_quote" defaultValue={r.source_quote} required style={{ width: "100%", minHeight: "3.5rem" }} /></label>
                    <label>applies_if (JSON)<input name="applies_if" defaultValue={JSON.stringify(r.applies_if)} style={{ width: "100%", padding: "0.4rem" }} /></label>
                    <input name="note" type="text" placeholder="Reason for the correction (required, published)" required style={{ width: "100%", padding: "0.4rem", marginTop: "0.3rem" }} />
                    <button type="submit" style={{ marginTop: "0.4rem" }}>Publish correction</button>
                  </form>
                  <form action={withdraw} className="small">
                    <input type="hidden" name="claim_id" value={r.id} />
                    <input name="note" type="text" placeholder="Reason for withdrawal (required, published)" required style={{ width: "100%", padding: "0.4rem" }} />
                    <button type="submit" className="secondary" style={{ marginTop: "0.4rem", marginLeft: 0 }}>Withdraw</button>
                  </form>
                </div>
              </details>
            </article>
          ))}
        </section>
      ))}

      <h2 id="submissions">Candidate submissions awaiting an existence check ({pending?.length ?? 0})</h2>
      <p className="meta">Open the source URL. If the statement appears there, publish; it goes live as written with the label "Candidate statement". If it does not, or falls under the moderation code, hold it with a reason.</p>
      {(pending ?? []).map((sub) => {
        const inv = (sub as unknown as { candidate_invitations: { candidates: { name: string; party_name_on_ballot: string } | null } }).candidate_invitations;
        return (
          <article key={sub.id} className="claim" style={{ marginBottom: "1rem" }}>
            <p style={{ margin: 0 }}><strong>{inv?.candidates?.name}</strong> <span className="muted">· {inv?.candidates?.party_name_on_ballot} · {String(sub.topic).replace(/_/g, " ")}</span></p>
            <blockquote style={{ margin: "0.4rem 0" }}>{sub.statement}</blockquote>
            <p className="small"><a href={sub.source_url} rel="noopener">{sub.source_url}</a></p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <form action={publishSubmission}><input type="hidden" name="submission_id" value={sub.id} /><input type="hidden" name="decision" value="publish" /><button type="submit">It appears at the URL: publish as written</button></form>
              <form action={publishSubmission} className="small"><input type="hidden" name="submission_id" value={sub.id} /><input type="hidden" name="decision" value="hold" /><input name="note" type="text" placeholder="Reason to hold (told to the candidate)" required style={{ padding: "0.4rem" }} /> <button type="submit" className="secondary">Hold</button></form>
            </div>
          </article>
        );
      })}
      {!pending?.length ? <p className="muted">None waiting.</p> : null}

      <h2 id="invitations">Invite a candidate to submit</h2>
      {newToken ? <div className="notice small"><p style={{ margin: 0 }}>Invitation link for {typeof sp.for === "string" ? sp.for : "the candidate"} (shown once; send it by the channel you chose): <code>https://hustings.org/candidates/submit?token={newToken}</code></p></div> : null}
      <form action={issueInvitation} className="household small" style={{ maxWidth: "36rem" }}>
        <label>Candidate
          <select name="candidate_id" style={{ width: "100%" }}>
            {liveCands.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.party_name_on_ballot} — {c.ballot_paper_id}</option>)}
          </select>
        </label>
        <label style={{ display: "block", marginTop: "0.5rem" }}>Channel
          <select name="channel" style={{ width: "14rem" }}><option value="email">Email</option><option value="social">Social media message</option><option value="post">Post</option><option value="agent">Via election agent</option></select>
        </label>
        <button type="submit" style={{ marginTop: "0.6rem" }}>Issue invitation link</button>
        <p className="meta">Every nominated candidate should be invited; the log proves it. Only the hash of the link is stored.</p>
      </form>

      <h2>Log a complaint or its resolution</h2>
      <form action={logComplaint} className="household small" style={{ maxWidth: "36rem" }}>
        <label>Claim number (optional)<input name="claim_id" type="text" inputMode="numeric" style={{ width: "8rem", padding: "0.4rem" }} /></label>
        <label style={{ display: "block", marginTop: "0.5rem" }}>Type
          <select name="event" style={{ width: "14rem" }}>
            <option value="complaint_received">Complaint received</option>
            <option value="complaint_resolved">Complaint resolved</option>
          </select>
        </label>
        <label style={{ display: "block", marginTop: "0.5rem" }}>Detail (published verbatim)<textarea name="detail" required style={{ width: "100%", minHeight: "4rem" }} /></label>
        <button type="submit" style={{ marginTop: "0.6rem" }}>Add to public log</button>
      </form>
    </>
  );
}
