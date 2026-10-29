import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { PanResponder, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import type { AppClaim } from '@/lib/appApi';
import { conditionText } from '@/lib/claims';
import { claimApplies } from '@/lib/household';
import { TOPICS, TOPIC_SHORT } from '@/lib/types';
import { SITE, savedAtText } from '@/core/api';
import { useStore } from '@/core/store';
import { F, TAP, usePalette } from '@/core/theme';
import { useBallot } from '@/core/useBallot';
import { ClaimGroup, Tag, candidateOnTopic } from '@/components/claims';
import { PledgeReceipt } from '@/components/money';
import { orderedTopics } from '@/components/nextVote';
import { Banner, ErrorState, LinkRow, Loading, Small, haptic, s } from '@/components/ui';

// What's at stake, by scale (Romily's choice E; the website's candidate page). Topics sit at the scale this office
// works at; a scale it doesn't decide says so, in the same words for every candidate, with where to look instead.
const WORLD = new Set(['defence_foreign_affairs_and_eu', 'environment_climate_and_energy']);
type Scale = { key: 'council' | 'region' | 'uk' | 'world'; label: string; note?: string; href?: string; hrefText?: string };
const LOCAL: Scale[] = [
  { key: 'council', label: 'Your council' },
  { key: 'region', label: 'Your region', note: 'A councillor doesn’t decide regional matters; in England a mayor and combined authority, where there is one, and in Scotland, Wales and Northern Ireland their own parliament or assembly, do.', href: '/learn/who-decides', hrefText: 'Who decides what' },
  { key: 'uk', label: 'The UK', note: 'A councillor doesn’t vote on national law, tax or benefits. What each party has published nationally is on Your politics.', href: '/you#you-stake', hrefText: 'What’s at stake nationally' },
  { key: 'world', label: 'The world', note: 'A councillor doesn’t decide defence, foreign affairs or trade.', href: '/you#you-stake', hrefText: 'Each party’s own words on the world' },
];
const NATIONAL: Scale[] = [
  { key: 'council', label: 'Your council', note: 'An MP doesn’t run the council: bins, planning, local roads, parking, libraries and council tax are decided by councillors.', href: '/learn/who-decides', hrefText: 'Who decides what' },
  { key: 'region', label: 'Your region', note: 'An MP votes on laws for the whole UK (or for England where a matter is devolved elsewhere); regional decisions sit with mayors, combined authorities and the devolved parliaments.', href: '/learn/who-decides', hrefText: 'Who decides what' },
  { key: 'uk', label: 'The UK' },
  { key: 'world', label: 'The world' },
];

// One candidate: photo (the only place photos appear), party, their own words, and their own and their party's
// positions by topic and scale, split for this household on the phone. Every candidate gets the same page. A bar at
// the foot goes to the next name on the paper (Romily's choice C); a sideways swipe does the same, in ballot order only.
export default function CandidateScreen() {
  const { ballotId, candidateId } = useLocalSearchParams<{ ballotId: string; candidateId: string }>();
  const c = usePalette();
  const stacked = useWindowDimensions().fontScale > 1.4;
  const { household, complete, personal } = useStore();
  const { ballot: b, fromCache, savedAt, error, refreshing, refresh, retry } = useBallot(ballotId);
  const idx = b?.candidates.findIndex((x) => String(x.id) === candidateId) ?? -1;
  const k = idx >= 0 ? b!.candidates[idx] : undefined;
  const party = k?.party_ec_id ? b?.parties.find((p) => p.ec_id === k.party_ec_id) : undefined;
  const isLocal = b?.ballot.level === 'local';
  const scales = isLocal ? LOCAL : NATIONAL;
  const [scale, setScale] = useState<Scale['key'] | null>(null);
  const on = scale ?? (isLocal ? 'council' : 'uk');
  const [statementOpen, setStatementOpen] = useState(false);

  const next = b && idx >= 0 && idx + 1 < b.candidates.length ? b.candidates[idx + 1] : null;
  const prev = b && idx > 0 ? b.candidates[idx - 1] : null;
  const go = (to: { id: number } | null, dir: 'next' | 'prev') => {
    if (!to) return;
    haptic.press();
    router.replace({ pathname: '/elections/[ballotId]/candidate/[candidateId]', params: { ballotId, candidateId: String(to.id), dir } });
  };
  // A sideways swipe that starts away from the left edge (which is the system's back gesture).
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (e, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 2.2 && e.nativeEvent.pageX - g.dx > 40,
    onPanResponderRelease: (_, g) => { if (g.dx < -80) go(next, 'next'); else if (g.dx > 80) go(prev, 'prev'); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [next?.id, prev?.id]);

  const onTopic = (topic: string) => (k ? candidateOnTopic(k, party, topic) : { list: [] as AppClaim[], label: null });
  const all: AppClaim[] = k ? TOPICS.flatMap(([t]) => onTopic(t).list) : [];
  const topics = orderedTopics(household, personal).filter((t) => (isLocal ? 'council' : WORLD.has(t.topic) ? 'world' : 'uk') === on);
  const tab = scales.find((x) => x.key === on)!;

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <Stack.Screen options={{ title: b && k ? `No. ${k.position} of ${b.candidates.length}` : 'Candidate' }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 14 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.accent} colors={[c.accent]} />} {...swipe.panHandlers}>
        {fromCache ? <Banner>You’re offline. Showing the copy saved {savedAtText(savedAt)}.</Banner> : null}
        {error && !b ? <ErrorState message={error} onRetry={retry} /> : null}
        {!b && !error ? <Loading label="Loading the candidate" /> : null}
        {b && !k ? <ErrorState message="This candidate is no longer on the ballot." /> : null}
        {k ? (
          <>
            <View style={{ flexDirection: stacked ? 'column' : 'row', gap: 16, alignItems: stacked ? 'flex-start' : 'center' }}>
              {k.photo_url ? (
                <Image source={{ uri: k.photo_url }} style={{ width: 92, height: 116, borderRadius: 16, backgroundColor: c.skeleton }} contentFit="cover" accessible accessibilityLabel={`Photo of ${k.name}`} />
              ) : (
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.roseSoft, alignItems: 'center', justifyContent: 'center' }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                  <Text style={{ fontFamily: F.bold, fontSize: 24, color: c.rose }}>{k.name.split(/\s+/).filter(Boolean).map((w, i, a) => (i === 0 || i === a.length - 1 ? w[0] : '')).join('').toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: stacked ? undefined : 1, gap: 8 }}>
                <Text style={[s.h1, { color: c.ink }]} accessibilityRole="header">{k.name}</Text>
                {/* The party's own colour, on its own candidate's screen only (party material). */}
                <View style={{ alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: party?.colour ?? c.chip, maxWidth: '100%' }}>
                  <Text style={{ fontFamily: F.bold, fontSize: 13, color: party?.ink ?? c.ink }}>{k.party_label || 'Independent'}</Text>
                </View>
                {k.party_label !== k.registered_party && k.registered_party ? <Small style={{ color: c.muted }}>Registered party: {k.registered_party}</Small> : null}
                {k.is_incumbent ? <Small style={{ color: c.muted }}>Currently holds this seat.</Small> : null}
              </View>
            </View>
            {k.photo_url ? <Small style={{ color: c.muted }}>{k.photo_credit && !/^(other|public-domain|profile-photo|copyright-assigned|sopn)$/i.test(k.photo_credit) ? `Photo: ${k.photo_credit}, via Democracy Club.` : 'Photo via Democracy Club.'}</Small> : null}

            {/* In their own words: the statement to voters, unedited. */}
            <View style={{ backgroundColor: c.panel, borderRadius: 20, borderWidth: 1, borderColor: c.line, padding: 16, gap: 8 }}>
              <Text style={[s.eyebrow, { color: c.rose }]}>In their own words</Text>
              {k.statement ? (
                <>
                  <Text style={{ fontFamily: F.displayItalic, fontSize: 17, lineHeight: 25, color: c.ink }}>“{statementOpen || k.statement.length <= 260 ? k.statement : `${k.statement.slice(0, 240).replace(/\s+\S*$/, '')}…`}”</Text>
                  {k.statement.length > 260 ? (
                    <Pressable onPress={() => { haptic.choose(); setStatementOpen((o) => !o); }} accessibilityRole="button" accessibilityState={{ expanded: statementOpen }} style={{ minHeight: TAP, justifyContent: 'center' }}>
                      <Text style={[s.link, { color: c.accent }]}>{statementOpen ? 'Show less' : 'Read all of it'}</Text>
                    </Pressable>
                  ) : null}
                  <Small style={{ color: c.muted }}>Statement supplied by the candidate to Democracy Club, reproduced unedited.</Small>
                </>
              ) : <Text style={[s.body, { color: c.soft }]}>No statement to voters supplied.</Text>}
              {k.homepage_url ? <LinkRow label="Their own website" url={k.homepage_url} /> : null}
            </View>

            <Text style={[s.h2, { color: c.ink }]} accessibilityRole="header">What’s it to {complete ? 'your household' : 'you'}?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityRole="tablist">
              {scales.map((x) => (
                <Pressable key={x.key} onPress={() => { haptic.choose(); setScale(x.key); }} accessibilityRole="tab" accessibilityState={{ selected: on === x.key }}
                  style={{ minHeight: TAP - 4, borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: on === x.key ? c.aubergine : c.panel, borderWidth: 1, borderColor: on === x.key ? c.aubergine : c.line }}>
                  <Text style={{ fontFamily: F.semi, fontSize: 15, color: on === x.key ? c.onAubergine : c.ink }}>{x.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {tab.note ? (
              <View style={{ backgroundColor: c.sand, borderRadius: 16, padding: 14, gap: 4 }}>
                <Text style={[s.body, { color: c.soft }]}>{tab.note}</Text>
                {tab.href ? <LinkRow label={tab.hrefText ?? 'Find out more'} url={`${SITE}${tab.href}`} /> : null}
              </View>
            ) : null}
            {!all.length ? (
              <View style={{ backgroundColor: c.sand, borderRadius: 16, padding: 14 }}>
                <Text style={[s.body, { color: c.soft }]}>Nothing published that we could source for {k.name} yet. That means nothing found, not nothing to say.</Text>
              </View>
            ) : topics.map((t) => {
              const { list, label } = onTopic(t.topic);
              return <TopicCard key={t.topic} title={TOPIC_SHORT[t.topic] ?? t.label} list={list}
                applies={complete && list.some((x) => conditionText(x.applies_if) && claimApplies(x.applies_if, household))}>
                <ClaimGroup claims={list} label={label} household={household} complete={complete} personal={personal} emptyText={`Nothing published that we could source on ${(TOPIC_SHORT[t.topic] ?? t.label).toLowerCase()}. That means nothing found, not nothing to say.`} />
                {t.topic === 'money_and_cost_of_living' ? <PledgeReceipt receipts={b!.receipts} partyEcId={k.party_ec_id} household={household} complete={complete} /> : null}
              </TopicCard>;
            })}
          </>
        ) : null}
      </ScrollView>

      {/* The next name on the paper, always under the thumb. Ballot order only: there is no "best next". */}
      {b && k ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.panel }}>
          <Pressable onPress={() => { haptic.choose(); router.replace({ pathname: '/elections/[ballotId]', params: { ballotId } }); }} accessibilityRole="button" style={{ minHeight: TAP, justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.semi, fontSize: 15, color: c.soft, textDecorationLine: 'underline' }}>Back to the paper</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          {next ? (
            <Pressable onPress={() => go(next, 'next')} accessibilityRole="button" accessibilityLabel={`Next on the paper: number ${next.position}, ${next.name}`}
              style={({ pressed }) => [{ minHeight: TAP, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: TAP, paddingHorizontal: 18, backgroundColor: c.rose, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
              <Text style={{ fontFamily: F.bold, fontSize: 15, color: c.onRose, flexShrink: 1 }} numberOfLines={1}>Next: No. {next.position}, {next.name}</Text>
              <Ionicons name="arrow-forward" size={16} color={c.onRose} />
            </Pressable>
          ) : <Text style={[s.small, { color: c.muted }]}>That’s everyone on the paper.</Text>}
        </View>
      ) : null}
    </View>
  );
}

// A topic as a card that opens (closed to start, so the page reads as a list of topics first).
function TopicCard({ title, list, applies, children }: { title: string; list: AppClaim[]; applies: boolean; children: ReactNode }) {
  const c = usePalette();
  const [open, setOpen] = useState(false);
  const status = list.length ? (applies ? null : 'Published') : 'Nothing found';
  return (
    <View style={{ backgroundColor: c.panel, borderRadius: 18, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }}>
      <Pressable onPress={() => { haptic.choose(); setOpen((o) => !o); }} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${title}${applies ? ', applies to you' : status ? `, ${status.toLowerCase()}` : ''}`}
        style={({ pressed }) => [{ minHeight: TAP + 8, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, opacity: pressed ? 0.7 : 1 }]}>
        <Text style={{ fontFamily: F.display, fontSize: 18, color: c.ink, flexShrink: 1 }}>{title}</Text>
        {applies ? <Tag label="Applies to you" bg={c.accentSoft} fg={c.accent} /> : status ? <Text style={[s.small, { color: c.muted }]}>{status}</Text> : null}
        <View style={{ flex: 1 }} />
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
      </Pressable>
      {open ? <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>{children}</View> : null}
    </View>
  );
}
