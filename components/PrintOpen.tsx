"use client";
import { useEffect } from "react";

// Printing a page prints everything: every closed "See the exact words and source" and other folded section is
// opened for the print, then closed again afterwards.
export default function PrintOpen() {
  useEffect(() => {
    let opened: HTMLDetailsElement[] = [];
    const before = () => { opened = [...document.querySelectorAll<HTMLDetailsElement>("details:not([open])")]; opened.forEach((d) => { d.open = true; }); };
    const after = () => { opened.forEach((d) => { d.open = false; }); opened = []; };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => { window.removeEventListener("beforeprint", before); window.removeEventListener("afterprint", after); };
  }, []);
  return null;
}
