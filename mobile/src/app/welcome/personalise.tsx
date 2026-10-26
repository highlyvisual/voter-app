import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { FIELD_KEYS } from '@/lib/household';
import { useStore } from '@/core/store';
import { F, usePalette } from '@/core/theme';
import { Emblem } from '@/components/brand';
import { Lede, Step, TextButton, Title, useFinishIntro } from '@/components/Onboarding';
import { Button, s } from '@/components/ui';

// Welcome, 3 of 3: the offer to personalise, with the privacy promise said once, plainly.
export default function Personalise() {
  const c = usePalette();
  const { saved } = useStore();
  const finish = useFinishIntro();
  const found = saved ? (saved.elections.length ? `Found ${saved.elections.length === 1 ? 'your election' : `${saved.elections.length} elections`} in ${saved.outcode}.` : `No elections are scheduled in ${saved.outcode} yet.`) : null;
  return (
    <Step step={3} of={3} onSkip={finish} skipLabel="Not now"
      foot={<>
        <Button label="Personalise" onPress={() => router.push({ pathname: '/ask', params: { n: '0', mode: 'intro' } })} hint={`${FIELD_KEYS.length} quick questions, one at a time`} />
        <TextButton label="Not now, take me to my next vote" onPress={finish} />
      </>}>
      {found ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: c.aubergineSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={18} color={c.aubergine} />
          <Text style={{ fontFamily: F.semi, fontSize: 15, color: c.aubergine }}>{found}</Text>
        </View>
      ) : null}
      <Title italic="to you?">What’s it </Title>
      <Lede>{FIELD_KEYS.length} quick questions about your household. Then what each candidate has said that applies to a home like yours comes first.</Lede>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ backgroundColor: c.panel, borderRadius: 24, borderWidth: 1, borderColor: c.line, padding: 22, gap: 14, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.roseSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="lock-closed" size={28} color={c.rose} />
          </View>
          <Text style={[s.h2, { color: c.ink, marginTop: 0, textAlign: 'center' }]} accessibilityRole="header">Your answers never leave this phone</Text>
          <Text style={[s.body, { color: c.soft, textAlign: 'center' }]}>Not to us, not to anyone. Tap to answer, skip any, change them whenever you like.</Text>
          <Emblem size={36} />
        </View>
      </View>
    </Step>
  );
}
