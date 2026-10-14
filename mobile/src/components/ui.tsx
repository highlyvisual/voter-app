import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAP, usePalette, type Palette } from '@/core/theme';

// Small building blocks, all in the site palette. Text uses the system font sizes, so Dynamic Type and Android font
// scaling apply everywhere; nothing has a fixed height that would clip larger text.

export function openLink(url: string, c: Palette) {
  return WebBrowser.openBrowserAsync(url, { toolbarColor: c.paper, controlsColor: c.accent });
}

export function Screen({ children, refreshing, onRefresh, edges = ['top'] }: { children: ReactNode; refreshing?: boolean; onRefresh?: () => void; edges?: ('top' | 'bottom')[] }) {
  const c = usePalette();
  return (
    <SafeAreaView style={[s.fill, { backgroundColor: c.paper }]} edges={edges}>
      <ScrollView
        contentContainerStyle={s.page}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.accent} colors={[c.accent]} /> : undefined}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function H1({ children }: { children: ReactNode }) {
  const c = usePalette();
  return <Text style={[s.h1, { color: c.ink }]} accessibilityRole="header">{children}</Text>;
}
export function H2({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const c = usePalette();
  return <Text style={[s.h2, { color: c.ink }, style]} accessibilityRole="header">{children}</Text>;
}
export function H3({ children }: { children: ReactNode }) {
  const c = usePalette();
  return <Text style={[s.h3, { color: c.ink }]} accessibilityRole="header">{children}</Text>;
}
export function Body({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const c = usePalette();
  return <Text style={[s.body, { color: c.ink }, style]}>{children}</Text>;
}
export function Small({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const c = usePalette();
  return <Text style={[s.small, { color: c.soft }, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  return <View style={[s.card, { backgroundColor: c.panel, borderColor: c.line }, style]}>{children}</View>;
}

export function Button({ label, onPress, disabled, busy, kind = 'primary', hint }: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean; kind?: 'primary' | 'secondary'; hint?: string }) {
  const c = usePalette();
  const primary = kind === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!(disabled || busy), busy: !!busy }}
      style={({ pressed }) => [s.button, primary ? { backgroundColor: c.accent } : { borderWidth: 2, borderColor: c.accent }, { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }]}
    >
      {busy ? <ActivityIndicator color={primary ? c.onAccent : c.accent} /> : <Text style={[s.buttonText, { color: primary ? c.onAccent : c.accent }]}>{label}</Text>}
    </Pressable>
  );
}

// A link out to the website or a source, opened in the in-app browser.
export function LinkRow({ label, url, onPress, hint }: { label: string; url?: string; onPress?: () => void; hint?: string }) {
  const c = usePalette();
  return (
    <Pressable onPress={onPress ?? (() => url && openLink(url, c))} accessibilityRole="link" accessibilityHint={hint} style={({ pressed }) => [s.linkRow, { opacity: pressed ? 0.6 : 1 }]}>
      <Text style={[s.link, { color: c.accent }]}>{label} ›</Text>
    </Pressable>
  );
}

// Grey label chip, same weight for every kind (layer chips imply no order).
export function Chip({ label }: { label: string }) {
  const c = usePalette();
  return <View style={[s.chip, { backgroundColor: c.chip }]}><Text style={[s.chipText, { color: c.soft }]}>{label}</Text></View>;
}

// Loading placeholder: grey blocks shaped like the content, gently pulsing. Hidden from screen readers, which hear the
// busy announcement instead.
export function Skeleton({ lines = 3, card = true }: { lines?: number; card?: boolean }) {
  const c = usePalette();
  const [pulse] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }), Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true })]));
    a.start();
    return () => a.stop();
  }, [pulse]);
  const body = (
    <Animated.View style={{ opacity: pulse, gap: 10 }}>
      {Array.from({ length: lines }, (_, i) => <View key={i} style={[s.skel, { backgroundColor: c.skeleton, width: i === 0 ? '60%' : i === lines - 1 ? '40%' : '90%' }]} />)}
    </Animated.View>
  );
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{card ? <Card>{body}</Card> : body}</View>;
}
export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityState={{ busy: true }} style={{ gap: 12 }}>
      <Skeleton lines={2} card={false} />
      <Skeleton />
      <Skeleton />
    </View>
  );
}

export function Banner({ children }: { children: ReactNode }) {
  const c = usePalette();
  return <View style={[s.banner, { backgroundColor: c.warnBg, borderColor: c.warn }]} accessibilityRole="alert"><Text style={[s.small, { color: c.warn, fontWeight: '700' }]}>{children}</Text></View>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = usePalette();
  return (
    <Card style={{ gap: 12 }}>
      <Text style={[s.body, { color: c.accent, fontWeight: '700' }]} accessibilityLiveRegion="polite">{message}</Text>
      {onRetry ? <Button label="Try again" onPress={onRetry} kind="secondary" /> : null}
    </Card>
  );
}

export function longDate(iso: string) {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' });
}
export function shortDate(iso: string) {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00Z' : iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' });
}

export const s = StyleSheet.create({
  fill: { flex: 1 },
  page: { padding: 20, paddingBottom: 40, gap: 14 },
  h1: { fontSize: 30, fontWeight: '800' },
  h2: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  h3: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 17, lineHeight: 24 },
  small: { fontSize: 14, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
  button: { minHeight: TAP, borderRadius: TAP / 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  buttonText: { fontSize: 18, fontWeight: '700' },
  linkRow: { minHeight: TAP, justifyContent: 'center' },
  link: { fontSize: 16, fontWeight: '700' },
  chip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 13, fontWeight: '700' },
  skel: { height: 16, borderRadius: 8 },
  banner: { borderWidth: 1, borderRadius: 12, padding: 12 },
});
