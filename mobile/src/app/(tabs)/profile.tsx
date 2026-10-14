import { Pressable, Text, View } from 'react-native';
import { FIELDS, FIELD_KEYS, OPTIONAL_FIELDS, OPTIONAL_KEYS, type Household } from '@/lib/household';
import { useStore } from '@/core/store';
import { TAP, usePalette } from '@/core/theme';
import { Button, Card, H1, H2, H3, Screen, Small, s } from '@/components/ui';

type Opt = readonly (readonly [string, string])[];

// Profile: the household questions (Romily, 18 Sept), the same bands as the website, plus the optional yes/no questions.
// Answers are saved as you tap, in the phone's secure storage, and are never sent anywhere.
export default function Profile() {
  const c = usePalette();
  const { household, complete, saveHousehold, clearHousehold, saved } = useStore();
  const set = (k: keyof Household, v: string | undefined) => saveHousehold({ ...household, [k]: v });
  const answered = FIELD_KEYS.filter((k) => household[k]).length;

  return (
    <Screen>
        <H1>Your household</H1>
        <Card style={{ borderColor: c.accent, borderWidth: 2 }}>
          <H3>Your answers never leave this phone</H3>
          <Small>They are kept in this phone’s secure storage and used here, on the phone, to show which positions apply to a household like yours and to look up money figures for your bands. They are not sent to What’s It To Me? or anyone else, not even as part of a web address. Delete the app, or tap “Clear my answers”, and they are gone.</Small>
        </Card>
        <Small>{complete ? 'All questions answered.' : `${answered} of ${FIELD_KEYS.length} answered. Answer them all to see what applies to you first.`} Bands, never exact figures.</Small>
        {saved ? <Small>Your postcode area ({saved.outcode}) comes from Home; only that first part is kept.</Small> : <Small>Your postcode is the eighth question: enter it on Home. Only its first part is kept.</Small>}

        {FIELD_KEYS.map((k) => (
          <Question key={k} label={FIELDS[k].label} options={FIELDS[k].options as Opt} value={household[k]} onChange={(v) => set(k, v)} />
        ))}

        <H2>Optional questions</H2>
        <Small>Each is a plain yes or no about the household, never about opinions. Left blank, nothing is assumed either way, and positions that depend on it are listed under “Applies to others”.</Small>
        {OPTIONAL_KEYS.map((k) => (
          <Question key={k} label={OPTIONAL_FIELDS[k].label} options={OPTIONAL_FIELDS[k].options as Opt} value={household[k]} onChange={(v) => set(k, v)} allowClear />
        ))}

        <Button label="Clear my answers" kind="secondary" onPress={clearHousehold} hint="Deletes every answer from this phone" />
    </Screen>
  );
}

// One question as a group of radio buttons, each a full-width 48 px row.
function Question({ label, options, value, onChange, allowClear = false }: { label: string; options: Opt; value: string | undefined; onChange: (v: string | undefined) => void; allowClear?: boolean }) {
  const c = usePalette();
  return (
    <Card style={{ gap: 2 }}>
      <Text style={[s.h3, { color: c.ink, marginBottom: 4 }]} accessibilityRole="header">{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map(([v, text]) => {
          const on = value === v;
          return (
            <Pressable key={v} onPress={() => onChange(on && allowClear ? undefined : v)} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={text}
              style={({ pressed }) => [{ minHeight: TAP, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.6 : 1 }]}>
              <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: on ? c.accent : c.soft, alignItems: 'center', justifyContent: 'center' }}>
                {on ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.accent }} /> : null}
              </View>
              <Text style={[s.body, { color: c.ink, flex: 1 }]}>{text}</Text>
            </Pressable>
          );
        })}
      </View>
      {allowClear && value ? <Small>Tap your answer again to leave it blank.</Small> : null}
    </Card>
  );
}
