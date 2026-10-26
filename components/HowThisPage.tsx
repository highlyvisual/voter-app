import type { ReactNode } from "react";

// Romily, round ten, q2: the positions pages "a bit less busy". Method notes that used to sit above the first position
// are folded here, one tap away; nothing is removed.
export default function HowThisPage({ children, label = "How this page works" }: { children: ReactNode; label?: string }) {
  return (
    <details className="how-page">
      <summary>{label}</summary>
      <div className="how-page-body">{children}</div>
    </details>
  );
}
