import Link from "next/link";
import { img } from "@/lib/site";
// Every candidate in every current election, one tile each, in election order then ballot order. Human, dynamic, neutral: nobody is larger, nobody is first for any reason but the ballot paper.
export type FaceTile = { id: number; name: string; party: string; colour: string | null; photo: string | null; ballot: string; area: string };
export default function FacesWall({ tiles }: { tiles: FaceTile[] }) {
  return (
    <section className="faces" aria-label="Every candidate standing in the elections covered">
      <p className="faces-title">Everyone asking for a vote right now — <span>{tiles.length} candidates</span>, in ballot-paper order</p>
      <ul className="faces-grid">
        {tiles.map((t, i) => (
          <li key={t.id} style={{ animationDelay: `${Math.min(i * 12, 1400)}ms` }}>
            <Link href={`/ballot/${encodeURIComponent(t.ballot)}#c-${t.id}`} className="face" style={{ borderColor: t.colour ?? "var(--rule)" }} title={`${t.name}, ${t.party}, ${t.area}`}>
              {t.photo ? <img src={img(t.photo, 120)} alt="" loading="lazy" width={56} height={56} /> : <span className="initials">{t.name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).map((w) => w[0]).slice(0, 2).join("")}</span>}
              <span className="face-label"><strong>{t.name}</strong><br />{t.party}<br /><span className="meta">{t.area}</span></span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="meta faces-note">{tiles.length} candidates across every election covered, in election order then ballot-paper order. Photos from Democracy Club where candidates have supplied one; initials otherwise.</p>
    </section>
  );
}
