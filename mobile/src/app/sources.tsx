import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { F, TAP, usePalette } from '@/core/theme';
import { Emblem } from '@/components/brand';
import { haptic, openLink, s } from '@/components/ui';

// Sources (Google Play's rule for apps with government and election information: say where it comes from, and that
// the app is not a government app; Google's second review, 14 Oct, asked for this in the app itself). Every source
// the app shows or draws, each with its link and licence. A new data source goes here and is reported to Cowork, so
// the store description says the same.
const SOURCES: { what: string; who: string; url: string; licence?: string }[] = [
  { what: 'Elections, candidates, their statements and photos, polling-day timetables', who: 'Democracy Club', url: 'https://democracyclub.org.uk', licence: 'CC BY 4.0' },
  { what: 'Every quoted manifesto, statement, leaflet and council record, with its date and link', who: 'What’s It To Me? ledger', url: 'https://whatsittome.org/ledger' },
  { what: 'Every dataset this app and the website use', who: 'What’s It To Me? data sources', url: 'https://whatsittome.org/data' },
  { what: 'Registering to vote', who: 'GOV.UK', url: 'https://www.gov.uk/register-to-vote', licence: 'Open Government Licence' },
  { what: 'How to vote: in person, by post, by proxy, and voter ID', who: 'GOV.UK', url: 'https://www.gov.uk/how-to-vote', licence: 'Open Government Licence' },
  { what: 'Voting in Northern Ireland', who: 'Electoral Office for Northern Ireland', url: 'https://www.eoni.org.uk' },
  { what: 'How elections are run, and guidance for voters', who: 'The Electoral Commission', url: 'https://www.electoralcommission.org.uk' },
  { what: 'Money figures for a household like yours', who: 'PolicyEngine UK, run by What’s It To Me? on each sourced pledge', url: 'https://policyengine.org/uk' },
  { what: 'The outline of your voting area', who: 'Office for National Statistics, Open Geography Portal', url: 'https://geoportal.statistics.gov.uk', licence: 'Open Government Licence' },
  { what: 'Finding your area from a postcode or location', who: 'postcodes.io, from the ONS Postcode Directory', url: 'https://postcodes.io', licence: 'Open Government Licence' },
  { what: 'The list of UK councils', who: 'mySociety', url: 'https://www.mysociety.org', licence: 'CC BY 4.0' },
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
            What’s It To Me? is not affiliated with, endorsed by or acting for any government, council, the Electoral Commission or any political party. It never ranks or recommends a candidate or a party. Everything it shows comes from the sources below; for anything official, check them.
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
