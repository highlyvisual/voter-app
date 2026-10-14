import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { FIELD_KEYS, FIELDS } from '@/lib/household';
import { savedAtText } from '@/core/api';
import { useStore } from '@/core/store';
import { F, TAP, usePalette } from '@/core/theme';
import { useBallot } from '@/core/useBallot';
import { Countdown, Deadlines, NameCards, SectionTitle, TopicsForYou } from '@/components/nextVote';
import { Banner, ErrorState, LinkRow, Loading, Screen, Small, haptic, s } from '@/components/ui';

// The ballot: the countdown, the deadlines, the paper as name cards in ballot-paper order (Romily's choice C), and what
// changes for you by topic, the household's own first with the reason behind an (i). The same pieces as Home.
export default function BallotScreen() {
  const { ballotId } = useLocalSearchParams<{ ballotId: string }>();
  const c = usePalette();
  const { household, complete, personal } = useStore();
  const { ballot: b, fromCache, savedAt, error, refreshing, refresh, retry } = useBallot(ballotId);
  const short = b?.ballot.area.replace(/^.*?:\s*/, '') ?? '';

  return (
    <Screen refreshing={refreshing} onRefresh={refresh} edges={[]}>
      <Stack.Screen options={{ title: short || 'Ballot' }} />
      {fromCache ? <Banner>You’re offline. Showing the copy saved {savedAtText(savedAt)}.</Banner> : null}
      {error && !b ? <ErrorState message={error} onRetry={retry} /> : null}
      {!b && !error ? <Loading label="Loading the ballot" /> : null}
      {b ? (
        <>
          {b.ballot.cancelled ? <Banner>This election has been cancelled.</Banner> : null}
          {b.ballot.postponed ? <Banner>This election has been postponed.{b.ballot.postponed_note ? ` ${b.ballot.postponed_note}` : ''}</Banner> : null}
          <Countdown date={b.ballot.date} name={b.ballot.by_election_reason ? `${short} by-election` : b.ballot.name} area={b.ballot.area} />
          {b.ballot.by_election_reason ? <Small style={{ color: c.muted }}>Why there’s a by-election: {b.ballot.by_election_reason.charAt(0).toUpperCase() + b.ballot.by_election_reason.slice(1).toLowerCase().replace(/_/g, ' ')}</Small> : null}

          <ProfileStrip />

          <SectionTitle>Before polling day</SectionTitle>
          <Deadlines items={b.key_dates.items} idRequired={b.key_dates.id_required} />
          {b.key_dates.notice_url ? <LinkRow label="The council’s official notice" url={b.key_dates.notice_url} /> : null}

          <SectionTitle right={<Text style={[s.small, { color: c.muted }]}>in ballot order</Text>}>{b.candidates.length === 1 ? 'The candidate' : `The ${b.candidates.length} on your paper`}</SectionTitle>
          {b.ballot.uncontested ? <Banner>Uncontested: there are no more candidates than seats, so no vote will be held.</Banner> : null}
          <Small style={{ color: c.muted }}>In the order you’ll see them on the paper, alphabetical by surname, as the law sets it.</Small>
          <NameCards ballotId={ballotId} candidates={b.candidates} parties={b.parties} />

          <SectionTitle>What changes for you</SectionTitle>
          <TopicsForYou ballotId={ballotId} b={b} household={household} complete={complete} personal={personal} />

          <LinkRow label="This ballot on the website" url={b.ballot.web_url} />
          <LinkRow label="Sources for everything in this app" onPress={() => router.push('/sources')} />
        </>
      ) : null}
    </Screen>
  );
}

// "Your answers so far" (Romily's choice C12): the household in one line, with Edit, so it is always visible.
function ProfileStrip() {
  const c = usePalette();
  const { household, complete } = useStore();
  const bits = FIELD_KEYS.filter((k) => household[k] && k !== 'student').map((k) => (FIELDS[k].options as readonly (readonly [string, string])[]).find(([v]) => v === household[k])?.[1]).filter(Boolean);
  return (
    <Pressable onPress={() => { haptic.choose(); router.navigate('/profile'); }} accessibilityRole="button" accessibilityHint="Opens You, to change your answers"
      style={({ pressed }) => [{ minHeight: TAP, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.roseSoft, borderRadius: 16, padding: 12, opacity: pressed ? 0.8 : 1 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.eyebrow, { color: c.rose }]}>{complete ? 'Your answers so far' : 'Not personalised yet'}</Text>
        <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 19, color: c.ink }} numberOfLines={2}>{bits.length ? bits.join(' · ') : 'Answer a few questions to see what applies to a household like yours first.'}</Text>
      </View>
      <Text style={[s.link, { color: c.accent }]}>{bits.length ? 'Edit' : 'Start'}</Text>
    </Pressable>
  );
}
