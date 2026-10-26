import { Stack } from 'expo-router';
import { usePalette } from '@/core/theme';

// First launch: welcome → where you vote → personalise → one question per screen. Shown once (store.introSeen).
export default function WelcomeLayout() {
  const c = usePalette();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.paper }, animation: 'slide_from_right' }} />;
}
