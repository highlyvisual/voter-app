import { Stack } from 'expo-router';
import { usePalette } from '@/core/theme';

// My elections: list → ballot → candidate or topic, with native push transitions and a back button.
export default function ElectionsLayout() {
  const c = usePalette();
  return (
    <Stack screenOptions={{ headerTintColor: c.accent, headerStyle: { backgroundColor: c.paper }, headerTitleStyle: { color: c.ink }, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: c.paper } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[ballotId]/index" options={{ title: 'Ballot' }} />
      <Stack.Screen name="[ballotId]/candidate/[candidateId]" options={{ title: 'Candidate' }} />
      <Stack.Screen name="[ballotId]/topic/[topic]" options={{ title: 'What changes for you' }} />
    </Stack>
  );
}
