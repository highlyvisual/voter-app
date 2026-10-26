import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SITE } from '@/core/api';
import { F, TAP, usePalette } from '@/core/theme';
import { IndependentLine } from '@/components/brand';
import { Screen, haptic, openLink, s } from '@/components/ui';

type Item = { label: string; icon: keyof typeof Ionicons.glyphMap; url?: string; to?: '/sources' };
const ITEMS: Item[][] = [
  [
    { label: 'Learn', icon: 'book-outline', url: `${SITE}/learn` },
    { label: 'How voting works', icon: 'checkbox-outline', url: `${SITE}/how-to-vote` },
  ],
  [
    { label: 'Sources', icon: 'document-text-outline', to: '/sources' },
    { label: 'How this works', icon: 'help-circle-outline', url: `${SITE}/about` },
    { label: 'Who we are', icon: 'people-outline', url: `${SITE}/who-we-are` },
    { label: 'Privacy and data use', icon: 'lock-closed-outline', url: `${SITE}/about/data-use` },
    { label: 'Accessibility', icon: 'accessibility-outline', url: `${SITE}/accessibility` },
  ],
  [{ label: 'Tell us what you think', icon: 'chatbubble-ellipses-outline', url: `${SITE}/feedback` }],
];

// More: Sources, and the website's own pages, opened in the in-app browser. The app holds no content of its own.
export default function More() {
  const c = usePalette();
  return (
    <Screen>
      <Text style={[s.h1, { color: c.ink, fontSize: 34, lineHeight: 40 }]} accessibilityRole="header">More</Text>
      {ITEMS.map((group, g) => (
        <View key={g} style={{ backgroundColor: c.panel, borderRadius: 20, borderWidth: 1, borderColor: c.line, paddingLeft: 16 }}>
          {group.map((x, i) => (
            <Pressable key={x.label} onPress={() => { haptic.choose(); if (x.to) router.push(x.to); else openLink(x.url!, c); }} accessibilityRole={x.to ? 'button' : 'link'} accessibilityLabel={x.label} accessibilityHint={x.to ? undefined : 'Opens on the website'}
              style={({ pressed }) => [{ minHeight: TAP + 6, flexDirection: 'row', alignItems: 'center', gap: 14, paddingRight: 14, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, opacity: pressed ? 0.6 : 1 }]}>
              <Ionicons name={x.icon} size={20} color={c.aubergine} />
              <Text style={{ fontFamily: F.semi, fontSize: 16, color: c.ink, flex: 1 }}>{x.label}</Text>
              <Ionicons name={x.to ? 'chevron-forward' : 'open-outline'} size={16} color={c.muted} />
            </Pressable>
          ))}
        </View>
      ))}
      <View style={{ backgroundColor: c.sand, borderRadius: 20, padding: 16, gap: 6 }}>
        <Text style={[s.h3, { color: c.ink }]} accessibilityRole="header">What this app keeps</Text>
        <Text style={[s.small, { color: c.soft }]}>Your answers and the first part of your postcode, on this phone only. Ballots you open and money figures are kept on the phone too, so they still read offline. Nothing about you is sent to What’s It To Me?: the app asks the website for the same ballots and figures it gives everyone, and works out what applies to you here.</Text>
      </View>
      <IndependentLine />
      <Text style={[s.small, { color: c.muted, textAlign: 'center' }]}>Version {Constants.expoConfig?.version ?? ''}</Text>
    </Screen>
  );
}
