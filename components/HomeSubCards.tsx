"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import InfoTip from "@/components/InfoTip";
import { HOME_SUBS, subOrder, type HomeSub } from "@/lib/homeTopics";
import { readProfile } from "@/lib/profile";

// Level two (Romily, round eleven q2): the sub-topics of Your Home as cards. With a saved profile, the one its housing
// answer points to comes first, with the reason behind a small (i) (her round-ten rule: reasons in a pop-up, not on the
// card). Read on this device only; the server sends the fixed order, so the page works without JavaScript.
export default function HomeSubCards() {
  const [tenure, setTenure] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setTenure(readProfile()?.tenure ?? null);
    read();
    window.addEventListener("profile-changed", read);
    return () => window.removeEventListener("profile-changed", read);
  }, []);
  const title = Object.fromEntries(HOME_SUBS.map((s) => [s.key, s])) as Record<HomeSub, (typeof HOME_SUBS)[number]>;
  return (
    <ul className="sub-cards">
      {subOrder(tenure).map(({ key, reason }) => (
        <li key={key} className="sub-card">
          <Link href={`/themes/your-home/${key}`} className="sub-link">
            <span className="sub-title">{title[key].title}</span>
            <span className="sub-blurb">{title[key].blurb}</span>
          </Link>
          {reason ? <InfoTip label={`Why is ${title[key].short.toLowerCase()} first?`}><b>Why first?</b> Your profile puts this first {reason}. It changes only the order; everything is still here.</InfoTip> : null}
        </li>
      ))}
    </ul>
  );
}
