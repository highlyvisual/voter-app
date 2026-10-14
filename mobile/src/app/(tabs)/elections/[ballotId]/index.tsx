import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { TOPICS, TOPIC_SHORT } from '@/lib/types';
import { savedAtText } from '@/core/api';
import { useStore } from '@/core/store';
import { TAP, usePalette } from '@/core/theme';
import { useBallot } from '@/core/useBallot';
import { CandidateCard, KeyDates } from '@/components/ballot';
import { Banner, Card, ErrorState, H1, H2, LinkRow, Loading, Screen, Small, longDate, s } from '@/components/ui';

// The ballot: key dates, the candidates in ballot-paper order, and "What changes for you" by topic.
export default function BallotScreen() {
  const { ballotId } = useLocalSearchParams<{ ballotId: string }>();
  const c = usePalette();
  const { complete } = useStore();
  const { ballot: b, fromCache, savedAt, error, refreshing, refresh, retry } = useBallot(ballotId);
  const parties = new Map((b?.parties ?? []).map((p) => [p.ec_id, p]));
  const count = (topic: string) => b ? b.parties.reduce((n, p) => n + p.claims.filter((x) => x.topic === topic).length, 0) + b.candidates.reduce((n, k) => n + k.claims.filter((x) => x.topic === topic).length, 0) : 0;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh} edges={[]}>
      <Stack.Screen options={{ title: b?.ballot.area ?? 'Ballot' }} />
      {fromCache ? <Banner>You’re offline. Showing the copy saved on {savedAtText(savedAt)}.</Banner> : null}
      {error && !b ? <ErrorState message={error} onRetry={retry} /> : null}
      {!b && !error ? <Loading label="Loading the ballot" /> : null}
      {b ? (
        <>
          <Text style={[s.small, { color: c.accent, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }]}>{longDate(b.ballot.date)}</Text>
          <H1>{b.ballot.name}</H1>
          {b.ballot.cancelled ? <Banner>This election has been cancelled.</Banner> : null}
          {b.ballot.postponed ? <Banner>This election has been postponed.{b.ballot.postponed_note ? ` ${b.ballot.postponed_note}` : ''}</Banner> : null}
          {b.ballot.uncontested ? <Banner>Uncontested: there are no more candidates than seats, so no vote will be held.</Banner> : null}
          {b.ballot.by_election_reason ? <Small>Why there’s a by-election: {b.ballot.by_election_reason.charAt(0).toUpperCase() + b.ballot.by_election_reason.slice(1).toLowerCase().replace(/_/g, " ")}</Small> : null}

          <KeyDates b={b} />

          <H2>{b.candidates.length === 1 ? 'The candidate' : `The ${b.candidates.length} candidates`}</H2>
          <Small>In ballot-paper order (alphabetical by surname), as the law sets it. Tap a candidate for their statement and positions.</Small>
          <View style={{ gap: 10 }}>
            {b.candidates.map((k) => <CandidateCard key={k.id} ballotId={ballotId} c={k} party={k.party_ec_id ? parties.get(k.party_ec_id) : undefined} />)}
          </View>

          <H2>What changes for you</H2>
          {/* Topics in the website's fixed order. TODO(Romily): order by the household's profile, with the reason shown (round five). */}
          <Small>{complete ? 'Each topic shows the positions that apply to your household first. Your answers stay on this phone.' : 'Answer the household questions in Profile to see which positions apply to you first. Your answers stay on this phone.'}</Small>
          <Card style={{ paddingVertical: 4 }}>
            {TOPICS.map(([id, name]) => {
              const n = count(id);
              return (
                <Pressable key={id} onPress={() => router.push({ pathname: '/elections/[ballotId]/topic/[topic]', params: { ballotId, topic: id } })} accessibilityRole="button" accessibilityLabel={`${name}, ${n} ${n === 1 ? 'position' : 'positions'}`}
                  style={({ pressed }) => [{ minHeight: TAP, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: id === TOPICS[0][0] ? 0 : 1, borderTopColor: c.line, opacity: pressed ? 0.6 : 1 }]}>
                  <Text style={[s.body, { color: c.ink, flexShrink: 1 }]}>{TOPIC_SHORT[id] ?? name}</Text>
                  <Text style={[s.small, { color: c.soft }]}>{n ? `${n} ›` : 'None yet ›'}</Text>
                </Pressable>
              );
            })}
          </Card>

          <LinkRow label="Open this ballot on the website" url={b.ballot.web_url} />
          <Small>Sources: {b.source}.</Small>
        </>
      ) : null}
    </Screen>
  );
}
