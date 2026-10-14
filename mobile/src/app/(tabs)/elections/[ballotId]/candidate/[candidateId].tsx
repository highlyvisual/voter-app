import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { TOPICS } from '@/lib/types';
import { savedAtText } from '@/core/api';
import { useStore } from '@/core/store';
import { usePalette } from '@/core/theme';
import { useBallot } from '@/core/useBallot';
import { ClaimGroup } from '@/components/claims';
import { PledgeReceipt } from '@/components/money';
import { Banner, Card, ErrorState, H1, H2, H3, LinkRow, Loading, Screen, Small, s } from '@/components/ui';

// One candidate: photo (the only place photos appear), party, statement in their own words, and their own and their
// party's verified positions by topic, split for this household on the phone. Every candidate gets the same layout.
export default function CandidateScreen() {
  const { ballotId, candidateId } = useLocalSearchParams<{ ballotId: string; candidateId: string }>();
  const c = usePalette();
  const { household, complete } = useStore();
  const { ballot: b, fromCache, savedAt, error, refreshing, refresh, retry } = useBallot(ballotId);
  const k = b?.candidates.find((x) => String(x.id) === candidateId);
  const party = k?.party_ec_id ? b?.parties.find((p) => p.ec_id === k.party_ec_id) : undefined;
  const all = k ? [...k.claims, ...(party?.claims ?? [])] : [];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh} edges={[]}>
      <Stack.Screen options={{ title: k?.name ?? 'Candidate' }} />
      {fromCache ? <Banner>You’re offline. Showing the copy saved on {savedAtText(savedAt)}.</Banner> : null}
      {error && !b ? <ErrorState message={error} onRetry={retry} /> : null}
      {!b && !error ? <Loading label="Loading the candidate" /> : null}
      {b && !k ? <ErrorState message="This candidate is no longer on the ballot." /> : null}
      {k ? (
        <>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            {k.photo_url ? (
              <Image source={{ uri: k.photo_url }} style={{ width: 96, height: 120, borderRadius: 12, backgroundColor: c.skeleton }} contentFit="cover" accessible accessibilityLabel={`Photo of ${k.name}`} />
            ) : null}
            <View style={{ flex: 1, gap: 6 }}>
              <H1>{k.name}</H1>
              {/* The party's own colour, on its own candidate's screen only (party material). */}
              <View style={{ alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: party?.colour ?? c.chip }}>
                <Text style={[s.small, { fontWeight: '800', color: party?.ink ?? c.ink }]}>{k.party_label}</Text>
              </View>
              {k.party_label !== k.registered_party && k.registered_party ? <Small>Registered party: {k.registered_party}</Small> : null}
              {k.is_incumbent ? <Small>Currently holds this seat.</Small> : null}
            </View>
          </View>
          {/* photo_credit can be a licence code such as "other" rather than a name; then only the source is named. */}
          {k.photo_url ? <Small>{k.photo_credit && !/^(other|public-domain|profile-photo|copyright-assigned|sopn)$/i.test(k.photo_credit) ? `Photo: ${k.photo_credit}, via Democracy Club.` : "Photo via Democracy Club."}</Small> : null}

          <H2>In their own words</H2>
          {k.statement ? (
            <Card>
              <Small>Statement to voters, as published on Democracy Club:</Small>
              <Text style={[s.body, { color: c.ink }]}>{k.statement}</Text>
            </Card>
          ) : <Small>No statement to voters has been published.</Small>}
          {k.homepage_url ? <LinkRow label="Their own website" url={k.homepage_url} /> : null}

          <H2>Positions by topic</H2>
          <Small>{complete ? 'Positions that apply to your household come first in each topic. Worked out on this phone.' : 'Answer the household questions in Profile to see which positions apply to you first.'}</Small>
          {TOPICS.map(([id, name]) => {
            const list = all.filter((x) => x.topic === id);
            return (
              <Card key={id}>
                <H3>{name}</H3>
                <ClaimGroup claims={list} household={household} complete={complete} emptyText="No published position found yet." />
                {id === 'money_and_cost_of_living' ? <PledgeReceipt receipts={b!.receipts} partyEcId={k.party_ec_id} household={household} complete={complete} /> : null}
              </Card>
            );
          })}
        </>
      ) : null}
    </Screen>
  );
}
