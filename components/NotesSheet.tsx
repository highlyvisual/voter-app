"use client";
import { useEffect, useState } from "react";
export default function NotesSheet({ ballotId, candidates }: { ballotId: string; candidates: { id: number; name: string; party: string }[] }) {
  const key = `notes:${ballotId}`;
  const [notes, setNotes] = useState<Record<number, string>>({});
  useEffect(() => { try { setNotes(JSON.parse(localStorage.getItem(key) ?? "{}")); } catch {} }, [key]);
  const set = (id: number, v: string) => { const n = { ...notes, [id]: v }; setNotes(n); try { localStorage.setItem(key, JSON.stringify(n)); } catch {} };
  return (
    <div className="notes">
      <p className="no-print"><button type="button" onClick={() => window.print()}>Print my notes</button> <button type="button" className="secondary" onClick={() => { if (confirm("Clear all notes for this ballot?")) { setNotes({}); try { localStorage.removeItem(key); } catch {} } }}>Clear</button></p>
      <ol className="notes-list">
        {candidates.map((c, i) => (
          <li key={c.id}><div><strong>{i + 1}. {c.name}</strong> <span className="muted">{c.party}</span></div><textarea value={notes[c.id] ?? ""} onChange={(e) => set(c.id, e.target.value)} placeholder="Your notes" /></li>
        ))}
      </ol>
    </div>
  );
}
