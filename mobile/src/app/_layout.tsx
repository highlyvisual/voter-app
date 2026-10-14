import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces/400Regular_Italic';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { PublicSans_400Regular } from '@expo-google-fonts/public-sans/400Regular';
import { PublicSans_500Medium } from '@expo-google-fonts/public-sans/500Medium';
import { PublicSans_600SemiBold } from '@expo-google-fonts/public-sans/600SemiBold';
import { PublicSans_700Bold } from '@expo-google-fonts/public-sans/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from '@/core/store';
import { dark, light } from '@/core/theme';

// The splash (the emblem on latte) stays up until the fonts and the phone's saved answers are loaded, then fades into
// Home or the welcome, which carry the same emblem.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

// Root: the on-phone store (profile and saved elections), Romily's palette for the navigation chrome, the tabs, and the
// welcome screens shown on first launch.
export default function RootLayout() {
  const scheme = useColorScheme();
  const p = scheme === 'dark' ? dark : light;
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, primary: p.accent, background: p.paper, card: p.paper, text: p.ink, border: p.line, notification: p.accent } };
  const [fontsLoaded, fontError] = useFonts({ Fraunces_600SemiBold, Fraunces_400Regular_Italic, PublicSans_400Regular, PublicSans_500Medium, PublicSans_600SemiBold, PublicSans_700Bold });
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ThemeProvider value={theme}>
          <StatusBar style="auto" />
          <SplashGate fontsReady={fontsLoaded || !!fontError} />
          {fontsLoaded || fontError ? (
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.paper } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="welcome" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="ask" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="sources" options={{ headerShown: true, title: 'Sources', headerTintColor: p.accent, headerStyle: { backgroundColor: p.paper }, headerTitleStyle: { color: p.ink, fontFamily: 'Fraunces_600SemiBold' }, headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }} />
            </Stack>
          ) : null}
        </ThemeProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function SplashGate({ fontsReady }: { fontsReady: boolean }) {
  const { ready } = useStore();
  useEffect(() => { if (fontsReady && ready) SplashScreen.hideAsync().catch(() => {}); }, [fontsReady, ready]);
  return null;
}
