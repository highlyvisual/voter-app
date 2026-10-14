import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/core/store';
import { F, TAP, usePalette } from '@/core/theme';
import { haptic, s } from '@/components/ui';

// The frame every welcome screen shares (Romily's choice A for questions): a segmented progress bar and a way out at
// the top, one idea in the middle, and the actions fixed at the foot so the next step is always under the thumb.
export function Step({ step, of, children, foot, onSkip, skipLabel = 'Skip' }: { step: number; of: number; children: ReactNode; foot: ReactNode; onSkip?: () => void; skipLabel?: string }) {
  const c = usePalette();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.paper }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, minHeight: TAP }}>
          <View style={{ flex: 1, flexDirection: 'row', gap: 6 }} accessible accessibilityRole="progressbar" accessibilityLabel={`Step ${step} of ${of}`} accessibilityValue={{ min: 1, max: of, now: step }}>
            {Array.from({ length: of }, (_, i) => <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i < step ? c.aubergine : c.line }} />)}
          </View>
          {onSkip ? (
            <Pressable onPress={() => { haptic.choose(); onSkip(); }} accessibilityRole="button" hitSlop={12} style={{ minHeight: TAP, justifyContent: 'center' }}>
              <Text style={{ fontFamily: F.semi, fontSize: 16, color: c.soft }}>{skipLabel}</Text>
            </Pressable>
          ) : null}
        </View>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 12, gap: 16 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12, gap: 8, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.paper }}>{foot}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Title({ children, italic }: { children: ReactNode; italic?: string }) {
  const c = usePalette();
  return (
    <Text style={[s.h1, { color: c.ink, fontSize: 34, lineHeight: 40 }]} accessibilityRole="header">
      {children}{italic ? <Text style={{ fontFamily: F.displayItalic, color: c.rose }}>{italic}</Text> : null}
    </Text>
  );
}

export function Lede({ children }: { children: ReactNode }) {
  const c = usePalette();
  return <Text style={[s.body, { color: c.soft, fontSize: 18, lineHeight: 26 }]}>{children}</Text>;
}

// A quiet text button for the foot ("Not now", "Skip the rest").
export function TextButton({ label, onPress, hint }: { label: string; onPress: () => void; hint?: string }) {
  const c = usePalette();
  return (
    <Pressable onPress={() => { haptic.choose(); onPress(); }} accessibilityRole="button" accessibilityHint={hint} style={({ pressed }) => ({ minHeight: TAP, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <Text style={{ fontFamily: F.semi, fontSize: 16, color: c.soft, textDecorationLine: 'underline' }}>{label}</Text>
    </Pressable>
  );
}

// Leave the welcome screens for Home, and don't show them again.
export function useFinishIntro() {
  const { markIntroSeen } = useStore();
  return () => { markIntroSeen(); router.replace('/'); };
}
