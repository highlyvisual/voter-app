"use client";
import { useEffect, useState } from "react";

// Controlled so no re-render can clear it, and remembered for this tab only (sessionStorage) so a back-navigation keeps it.
export default function PostcodeField({ id = "postcode" }: { id?: string }) {
  const [v, setV] = useState("");
  useEffect(() => { try { const s = sessionStorage.getItem("pc"); if (s) setV(s); } catch {} }, []);
  return (
    <input
      id={id} name="postcode" type="text" autoComplete="postal-code" autoCapitalize="characters" spellCheck={false}
      inputMode="text" enterKeyHint="search" placeholder="e.g. WC1H 9JE" required value={v}
      onChange={(e) => { setV(e.target.value); try { sessionStorage.setItem("pc", e.target.value); } catch {} }}
    />
  );
}
