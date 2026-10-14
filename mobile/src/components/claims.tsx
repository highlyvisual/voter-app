import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { AppClaim } from '@/lib/appApi';
import { conditionText, splitForHousehold } from '@/lib/claims';
import { claimApplies, type Household } from '@/lib/household';
import { TAP, usePalette } from '@/core/theme';
import { Chip, Small, openLink, s, shortDate } from '@/components/ui';

// One claim, laid out the same way for every candidate and party: the kind of source (grey chip), our one-line summary,
// the verbatim quotation, who it applies to if it names a group, and the source line, which opens the source.
export function ClaimItem({ c, applies }: { c: AppClaim; applies: boolean }) {
  const p = usePalette();
  const when = conditionText(c.applies_if)?.replace(/^Applies if:\s*/, '') ?? null;
  const src = c.sources;
  const sourceLine = src ? `${src.title}, ${src.publisher}${src.published_on ? `, ${shortDate(src.published_on)}` : ''}` : 'Source unavailable';
  return (
    <View style={{ gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: p.line }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Chip label={c.layer} />
        {c.precision_label ? <Chip label={c.precision_label} /> : null}
      </View>
      <Text style={[s.body, { color: p.ink, fontWeight: '700' }]}>{c.claim_text}</Text>
      <View style={{ borderLeftWidth: 3, borderLeftColor: p.accent, paddingLeft: 12 }} accessible accessibilityLabel={`In their exact words: ${c.source_quote}`}>
        <Text style={[s.body, { color: p.ink, fontStyle: 'italic' }]}>“{c.source_quote}”</Text>
      </View>
      {when ? <Small style={applies ? { color: p.ink, fontWeight: '700' } : undefined}>{applies ? `Applies to you: ${when}.` : `Would apply if: ${when}.`}</Small> : null}
      {src ? (
        <Pressable
          onPress={() => openLink(src.url, p)}
          accessibilityRole="link"
          accessibilityLabel={`Source: ${sourceLine}`}
          accessibilityHint="Opens the source"
          style={({ pressed }) => [{ minHeight: TAP, justifyContent: 'center', opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[s.small, { color: p.accent, fontWeight: '700' }]}>Source: {sourceLine} ›</Text>
        </Pressable>
      ) : <Small>{sourceLine}</Small>}
    </View>
  );
}

// A list of claims split for this household, on the phone: those that apply first, the rest under "Applies to others".
// Without a complete profile, everything is shown in one list (as the website does).
export function ClaimGroup({ claims, household, complete, emptyText }: { claims: AppClaim[]; household: Household; complete: boolean; emptyText: string }) {
  const p = usePalette();
  const [open, setOpen] = useState(false);
  const { shown, hidden } = splitForHousehold(claims, household, complete, claimApplies);
  if (!claims.length) return <Small>{emptyText}</Small>;
  return (
    <View>
      {/* TODO(Romily): what to say when a household has claims on this topic but none apply to it. Placeholder below. */}
      {complete && !shown.length ? <Small>None of these name a household like yours.</Small> : null}
      {shown.map((c) => <ClaimItem key={c.id} c={c} applies={complete} />)}
      {hidden.length ? (
        <View>
          <Pressable
            onPress={() => setOpen((o) => !o)}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityLabel={`Applies to others, ${hidden.length} ${hidden.length === 1 ? 'position' : 'positions'}`}
            style={({ pressed }) => [{ minHeight: TAP, justifyContent: 'center', borderTopWidth: 1, borderTopColor: p.line, opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[s.small, { color: p.ink, fontWeight: '700' }]}>{open ? '▾' : '▸'} Applies to others ({hidden.length})</Text>
          </Pressable>
          {open ? hidden.map((c) => <ClaimItem key={c.id} c={c} applies={false} />) : null}
        </View>
      ) : null}
    </View>
  );
}
