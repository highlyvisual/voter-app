"use client";

// Tiny progressive enhancement: expand or collapse every candidate. Without JavaScript each row still opens individually.
export default function ExpandAll() {
  const set = (open: boolean) => document.querySelectorAll<HTMLDetailsElement>("details.candidate").forEach((d) => { d.open = open; });
  return (
    <span className="controls">
      <button type="button" className="link" onClick={() => set(true)}>Expand all</button>
      <button type="button" className="link" onClick={() => set(false)}>Collapse all</button>
    </span>
  );
}
