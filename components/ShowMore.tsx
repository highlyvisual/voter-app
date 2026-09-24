"use client";
import { useState } from "react";
// Caps a tall block on small screens with a "show all" button; on wide screens everything shows as before.
export default function ShowMore({ children, label }: { children: React.ReactNode; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`showmore${open ? " open" : ""}`}>
      <div className="showmore-body">{children}</div>
      {!open ? <div className="showmore-fade"><button type="button" className="secondary" onClick={() => setOpen(true)}>{label}</button></div> : null}
    </div>
  );
}
