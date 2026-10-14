import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text } from 'react-native';
import type { FieldKey } from '@/lib/household';
import { F, TAP, usePalette } from '@/core/theme';
import { haptic } from '@/components/ui';

// The household questions asked as a person would ask them. The answer bands are the website's (lib/household.ts).
export const QUESTION: Record<FieldKey, string> = {
  age_band: 'How old are you?',
  household: 'Who do you live with?',
  children: 'Any children or dependants?',
  tenure: 'How do you live?',
  income_band: 'Roughly what does your household earn?',
  employment: 'Are you working?',
  student: 'Are you studying?',
};

// An answer chip: outlined until chosen, then filled aubergine with a tick. A radio to screen readers.
export function Choice({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = usePalette();
  return (
    <Pressable
      onPress={() => { haptic.choose(); onPress(); }}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      style={({ pressed }) => [{ minHeight: TAP, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5, borderColor: on ? c.aubergine : c.line, backgroundColor: on ? c.aubergine : c.panel, maxWidth: '100%', transform: [{ scale: pressed ? 0.97 : 1 }] }]}
    >
      {on ? <Ionicons name="checkmark" size={18} color={c.onAubergine} /> : null}
      <Text style={{ fontFamily: on ? F.semi : F.medium, fontSize: 16, lineHeight: 21, color: on ? c.onAubergine : c.ink, flexShrink: 1 }}>{label}</Text>
    </Pressable>
  );
}
