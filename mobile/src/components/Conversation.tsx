import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { F, TAP, usePalette } from '@/core/theme';
import { Emblem } from '@/components/brand';
import { Choice } from '@/components/questions';
import { InfoButton, Sheet } from '@/components/Sheet';
import { haptic, s } from '@/components/ui';

export type Ask = { key: string; question: string; options: readonly (readonly [string, string])[]; why?: string };

// The extra questions as a conversation (Romily's choice C for the non-essential questions): the app asks in a bubble
// beside the emblem, the answer appears on the right and can be tapped to change, and the next question follows.
// Every one can be skipped; a skipped one says so and can be answered later. Nothing is assumed from a blank.
export function Conversation({ asks, answers, onAnswer }: { asks: Ask[]; answers: Record<string, string | undefined>; onAnswer: (key: string, value: string | undefined) => void }) {
  const c = usePalette();
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [why, setWhy] = useState<Ask | null>(null);
  // Answered or skipped questions stay in the thread; the first open one is asked now, and the rest wait.
  const current = asks.find((a) => !answers[a.key] && !skipped.has(a.key))?.key ?? null;
  const shown = asks.slice(0, current ? asks.findIndex((a) => a.key === current) + 1 : asks.length);

  return (
    <View style={{ gap: 12 }}>
      {shown.map((a) => {
        const answer = a.options.find(([v]) => v === answers[a.key])?.[1];
        const asking = a.key === current || a.key === editing;
        return (
          <View key={a.key} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingRight: 36 }}>
              <View style={{ width: 30, alignItems: 'center' }}><Emblem size={26} /></View>
              <View style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: c.panel, borderRadius: 18, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: c.line, paddingLeft: 14, paddingVertical: 10, paddingRight: a.why ? 0 : 14 }}>
                <Text style={[s.body, { color: c.ink, flexShrink: 1 }]}>{a.question}</Text>
                {a.why ? <InfoButton label="Why we ask" onPress={() => setWhy(a)} /> : null}
              </View>
            </View>
            {asking ? (
              <View style={{ gap: 8, paddingLeft: 38 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={a.question}>
                  {a.options.map(([v, label]) => (
                    <Choice key={v} label={label} on={answers[a.key] === v} onPress={() => { onAnswer(a.key, v); setEditing(null); setSkipped((x) => { const n = new Set(x); n.delete(a.key); return n; }); }} />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 18 }}>
                  <Pressable onPress={() => { haptic.choose(); setSkipped((x) => new Set(x).add(a.key)); setEditing(null); }} accessibilityRole="button" style={{ minHeight: TAP, justifyContent: 'center' }}>
                    <Text style={{ fontFamily: F.semi, fontSize: 15, color: c.soft, textDecorationLine: 'underline' }}>Skip this one</Text>
                  </Pressable>
                  {answers[a.key] ? (
                    <Pressable onPress={() => { haptic.choose(); onAnswer(a.key, undefined); setEditing(null); setSkipped((x) => new Set(x).add(a.key)); }} accessibilityRole="button" style={{ minHeight: TAP, justifyContent: 'center' }}>
                      <Text style={{ fontFamily: F.semi, fontSize: 15, color: c.soft, textDecorationLine: 'underline' }}>Leave it blank</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : (
              <Pressable onPress={() => { haptic.choose(); setEditing(a.key); }} accessibilityRole="button" accessibilityLabel={`${a.question} ${answer ? `You said ${answer}` : 'Skipped'}`} accessibilityHint="Change this answer"
                style={({ pressed }) => [{ alignSelf: 'flex-end', maxWidth: '82%', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: answer ? c.aubergine : 'transparent', borderWidth: answer ? 0 : 1, borderColor: c.line, borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10, minHeight: TAP, opacity: pressed ? 0.8 : 1 }]}>
                <Text style={{ fontFamily: F.semi, fontSize: 16, color: answer ? c.onAubergine : c.muted, flexShrink: 1 }}>{answer ?? 'Skipped'}</Text>
                <Ionicons name="pencil" size={14} color={answer ? c.onAubergine : c.muted} />
              </Pressable>
            )}
          </View>
        );
      })}
      {!current && !editing ? <Text style={[s.small, { color: c.muted, paddingLeft: 38 }]}>That’s all of them. Tap an answer to change it.</Text> : null}
      <Sheet open={!!why} onClose={() => setWhy(null)} label="Why we ask">
        <Text style={[s.eyebrow, { color: c.rose }]}>Why we ask</Text>
        <Text style={[s.body, { color: c.ink }]}>{why?.why}</Text>
        <Text style={[s.body, { color: c.soft }]}>Your answer stays on this phone. It is never sent, and it never changes who is shown or in what order.</Text>
        <Pressable onPress={() => setWhy(null)} accessibilityRole="button" style={{ minHeight: TAP, justifyContent: 'center' }}><Text style={[s.link, { color: c.accent }]}>Close</Text></Pressable>
      </Sheet>
    </View>
  );
}
