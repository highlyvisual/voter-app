import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useStore } from '@/core/store';
import { usePalette } from '@/core/theme';
import { Emblem } from '@/components/brand';
import { ComingUp, upcoming } from '@/components/nextVote';
import { Button, LinkRow, Screen, Small, s, shortDate } from '@/components/ui';

// Coming up: every election saved for the area, soonest first. Nothing is fetched until a ballot is opened.
export default function ComingUpTab() {
  const c = usePalette();
  const { saved, ready } = useStore();
  if (!ready) return null;
  const { ahead } = saved ? upcoming(saved.elections) : { ahead: [] };
  return (
    <Screen>
      <Text style={[s.h1, { color: c.ink, fontSize: 34, lineHeight: 40 }]} accessibilityRole="header">Coming up</Text>
      {saved ? (
        <>
          <Small style={{ color: c.muted }}>Near {saved.outcode}, soonest first.</Small>
          <ComingUp list={ahead} placeUrl={saved.placeUrl} />
          <LinkRow label="What’s happening where you live" url={saved.placeUrl} hint="Opens your area page on the website" />
          <Small style={{ color: c.muted }}>Found on {shortDate(saved.savedAt)}. Change your area from the pill at the top of Home.</Small>
        </>
      ) : (
        <View style={{ alignItems: 'center', gap: 16, paddingVertical: 32 }}>
          <Emblem size={96} />
          <Text style={[s.h2, { color: c.ink, textAlign: 'center' }]}>Nothing here yet</Text>
          <Text style={[s.body, { color: c.soft, textAlign: 'center' }]}>Tell us where you vote and the elections there will appear here.</Text>
          <Button label="Find my next vote" onPress={() => router.navigate('/')} />
        </View>
      )}
    </Screen>
  );
}
