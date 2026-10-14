import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import type { ElectionsResponse, MetaResponse } from '@/lib/appApi';
import { compareVersions } from '@/lib/appApi';
import { loadMeta, lookupElections } from '@/core/api';
import { useStore } from '@/core/store';
import { TAP, usePalette } from '@/core/theme';
import { ElectionList } from '@/components/ElectionList';
import { Button, LinkRow, Screen, Small, openLink, s } from '@/components/ui';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

// Home: the postcode screen. The postcode is sent once for the lookup; only the outward code and the elections found
// are kept on the phone, for "My elections".
export default function Home() {
  const c = usePalette();
  const { saveElections, saved } = useStore();
  const [postcode, setPostcode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ElectionsResponse | null>(null);
  const [meta, setMeta] = useState<MetaResponse | null>(null);

  // Which app versions the website still serves. Offline or unreachable: carry on.
  useEffect(() => { loadMeta().then((m) => m?.ok && setMeta(m)).catch(() => {}); }, []);
  const mustUpdate = !!meta && compareVersions(APP_VERSION, meta.minAppVersion) < 0;
  const canUpdate = !!meta && !mustUpdate && compareVersions(APP_VERSION, meta.latestAppVersion) < 0;
  const storeUrl = meta ? (Platform.OS === 'ios' ? meta.storeUrls.ios : meta.storeUrls.android) : null;

  async function look() {
    Keyboard.dismiss();
    setBusy(true);
    setResult(null);
    try {
      const r = await lookupElections(postcode);
      setResult(r);
      if (r.ok) { saveElections({ outcode: r.outcode, placeUrl: r.placeUrl, elections: r.elections }); setPostcode(''); }
    } catch (e) {
      setResult({ ok: false, message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  const shown = result?.ok ? result : null;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        {(mustUpdate || canUpdate) && meta ? (
          <Pressable onPress={() => storeUrl && openLink(storeUrl, c)} disabled={!storeUrl} accessibilityRole={storeUrl ? 'link' : 'text'} style={{ borderWidth: 2, borderRadius: 12, padding: 14, borderColor: c.accent, backgroundColor: mustUpdate ? c.accent : c.panel }}>
            <Text style={[s.body, { fontWeight: '700', color: mustUpdate ? c.onAccent : c.ink }]}>{meta.updateMessage}</Text>
          </Pressable>
        ) : null}
        <Text style={[s.h1, { color: c.ink, fontSize: 34 }]} accessibilityRole="header">What’s It To Me?</Text>
        <Text style={[s.body, { color: c.soft }]}>Politics, in your context. Find the elections where you live and what each result could mean for you.</Text>

        <Text style={[s.body, { color: c.ink, fontWeight: '700' }]} nativeID="pcLabel">Your postcode</Text>
        <TextInput
          value={postcode}
          onChangeText={setPostcode}
          onSubmitEditing={look}
          placeholder="e.g. WC1H 9JE"
          placeholderTextColor={c.soft}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="postal-code"
          textContentType="postalCode"
          returnKeyType="search"
          testID="postcode"
          accessibilityLabel="Your postcode"
          accessibilityLabelledBy="pcLabel"
          style={{ borderWidth: 2, borderRadius: 12, paddingHorizontal: 14, minHeight: 52, fontSize: 20, letterSpacing: 1, color: c.ink, backgroundColor: c.panel, borderColor: c.line }}
        />
        <Button label="Find my elections" onPress={look} busy={busy} disabled={!postcode.trim() || mustUpdate} />
        <Small>Your full postcode is used once for this search and is not stored. Only the first part (for example CH4) is kept on this phone, for My elections.</Small>

        {result && !result.ok ? <Text style={[s.body, { color: c.accent, fontWeight: '600' }]} accessibilityLiveRegion="polite">{result.message}</Text> : null}
        {shown ? (
          <View accessibilityLiveRegion="polite"><ElectionList outcode={shown.outcode} elections={shown.elections} placeUrl={shown.placeUrl} /></View>
        ) : saved && !result ? (
          <ElectionList outcode={saved.outcode} elections={saved.elections} placeUrl={saved.placeUrl} />
        ) : null}

        <View style={{ borderTopWidth: 1, borderTopColor: c.line, marginTop: 20, paddingTop: 14, gap: 4 }}>
          <Small>What’s It To Me? is independent. It does not represent any government, council or political party. Election information comes from Democracy Club and official sources, credited on every page.</Small>
          <LinkRow label="Who we are and how it works" url="https://whatsittome.org/who-we-are" />
        </View>
        <View style={{ height: TAP / 2 }} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
