import { Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { TOPICS, TOPIC_SHORT } from '@/lib/types';
import { savedAtText } from '@/core/api';
import { useStore } from '@/core/store';
import { usePalette } from '@/core/theme';
import { useBallot } from '@/core/useBallot';
import { ClaimGroup } from '@/components/claims';
import { CurrentLaw, PledgeReceipt } from '@/components/money';
import { Banner, Card, ErrorState, H1, Loading, Screen, Small, s } from '@/components/ui';

// What changes for you, on one topic: every candidate in ballot-paper order, each with the positions that apply to this
// household first and the rest under "Applies to others". The split runs on the phone (lib/household.ts claimApplies).
// Money: the current-law figures for this household, and each party's modelled pledge where there is one.
export default function TopicScreen() {
  const { ballotId, topic } = useLocalSearchParams<{ ballotId: string; topic: string }>();
  const c = usePalette();
  const { household, complete } = useStore();
  const { ballot: b, fromCache, savedAt, error, refreshing, refresh, retry } = useBallot(ballotId);
  const name = TOPICS.find(([id]) => id === topic)?.[1] ?? topic;
  const money = topic === 'money_and_cost_of_living';

  return (
    <Screen refreshing={refreshing} onRefresh={refresh} edges={[]}>
      <Stack.Screen options={{ title: TOPIC_SHORT[topic] ?? 'Topic' }} />
      {fromCache ? <Banner>You’re offline. Showing the copy saved on {savedAtText(savedAt)}.</Banner> : null}
      {error && !b ? <ErrorState message={error} onRetry={retry} /> : null}
      {!b && !error ? <Loading label="Loading positions" /> : null}
      {b ? (
        <>
          <H1>{name}</H1>
          <Small>{complete ? 'Positions that apply to your household come first. Your answers stay on this phone.' : 'Answer the household questions in Profile to see which positions apply to you first.'}</Small>
          {money ? <CurrentLaw receipts={b.receipts} household={household} complete={complete} /> : null}
          {b.candidates.map((k) => {
            const party = k.party_ec_id ? b.parties.find((p) => p.ec_id === k.party_ec_id) : undefined;
            const list = [...k.claims, ...(party?.claims ?? [])].filter((x) => x.topic === topic);
            return (
              <Card key={k.id} style={{ paddingLeft: 0, flexDirection: 'row', overflow: 'hidden' }}>
                <View style={{ width: 6, marginLeft: 0, marginVertical: -16, backgroundColor: party?.colour ?? c.line }} />
                <View style={{ flex: 1, paddingLeft: 14, gap: 6 }}>
                  <Text style={[s.h3, { color: c.ink }]} accessibilityRole="header">{k.name}</Text>
                  <Small>{k.party_label}</Small>
                  <ClaimGroup claims={list} household={household} complete={complete} emptyText="No published position found yet." />
                  {money ? <PledgeReceipt receipts={b.receipts} partyEcId={k.party_ec_id} household={household} complete={complete} /> : null}
                </View>
              </Card>
            );
          })}
        </>
      ) : null}
    </Screen>
  );
}
