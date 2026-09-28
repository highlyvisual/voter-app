// The Electoral Commission's register entry, latest statement of accounts, recent loans and 2024 general election
// campaign spending for every registered party. Written by scripts/loaders/party_register.py (the "Data files"
// workflow, weekly). Donations are separate (party_funding table, components/PartyFunding.tsx).
import data from "./party_register.json";

export type Loan = { lender: string; lender_type: string; value: number; start: string | null; status: string; outstanding: number; unit: string; reported: string; type: string; ref: string };
export type Accounts = {
  year: number; financial_year_end: string | null; published: string | null; basis: string | null; band: string | null;
  total_income: number; total_expenditure: number; income: [string, number][]; expenditure: [string, number][];
  net_assets: number | null; page: string; document: string | null;
};
export type PartyEntry = {
  name: string; register: string; registered_on: string | null; officers: [string, string][]; descriptions: string[];
  fields_candidates_in: string[]; minor_party: boolean; page: string; accounts?: Accounts;
  loans: { count: number; total: number; largest: Loan[] }; ge2024_spending?: { total: number; by_category: [string, number][] };
};
type Doc = { retrieved_at: string; source: { publisher: string; title: string; page: string }; loan_quarters: string[]; ge: string; parties: Record<string, PartyEntry> };
const DOC = data as unknown as Doc;

export const REGISTER_RETRIEVED = DOC.retrieved_at;
export const LOAN_QUARTERS = DOC.loan_quarters;
export const partyEntry = (ecId: string): PartyEntry | null => DOC.parties[ecId] ?? null;
