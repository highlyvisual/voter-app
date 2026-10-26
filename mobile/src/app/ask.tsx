import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { FIELDS, FIELD_KEYS } from '@/lib/household';
import { useStore } from '@/core/store';
import { F, usePalette } from '@/core/theme';
import { Choice, QUESTION } from '@/components/questions';
import { Step, TextButton, Title } from '@/components/Onboarding';

// The household questions, one per screen (Romily's choice A), chips for answers. A tap saves the answer on the phone
// and the next question slides in; "Skip this one" leaves it blank. Opened from the welcome (mode=intro: the last
// answer goes to Home), from Home or You (all the questions from the first unanswered), or from one row on You
// (only=1: that question, then back).
export default function Ask() {
  const c = usePalette();
  const params = useLocalSearchParams<{ n?: string; mode?: string; only?: string }>();
  const { household, saveHousehold, markIntroSeen } = useStore();
  const [i, setI] = useState(() => Math.max(0, Math.min(FIELD_KEYS.length - 1, Number(params.n) || 0)));
  const [slide] = useState(() => new Animated.Value(1));
  const moving = useRef(false);
  const key = FIELD_KEYS[i];

  useEffect(() => { slide.setValue(0); Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true }).start(); }, [i, slide]);

  const done = () => {
    // From the welcome, leave nothing behind to swipe back to: close this, then swap the welcome for Home.
    if (params.mode === 'intro') { markIntroSeen(); router.dismissAll(); router.replace('/'); } else router.back();
  };
  const next = () => {
    if (params.only === '1' || i + 1 >= FIELD_KEYS.length) done();
    else setI(i + 1);
  };
  const choose = (v: string) => {
    if (moving.current) return;
    moving.current = true;
    saveHousehold({ ...household, [key]: v });
    // A beat to see the chip fill before the next question slides in.
    setTimeout(() => { moving.current = false; next(); }, 260);
  };

  return (
    <Step step={i + 1} of={FIELD_KEYS.length} onSkip={done} skipLabel={params.only === '1' ? 'Close' : 'Skip the rest'}
      foot={<TextButton label={i > 0 && params.only !== '1' ? 'Back to the last one' : 'Skip this one'} onPress={i > 0 && params.only !== '1' ? () => setI(i - 1) : next} />}>
      <Animated.View style={{ gap: 16, opacity: slide, transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }] }}>
        <Text style={{ fontFamily: F.bold, fontSize: 13, letterSpacing: 1, color: c.muted, textTransform: 'uppercase' }}>{i + 1} of {FIELD_KEYS.length} · {FIELDS[key].label}</Text>
        <Title>{QUESTION[key]}</Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }} accessibilityRole="radiogroup" accessibilityLabel={QUESTION[key]}>
          {(FIELDS[key].options as readonly (readonly [string, string])[]).map(([v, label]) => (
            <Choice key={v} label={label} on={household[key] === v} onPress={() => choose(v)} />
          ))}
        </View>
        {params.only !== '1' && i > 0 ? <TextButton label="Skip this one" onPress={next} /> : null}
      </Animated.View>
    </Step>
  );
}
