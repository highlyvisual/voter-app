"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { lensFor, whyFirst, type Lens, type Why } from "@/lib/councilBusiness";
import { readPersonal, readProfile } from "@/lib/profile";

// Romily, round ten q13: council business personalised to the profile, with less on screen at once. The server renders
// every item by date (children), so the page works without JavaScript and without a profile. Here, in the browser only,
// a saved profile re-groups the same items: those the published rule (lib/councilBusiness.ts) ties to the household
// first, the rest underneath, each group cut to a few with "Show all". Nothing is sent anywhere; nothing is hidden.
export type BusinessItem = { id: string; title: string; node: ReactNode };

const SHOW = 5;

export default function CouncilBusiness({ items, children, show = SHOW, heading = "h3" }: { items: BusinessItem[]; children: ReactNode; show?: number; heading?: "h3" | "h4" }) {
  const [lens, setLens] = useState<Lens | null | undefined>(undefined);
  useEffect(() => {
    const read = () => setLens(lensFor(readProfile(), readPersonal()));
    read();
    window.addEventListener("profile-changed", read);
    return () => window.removeEventListener("profile-changed", read);
  }, []);

  // Before the profile is read, or with nothing in it that puts a topic first: the date order, as the server sent it.
  if (!lens) {
    return (
      <>
        {children}
        {lens === null ? <p className="meta cb-invite">Want what touches your household listed first? <Link href="/profile">Add a few details to your profile</Link>; they stay on this device.</p> : null}
      </>
    );
  }
  const H = heading;
  const sorted = items.map((it) => ({ it, why: whyFirst(it.title, lens) }));
  const mine = sorted.filter((x) => x.why.length);
  const rest = sorted.filter((x) => !x.why.length);
  const firstWords = [...lens.topics.map((t) => t.label.toLowerCase()), ...lens.groups.map((g) => g.names!.label)];
  return (
    <div className="cb-split">
      <H className="cb-heading">About your household <span className="cb-count">{count(mine.length)}</span></H>
      {mine.length ? <Group rows={mine} show={show} /> : <p className="meta">Nothing here has a title about {list(firstWords)}.</p>}
      <H className="cb-heading">Not about you directly &mdash; still worth a look <span className="cb-count">{count(rest.length)}</span></H>
      {rest.length ? <Group rows={rest} show={show} /> : <p className="meta">Nothing else on these agendas.</p>}
      <p className="meta">Sorted on this device from your profile, by the words in each title only, never by how important anything is. <Link href="/profile">Change your profile</Link>.</p>
    </div>
  );
}

function Group({ rows, show }: { rows: { it: BusinessItem; why: Why[] }[]; show: number }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, show);
  return (
    <>
      <ul className="cb-list">
        {shown.map(({ it, why }) => (
          <li key={it.id} className="cb-item">
            <div className="cb-body">{it.node}</div>
            {why.length ? <WhyFirst why={why} /> : null}
          </li>
        ))}
      </ul>
      {rows.length > show ? <button type="button" className="secondary small cb-more" aria-expanded={all} onClick={() => setAll((a) => !a)}>{all ? "Show fewer" : `Show all ${rows.length}`}</button> : null}
    </>
  );
}

// The reason sits behind a small (i), not inline (Romily's q29 rule in the app: reasons behind a pop-up).
function WhyFirst({ why }: { why: Why[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="cb-why">
      <button type="button" className="cb-why-btn" aria-expanded={open} aria-label="Why is this first?" onClick={() => setOpen((o) => !o)}><span aria-hidden>i</span></button>
      {open ? (
        <div className="cb-why-panel" role="note">
          <p><b>Why first?</b> {why.map((w, i) => <span key={i}>{i ? " Also: " : ""}{w.kind === "topic" ? <>Its title uses a word we file under {w.label.toLowerCase()}, and your profile puts that first {w.reason}.</> : <>Its title names {w.label}, and you told us: {w.answer}. That answer stays on this device.</>}</span>)}</p>
          <p className="meta">Matched on the title&rsquo;s words only. It says nothing about whether the item is good or bad for you.</p>
        </div>
      ) : null}
    </div>
  );
}

const count = (n: number) => `${n} ${n === 1 ? "item" : "items"}`;

function list(xs: string[]): string {
  return xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} or ${xs.at(-1)}`;
}
