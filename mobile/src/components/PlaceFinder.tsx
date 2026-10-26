import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import type { ElectionsResponse } from '@/lib/appApi';
import { lookupElections, lookupElectionsNear } from '@/core/api';
import { useStore } from '@/core/store';
import { F, TAP, usePalette } from '@/core/theme';
import { Button, haptic, s } from '@/components/ui';

// Where you vote: a postcode, or "Use my location" (approximate, asked for once, used once). Either is sent once for the
// lookup and not kept; only the outward code and the elections found are saved on the phone.
export function PlaceFinder({ onFound, disabled }: { onFound?: () => void; disabled?: boolean }) {
  const c = usePalette();
  const { saveElections } = useStore();
  const [postcode, setPostcode] = useState('');
  const [busy, setBusy] = useState<'postcode' | 'location' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function finish(get: () => Promise<ElectionsResponse>, kind: 'postcode' | 'location') {
    setBusy(kind);
    setMessage(null);
    try {
      const r = await get();
      if (!r.ok) { setMessage(r.message); return; }
      saveElections({ outcode: r.outcode, placeUrl: r.placeUrl, elections: r.elections });
      setPostcode('');
      haptic.press();
      onFound?.();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  function byPostcode() {
    Keyboard.dismiss();
    finish(() => lookupElections(postcode), 'postcode');
  }

  async function byLocation() {
    Keyboard.dismiss();
    setMessage(null);
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) { setMessage('Location is off for this app, so type your postcode instead. You can change this in Settings.'); return; }
    finish(async () => {
      let pos: Location.LocationObject;
      try {
        pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      } catch {
        return { ok: false, message: 'We couldn’t get your location just now. Please type your postcode instead.' };
      }
      return lookupElectionsNear(pos.coords.latitude, pos.coords.longitude);
    }, 'location');
  }

  return (
    <View style={{ gap: 12 }}>
      <TextInput
        value={postcode}
        onChangeText={setPostcode}
        onSubmitEditing={byPostcode}
        placeholder="Your postcode"
        placeholderTextColor={c.muted}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="postal-code"
        textContentType="postalCode"
        returnKeyType="search"
        testID="postcode"
        accessibilityLabel="Your postcode"
        style={{ borderWidth: 2, borderRadius: 16, paddingHorizontal: 18, minHeight: 60, fontSize: 22, fontFamily: F.semi, letterSpacing: 1.5, color: c.ink, backgroundColor: c.panel, borderColor: postcode ? c.ink : c.line }}
      />
      <Button label="Find my next vote" onPress={byPostcode} busy={busy === 'postcode'} disabled={!postcode.trim() || !!busy || disabled} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
        <Text style={[s.small, { color: c.muted }]}>or</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
      </View>
      <Pressable
        onPress={byLocation}
        disabled={!!busy || disabled}
        accessibilityRole="button"
        accessibilityLabel="Use my location"
        accessibilityHint="Asks for your approximate location once, to find your postcode area. It is not kept."
        accessibilityState={{ busy: busy === 'location', disabled: !!busy || !!disabled }}
        style={({ pressed }) => [{ minHeight: TAP + 4, borderRadius: TAP, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.aubergineSoft, opacity: busy && busy !== 'location' ? 0.5 : pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
      >
        <Ionicons name={busy === 'location' ? 'hourglass-outline' : 'navigate'} size={18} color={c.aubergine} />
        <Text style={{ fontFamily: F.bold, fontSize: 17, color: c.aubergine }}>{busy === 'location' ? 'Finding you…' : 'Use my location'}</Text>
      </Pressable>
      <Text style={[s.small, { color: c.muted, textAlign: 'center' }]}>
        <Ionicons name="lock-closed" size={12} color={c.muted} /> Used once to find your area. Never kept.
      </Text>
      {message ? <Text style={[s.body, { color: c.accent, fontFamily: F.semi }]} accessibilityLiveRegion="polite" accessibilityRole="alert">{message}</Text> : null}
    </View>
  );
}
