import { useCallback, useEffect, useState } from 'react';
import type { BallotResponse } from '@/lib/appApi';
import { loadBallot, type Loaded } from '@/core/api';

export type Ballot = Extract<BallotResponse, { ok: true }>;

// One ballot shared by the ballot, candidate and topic screens: fetched once per session (memory), refreshed on pull,
// and read from the phone's copy when offline (Loaded.fromCache).
const memory = new Map<string, Loaded<Ballot>>();

export function useBallot(id: string) {
  const [state, setState] = useState<Loaded<Ballot> | null>(memory.get(id) ?? null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await loadBallot(id);
      memory.set(id, r);
      setState(r);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  // First load: from memory if this session already has it (initial state), otherwise fetched; state is set only when
  // the reply arrives.
  useEffect(() => {
    if (memory.has(id)) return;
    let live = true;
    loadBallot(id).then((r) => { memory.set(id, r); if (live) setState(r); }, (e: Error) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [id]);
  const refresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);
  return { ballot: state?.data ?? null, fromCache: state?.fromCache ?? false, savedAt: state?.savedAt ?? null, error, refreshing, refresh, retry: load };
}
