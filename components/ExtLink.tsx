import type { ReactNode } from "react";
import { fixLink, linkFixes } from "@/lib/links";

// An outbound link that survives the page it points to disappearing: if the weekly link check found it dead, the
// Internet Archive's copy is linked instead and the reader is told so.
export default async function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  const f = fixLink(await linkFixes(), href) ?? { href, archived: false };
  return (
    <>
      <a href={f.href} rel="noopener">{children}</a>
      {f.archived ? <span className="meta"> (archived copy: the original page no longer loads)</span> : null}
    </>
  );
}
