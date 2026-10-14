import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MetaResponse } from '@/lib/appApi';
import { compareVersions } from '@/lib/appApi';
import { loadMeta, savedAtText } from '@/core/api';
import { useStore } from '@/core/store';
import { F, TAP, usePalette } from '@/core/theme';
import { useBallot } from '@/core/useBallot';
import { AreaMap } from '@/components/AreaMap';
import { Emblem, Wordmark } from '@/components/brand';
import { ComingUp, Countdown, Deadlines, Eyebrow, NameCards, SectionTitle, TopicsForYou, upcoming } from '@/components/nextVote';
import { PlaceFinder } from '@/components/PlaceFinder';
import { InfoButton, Sheet } from '@/components/Sheet';
import { Banner, Button, ErrorState, LinkRow, Loading, Small, haptic, openLink, s } from '@/components/ui';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

// Home is "Your next vote" (Romily, round ten Q1), map first (her choice E): the area drawn behind, and a sheet over it
// with the countdown, the deadlines, the paper, what changes for you, and what else is coming up near you. With no area
// saved yet, Home asks where you vote (the welcome's second step). First launch goes through the welcome screens.
export default function Home() {
  const { ready, saved, introSeen } = useStore();
  if (!ready) return null;
  if (!introSeen && !saved) return <Redirect href="/welcome" />;
  return saved ? <NextVote /> : <WherePrompt />;
}

function useMeta() {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  useEffect(() => { loadMeta().then((m) => m?.ok && setMeta(m)).catch(() => {}); }, []);
  const mustUpdate = !!meta && compareVersions(APP_VERSION, meta.minAppVersion) < 0;
  const canUpdate = !!meta && !mustUpdate && compareVersions(APP_VERSION, meta.latestAppVersion) < 0;
  const storeUrl = meta ? (Platform.OS === 'ios' ? meta.storeUrls.ios : meta.storeUrls.android) : null;
  return { meta, mustUpdate, canUpdate, storeUrl };
}

function UpdateNotice() {
  const c = usePalette();
  const { meta, mustUpdate, canUpdate, storeUrl } = useMeta();
  if (!meta || !(mustUpdate || canUpdate)) return null;
  return (
    <Pressable onPress={() => storeUrl && openLink(storeUrl, c)} disabled={!storeUrl} accessibilityRole={storeUrl ? 'link' : 'text'}
      style={{ borderWidth: 2, borderRadius: 14, padding: 14, borderColor: c.accent, backgroundColor: mustUpdate ? c.accent : c.panel }}>
      <Text style={[s.body, { fontFamily: F.bold, color: mustUpdate ? c.onAccent : c.ink }]}>{meta.updateMessage}</Text>
    </Pressable>
  );
}

// No area yet: the brand, one question, and the finder.
function WherePrompt() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <Animated.ScrollView style={{ flex: 1, backgroundColor: c.paper }} contentContainerStyle={{ paddingTop: insets.top + 12, padding: 24, gap: 18 }} keyboardShouldPersistTaps="handled">
      <Wordmark />
      <UpdateNotice />
      <View style={{ alignItems: 'center', paddingVertical: 16 }}><Emblem size={150} /></View>
      <Text style={[s.h1, { color: c.ink, fontSize: 34, lineHeight: 40 }]} accessibilityRole="header">Where do you <Text style={{ fontFamily: F.displayItalic, color: c.rose }}>vote?</Text></Text>
      <Text style={[s.body, { color: c.soft, fontSize: 18 }]}>We’ll find your next election and who’s standing.</Text>
      <PlaceFinder />
    </Animated.ScrollView>
  );
}

function NextVote() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { saved, clearElections, household, complete } = useStore();
  const [changing, setChanging] = useState(false);
  const [credits, setCredits] = useState(false);
  const [scrollY] = useState(() => new Animated.Value(0));
  const { next, ahead } = upcoming(saved!.elections);
  const mapH = Math.round(Math.min(440, height * 0.44));
  const area = next?.post_label ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: c.mapGround }}>
      {/* The map sits behind and drifts up at half speed as the sheet slides over it. */}
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: [{ translateY: scrollY.interpolate({ inputRange: [-200, 0, mapH], outputRange: [0, 0, -mapH / 2], extrapolate: 'clamp' }) }] }}>
        <AreaMap ballotId={next?.covered ? next.ballot_paper_id : null} height={mapH} />
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: mapH - 32, minHeight: height + mapH / 2 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ backgroundColor: c.paper, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingBottom: 48, gap: 12, minHeight: height - insets.top, shadowColor: '#2B1B14', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: -4 }, elevation: 8 }}>
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: c.line, marginTop: 10, marginBottom: 8 }} />
          <UpdateNotice />
          {next?.covered ? <Covered id={next.ballot_paper_id} household={household} complete={complete} /> : next ? <NotCovered name={next.election_name} date={next.election_date} label={next.post_label} placeUrl={saved!.placeUrl} /> : <NothingScheduled outcode={saved!.outcode} placeUrl={saved!.placeUrl} />}

          {!complete ? (
            <Pressable onPress={() => { haptic.press(); router.push({ pathname: '/welcome/question', params: { n: '0' } }); }} accessibilityRole="button" accessibilityLabel="Personalise my politics" accessibilityHint="Seven quick questions about your household. Answers stay on this phone."
              style={({ pressed }) => [{ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.aubergine, borderRadius: 20, padding: 16, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
              <Ionicons name="person-circle-outline" size={30} color={c.onAubergine} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 17, color: c.onAubergine }}>Personalise my politics</Text>
                <Text style={{ fontFamily: F.body, fontSize: 14, color: c.onAubergine, opacity: 0.85 }}>See what applies to a home like yours first</Text>
              </View>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.paper, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="arrow-forward" size={18} color={c.aubergine} /></View>
            </Pressable>
          ) : null}

          <SectionTitle>Coming up near you</SectionTitle>
          <ComingUp list={ahead} placeUrl={saved!.placeUrl} skip={next?.ballot_paper_id} />
          <LinkRow label="What’s happening where you live" url={saved!.placeUrl} hint="Opens your area page on the website" />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 20 }}>
            <Emblem size={22} />
            <Small style={{ color: c.muted }}>Independent. No rankings, no recommendations.</Small>
            <InfoButton label="Sources and map credits" onPress={() => setCredits(true)} />
          </View>
        </View>
      </Animated.ScrollView>

      {/* Floating over the map: where this is (tap to change) and the emblem. */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }} pointerEvents="box-none">
        <Pressable onPress={() => { haptic.choose(); setChanging(true); }} accessibilityRole="button" accessibilityLabel={`Your area: ${saved!.outcode}${area ? `, ${area}` : ''}`} accessibilityHint="Change or forget your area"
          style={({ pressed }) => [{ flex: 1, minHeight: TAP + 4, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.panel, borderRadius: 999, paddingHorizontal: 16, shadowColor: '#2B1B14', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4, opacity: pressed ? 0.85 : 1 }]}>
          <Ionicons name="location" size={18} color={c.aubergine} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.bold, fontSize: 15, color: c.ink }}>{saved!.outcode}</Text>
            {area ? <Text style={{ fontFamily: F.body, fontSize: 12, color: c.muted }} numberOfLines={1}>{area}</Text> : null}
          </View>
          <Ionicons name="swap-horizontal" size={18} color={c.muted} />
        </Pressable>
        <View style={{ width: TAP + 4, height: TAP + 4, borderRadius: 26, backgroundColor: c.panel, alignItems: 'center', justifyContent: 'center', shadowColor: '#2B1B14', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4 }}>
          <Emblem size={34} label="What’s It To Me?" />
        </View>
      </View>

      <Sheet open={changing} onClose={() => setChanging(false)} label="Change your area">
        <Eyebrow>Your area</Eyebrow>
        <Text style={[s.h2, { color: c.ink, marginTop: 0 }]}>Somewhere else?</Text>
        <PlaceFinder onFound={() => setChanging(false)} />
        <Small style={{ color: c.muted }}>Saved on {savedAtText(saved!.savedAt)}. Only {saved!.outcode} is kept on this phone.</Small>
        <Button label="Forget this area" kind="secondary" onPress={() => { setChanging(false); clearElections(); }} hint="Removes the saved area from this phone" />
      </Sheet>
      <Sheet open={credits} onClose={() => setCredits(false)} label="Sources and credits">
        <Eyebrow>Sources</Eyebrow>
        <Small>Elections, candidates and dates: Democracy Club (CC BY 4.0) and official notices. Area outline: ONS Open Geography Portal (Open Government Licence). Postcode lookup: postcodes.io.</Small>
        <Small>What’s It To Me? is independent. It does not represent any government, council or political party.</Small>
        <LinkRow label="Who we are and how it works" url="https://whatsittome.org/who-we-are" />
      </Sheet>
    </View>
  );
}

function Covered({ id, household, complete }: { id: string; household: ReturnType<typeof useStore>['household']; complete: boolean }) {
  const c = usePalette();
  const { ballot: b, fromCache, savedAt, error, retry } = useBallot(id);
  if (error && !b) return <ErrorState message={error} onRetry={retry} />;
  if (!b) return <Loading label="Loading your next vote" />;
  const short = b.ballot.area.replace(/^.*?:\s*/, '');
  return (
    <View style={{ gap: 12 }}>
      {fromCache ? <Banner>You’re offline. Showing the copy saved {savedAtText(savedAt)}.</Banner> : null}
      {b.ballot.cancelled ? <Banner>This election has been cancelled.</Banner> : null}
      {b.ballot.postponed ? <Banner>This election has been postponed.{b.ballot.postponed_note ? ` ${b.ballot.postponed_note}` : ''}</Banner> : null}
      <Countdown date={b.ballot.date} name={b.ballot.by_election_reason ? `${short} by-election` : b.ballot.name} area={b.ballot.area} />

      <SectionTitle>Before polling day</SectionTitle>
      <Deadlines items={b.key_dates.items} idRequired={b.key_dates.id_required} />

      <SectionTitle right={<Text style={[s.small, { color: c.muted }]}>in ballot order</Text>}>{b.candidates.length === 1 ? 'The candidate' : `The ${b.candidates.length} on your paper`}</SectionTitle>
      {b.ballot.uncontested ? <Banner>Uncontested: there are no more candidates than seats, so no vote will be held.</Banner> : null}
      <NameCards ballotId={id} candidates={b.candidates} parties={b.parties} />

      <SectionTitle>What changes for you</SectionTitle>
      <TopicsForYou ballotId={id} b={b} household={household} complete={complete} />
      <LinkRow label="Everything on this ballot" onPress={() => router.push({ pathname: '/elections/[ballotId]', params: { ballotId: id } })} />
    </View>
  );
}

function NotCovered({ name, date, label, placeUrl }: { name: string; date: string; label: string; placeUrl: string }) {
  const c = usePalette();
  return (
    <View style={{ gap: 12 }}>
      <Countdown date={date} name={name} area={label} />
      <View style={{ backgroundColor: c.sand, borderRadius: 20, padding: 16, gap: 8 }}>
        <Text style={[s.body, { color: c.ink }]}>We don’t cover this election yet, so there are no name cards here. Your area page has what we have.</Text>
        <Button label="See your area" kind="secondary" onPress={() => openLink(placeUrl, c)} />
      </View>
    </View>
  );
}

function NothingScheduled({ outcode, placeUrl }: { outcode: string; placeUrl: string }) {
  const c = usePalette();
  return (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <Eyebrow>Your next vote</Eyebrow>
      <Text style={[s.h1, { color: c.ink }]} accessibilityRole="header">Nothing scheduled in {outcode} yet</Text>
      <Text style={[s.body, { color: c.soft }]}>When an election is called here, it will appear on this screen.</Text>
      <Button label="What’s happening where you live" kind="secondary" onPress={() => openLink(placeUrl, c)} />
    </View>
  );
}
