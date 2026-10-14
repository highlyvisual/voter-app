import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import type { AppElection } from '@/lib/appApi';
import { usePalette } from '@/core/theme';
import { LinkRow, Small, longDate, openLink, s } from '@/components/ui';

// The elections at an address. A covered ballot opens the native ballot screen; one we don't cover yet opens the
// area page on the website.
export function ElectionList({ outcode, elections, placeUrl }: { outcode: string; elections: AppElection[]; placeUrl: string }) {
  const c = usePalette();
  return (
    <View style={{ gap: 12 }}>
      <Text style={[s.h2, { color: c.ink }]} accessibilityRole="header">
        {elections.length ? `Coming up in ${outcode}` : `No elections are scheduled in ${outcode} yet`}
      </Text>
      {elections.map((e) => (
        <Pressable
          key={e.ballot_paper_id}
          onPress={() => (e.covered ? router.push({ pathname: '/elections/[ballotId]', params: { ballotId: e.ballot_paper_id } }) : openLink(placeUrl, c))}
          accessibilityRole={e.covered ? 'button' : 'link'}
          accessibilityLabel={`${e.election_name}, ${e.post_label}, ${longDate(e.election_date)}`}
          accessibilityHint={e.covered ? 'Opens the candidates and what changes for you' : 'Not covered yet. Opens your area page on the website'}
          style={({ pressed }) => [s.card, { backgroundColor: pressed ? c.line : c.panel, borderColor: c.line, minHeight: 48 }]}
        >
          <Text style={[s.small, { color: c.accent, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }]}>{longDate(e.election_date)}</Text>
          <Text style={[s.h3, { color: c.ink }]}>{e.election_name}</Text>
          <Small>{e.post_label}</Small>
          <Small>{e.covered ? 'See the candidates and what changes for you ›' : 'Not covered yet. See your area ›'}</Small>
        </Pressable>
      ))}
      <LinkRow label="What’s happening where you live" url={placeUrl} hint="Opens your area page on the website" />
    </View>
  );
}
