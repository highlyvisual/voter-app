import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { usePalette } from '@/core/theme';
import { Lockup } from '@/components/brand';
import { Lede, Step } from '@/components/Onboarding';
import { Button } from '@/components/ui';

// Welcome, 1 of 3: the emblem (the splash fades into it) and one line on what the app does.
export default function Welcome() {
  const c = usePalette();
  const [rise] = useState(() => new Animated.Value(0));
  useEffect(() => { Animated.timing(rise, { toValue: 1, duration: 600, delay: 150, useNativeDriver: true }).start(); }, [rise]);
  return (
    <Step step={1} of={3} foot={<Button label="Get started" onPress={() => router.push('/welcome/place')} />}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 28, paddingVertical: 24 }}>
        <View style={{ backgroundColor: c.apricot, borderRadius: 200, padding: 28 }}>
          <Lockup width={250} />
        </View>
        <Animated.View style={{ opacity: rise, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          <Lede>Who’s on your ballot, and what each of them has said about the things that touch your life. In their own words, with the source. No rankings, no recommendations.</Lede>
        </Animated.View>
      </View>
    </Step>
  );
}
