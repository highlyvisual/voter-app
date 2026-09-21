"use client";
import { useEffect, useState } from "react";
// Plain English / full guide toggle. localStorage only.
export default function PlainToggle() {
  const [plain, setPlain] = useState(false);
  useEffect(() => { try { setPlain(localStorage.getItem("plain") === "1"); } catch {} }, []);
  useEffect(() => { document.documentElement.classList.toggle("plain", plain); try { localStorage.setItem("plain", plain ? "1" : "0"); } catch {} }, [plain]);
  return <p className="meta"><label style={{ cursor: "pointer" }}><input type="checkbox" checked={plain} onChange={(e) => setPlain(e.target.checked)} style={{ marginRight: "0.4rem" }} />Plain English: show the short version</label></p>;
}
