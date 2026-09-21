"use server";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { adminClient } from "@/lib/admin";
import { TOPICS } from "@/lib/data";

export async function submitStatement(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) redirect("/candidates/submit");
  const db = adminClient();
  const hash = createHash("sha256").update(token).digest("hex");
  const { data: inv } = await db.from("candidate_invitations").select("id, submission_status").eq("token_hash", hash).maybeSingle();
  if (!inv) redirect("/candidates/submit?token=bad");
  const rows: { invitation_id: number; topic: string; statement: string; source_url: string }[] = [];
  for (const [k] of TOPICS) {
    const st = String(formData.get(`statement_${k}`) ?? "").trim();
    const src = String(formData.get(`source_${k}`) ?? "").trim();
    if (st && /^https?:\/\//i.test(src)) rows.push({ invitation_id: inv.id, topic: k, statement: st.slice(0, 600), source_url: src });
  }
  if (rows.length) {
    const { error } = await db.from("candidate_submissions").insert(rows);
    if (error) throw error;
    await db.from("candidate_invitations").update({ responded_at: new Date().toISOString(), submission_status: "received" }).eq("id", inv.id);
    await db.from("change_log").insert({ claim_id: null, event: "submission_received", actor: "candidate (via invitation)", detail: `${rows.length} statement(s) received for invitation ${inv.id}; pending existence check.` });
  }
  redirect(`/candidates/submit?token=${encodeURIComponent(token)}&done=1`);
}
