import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { TOPICS, TOPIC_SHORT } from '@/lib/types';
import { savedAtText } from '@/core/api';
import { useStore } from '@/core/store';
import { F, TAP, usePalette } from '@/core/theme';
import { useBallot } from '@/core/useBallot';
import { ClaimGroup, candidateOnTopic } from '@/components/claims';
import { CurrentLaw, PledgeReceipt } from '@/components/money';
import { Eyebrow } from '@/components/nextVote';
import { Banner, ErrorState, Loading, Screen, Small, haptic, s } from '@/components/ui';

// What changes for you, on one topic: every candidate in ballot-paper order, the same card for each, with the
// positions that apply to this household first and the rest under "Applies to others" (closed). The split runs on the
// phone (lib/household.ts claimApplies). Money: the current-law figures for this household, and each party's modelled
// pledge where there is one.
export default function TopicScreen() {
  const { ballotId, topic } = useLocalSearchParams<{ ballotId: string; topic: string }>();
  const c = usePalette();
  const { household, complete, personal } = useStore();
  const { ballot: b, fromCache, savedAt, error, refreshing, refresh, retry } = useBallot(ballotId);
  const name = TOPICS.find(([id]) => id === topic)?.[1] ?? topic;
  const money = topic === 'money_and_cost_of_living';

  return (
    <Screen refreshing={refreshing} onRefresh={refresh} edges={[]}>
      <Stack.Screen options={{ title: TOPIC_SHORT[topic] ?? 'Topic' }} />
      {fromCache ? <Banner>You’re offline. Showing the copy saved {savedAtText(savedAt)}.</Banner> : null}
      {error && !b ? <ErrorState message={error} onRetry={retry} /> : null}
      {!b && !error ? <Loading label="Loading positions" /> : null}
      {b ? (
        <>
          <Eyebrow>What changes for you</Eyebrow>
          <Text style={[s.h1, { color: c.ink }]} accessibilityRole="header">{name}</Text>
          <Small style={{ color: c.muted }}>{complete ? 'What applies to a household like yours comes first. Worked out on this phone.' : 'Everyone on the paper, in ballot order. Answer the questions in You to see what applies to you first.'}</Small>
          {money ? <CurrentLaw receipts={b.receipts} household={household} complete={complete} /> : null}
          {b.candidates.map((k) => {
            const party = k.party_ec_id ? b.parties.find((p) => p.ec_id === k.party_ec_id) : undefined;
            const { list, label } = candidateOnTopic(k, party, String(topic));
            return (
              <View key={k.id} style={{ backgroundColor: c.panel, borderRadius: 20, borderWidth: 1, borderColor: c.line, padding: 16, gap: 6 }}>
                <Pressable onPress={() => { haptic.choose(); router.push({ pathname: '/elections/[ballotId]/candidate/[candidateId]', params: { ballotId, candidateId: String(k.id) } }); }}
                  accessibilityRole="button" accessibilityLabel={`Number ${k.position}, ${k.name}, ${k.party_label}`} accessibilityHint="Opens their page" style={({ pressed }) => [{ gap: 6, opacity: pressed ? 0.7 : 1, minHeight: TAP }]}>
                  <Text style={{ fontFamily: F.bold, fontSize: 12, color: c.muted }}>No. {k.position}</Text>
                  <Text style={[s.h3, { color: c.ink }]}>{k.name}</Text>
                  <View style={{ alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: party?.colour ? 9 : 0, paddingVertical: party?.colour ? 3 : 0, backgroundColor: party?.colour ?? 'transparent' }}>
                    <Text style={{ fontFamily: F.semi, fontSize: 12, color: party?.colour ? (party.ink ?? '#000000') : c.muted }}>{k.party_label || 'Independent'}</Text>
                  </View>
                </Pressable>
                <ClaimGroup claims={list} label={label} household={household} complete={complete} personal={personal} emptyText="No published position found yet." />
                {money ? <PledgeReceipt receipts={b.receipts} partyEcId={k.party_ec_id} household={household} complete={complete} /> : null}
              </View>
            );
          })}
        </>
      ) : null}
    </Screen>
  );
}
