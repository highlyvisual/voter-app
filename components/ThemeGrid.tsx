import Link from "next/link";
import ThemeIcon from "@/components/ThemeIcon";
import { THEMES } from "@/lib/themes";

// Level one of Romily's three (round eleven q2): "tappable as the main icons so people can choose which area to view".
// Her ten themes in her order, the same tile for each. Only Your Home is built; the rest say so quietly where `notes`
// is on (the themes page), and lead to the topic pages that cover them now.
export default function ThemeGrid({ notes = false, compact = false }: { notes?: boolean; compact?: boolean }) {
  return (
    <ul className={`theme-grid${compact ? " compact" : ""}`}>
      {THEMES.map((t) => (
        <li key={t.slug}>
          <Link href={`/themes/${t.slug}`} className="theme-tile">
            <ThemeIcon slug={t.slug} size={compact ? 28 : 36} />
            <span className="theme-name">{t.name}</span>
            {notes && !compact ? <span className="theme-subs">{t.subs}</span> : null}
            {notes && !t.built ? <span className="theme-note">Being redesigned</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
