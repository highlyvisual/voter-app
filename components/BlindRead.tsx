"use client";
import { useEffect, useState } from "react";

// Reading mode that hides who said what, so positions can be read before names. Purely client-side; nothing is recorded.
export default function BlindRead() {
  const [on, setOn] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle("blind", on); }, [on]);
  return (
    <p className="meta" style={{ margin: "0.5rem 0 1rem" }}>
      <label style={{ cursor: "pointer" }}>
        <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} style={{ marginRight: "0.4rem" }} />
        Hide names and parties while I read
      </label>
    </p>
  );
}
