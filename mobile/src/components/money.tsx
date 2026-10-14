import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { AppReceiptSetRef, BallotResponse, ReceiptSetResponse } from '@/lib/appApi';
import { gridKey, modelCaveat, type Household } from '@/lib/household';
import { PLEDGE_LABELS, RECEIPT_FIELDS, currentLawLines, monthlyGist } from '@/lib/receipts';
import { loadReceiptSet } from '@/core/api';
import { usePalette } from '@/core/theme';
import { Body, Card, ErrorState, H3, LinkRow, Skeleton, Small, s } from '@/components/ui';

type Receipts = NonNullable<Extract<BallotResponse, { ok: true }>['receipts']>;
type Set = Extract<ReceiptSetResponse, { ok: true }>;
const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const row = (set: Set, key: string) => {
  const v = set.rows[key];
  return v ? Object.fromEntries(set.fields.map((f, i) => [f, v[i]])) as Record<string, number> : null;
};

// The money layer, worked out on the phone. The whole reform set is downloaded (the same file for everyone) and this
// household's row is looked up here by its grid key, so the answers never leave the phone.
export function useReceiptSets(receipts: Receipts | null, refs: AppReceiptSetRef[]) {
  const [sets, setSets] = useState<Record<string, Set>>({});
  const [error, setError] = useState<string | null>(null);
  const ids = refs.map((r) => r.url).join('|');
  useEffect(() => {
    let live = true;
    if (!receipts || !refs.length) return;
    Promise.all(refs.map((r) => loadReceiptSet(r))).then((all) => { if (live) setSets(Object.fromEntries(all.map((x) => [x.id, x]))); }).catch((e: Error) => { if (live) setError(e.message); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
  return { sets, error };
}

// Current law for this household (the starting point every pledge is measured against).
export function CurrentLaw({ receipts, household, complete }: { receipts: Receipts | null; household: Household; complete: boolean }) {
  const c = usePalette();
  const base = receipts?.sets.find((r) => r.id === receipts.baseline_id);
  const { sets, error } = useReceiptSets(receipts, base && complete ? [base] : []);
  if (!complete) return <Small>Answer the household questions in Profile to see money figures for a household like yours. They stay on this phone.</Small>;
  const caveat = modelCaveat(household);
  if (caveat) return (
    <Card>
      <H3>A household like this one: no money figures</H3>
      <Small>{caveat.text}</Small>
      {caveat.sources.map((x) => <LinkRow key={x.url} label={x.label} url={x.url} />)}
    </Card>
  );
  if (!receipts || !base) return <Small>No money figures are available for this ballot.</Small>;
  if (error) return <ErrorState message={error} />;
  const set = sets[base.id];
  if (!set) return <Skeleton lines={5} />;
  const key = gridKey(household)!;
  const r = row(set, key);
  if (!r) return <Small>No calculation is available for this combination of bands.</Small>;
  return (
    <Card>
      <H3>A household like this one, under current law</H3>
      <Small>Per year, for a representative household in your bands, calculated with PolicyEngine UK {set.version}. Not you, and not a voting guide.</Small>
      <View accessibilityRole="summary" style={{ marginTop: 6 }}>
        {currentLawLines(key, r).map((l) => (
          <View key={l.key} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.line }} accessible accessibilityLabel={`${l.label}: ${l.sign === '-' ? 'minus ' : ''}${gbp.format(l.amount)}`}>
            <Text style={[s.small, { color: c.ink, flex: 1, fontWeight: l.key === 'household_net_income' ? '800' : '400' }]}>{l.label}</Text>
            <Text style={[s.small, { color: c.ink, fontWeight: l.key === 'household_net_income' ? '800' : '600' }]}>{l.sign === '-' ? '−' : l.sign}{gbp.format(l.amount)}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

// One party's modelled pledge against current law, for this household. Shown inside that party's candidate section.
export function PledgeReceipt({ receipts, partyEcId, household, complete }: { receipts: Receipts | null; partyEcId: string | null; household: Household; complete: boolean }) {
  const c = usePalette();
  const base = receipts?.sets.find((r) => r.id === receipts.baseline_id);
  const ref = partyEcId ? receipts?.sets.find((r) => r.party_ec_id === partyEcId) : undefined;
  const { sets, error } = useReceiptSets(receipts, base && ref && complete && !modelCaveat(household) ? [base, ref] : []);
  if (!complete || !base || !ref || modelCaveat(household)) return null;
  if (error) return <ErrorState message={error} />;
  const a = sets[base.id], b = sets[ref.id];
  if (!a || !b) return <Skeleton lines={4} />;
  const key = gridKey(household)!;
  const ra = row(a, key), rb = row(b, key);
  if (!ra || !rb) return null;
  const delta = rb.household_net_income - ra.household_net_income;
  return (
    <Card style={{ marginTop: 8 }}>
      <Small>Modelled: {ref.label ?? 'Modelled pledge'}</Small>
      <Body style={{ fontWeight: '800' }}>{monthlyGist(delta)}</Body>
      <Small>for a household like this one. Whether that is good or bad depends on what the money is for; that judgement is yours.</Small>
      {RECEIPT_FIELDS.map((f) => {
        const x = ra[f] ?? 0, y = rb[f] ?? 0;
        return (
          <View key={f} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: c.line }} accessible accessibilityLabel={`${PLEDGE_LABELS[f]}: current law ${gbp.format(x)}, under this pledge ${gbp.format(y)}`}>
            <Text style={[s.small, { color: c.ink, flex: 1 }]}>{PLEDGE_LABELS[f]}</Text>
            <Text style={[s.small, { color: c.ink }]}>{gbp.format(x)} → {gbp.format(y)}</Text>
          </View>
        );
      })}
      <Small>PolicyEngine UK {b.version}, from the sourced pledge{ref.sources.length ? `: ${ref.sources.map((x) => x.title).join('; ')}` : ''}. One pledge modelled on its own; not a forecast.</Small>
    </Card>
  );
}
