"use server";
import { adminClient } from "@/lib/admin";

// WP-A11: two fixed questions, anonymous daily counts per ballot, optional comment stored without identifier or time finer than the day.
const recent = new Map<string, number>(); // in-memory per-instance rate limit: one submission per ballot per minute per anonymous key
export async function sendFeedback(formData: FormData) {
  const ballot = String(formData.get("ballot") ?? "");
  const found = String(formData.get("found") ?? "");
  const likely = String(formData.get("likely") ?? "");
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 500);
  const key = String(formData.get("k") ?? "") + ballot;
  const now = Date.now();
  if (recent.get(key) && now - (recent.get(key) ?? 0) < 60000) return;
  recent.set(key, now);
  if (!ballot) return;
  const db = adminClient();
  const day = new Date().toISOString().slice(0, 10);
  const { data } = await db.from("feedback_totals").select("*").eq("day", day).eq("ballot_paper_id", ballot).maybeSingle();
  const row = data ?? { day, ballot_paper_id: ballot, found_yes: 0, found_no: 0, more_likely: 0, less_likely: 0, no_difference: 0 };
  if (found === "yes") row.found_yes++; if (found === "no") row.found_no++;
  if (likely === "more") row.more_likely++; if (likely === "less") row.less_likely++; if (likely === "same") row.no_difference++;
  await db.from("feedback_totals").upsert(row);
  if (comment) await db.from("feedback_comments").insert({ day, ballot_paper_id: ballot, comment });
}
