"use client";
import { useSearchParams } from "next/navigation";
import { findElection } from "@/app/find/actions";
import PostcodeField from "@/components/PostcodeField";

// The quick postcode lookup on the home page. The error from a failed lookup arrives as ?error=, read here in the browser
// so that the home page itself can be cached and served instantly (Nova audit, 27 Sept).
export function LookupView({ error }: { error: string | null }) {
  return (
    <details className="quick-lookup" open={!!error}>
      <summary>In a hurry? Just look up a postcode</summary>
      <form action={findElection} className="find-big" aria-label="Find your election">
        <label htmlFor="postcode">Your postcode</label>
        <div className="row">
          <PostcodeField errorId={error ? "pc-error" : undefined} />
          <button type="submit">Find my election</button>
        </div>
        <p className="meta">Used once to find the elections at that address, via Democracy Club. Never kept by us.</p>
        {error ? <p className="notice small" id="pc-error" role="alert" style={{ marginTop: "0.6rem" }}>{error}</p> : null}
      </form>
    </details>
  );
}

export default function HomeLookup() {
  const e = useSearchParams().get("error");
  return <LookupView error={e ? e.slice(0, 200) : null} />;
}
