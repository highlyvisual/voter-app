"use client";
import { useSearchParams } from "next/navigation";
import { findElection } from "@/app/find/actions";
import PostcodeField from "@/components/PostcodeField";

// The postcode box on the home page. The error from a failed lookup arrives as ?error=, read here in the browser
// so that the home page itself can be cached and served instantly (Nova audit, 27 Sept). Round ten (Romily, q1): it is
// the home page's main action for anyone this browser doesn't know yet, so it is out in the open, not folded away.
export function LookupView({ error }: { error: string | null }) {
  return (
    <form action={findElection} className="find-big nv-form" aria-label="Find your next vote">
      <label htmlFor="postcode">Your postcode</label>
      <div className="row">
        <PostcodeField errorId={error ? "pc-error" : undefined} />
        <button type="submit">Find my next vote</button>
      </div>
      <p className="meta">Used once to find the elections at that address, via Democracy Club. Never kept by us.</p>
      {error ? <p className="notice small" id="pc-error" role="alert" style={{ marginTop: "0.6rem" }}>{error}</p> : null}
    </form>
  );
}

export default function HomeLookup() {
  const e = useSearchParams().get("error");
  return <LookupView error={e ? e.slice(0, 200) : null} />;
}
