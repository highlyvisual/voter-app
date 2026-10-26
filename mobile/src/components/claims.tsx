import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { AppClaim } from '@/lib/appApi';
import { conditionText, splitForHousehold } from '@/lib/claims';
import { claimApplies, type Household } from '@/lib/household';
import { personalMatchers, type PersonalMatch } from '@/lib/personal';
import type { Personal } from '@/core/store';
import { F, TAP, usePalette } from '@/core/theme';
import { Sheet } from '@/components/Sheet';
import { Button, Chip, Small, haptic, openLink, s, shortDate } from '@/components/ui';

// The groups this claim's own words name, from the optional questions about the person (Romily, round ten; Barny, 14
// Oct). Only an explicit naming counts (lib/personal.ts "names" tier), matched against the verbatim quotation, never our
// summary, and only on the phone. It says nothing about whether the position is good or bad for anyone.
export function namedGroups(c: AppClaim, matchers: PersonalMatch[]): string[] {
  return matchers.filter((m) => m.names && m.names.re.test(c.source_quote)).map((m) => m.names!.label);
}
export function useMatchers(personal: Personal) { return personalMatchers(personal); }

// One claim, laid out the same way for every candidate and party (Romily's choices C and A): what kind of source it is,
// our one-line summary, the exact words as a hanging quotation, "Applies to you" only where its own condition matches,
// and "Sourced:" which opens the full citation and the link.
export function ClaimItem({ c, applies, names = [] }: { c: AppClaim; applies: boolean; names?: string[] }) {
  const p = usePalette();
  const [open, setOpen] = useState(false);
  const when = conditionText(c.applies_if)?.replace(/^Applies if:\s*/, '') ?? null;
  const src = c.sources;
  return (
    <View style={{ gap: 10, paddingVertical: 14, borderTopWidth: 1, borderTopColor: p.line }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {applies && when ? <Tag label="Applies to you" bg={p.accentSoft} fg={p.accent} /> : null}
        {names.map((n) => <Tag key={n} label={`Names ${n}`} bg={p.aubergineSoft} fg={p.aubergine} />)}
        <Chip label={c.layer} />
        {c.precision_label ? <Chip label={c.precision_label} /> : null}
      </View>
      <Text style={{ fontFamily: F.semi, fontSize: 17, lineHeight: 24, color: p.ink }}>{c.claim_text}</Text>
      <View style={{ borderLeftWidth: 3, borderLeftColor: p.roseGold, paddingLeft: 14 }} accessible accessibilityLabel={`In their exact words: ${c.source_quote}`}>
        <Text style={{ fontFamily: F.displayItalic, fontSize: 17, lineHeight: 25, color: p.ink }}>“{c.source_quote}”</Text>
      </View>
      {when ? <Small style={applies ? { color: p.ink, fontFamily: F.semi } : undefined}>{applies ? `Because you told us: ${when}.` : `Would apply if: ${when}.`}</Small> : null}
      {src ? (
        <>
          <Pressable onPress={() => { haptic.choose(); setOpen(true); }} accessibilityRole="button" accessibilityLabel={`Sourced: ${src.title}, ${src.publisher}`} accessibilityHint="Shows the full source and its link"
            style={({ pressed }) => [{ minHeight: TAP, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', maxWidth: '100%', opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="document-text-outline" size={16} color={p.accent} />
            <Text style={{ fontFamily: F.semi, fontSize: 14, color: p.accent, flexShrink: 1 }} numberOfLines={2}>
              <Text style={{ fontFamily: F.bold }}>Sourced: </Text>{src.title}{src.published_on ? `, ${shortDate(src.published_on)}` : ''}
            </Text>
          </Pressable>
          <Sheet open={open} onClose={() => setOpen(false)} label="The source">
            <Text style={[s.eyebrow, { color: p.rose }]}>Sourced</Text>
            <Text style={[s.h2, { color: p.ink, marginTop: 0 }]}>{src.title}</Text>
            <SourceRow k="Published by" v={src.publisher} />
            {src.published_on ? <SourceRow k="Published" v={shortDate(src.published_on)} /> : null}
            <SourceRow k="Retrieved" v={shortDate(src.retrieved_at)} />
            <SourceRow k="Address" v={src.url} />
            <Button label="Open the source" onPress={() => openLink(src.url, p)} />
            {src.archive_url ? <Button label="Open the archived copy" kind="secondary" onPress={() => openLink(src.archive_url!, p)} /> : null}
            <Pressable onPress={() => setOpen(false)} accessibilityRole="button" style={{ minHeight: TAP, justifyContent: 'center', alignItems: 'center' }}><Text style={[s.link, { color: p.accent }]}>Close</Text></Pressable>
          </Sheet>
        </>
      ) : <Small>Source unavailable</Small>}
    </View>
  );
}

function SourceRow({ k, v }: { k: string; v: string }) {
  const p = usePalette();
  return (
    <View style={{ gap: 2, paddingVertical: 6, borderTopWidth: 1, borderTopColor: p.line }}>
      <Text style={[s.eyebrow, { color: p.muted }]}>{k}</Text>
      <Text style={[s.body, { color: p.ink }]} selectable>{v}</Text>
    </View>
  );
}

export function Tag({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: bg }}><Text style={{ fontFamily: F.bold, fontSize: 12, color: fg }}>{label}</Text></View>;
}

// A list of claims split for this household, on the phone: those that apply first, the rest under "Applies to others"
// (closed to start, Romily round ten Q32). Within each, claims whose words name a group the person chose come first.
// Without a complete profile, everything is shown in one list, as on the website.
export function ClaimGroup({ claims, household, complete, personal = {}, emptyText }: { claims: AppClaim[]; household: Household; complete: boolean; personal?: Personal; emptyText: string }) {
  const p = usePalette();
  const [open, setOpen] = useState(false);
  const matchers = useMatchers(personal);
  const { shown, hidden } = splitForHousehold(claims, household, complete, claimApplies);
  const byName = (list: AppClaim[]) => [...list].sort((a, b) => Number(namedGroups(b, matchers).length > 0) - Number(namedGroups(a, matchers).length > 0));
  if (!claims.length) return <Small>{emptyText}</Small>;
  return (
    <View>
      {complete && !shown.length ? <Small style={{ paddingVertical: 8 }}>None of these positions mention households like yours.</Small> : null}
      {byName(shown).map((c) => <ClaimItem key={c.id} c={c} applies={complete && claimApplies(c.applies_if, household)} names={namedGroups(c, matchers)} />)}
      {hidden.length ? (
        <View>
          <Pressable
            onPress={() => { haptic.choose(); setOpen((o) => !o); }}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityLabel={`Applies to others, ${hidden.length} ${hidden.length === 1 ? 'position' : 'positions'}`}
            style={({ pressed }) => [{ minHeight: TAP, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: p.line, opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name={open ? 'chevron-down' : 'chevron-forward'} size={16} color={p.soft} />
            <Text style={{ fontFamily: F.semi, fontSize: 15, color: p.soft }}>Applies to others ({hidden.length})</Text>
          </Pressable>
          {open ? byName(hidden).map((c) => <ClaimItem key={c.id} c={c} applies={false} names={namedGroups(c, matchers)} />) : null}
        </View>
      ) : null}
    </View>
  );
}
