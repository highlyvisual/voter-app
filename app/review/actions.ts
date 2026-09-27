"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/admin";
import { clearSession, currentReviewer, matchReviewer, setSession } from "@/lib/session";

async function requireReviewer() {
  const who = await currentReviewer();
  if (!who) redirect("/review");
  return who;
}

async function log(claimId: number | null, event: string, actor: string, detail: string | null) {
  const { error } = await adminClient().from("change_log").insert({ claim_id: claimId, event, actor, detail });
  if (error) throw error;
}

// Rate limit (review, 25 Sept): five wrong passcodes from one address in 15 minutes, or 30 from anywhere in an hour,
// and sign-in pauses. Only a salted hash of the address is kept, and only for failed attempts.
async function tooManyFailures(ipHash: string): Promise<boolean> {
  const db = adminClient();
  const since15 = new Date(Date.now() - 15 * 60_000).toISOString(), since60 = new Date(Date.now() - 60 * 60_000).toISOString();
  const [mine, all] = await Promise.all([
    db.from("review_signin_failures").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("at", since15),
    db.from("review_signin_failures").select("id", { count: "exact", head: true }).gte("at", since60),
  ]);
  return (mine.count ?? 0) >= 5 || (all.count ?? 0) >= 30;
}

export async function signIn(formData: FormData) {
  const h = await headers();
  const ip = h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = createHash("sha256").update(`${process.env.REVIEWERS ?? ""}|${ip}`).digest("hex").slice(0, 32);
  if (await tooManyFailures(ipHash)) redirect("/review?error=wait");
  const code = String(formData.get("passcode") ?? "");
  const name = matchReviewer(code);
  if (!name) {
    await adminClient().from("review_signin_failures").insert({ ip_hash: ipHash });
    await new Promise((r) => setTimeout(r, 1000));
    redirect("/review?error=1");
  }
  await setSession(name);
  redirect("/review");
}

export async function signOut() {
  await clearSession();
  redirect("/review");
}

type ClaimRow = {
  id: number; ballot_paper_id: string; candidate_id: number | null; party_ec_id: string | null; topic: string; tier: string;
  claim_text: string; source_id: number; source_quote: string; applies_if: unknown; status: string; drafted_by: string;
};

export async function amend(formData: FormData) {
  const who = await requireReviewer();
  const claimId = Number(formData.get("claim_id"));
  const claimText = String(formData.get("claim_text") ?? "").trim();
  const quote = String(formData.get("source_quote") ?? "").trim();
  const appliesRaw = String(formData.get("applies_if") ?? "{}").trim() || "{}";
  const reason = String(formData.get("note") ?? "").trim();
  if (!claimText || !quote || !reason) redirect("/review?msg=needreason");
  let applies: unknown;
  try { applies = JSON.parse(appliesRaw); } catch { redirect("/review?msg=badjson"); }
  const db = adminClient();
  const { data: claim } = await db.from("current_claims").select("*").eq("id", claimId).maybeSingle();
  if (!claim || claim.status !== "verified") redirect("/review?msg=notdraft");
  const c = claim as ClaimRow;
  // A correction publishes immediately under the source rule; the change and its reason are public.
  const appliesObj = (applies && typeof applies === "object" ? applies : {}) as Record<string, unknown>;
  const { data: inserted, error: iErr } = await db
    .from("claims")
    .insert({
      ballot_paper_id: c.ballot_paper_id, candidate_id: c.candidate_id, party_ec_id: c.party_ec_id, topic: c.topic, tier: c.tier,
      claim_text: claimText, source_id: c.source_id, source_quote: quote, applies_if: { ...appliesObj, _published_by_source_rule: true },
      status: "verified", supersedes: c.id, drafted_by: who,
    })
    .select("id").single();
  if (iErr) throw iErr;
  await log(inserted.id, "corrected", who, `Corrected by ${who}: ${reason}. Supersedes ${c.id}.`);
  revalidatePath("/review"); revalidatePath("/ledger"); revalidatePath(`/ballot/${c.ballot_paper_id}`);
  redirect("/review");
}

export async function withdraw(formData: FormData) {
  const who = await requireReviewer();
  const claimId = Number(formData.get("claim_id"));
  const reason = String(formData.get("note") ?? "").trim();
  if (!reason) redirect("/review?msg=needreason");
  const db = adminClient();
  const { data: claim } = await db.from("current_claims").select("*").eq("id", claimId).maybeSingle();
  if (!claim || claim.status !== "verified") redirect("/review?msg=notdraft");
  const c = claim as ClaimRow;
  const { data: inserted, error: iErr } = await db
    .from("claims")
    .insert({
      ballot_paper_id: c.ballot_paper_id, candidate_id: c.candidate_id, party_ec_id: c.party_ec_id, topic: c.topic, tier: c.tier,
      claim_text: c.claim_text, source_id: c.source_id, source_quote: c.source_quote, applies_if: c.applies_if,
      status: "withdrawn", supersedes: c.id, drafted_by: c.drafted_by,
    })
    .select("id").single();
  if (iErr) throw iErr;
  await log(inserted.id, "withdrawn", who, `Withdrawn by ${who}: ${reason}. Supersedes verified ${c.id}.`);
  revalidatePath("/review"); revalidatePath("/ledger"); revalidatePath(`/ballot/${c.ballot_paper_id}`);
  redirect("/review");
}

export async function logComplaint(formData: FormData) {
  const who = await requireReviewer();
  const claimIdRaw = String(formData.get("claim_id") ?? "").trim();
  const detail = String(formData.get("detail") ?? "").trim();
  const event = String(formData.get("event") ?? "complaint_received");
  if (!detail || !["complaint_received", "complaint_resolved"].includes(event)) redirect("/review?msg=needreason");
  await log(claimIdRaw ? Number(claimIdRaw) : null, event, who, detail);
  revalidatePath("/review"); revalidatePath("/ledger");
  redirect("/review");
}

import { randomBytes, createHash } from "node:crypto";

// WP-A5: issue an invitation token for a candidate. The plain token is shown once to the maintainer to send; only its hash is stored.
export async function issueInvitation(formData: FormData) {
  const who = await requireReviewer();
  const candidateId = Number(formData.get("candidate_id"));
  const channel = String(formData.get("channel") ?? "email");
  const db = adminClient();
  const { data: c } = await db.from("candidates").select("id, ballot_paper_id, name").eq("id", candidateId).maybeSingle();
  if (!c) redirect("/review?msg=notdraft");
  const token = randomBytes(24).toString("base64url");
  const { error } = await db.from("candidate_invitations").insert({ candidate_id: c.id, ballot_paper_id: c.ballot_paper_id, token_hash: createHash("sha256").update(token).digest("hex"), channel, submission_status: "invited" });
  if (error) throw error;
  await log(null, "invitation_issued", who, `Invitation issued to ${c.name} (${c.ballot_paper_id}) via ${channel}.`);
  redirect(`/review?token=${encodeURIComponent(token)}&for=${encodeURIComponent(c.name)}#invitations`);
}

// Publish a submission: existence check is the maintainer's confirmation that the statement appears at the cited URL.
export async function publishSubmission(formData: FormData) {
  const who = await requireReviewer();
  const id = Number(formData.get("submission_id"));
  const decision = String(formData.get("decision") ?? "publish");
  const db = adminClient();
  const { data: sub } = await db.from("candidate_submissions").select("*, candidate_invitations(candidate_id, ballot_paper_id)").eq("id", id).maybeSingle();
  if (!sub || sub.status !== "pending") redirect("/review?msg=notdraft");
  const inv = (sub as unknown as { candidate_invitations: { candidate_id: number; ballot_paper_id: string } }).candidate_invitations;
  if (decision === "hold") {
    await db.from("candidate_submissions").update({ status: "held", checked_by: who, checked_at: new Date().toISOString() }).eq("id", id);
    await log(null, "submission_held", who, `Submission ${id} held: ${String(formData.get("note") ?? "").trim() || "no reason given"}.`);
    redirect("/review#submissions");
  }
  const { data: cand } = await db.from("candidates").select("name, party_ec_id").eq("id", inv.candidate_id).single();
  const { data: src, error: sErr } = await db.from("sources").insert({ title: `Candidate statement: ${cand?.name}`, url: sub.source_url, publisher: `${cand?.name} (candidate), submitted via this site`, layer: "candidate_statement", notes: `Submitted by the candidate or agent; existence at the cited URL confirmed by ${who}.` }).select("id").single();
  if (sErr) throw sErr;
  const hedged = /\b(would consider|in due course|where appropriate|if funding allows|subject to|may look at|aim to explore)\b/i.test(sub.statement);
  const { data: claim, error: cErr } = await db.from("claims").insert({
    ballot_paper_id: inv.ballot_paper_id, candidate_id: inv.candidate_id, party_ec_id: cand?.party_ec_id ?? null, topic: sub.topic, tier: "documented",
    claim_text: hedged ? sub.statement : sub.statement, source_id: src.id, source_quote: sub.statement, applies_if: { _published_by_source_rule: true, _candidate_submitted: true, ...(hedged ? { _hedged: true } : {}) },
    status: "verified", drafted_by: "candidate (submitted)", precision: hedged ? "aspiration" : "measurable",
  }).select("id").single();
  if (cErr) throw cErr;
  await db.from("candidate_submissions").update({ status: "published", checked_by: who, checked_at: new Date().toISOString(), claim_id: claim.id }).eq("id", id);
  const { count } = await db.from("candidate_submissions").select("id", { count: "exact", head: true }).eq("invitation_id", sub.invitation_id).eq("status", "pending");
  if (!count) await db.from("candidate_invitations").update({ submission_status: "published" }).eq("id", sub.invitation_id);
  await log(claim.id, "published", who, `Candidate-submitted statement published as written after existence check at ${sub.source_url}.${hedged ? " Hedged wording: no summary, filed as aspiration." : ""}`);
  revalidatePath(`/ballot/${inv.ballot_paper_id}`);
  redirect("/review#submissions");
}
