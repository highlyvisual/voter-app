import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '@/core/store';
import { dark, light } from '@/core/theme';

// Root: the on-phone store (profile and saved elections), the site palette for the navigation chrome, and the tabs.
export default function RootLayout() {
  const scheme = useColorScheme();
  const p = scheme === 'dark' ? dark : light;
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, primary: p.accent, background: p.paper, card: p.paper, text: p.ink, border: p.line, notification: p.accent } };
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ThemeProvider value={theme}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ThemeProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
