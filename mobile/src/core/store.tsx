import { File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppElection } from '@/lib/appApi';
import { FIELD_KEYS, OPTIONAL_KEYS, householdComplete, type Household } from '@/lib/household';
import { PERSONAL_FIELDS, PERSONAL_KEYS, type PersonalKey } from '@/lib/personal';

// What the app keeps, all of it on this phone only:
// - the household answers (the eight questions and the optional ones), in the system keychain / keystore via
//   expo-secure-store. They are never sent anywhere, not even in a URL: claims are filtered and money figures looked up
//   here, on the phone.
// - the outward code (e.g. "CH4") and the elections found for it, so "My elections" works without asking again.
//   The full postcode is used once for the lookup and not kept.
// - the optional questions about the person (ethnic group, religion, sex, gender, orientation: lib/personal.ts), also in
//   secure storage, also never sent. They are used only to list first the positions whose own words name the group
//   chosen. "Clear my answers" deletes them with the household answers.
// - whether the three welcome screens have been seen (app 0.3.0), so they show once.
const HOUSEHOLD_KEY = 'household.v1';
const PERSONAL_KEY = 'personal.v1';
export type Personal = Partial<Record<PersonalKey, string>>;
const electionsFile = () => new File(Paths.document, 'my-elections.json');
const introFile = () => new File(Paths.document, 'intro-seen');

export type SavedElections = { outcode: string; placeUrl: string; elections: AppElection[]; savedAt: string };

type Store = {
  ready: boolean;
  household: Household;
  complete: boolean;
  saveHousehold: (h: Household) => Promise<void>;
  clearHousehold: () => Promise<void>;
  personal: Personal;
  savePersonal: (p: Personal) => Promise<void>;
  saved: SavedElections | null;
  saveElections: (s: Omit<SavedElections, 'savedAt'>) => void;
  clearElections: () => void;
  introSeen: boolean;
  markIntroSeen: () => void;
};

const Ctx = createContext<Store | null>(null);

// Only known keys and values are kept, so nothing unexpected is ever stored.
function clean(h: Household): Household {
  const out: Household = {};
  for (const k of FIELD_KEYS) if (typeof h[k] === 'string' && h[k]) out[k] = h[k];
  for (const k of OPTIONAL_KEYS) if (h[k] === 'yes' || h[k] === 'no') out[k] = h[k];
  return out;
}
function cleanPersonal(p: Personal): Personal {
  const out: Personal = {};
  for (const k of PERSONAL_KEYS) if ((PERSONAL_FIELDS[k].options as readonly (readonly [string, string])[]).some(([v]) => v === p[k])) out[k] = p[k];
  return out;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [household, setHousehold] = useState<Household>({});
  const [personal, setPersonal] = useState<Personal>({});
  const [saved, setSaved] = useState<SavedElections | null>(null);
  const [introSeen, setIntroSeen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(HOUSEHOLD_KEY);
        if (raw) setHousehold(clean(JSON.parse(raw) as Household));
      } catch { /* unreadable: start empty */ }
      try {
        const raw = await SecureStore.getItemAsync(PERSONAL_KEY);
        if (raw) setPersonal(cleanPersonal(JSON.parse(raw) as Personal));
      } catch { /* unreadable: start empty */ }
      try {
        const f = electionsFile();
        if (f.exists) setSaved(JSON.parse(await f.text()) as SavedElections);
      } catch { /* start empty */ }
      try { setIntroSeen(introFile().exists); } catch { /* show the welcome again */ }
      setReady(true);
    })();
  }, []);

  const saveHousehold = useCallback(async (h: Household) => {
    const c = clean(h);
    setHousehold(c);
    await SecureStore.setItemAsync(HOUSEHOLD_KEY, JSON.stringify(c));
  }, []);
  // "Clear my answers": the household and the optional questions about the person, both gone from the phone.
  const clearHousehold = useCallback(async () => {
    setHousehold({});
    setPersonal({});
    await SecureStore.deleteItemAsync(HOUSEHOLD_KEY);
    await SecureStore.deleteItemAsync(PERSONAL_KEY);
  }, []);
  const savePersonal = useCallback(async (p: Personal) => {
    const c = cleanPersonal(p);
    setPersonal(c);
    await SecureStore.setItemAsync(PERSONAL_KEY, JSON.stringify(c));
  }, []);
  const saveElections = useCallback((s: Omit<SavedElections, 'savedAt'>) => {
    const v = { ...s, savedAt: new Date().toISOString() };
    setSaved(v);
    try {
      const f = electionsFile();
      if (f.exists) f.delete();
      f.create();
      f.write(JSON.stringify(v));
    } catch { /* kept for this session only */ }
  }, []);
  const clearElections = useCallback(() => {
    setSaved(null);
    try { const f = electionsFile(); if (f.exists) f.delete(); } catch { /* nothing to remove */ }
  }, []);

  const markIntroSeen = useCallback(() => {
    setIntroSeen(true);
    try { const f = introFile(); if (!f.exists) f.create(); } catch { /* shown again next launch */ }
  }, []);

  const value = useMemo<Store>(() => ({ ready, household, complete: householdComplete(household), saveHousehold, clearHousehold, personal, savePersonal, saved, saveElections, clearElections, introSeen, markIntroSeen }),
    [ready, household, saveHousehold, clearHousehold, personal, savePersonal, saved, saveElections, clearElections, introSeen, markIntroSeen]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
