import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import type { AppCandidate, AppParty } from '@/lib/appApi';
import type { Ballot } from '@/core/useBallot';
import { TAP, usePalette } from '@/core/theme';
import { Card, H2, Small, openLink, s, shortDate } from '@/components/ui';

// A candidate as a card on the ballot: party colour strip (the party's own colour, on its own candidate only), name and
// party as on the ballot paper. Every candidate gets exactly this card, in ballot-paper order. No photo here: photos
// appear only on the candidate's own screen (Romily, round five).
export function CandidateCard({ ballotId, c, party }: { ballotId: string; c: AppCandidate; party: AppParty | undefined }) {
  const p = usePalette();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/elections/[ballotId]/candidate/[candidateId]', params: { ballotId, candidateId: String(c.id) } })}
      accessibilityRole="button"
      accessibilityLabel={`${c.name}, ${c.party_label}`}
      accessibilityHint="Opens this candidate's statement and positions"
      style={({ pressed }) => [{ flexDirection: 'row', borderWidth: 1, borderColor: p.line, borderRadius: 16, overflow: 'hidden', backgroundColor: pressed ? p.line : p.panel, minHeight: TAP + 16 }]}
    >
      <View style={{ width: 8, backgroundColor: party?.colour ?? p.line }} />
      <View style={{ flex: 1, padding: 14, gap: 2, justifyContent: 'center' }}>
        <Text style={[s.h3, { color: p.ink }]}>{c.name}</Text>
        <Small>{c.party_label}</Small>
      </View>
      <View style={{ justifyContent: 'center', paddingRight: 14 }}><Text style={[s.h3, { color: p.soft }]} importantForAccessibility="no">›</Text></View>
    </Pressable>
  );
}

// Key dates before the poll, each linking to the GOV.UK page where it is done.
export function KeyDates({ b }: { b: Ballot }) {
  const p = usePalette();
  const today = new Date().toISOString().slice(0, 10);
  const kd = b.key_dates;
  return (
    <Card>
      <H2 style={{ marginTop: 0 }}>Key dates</H2>
      {kd.items.map((i) => {
        const past = i.date < today;
        return (
          <Pressable key={i.kind} onPress={() => openLink(i.href, p)} accessibilityRole="link" accessibilityLabel={`${i.label}: ${past ? 'closed' : 'by'} ${shortDate(i.date)}${i.time ? `, ${i.time}` : ''}`} accessibilityHint="Opens GOV.UK"
            style={({ pressed }) => [{ minHeight: TAP, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: p.line, opacity: pressed ? 0.6 : 1 }]}>
            <Text style={[s.body, { color: p.accent, fontWeight: '700', flexShrink: 1 }]}>{i.label} ›</Text>
            <Text style={[s.small, { color: past ? p.soft : p.ink, textAlign: 'right', flexShrink: 1 }]}>{past ? 'Closed ' : 'By '}{shortDate(i.date)}{i.time ? ` ${i.time}` : ''}</Text>
          </Pressable>
        );
      })}
      <Small>Polls 7am to 10pm{kd.id_required ? ' · photo ID needed' : ' · no photo ID needed at this election'}. {kd.source ? 'Dates from Democracy Club (CC BY 4.0).' : 'Worked out from the statutory timetable.'}{kd.notice_url ? ' Confirm them on the council’s official notice.' : ''}</Small>
      {kd.notice_url ? <Pressable onPress={() => openLink(kd.notice_url!, p)} accessibilityRole="link" style={{ minHeight: TAP, justifyContent: 'center' }}><Text style={[s.small, { color: p.accent, fontWeight: '700' }]}>Council’s official notice ›</Text></Pressable> : null}
    </Card>
  );
}
