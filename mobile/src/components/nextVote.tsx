import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import type { AppCandidate, AppClaim, AppElection, AppKeyDate, AppParty } from '@/lib/appApi';
import { conditionText } from '@/lib/claims';
import { claimApplies, type Household } from '@/lib/household';
import { PERSONAL_KEYS } from '@/lib/personal';
import { topicsForHousehold } from '@/lib/topicOrder';
import { TOPIC_SHORT } from '@/lib/types';
import type { Personal } from '@/core/store';
import type { Ballot } from '@/core/useBallot';
import { F, TAP, usePalette } from '@/core/theme';
import { InfoButton, Sheet } from '@/components/Sheet';
import { haptic, longDate, openLink, s, shortDate } from '@/components/ui';

// The pieces of "Your next vote" on Home (Romily, round ten Q1): the countdown, the deadlines, the paper as name cards,
// what changes for you, and what else is coming up. Same rules as everywhere: ballot-paper order, nothing ranked,
// party colour only on the party's own label.

// Today in the UK, as YYYY-MM-DD, and whole days from it to a date.
export function todayUK() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' }); }
export function daysUntil(iso: string) { return Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse(todayUK() + 'T12:00:00Z')) / 86400000); }

// The elections saved for this area that haven't happened yet, soonest first; the next vote is the first we cover.
export function upcoming(list: AppElection[]) {
  const t = todayUK();
  const ahead = list.filter((e) => e.election_date >= t).sort((a, b) => a.election_date.localeCompare(b.election_date));
  return { next: ahead.find((e) => e.covered) ?? ahead[0] ?? null, ahead };
}

export function Eyebrow({ children, color }: { children: string; color?: string }) {
  const c = usePalette();
  return <Text style={[s.eyebrow, { color: color ?? c.rose }]}>{children}</Text>;
}

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  const c = usePalette();
  const big = useWindowDimensions().fontScale > 1.35; // the note goes under the title with the largest text
  return (
    <View style={{ flexDirection: big ? 'column' : 'row', alignItems: big ? 'flex-start' : 'center', justifyContent: 'space-between', marginTop: 18 }}>
      <Text style={[s.h2, { color: c.ink, marginTop: 0, flexShrink: 1 }]} accessibilityRole="header">{children}</Text>
      {right}
    </View>
  );
}

// The countdown: the number of days, big, in Fraunces; polling day and the hours under it.
export function Countdown({ date, name, area }: { date: string; name: string; area: string }) {
  const c = usePalette();
  const d = daysUntil(date);
  if (d < 0) return (
    <View style={{ gap: 6 }}>
      <Eyebrow color={c.muted}>Held</Eyebrow>
      <Text style={[s.h2, { color: c.ink, marginTop: 2 }]} accessibilityRole="header">{name}</Text>
      <Text style={[s.small, { color: c.soft }]}>Polling day was {longDate(date)} · {area}</Text>
    </View>
  );
  const big = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : String(d);
  const unit = d > 1 ? 'days to polling day' : d === 1 ? 'is polling day' : 'is polling day · polls open 7am to 10pm';
  return (
    <View style={{ gap: 6 }} accessible accessibilityLabel={`${d > 1 ? `${d} days to polling day` : big + ' ' + unit}. ${name}, ${longDate(date)}.`}>
      <Eyebrow>Your next vote</Eyebrow>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <Text style={{ fontFamily: F.display, fontSize: d > 1 ? 64 : 44, lineHeight: d > 1 ? 68 : 50, color: c.aubergine, letterSpacing: -1 }}>{big}</Text>
        <Text style={{ fontFamily: F.semi, fontSize: 17, lineHeight: 22, color: c.soft, paddingBottom: d > 1 ? 10 : 6, flexShrink: 1 }}>{unit}</Text>
      </View>
      <Text style={[s.h2, { color: c.ink, marginTop: 2 }]} accessibilityRole="header">{name}</Text>
      <Text style={[s.small, { color: c.soft }]}>{longDate(date)} · {area}</Text>
    </View>
  );
}

// Register, postal, proxy and photo ID: each with where it stands today, and the GOV.UK page to do it.
export function Deadlines({ items, idRequired }: { items: AppKeyDate[]; idRequired: boolean }) {
  const c = usePalette();
  // With the largest text sizes the row stacks: text first at full width, the state under it.
  const big = useWindowDimensions().fontScale > 1.35;
  const icon: Record<AppKeyDate['kind'], keyof typeof Ionicons.glyphMap> = { register: 'person-add-outline', postal: 'mail-outline', proxy: 'people-outline', voter_id: 'id-card-outline' };
  return (
    <View style={{ backgroundColor: c.sand, borderRadius: 20, paddingHorizontal: 6 }}>
      {items.map((i, n) => {
        const d = daysUntil(i.date);
        const closed = d < 0;
        const state = closed ? 'Closed' : d === 0 ? `Closes today${i.time ? ` at ${i.time}` : ''}` : d === 1 ? 'Closes tomorrow' : `Open · ${d} days left`;
        const soon = !closed && d <= 3;
        return (
          <Pressable key={i.kind} onPress={() => { haptic.choose(); openLink(i.href, c); }} accessibilityRole="link" accessibilityHint="Opens GOV.UK"
            accessibilityLabel={`${i.label}. ${state}. ${closed ? 'Closed on' : 'Deadline'} ${shortDate(i.date)}${i.time ? ` ${i.time}` : ''}.`}
            style={({ pressed }) => [{ minHeight: TAP + 12, flexDirection: big ? 'column' : 'row', alignItems: big ? 'flex-start' : 'center', gap: big ? 6 : 12, paddingHorizontal: 10, paddingVertical: big ? 10 : 0, borderTopWidth: n ? 1 : 0, borderTopColor: c.line, opacity: pressed ? 0.6 : 1 }]}>
            {big ? null : (
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: closed ? c.line : c.panel, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={icon[i.kind]} size={18} color={closed ? c.muted : c.aubergine} />
              </View>
            )}
            <View style={{ flex: big ? undefined : 1, gap: 1 }}>
              <Text style={{ fontFamily: F.semi, fontSize: 16, color: closed ? c.muted : c.ink }}>{i.label}</Text>
              <Text style={[s.small, { color: c.muted }]}>{closed ? 'Closed' : 'By'} {shortDate(i.date)}{i.time ? `, ${i.time}` : ''}</Text>
            </View>
            <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: closed ? 'transparent' : soon ? c.accentSoft : c.aubergineSoft }}>
              <Text style={{ fontFamily: F.bold, fontSize: 12, color: closed ? c.muted : soon ? c.accent : c.aubergine }}>{closed ? 'Closed' : d <= 1 ? (d === 0 ? 'Today' : 'Tomorrow') : `${d} days`}</Text>
            </View>
            {big ? null : <Ionicons name="open-outline" size={16} color={c.muted} />}
          </Pressable>
        );
      })}
      <Text style={[s.small, { color: c.muted, padding: 10, paddingTop: 4 }]}>Polls 7am to 10pm{idRequired ? ' · bring photo ID' : ''}</Text>
    </View>
  );
}

function initials(name: string) {
  const w = name.split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? '') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
}

// The paper as name cards (Romily's choice C), two to a row, in ballot-paper order with the number that keeps it honest.
// Initials, never photos, in a list (round five). The party label sits in the party's own colour.
export function NameCards({ ballotId, candidates, parties }: { ballotId: string; candidates: AppCandidate[]; parties: AppParty[] }) {
  const c = usePalette();
  const big = useWindowDimensions().fontScale > 1.35; // one card to a row with the largest text
  const byId = new Map(parties.map((p) => [p.ec_id, p]));
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {candidates.map((k) => {
        const party = k.party_ec_id ? byId.get(k.party_ec_id) : undefined;
        const colour = party?.colour ?? null;
        return (
          <Pressable key={k.id}
            onPress={() => { haptic.choose(); router.push({ pathname: '/elections/[ballotId]/candidate/[candidateId]', params: { ballotId, candidateId: String(k.id) } }); }}
            accessibilityRole="button" accessibilityLabel={`Number ${k.position}, ${k.name}, ${k.party_label}`} accessibilityHint="Opens what they have said"
            style={({ pressed }) => [{ flexBasis: big ? '100%' : '47%', flexGrow: 1, minHeight: 132, backgroundColor: c.panel, borderRadius: 18, borderWidth: 1, borderColor: c.line, padding: 14, gap: 8, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.roseSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: F.bold, fontSize: 14, color: c.rose }}>{initials(k.name)}</Text>
              </View>
              <Text style={{ fontFamily: F.bold, fontSize: 13, color: c.muted }}>No. {k.position}</Text>
            </View>
            <Text style={{ fontFamily: F.display, fontSize: 17, lineHeight: 22, color: c.ink }} numberOfLines={3}>{k.name}</Text>
            <View style={{ alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: colour ? 9 : 0, paddingVertical: colour ? 3 : 0, backgroundColor: colour ?? 'transparent' }}>
              <Text style={{ fontFamily: F.semi, fontSize: 12, lineHeight: 16, color: colour ? (party?.ink ?? '#000000') : c.muted, flexShrink: 1 }} numberOfLines={2}>{k.party_label || 'Independent'}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// Topics, the household's own first (Romily, round ten Q29), the reason behind an (i) rather than on the row. With any
// optional question about the person answered, Equality and rights comes first too, as on the website. Only topics
// with a sourced position are listed (Barny, 14 Oct); with none at all, one line says so and points to the candidates'
// own statements. A topic is tagged "Applies to you" only where a statement's own condition matches this household.
export function orderedTopics(household: Household, personal: Personal) {
  const base = topicsForHousehold(household).all;
  if (!PERSONAL_KEYS.some((k) => personal[k])) return base;
  const eq = base.find((t) => t.topic === 'equality_and_rights')!;
  return [{ ...eq, reason: eq.reason ?? 'because you answered the optional questions about you' }, ...base.filter((t) => t.topic !== 'equality_and_rights')];
}

export function TopicsForYou({ ballotId, b, household, complete, personal }: { ballotId: string; b: Ballot; household: Household; complete: boolean; personal: Personal }) {
  const c = usePalette();
  const [why, setWhy] = useState<{ label: string; reason: string } | null>(null);
  const claims: AppClaim[] = [...b.parties.flatMap((p) => p.claims), ...b.candidates.flatMap((k) => k.claims)];
  const appliesOn = new Set(complete ? claims.filter((x) => conditionText(x.applies_if) && claimApplies(x.applies_if, household)).map((x) => x.topic) : []);
  const published = new Set(claims.map((x) => x.topic));
  const list = orderedTopics(household, personal).filter((t) => published.has(t.topic));
  const first = b.candidates[0];
  if (!list.length) return (
    <View style={{ backgroundColor: c.sand, borderRadius: 20, padding: 16, gap: 6 }}>
      <Text style={[s.body, { color: c.ink }]}>No one on this paper has published a position we could source yet.</Text>
      {first ? (
        <Pressable onPress={() => { haptic.choose(); router.push({ pathname: '/elections/[ballotId]/candidate/[candidateId]', params: { ballotId, candidateId: String(first.id) } }); }}
          accessibilityRole="button" accessibilityHint="Starts with number 1; swipe or tap Next for the rest, in ballot order" style={({ pressed }) => [{ minHeight: TAP, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.6 : 1 }]}>
          <Text style={[s.link, { color: c.accent }]}>Read the candidates’ own statements</Text>
          <Ionicons name="arrow-forward" size={16} color={c.accent} />
        </Pressable>
      ) : null}
    </View>
  );
  return (
    <View style={{ backgroundColor: c.panel, borderRadius: 20, borderWidth: 1, borderColor: c.line, paddingLeft: 16 }}>
      {list.map((t, n) => (
        <View key={t.topic} style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: n ? 1 : 0, borderTopColor: c.line }}>
          <Pressable onPress={() => { haptic.choose(); router.push({ pathname: '/elections/[ballotId]/topic/[topic]', params: { ballotId, topic: t.topic } }); }}
            accessibilityRole="button" accessibilityLabel={`${TOPIC_SHORT[t.topic] ?? t.label}${appliesOn.has(t.topic) ? ', applies to you' : ''}`}
            style={({ pressed }) => [{ flex: 1, minHeight: TAP + 6, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.6 : 1 }]}>
            <Text style={{ fontFamily: t.reason ? F.semi : F.body, fontSize: 17, color: c.ink, flexShrink: 1 }}>{TOPIC_SHORT[t.topic] ?? t.label}</Text>
            {appliesOn.has(t.topic) ? <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: c.accentSoft }}><Text style={{ fontFamily: F.bold, fontSize: 11, color: c.accent }}>Applies to you</Text></View> : null}
          </Pressable>
          {t.reason ? <InfoButton label={`Why ${TOPIC_SHORT[t.topic] ?? t.label} is near the top`} onPress={() => setWhy({ label: TOPIC_SHORT[t.topic] ?? t.label, reason: t.reason! })} /> : <View style={{ width: 8 }} />}
          <Ionicons name="chevron-forward" size={18} color={c.muted} style={{ marginRight: 12 }} />
        </View>
      ))}
      <Sheet open={!!why} onClose={() => setWhy(null)} label={`Why ${why?.label ?? ''}`}>
        <Eyebrow>Why it’s near the top</Eyebrow>
        <Text style={[s.h2, { color: c.ink, marginTop: 0 }]}>{why?.label}: shown first {why?.reason}.</Text>
        <Text style={[s.body, { color: c.soft }]}>The order changes only with what you told us, never with anything political. It never changes who is shown, or in what order.</Text>
        <Pressable onPress={() => setWhy(null)} accessibilityRole="button" style={{ minHeight: TAP, justifyContent: 'center' }}><Text style={[s.link, { color: c.accent }]}>Close</Text></Pressable>
      </Sheet>
    </View>
  );
}

// "Coming up near you": every election saved for the area, soonest first. A covered one opens its ballot.
export function ComingUp({ list, placeUrl, skip }: { list: AppElection[]; placeUrl: string; skip?: string }) {
  const c = usePalette();
  const rest = list.filter((e) => e.ballot_paper_id !== skip);
  return (
    <View style={{ gap: 8 }}>
      {rest.length === 0 ? <Text style={[s.body, { color: c.soft }]}>Nothing else is scheduled here yet.</Text> : null}
      {rest.map((e) => (
        <Pressable key={e.ballot_paper_id}
          onPress={() => { haptic.choose(); if (e.covered) router.push({ pathname: '/elections/[ballotId]', params: { ballotId: e.ballot_paper_id } }); else openLink(placeUrl, c); }}
          accessibilityRole={e.covered ? 'button' : 'link'} accessibilityLabel={`${e.election_name}, ${e.post_label}, ${longDate(e.election_date)}`}
          style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.panel, borderRadius: 18, borderWidth: 1, borderColor: c.line, padding: 12, opacity: pressed ? 0.7 : 1 }]}>
          <View style={{ width: 52, borderRadius: 12, backgroundColor: c.apricot, alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ fontFamily: F.bold, fontSize: 11, color: c.rose, textTransform: 'uppercase' }}>{new Date(e.election_date + 'T12:00:00Z').toLocaleDateString('en-GB', { month: 'short', timeZone: 'Europe/London' })}</Text>
            <Text style={{ fontFamily: F.display, fontSize: 22, lineHeight: 26, color: c.ink }}>{Number(e.election_date.slice(8))}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: F.semi, fontSize: 16, color: c.ink }} numberOfLines={2}>{e.post_label}</Text>
            <Text style={[s.small, { color: c.muted }]} numberOfLines={2}>{e.covered ? e.election_name : 'Not covered yet · see your area'}</Text>
          </View>
          <Ionicons name={e.covered ? 'chevron-forward' : 'open-outline'} size={18} color={c.muted} />
        </Pressable>
      ))}
    </View>
  );
}
