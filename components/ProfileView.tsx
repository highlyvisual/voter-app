"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FIELDS, FIELD_KEYS, OPTIONAL_FIELDS, OPTIONAL_KEYS } from "@/lib/household";
import { HOUSEHOLD_KEYS, clearPersonal, clearProfile, readProfile, writeProfile, type Profile } from "@/lib/profile";
import { PERSONAL_FIELDS, PERSONAL_KEYS, PERSONAL_WHY } from "@/lib/personal";

// "My profile": every answer, why it is asked, and one tap to change or remove it. Lives on this device only.
const WHY: Record<string, string> = {
  postcode: "Finds the elections at your address.",
  age_band: "Some policies name an age: pensions, youth fares, training.",
  household: "Tax and benefit figures depend on whether income is shared.",
  children: "Child benefit, the two-child limit, schools and childcare.",
  tenure: "Renters, mortgage-holders and outright owners are affected by different policies.",
  income_band: "Needed to calculate tax and benefit effects. A band, never a figure.",
  employment: "National Insurance, benefits and pensions differ by work status.",
  student: "Fees, loans and maintenance apply only to students.",
};
export default function ProfileView({ findAction }: { findAction: (fd: FormData) => void }) {
  const [p, setP] = useState<Profile | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setP(readProfile()); setLoaded(true); const on = () => setP(readProfile()); window.addEventListener("profile-changed", on); return () => window.removeEventListener("profile-changed", on); }, []);
  if (!loaded) return null;
  if (!p || !Object.keys(p).length) return (
    <div className="deadend">
      <p style={{ margin: 0 }}><strong>No profile on this device yet.</strong> A few questions, each skippable, and every ballot page will show what applies to a household like yours.</p>
      <p style={{ margin: "0.6rem 0 0" }}><Link href="/start" className="button">Build my profile</Link></p>
    </div>
  );
  const set = (k: string, v: string) => { const next = { ...p, [k]: v }; writeProfile(next); setP(next); setEditing(null); };
  const all: [string, string, [string, string][]][] = [
    ...FIELD_KEYS.map((k) => [k, FIELDS[k].label, FIELDS[k].options as unknown as [string, string][]] as [string, string, [string, string][]]),
    ...OPTIONAL_KEYS.map((k) => [k, OPTIONAL_FIELDS[k].label, OPTIONAL_FIELDS[k].options as unknown as [string, string][]] as [string, string, [string, string][]]),
  ];
  return (
    <>
      <div className="profile-grid">
        <section className="profile-card">
          <p className="profile-label">Where you live</p>
          {editing === "postcode" ? (
            <form onSubmit={(e) => { e.preventDefault(); const v = String(new FormData(e.currentTarget).get("pc") ?? "").trim().toUpperCase(); if (v) set("postcode", v); }}>
              <input name="pc" defaultValue={p.postcode ?? ""} className="big-input" style={{ fontSize: "1.2rem" }} aria-label="Postcode" autoFocus />
              <p><button type="submit" className="small">Save</button> <button type="button" className="secondary small" onClick={() => setEditing(null)}>Cancel</button></p>
            </form>
          ) : (
            <>
              <p className="profile-value">{p.postcode ?? <span className="meta">Not set</span>}</p>
              <p className="meta">{WHY.postcode}</p>
              <button type="button" className="secondary small" onClick={() => setEditing("postcode")}>Edit</button>
            </>
          )}
        </section>
        {all.map(([k, label, options]) => {
          const current = options.find(([code]) => code === p[k])?.[1];
          return (
            <section key={k} className="profile-card">
              <p className="profile-label">{label}</p>
              {editing === k ? (
                <div className="pills">
                  {options.map(([code, text]) => <button key={code} type="button" className={`pill${p[k] === code ? " on" : ""}`} onClick={() => set(k, code)}>{text}</button>)}
                  <button type="button" className="pill" onClick={() => set(k, "")}>Prefer not to say</button>
                </div>
              ) : (
                <>
                  <p className="profile-value">{current ?? <span className="meta">Not answered — nothing is assumed</span>}</p>
                  {WHY[k] ? <p className="meta">{WHY[k]}</p> : null}
                  <button type="button" className="secondary small" onClick={() => setEditing(k)}>{current ? "Change" : "Answer"}</button>
                </>
              )}
            </section>
          );
        })}
      </div>
      <h2>About you <span className="meta">(optional, this browser only)</span></h2>
      <p className="meta">Never put in a page address, never sent to us, never used to calculate anything. If you answer, every party&rsquo;s own words on these subjects are shown first on Your politics.</p>
      <div className="profile-grid">
        {PERSONAL_KEYS.map((k) => {
          const options = PERSONAL_FIELDS[k].options as unknown as [string, string][];
          const current = options.find(([code]) => code === p[k])?.[1];
          return (
            <section key={k} className="profile-card">
              <p className="profile-label">{PERSONAL_FIELDS[k].label}</p>
              {editing === k ? (
                <div className="pills">
                  {options.map(([code, text]) => <button key={code} type="button" className={`pill${p[k] === code ? " on" : ""}`} onClick={() => set(k, code)}>{text}</button>)}
                  <button type="button" className="pill" onClick={() => set(k, "")}>Prefer not to say</button>
                </div>
              ) : (
                <>
                  <p className="profile-value">{current ?? <span className="meta">Not answered</span>}</p>
                  <p className="meta">{PERSONAL_WHY[k]}</p>
                  <button type="button" className="secondary small" onClick={() => setEditing(k)}>{current ? "Change" : "Answer"}</button>
                </>
              )}
            </section>
          );
        })}
      </div>
      {PERSONAL_KEYS.some((k) => p[k]) ? <p><button type="button" className="secondary" onClick={() => { clearPersonal(); setP(readProfile()); }}>Delete my answers about me</button></p> : null}
      <div className="profile-actions">
        {p.postcode ? <form action={findAction} style={{ display: "inline" }}>
          <input type="hidden" name="postcode" value={p.postcode} />
          <input type="hidden" name="from" value="profile" />
          {/* Household answers only: answers about the person never leave this browser. */}
          {Object.entries(p).filter(([k]) => HOUSEHOLD_KEYS.includes(k)).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <button type="submit">Show my politics</button>
        </form> : null}
        <button type="button" className="secondary" onClick={() => { if (confirm("Delete your profile from this device?")) { clearProfile(); setP(null); } }}>Delete my profile</button>
      </div>
      <p className="meta">Your saved profile lives only in this browser, and deleting it here removes it completely. When you look at a ballot, your answers travel in the page address so the page can use them; we don't store them. We never ask who you support or how you voted.</p>
    </>
  );
}
