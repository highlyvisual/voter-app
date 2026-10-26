import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAP, usePalette } from '@/core/theme';
import { haptic, s } from '@/components/ui';

// A small sheet that slides up over the screen: the reason behind an (i), or changing your area. Tap outside or
// "Close" to dismiss; Android's back button closes it too.
export function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(27,19,16,0.45)' }} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={{ backgroundColor: c.panel, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: insets.bottom + 12, maxHeight: '85%' }} accessibilityViewIsModal accessibilityLabel={label}>
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: c.line, marginTop: 10 }} />
          <ScrollView contentContainerStyle={[s.page, { paddingTop: 16 }]} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// The round (i) that opens a reason. 48 px to the finger, small to the eye.
export function InfoButton({ onPress, label }: { onPress: () => void; label: string }) {
  const c = usePalette();
  return (
    <Pressable onPress={() => { haptic.choose(); onPress(); }} accessibilityRole="button" accessibilityLabel={label} hitSlop={8}
      style={{ width: TAP, height: TAP, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="information-circle-outline" size={24} color={c.aubergine} />
    </Pressable>
  );
}
