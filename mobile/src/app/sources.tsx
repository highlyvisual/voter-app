import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SITE } from '@/core/api';
import { F, TAP, usePalette } from '@/core/theme';
import { Emblem } from '@/components/brand';
import { haptic, openLink, s } from '@/components/ui';

// Sources (Google Play's rule for apps with government and election information: say where it comes from, and that
// the app is not a government app). Every source the app shows or draws, each with its link and licence.
const SOURCES: { what: string; who: string; url: string; licence?: string }[] = [
  { what: 'Elections, candidates, their statements and photos, polling-day timetables', who: 'Democracy Club', url: 'https://democracyclub.org.uk', licence: 'CC BY 4.0' },
  { what: 'Registering, postal and proxy votes, and free voter ID', who: 'GOV.UK', url: 'https://www.gov.uk/elections-in-the-uk', licence: 'Open Government Licence' },
  { what: 'How elections are run, and official guidance for voters', who: 'The Electoral Commission', url: 'https://www.electoralcommission.org.uk/voting-and-elections' },
  { what: 'Party and candidate positions', who: 'Each one’s own source: manifestos, statements, leaflets and official records, linked under every position as “Sourced:”', url: `${SITE}/about/accuracy` },
  { what: 'Money figures for a household like yours', who: 'PolicyEngine UK, run by What’s It To Me? on each sourced pledge', url: 'https://policyengine.org/uk' },
  { what: 'The outline of your voting area', who: 'Office for National Statistics, Open Geography Portal', url: 'https://geoportal.statistics.gov.uk', licence: 'Open Government Licence' },
  { what: 'Finding your area from a postcode or location', who: 'postcodes.io, from the ONS Postcode Directory', url: 'https://postcodes.io', licence: 'Open Government Licence' },
  { what: 'Roads and place names on the map', who: '© OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright', licence: 'ODbL' },
];

export default function Sources() {
  const c = usePalette();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.paper }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={{ padding: 20, gap: 14 }}>
        <View style={{ backgroundColor: c.aubergine, borderRadius: 20, padding: 18, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ backgroundColor: c.paper, borderRadius: 20, padding: 4 }}><Emblem size={28} /></View>
            <Text style={{ fontFamily: F.display, fontSize: 20, color: c.onAubergine, flexShrink: 1 }} accessibilityRole="header">Independent</Text>
          </View>
          <Text style={{ fontFamily: F.body, fontSize: 16, lineHeight: 23, color: c.onAubergine }}>
            What’s It To Me? is not affiliated with, endorsed by or acting for any government, council, the Electoral Commission or any political party. It never ranks or recommends a candidate or a party. Official information comes from the public sources below; for anything official, check them.
          </Text>
        </View>
        <Text style={[s.small, { color: c.muted }]}>Where everything in this app comes from. Tap one to open it.</Text>
      </View>
      <View style={{ marginHorizontal: 20, backgroundColor: c.panel, borderRadius: 20, borderWidth: 1, borderColor: c.line }}>
        {SOURCES.map((x, i) => (
          <Pressable key={x.what} onPress={() => { haptic.choose(); openLink(x.url, c); }} accessibilityRole="link" accessibilityLabel={`${x.what}: ${x.who}${x.licence ? `, ${x.licence}` : ''}`}
            style={({ pressed }) => [{ minHeight: TAP + 8, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, opacity: pressed ? 0.6 : 1 }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: c.ink }}>{x.what}</Text>
              <Text style={[s.small, { color: c.muted }]}>{x.who}{x.licence ? ` · ${x.licence}` : ''}</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={c.muted} />
          </Pressable>
        ))}
      </View>
      <Text style={[s.small, { color: c.muted, padding: 20 }]}>What’s It To Me? {Constants.expoConfig?.version ?? ''}</Text>
    </ScrollView>
  );
}
