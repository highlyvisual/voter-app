import { publicClient } from "@/lib/data";

// Links the weekly link check (scripts/auto/link_check.py) found dead, with the archived copy to show instead, and
// plain http:// links that work over https. Read at most every ten minutes per server instance.
export type LinkFix = { href: string; archived: boolean };
let memo: { at: number; map: Map<string, LinkFix> } | null = null;

export async function linkFixes(): Promise<Map<string, LinkFix>> {
  if (memo && Date.now() - memo.at < 600_000) return memo.map;
  const map = new Map<string, LinkFix>();
  try {
    const { data } = await publicClient().from("link_status").select("url, dead, archive_url, https_url").or("dead.eq.true,https_url.not.is.null");
    for (const r of data ?? []) {
      if (r.dead && r.archive_url) map.set(r.url, { href: r.archive_url, archived: true });
      else if (!r.dead && r.https_url) map.set(r.url, { href: r.https_url, archived: false });
    }
  } catch { /* the original links still work as they are */ }
  memo = { at: Date.now(), map };
  return map;
}

export function fixLink(map: Map<string, LinkFix>, url: string | null | undefined): LinkFix | null {
  if (!url) return null;
  return map.get(url) ?? { href: url, archived: false };
}
