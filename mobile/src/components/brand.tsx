import { Image } from 'expo-image';
import { Text, View, useColorScheme, type StyleProp, type ViewStyle } from 'react-native';
import { F, usePalette } from '@/core/theme';

// The emblem and wordmark (public/brand on the website, the same files). Light and dark versions follow the phone.
const MARK = { light: require('../../assets/brand/mark-light.png'), dark: require('../../assets/brand/mark-dark.png') };
const LOGO = { light: require('../../assets/brand/logo-light.png'), dark: require('../../assets/brand/logo-dark.png') };
const LOCKUP = { light: require('../../assets/brand/lockup-light.png'), dark: require('../../assets/brand/lockup-dark.png') };

function useScheme() { return useColorScheme() === 'dark' ? 'dark' : 'light'; }

// The heads-and-question-mark emblem on its own. Decorative wherever the name is also written next to it.
export function Emblem({ size = 40, label }: { size?: number; label?: string }) {
  const k = useScheme();
  return (
    <Image source={size > 120 ? LOGO[k] : MARK[k]} style={{ width: size, height: size * 0.88 }} contentFit="contain"
      accessible={!!label} accessibilityLabel={label} accessibilityIgnoresInvertColors />
  );
}

// The full lockup (emblem, name and "Politics, in your context.") for the welcome screen.
export function Lockup({ width = 260 }: { width?: number }) {
  const k = useScheme();
  return <Image source={LOCKUP[k]} style={{ width, height: width * 0.81 }} contentFit="contain" accessible accessibilityLabel="What’s It To Me? Politics, in your context." accessibilityIgnoresInvertColors />;
}

// Emblem and name in a row, set in Fraunces: the header on Home.
export function Wordmark({ size = 22, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]} accessible accessibilityRole="header" accessibilityLabel="What’s It To Me?">
      <Emblem size={size * 1.6} />
      <Text style={{ fontFamily: F.display, fontSize: size, color: c.ink, letterSpacing: -0.3 }} maxFontSizeMultiplier={1.4}>What’s It To Me?</Text>
    </View>
  );
}
