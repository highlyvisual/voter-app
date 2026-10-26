import { Stack } from 'expo-router';
import { F, usePalette } from '@/core/theme';

// The list is always at the root, so the tab opens on it even when a ballot was opened from Home.
export const unstable_settings = { initialRouteName: 'index' };

// Coming up: list → ballot → candidate or topic, with native push transitions and a back button.
export default function ElectionsLayout() {
  const c = usePalette();
  return (
    <Stack screenOptions={{ headerTintColor: c.accent, headerStyle: { backgroundColor: c.paper }, headerTitleStyle: { color: c.ink, fontFamily: F.display }, headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: c.paper } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[ballotId]/index" options={{ title: 'Ballot' }} />
      {/* Next and previous on the paper replace the screen; the slide shows which way you went. */}
      <Stack.Screen name="[ballotId]/candidate/[candidateId]" options={({ route }) => ({ title: 'Candidate', animation: (route.params as { dir?: string } | undefined)?.dir === 'prev' ? 'slide_from_left' : 'slide_from_right' })} />
      <Stack.Screen name="[ballotId]/topic/[topic]" options={{ title: 'What changes for you' }} />
    </Stack>
  );
}
