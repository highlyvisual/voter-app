import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Reviewer sign-in without any third-party auth: REVIEWERS="Name:passcode,Name:passcode" set as a secret env var by the
// site owner. Sessions are an HMAC-signed cookie; the signing key is derived from the service-role key, which never leaves the server.
const COOKIE = "reviewer";
const TTL_S = 60 * 60 * 12;

function secret(): string {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createHmac("sha256", "voter-app-session").update(k).digest("hex");
}

export function reviewers(): { name: string; code: string }[] {
  return (process.env.REVIEWERS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const i = s.indexOf(":");
      return { name: s.slice(0, i).trim(), code: s.slice(i + 1).trim() };
    })
    .filter((r) => r.name && r.code);
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function matchReviewer(code: string): string | null {
  for (const r of reviewers()) {
    const a = Buffer.from(r.code), b = Buffer.from(code);
    if (a.length === b.length && timingSafeEqual(a, b)) return r.name;
  }
  return null;
}

export async function setSession(name: string) {
  const exp = Math.floor(Date.now() / 1000) + TTL_S;
  const payload = `${name}|${exp}`;
  (await cookies()).set(COOKIE, `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`, {
    httpOnly: true, sameSite: "lax", secure: true, path: "/review", maxAge: TTL_S,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function currentReviewer(): Promise<string | null> {
  const c = (await cookies()).get(COOKIE)?.value;
  if (!c) return null;
  const [p, sig] = c.split(".");
  if (!p || !sig) return null;
  const payload = Buffer.from(p, "base64url").toString();
  const expected = sign(payload);
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  const [name, exp] = payload.split("|");
  if (!name || Number(exp) < Math.floor(Date.now() / 1000)) return null;
  return reviewers().some((r) => r.name === name) ? name : null;
}
