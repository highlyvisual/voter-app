"use client";
import { useState } from "react";

// Round eight q19, first Learn visual: who controls what. One row per everyday thing, one column per nation, the
// level that decides it marked on a fixed scale (local, area-wide, devolved, UK). Simplified; the address-level chain on
// each ballot page is the precise version. Sources are listed on the page.
type Level = "local" | "area" | "devolved" | "uk";
const LEVELS: Record<Level, string> = { local: "Your council", area: "Area-wide body", devolved: "Devolved government", uk: "UK Parliament and Government" };
type Nation = "England" | "Scotland" | "Wales" | "Northern Ireland";
const NATIONS: Nation[] = ["England", "Scotland", "Wales", "Northern Ireland"];
type Cell = { levels: Level[]; text: string };
const ROWS: { thing: string; by: Record<Nation, Cell> }[] = [
  { thing: "Bins and recycling", by: {
    England: { levels: ["local"], text: "Your district, borough or unitary council collects; in two-tier areas the county council disposes of the waste." },
    Scotland: { levels: ["local"], text: "Your council." }, Wales: { levels: ["local"], text: "Your council." }, "Northern Ireland": { levels: ["local"], text: "Your council." } } },
  { thing: "Planning applications", by: {
    England: { levels: ["local"], text: "Your district, borough or unitary council; the county council decides minerals and waste sites." },
    Scotland: { levels: ["local"], text: "Your council, with appeals to the Scottish Government." },
    Wales: { levels: ["local"], text: "Your council, with appeals to the Welsh Government." },
    "Northern Ireland": { levels: ["local", "devolved"], text: "Your council since 2015; the Department for Infrastructure decides regionally significant applications." } } },
  { thing: "Council tax", by: {
    England: { levels: ["local", "area"], text: "Councils set it; the police and crime commissioner (or mayor), fire authority and any parish council add their shares." },
    Scotland: { levels: ["local"], text: "Your council sets it; water and sewerage charges are collected with it." },
    Wales: { levels: ["local", "area"], text: "Your council sets it; the police and crime commissioner and any community council add their shares." },
    "Northern Ireland": { levels: ["local", "devolved"], text: "There is no council tax. Households pay rates: a district rate set by your council and a regional rate set by the Executive." } } },
  { thing: "Schools", by: {
    England: { levels: ["uk", "local"], text: "The Department for Education funds schools and oversees academies; councils run the schools they maintain and school admissions for them." },
    Scotland: { levels: ["devolved", "local"], text: "The Scottish Government sets policy; councils run schools." },
    Wales: { levels: ["devolved", "local"], text: "The Welsh Government sets policy; councils run schools." },
    "Northern Ireland": { levels: ["devolved"], text: "The Executive sets policy; the Education Authority runs schools." } } },
  { thing: "Adult social care", by: {
    England: { levels: ["local", "uk"], text: "County and unitary councils arrange care; the UK Government sets the rules and much of the funding." },
    Scotland: { levels: ["local", "devolved"], text: "Councils and the NHS together, through integration joint boards, under the Scottish Government." },
    Wales: { levels: ["local", "devolved"], text: "Councils arrange care, under the Welsh Government." },
    "Northern Ireland": { levels: ["devolved"], text: "Health and social care trusts, under the Executive." } } },
  { thing: "The NHS", by: {
    England: { levels: ["uk", "area"], text: "The Department of Health and Social Care; integrated care boards plan and pay for local services." },
    Scotland: { levels: ["devolved"], text: "The Scottish Government, through 14 regional health boards." },
    Wales: { levels: ["devolved"], text: "The Welsh Government, through seven health boards." },
    "Northern Ireland": { levels: ["devolved"], text: "The Executive, through health and social care trusts." } } },
  { thing: "Policing", by: {
    England: { levels: ["area", "uk"], text: "An elected police and crime commissioner (or mayor) sets the budget and priorities; Parliament makes the law." },
    Scotland: { levels: ["devolved"], text: "The Scottish Government; Police Scotland is overseen by the Scottish Police Authority." },
    Wales: { levels: ["area", "uk"], text: "An elected police and crime commissioner sets priorities; policing law is made by the UK Parliament." },
    "Northern Ireland": { levels: ["devolved"], text: "Devolved to the Executive; the Policing Board oversees the PSNI." } } },
  { thing: "Buses", by: {
    England: { levels: ["local", "area"], text: "Councils and combined authorities; mayors and councils can take bus routes under public control." },
    Scotland: { levels: ["local", "devolved"], text: "Councils and regional transport partnerships, under the Scottish Government." },
    Wales: { levels: ["local", "devolved"], text: "Councils and the Welsh Government, with Transport for Wales." },
    "Northern Ireland": { levels: ["devolved"], text: "The Department for Infrastructure; Translink runs the services." } } },
  { thing: "Main roads", by: {
    England: { levels: ["uk", "local"], text: "National Highways (for the UK Government) runs motorways and major A roads; councils run the rest." },
    Scotland: { levels: ["devolved", "local"], text: "Transport Scotland runs trunk roads; councils run the rest." },
    Wales: { levels: ["devolved", "local"], text: "The Welsh Government runs trunk roads; councils run the rest." },
    "Northern Ireland": { levels: ["devolved"], text: "The Department for Infrastructure runs all public roads." } } },
  { thing: "Income tax", by: {
    England: { levels: ["uk"], text: "The UK Parliament." },
    Scotland: { levels: ["devolved", "uk"], text: "The Scottish Parliament sets the rates and bands on earnings and pensions; the UK Parliament sets the rest, including the personal allowance." },
    Wales: { levels: ["uk", "devolved"], text: "The UK Parliament, with the Senedd setting a Welsh rate on part of each band." },
    "Northern Ireland": { levels: ["uk"], text: "The UK Parliament." } } },
  { thing: "Benefits and the State Pension", by: {
    England: { levels: ["uk"], text: "The UK Parliament and the Department for Work and Pensions." },
    Scotland: { levels: ["uk", "devolved"], text: "Mostly the UK Parliament; some disability, carer and family benefits are run by Social Security Scotland." },
    Wales: { levels: ["uk"], text: "The UK Parliament and the Department for Work and Pensions." },
    "Northern Ireland": { levels: ["devolved"], text: "Devolved, though Northern Ireland by long practice keeps the same benefits as Great Britain." } } },
  { thing: "Immigration, defence and foreign policy", by: {
    England: { levels: ["uk"], text: "The UK Parliament and Government." }, Scotland: { levels: ["uk"], text: "The UK Parliament and Government." },
    Wales: { levels: ["uk"], text: "The UK Parliament and Government." }, "Northern Ireland": { levels: ["uk"], text: "The UK Parliament and Government." } } },
];
const ORDER: Level[] = ["local", "area", "devolved", "uk"];

export default function WhoDecides() {
  const [nation, setNation] = useState<Nation>("England");
  return (
    <div className="who-decides">
      <div className="area-zoom" role="group" aria-label="Choose a nation">
        <span className="meta">Where do you live?</span>
        {NATIONS.map((n) => <button key={n} type="button" aria-pressed={n === nation} className={n === nation ? "on" : ""} onClick={() => setNation(n)}>{n}</button>)}
      </div>
      <p className="meta" aria-live="polite">Showing who decides in <strong>{nation}</strong>.</p>
      <div className="wd-key" aria-hidden>{ORDER.map((l) => <span key={l} className={`wd-lv lv-${l}`}>{LEVELS[l]}</span>)}</div>
      <ul className="wd-list">
        {ROWS.map((r) => {
          const c = r.by[nation];
          return (
            <li key={r.thing}>
              <span className="wd-thing">{r.thing}</span>
              <span className="wd-scale" aria-hidden>{ORDER.map((l) => <i key={l} className={`lv-${l}${c.levels.includes(l) ? " on" : ""}`} />)}</span>
              <span className="wd-who"><strong>{c.levels.map((l) => LEVELS[l]).join(" and ")}.</strong> {c.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
