import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { Text, View } from 'react-native';
import { FIELDS, FIELD_KEYS, type FieldKey } from '@/lib/household';
import { useStore } from '@/core/store';
import { F, usePalette } from '@/core/theme';
import { Choice, QUESTION } from '@/components/questions';
import { Step, TextButton, Title, useFinishIntro } from '@/components/Onboarding';

// One household question per screen (Romily's choice A), chips for answers. A tap saves the answer on the phone and
// moves on; "Skip this one" leaves it blank. The last answer goes straight to Home.
export default function Question() {
  const c = usePalette();
  const { n } = useLocalSearchParams<{ n: string }>();
  const i = Math.max(0, Math.min(FIELD_KEYS.length - 1, Number(n) || 0));
  const key: FieldKey = FIELD_KEYS[i];
  const { household, saveHousehold } = useStore();
  const finish = useFinishIntro();
  const moving = useRef(false);

  const next = () => {
    if (i + 1 < FIELD_KEYS.length) router.push({ pathname: '/welcome/question', params: { n: String(i + 1) } });
    else finish();
  };
  const choose = (v: string) => {
    if (moving.current) return;
    moving.current = true;
    saveHousehold({ ...household, [key]: v });
    // A beat to see the chip fill before the next question slides in.
    setTimeout(() => { moving.current = false; next(); }, 260);
  };

  return (
    <Step step={i + 1} of={FIELD_KEYS.length} onSkip={finish} skipLabel="Skip the rest"
      foot={<TextButton label="Skip this one" onPress={next} />}>
      <Text style={{ fontFamily: F.bold, fontSize: 13, letterSpacing: 1, color: c.muted, textTransform: 'uppercase' }}>{i + 1} of {FIELD_KEYS.length} · {FIELDS[key].label}</Text>
      <Title>{QUESTION[key]}</Title>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }} accessibilityRole="radiogroup" accessibilityLabel={QUESTION[key]}>
        {(FIELDS[key].options as readonly (readonly [string, string])[]).map(([v, label]) => (
          <Choice key={v} label={label} on={household[key] === v} onPress={() => choose(v)} />
        ))}
      </View>
    </Step>
  );
}
