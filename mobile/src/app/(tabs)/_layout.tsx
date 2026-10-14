import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { F, usePalette } from '@/core/theme';

type IconName = keyof typeof Ionicons.glyphMap;

// Bottom tabs: Home · My elections · Profile · More.
export default function TabLayout() {
  const c = usePalette();
  const icon = (name: IconName) => function Icon({ color, size }: { color: unknown; size: number }) { return <Ionicons name={name} size={size} color={color as string} />; };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.soft,
        tabBarStyle: { backgroundColor: c.panel, borderTopColor: c.line },
        tabBarLabelStyle: { fontSize: 12, fontFamily: F.semi },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline'), tabBarAccessibilityLabel: 'Home' }} />
      <Tabs.Screen name="elections" options={{ title: 'My elections', tabBarIcon: icon('checkbox-outline'), tabBarAccessibilityLabel: 'My elections' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-circle-outline'), tabBarAccessibilityLabel: 'Profile' }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('ellipsis-horizontal-circle-outline'), tabBarAccessibilityLabel: 'More' }} />
    </Tabs>
  );
}
