import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { FIELDS, FIELD_KEYS, OPTIONAL_FIELDS, OPTIONAL_KEYS, type Household } from '@/lib/household';
import { PERSONAL_FIELDS, PERSONAL_KEYS, PERSONAL_WHY } from '@/lib/personal';
import { useStore } from '@/core/store';
import { F, TAP, usePalette } from '@/core/theme';
import { Conversation, type Ask } from '@/components/Conversation';
import { QUESTION } from '@/components/questions';
import { Button, Screen, haptic, s } from '@/components/ui';

// The extra household questions, asked as a person would. The answers and their bands are the website's.
const EXTRA_ASK: Record<string, string> = {
  disability: 'Is anyone in your household disabled, or living with a long-term health condition?',
  carer: 'Is anyone in your household an unpaid carer?',
  visa: 'Is anyone in your household on a UK visa, or seeking asylum?',
  benefits: 'Does your household get a means-tested benefit, like Universal Credit or Pension Credit?',
  drives: 'Does your household own or regularly drive a car?',
  veteran: 'Has anyone in your household served in the armed forces?',
};
const ABOUT_ASK: Record<string, string> = {
  ethnicity: 'Which ethnic group are you?',
  religion: 'What is your religion, if any?',
  sex: 'What is your sex?',
  trans: 'Is the gender you identify with the same as your sex registered at birth?',
  orientation: 'What is your sexual orientation?',
};
// The website's reason, first sentence, then what the app does with it: only positions whose own words name the group.
const aboutWhy = (k: keyof typeof PERSONAL_WHY) => `${PERSONAL_WHY[k].split('. ')[0]}. If you answer, positions whose own words name your group are marked and listed first, from every party that has any.`;

// You: the household (one row per question, tap to change, one per screen), then the extras and the optional questions
// about you as a conversation. Everything here stays on this phone and is never sent; "Clear my answers" removes it all.
export default function You() {
  const c = usePalette();
  const { household, complete, saveHousehold, personal, savePersonal, clearHousehold, saved } = useStore();
  const answered = FIELD_KEYS.filter((k) => household[k]).length;
  const firstOpen = FIELD_KEYS.findIndex((k) => !household[k]);

  const extras: Ask[] = OPTIONAL_KEYS.map((k) => ({ key: k, question: EXTRA_ASK[k] ?? OPTIONAL_FIELDS[k].label, options: OPTIONAL_FIELDS[k].options }));
  const about: Ask[] = PERSONAL_KEYS.map((k) => ({ key: k, question: ABOUT_ASK[k] ?? PERSONAL_FIELDS[k].label, options: PERSONAL_FIELDS[k].options, why: aboutWhy(k) }));

  return (
    <Screen>
      <Text style={[s.h1, { color: c.ink, fontSize: 34, lineHeight: 40 }]} accessibilityRole="header">You</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.roseSoft, borderRadius: 18, padding: 14 }}>
        <Ionicons name="lock-closed" size={22} color={c.rose} />
        <Text style={{ fontFamily: F.semi, fontSize: 15, lineHeight: 21, color: c.ink, flex: 1 }}>Your answers never leave this phone. Not to us, not to anyone.</Text>
      </View>

      <Section title="Your household" note={complete ? 'All answered' : `${answered} of ${FIELD_KEYS.length}`} />
      <View style={{ backgroundColor: c.panel, borderRadius: 20, borderWidth: 1, borderColor: c.line, paddingLeft: 16 }}>
        <Row label="Where you vote" value={saved ? saved.outcode : 'Not set'} onPress={() => router.navigate('/')} hint="Change it from the pill at the top of Home" first />
        {FIELD_KEYS.map((k) => {
          const v = (FIELDS[k].options as readonly (readonly [string, string])[]).find(([x]) => x === household[k])?.[1];
          return <Row key={k} label={FIELDS[k].label} value={v ?? 'Not answered'} muted={!v} onPress={() => router.push({ pathname: '/ask', params: { n: String(FIELD_KEYS.indexOf(k)), only: '1' } })} hint={`Change: ${QUESTION[k]}`} />;
        })}
      </View>
      {!complete ? <Button label={answered ? 'Answer the rest' : 'Answer 7 quick questions'} onPress={() => router.push({ pathname: '/ask', params: { n: String(Math.max(0, firstOpen)) } })} /> : null}

      <Section title="A few more, if you like" note="Optional" />
      <Text style={[s.small, { color: c.muted }]}>Plain yes or no, about the household. Left blank, nothing is assumed either way.</Text>
      <Conversation asks={extras} answers={household as Record<string, string | undefined>} onAnswer={(k, v) => saveHousehold({ ...household, [k]: v } as Household)} />

      <Section title="About you" note="Optional" />
      <Text style={[s.small, { color: c.muted }]}>Some positions name a group of people. Answer any of these and positions whose own words name yours are marked and listed first, from every party. Nothing is ranked or judged.</Text>
      <Conversation asks={about} answers={personal} onAnswer={(k, v) => savePersonal({ ...personal, [k]: v })} />

      <View style={{ height: 12 }} />
      <Button label="Clear my answers" kind="secondary" onPress={clearHousehold} hint="Deletes every answer, household and about you, from this phone" />
    </Screen>
  );
}

function Section({ title, note }: { title: string; note?: string }) {
  const c = usePalette();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 14 }}>
      <Text style={[s.h2, { color: c.ink, marginTop: 0 }]} accessibilityRole="header">{title}</Text>
      {note ? <Text style={[s.small, { color: c.muted }]}>{note}</Text> : null}
    </View>
  );
}

function Row({ label, value, onPress, hint, muted, first }: { label: string; value: string; onPress: () => void; hint?: string; muted?: boolean; first?: boolean }) {
  const c = usePalette();
  return (
    <Pressable onPress={() => { haptic.choose(); onPress(); }} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} accessibilityHint={hint}
      style={({ pressed }) => [{ minHeight: TAP + 8, flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 14, paddingVertical: 8, borderTopWidth: first ? 0 : 1, borderTopColor: c.line, opacity: pressed ? 0.6 : 1 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.small, { color: c.muted }]}>{label}</Text>
        <Text style={{ fontFamily: muted ? F.body : F.semi, fontSize: 16, color: muted ? c.muted : c.ink }}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.muted} />
    </Pressable>
  );
}
