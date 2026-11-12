import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCurrency } from '@/components/CurrencyProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';
import { CURRENCY_LIST, type CurrencyCode } from '@/constants/currencies';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Optional: pick a currency locally instead of changing the app currency. */
  selected?: CurrencyCode;
  onSelect?: (code: CurrencyCode) => void;
};

export function CurrencyPicker({ visible, onClose, selected, onSelect }: Props) {
  const colors = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();
  const { currency, setCurrency } = useCurrency();
  const activeCode = selected ?? currency.code;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.sheet, paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.grabber, { backgroundColor: colors.cardBorder }]} />
        <Text style={[styles.title, { color: colors.text }]}>Currency</Text>
        {CURRENCY_LIST.map((c) => {
          const active = c.code === activeCode;
          return (
            <Pressable
              key={c.code}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                (onSelect ?? setCurrency)(c.code);
                onClose();
              }}
              style={[
                styles.row,
                { backgroundColor: colors.card, borderColor: active ? colors.tint : colors.cardBorder },
              ]}>
              <View style={[styles.symbol, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.symbolText, { color: colors.tint }]}>{c.symbol}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.code, { color: colors.text }]}>{c.code}</Text>
                <Text style={[styles.name, { color: colors.textMuted }]}>{c.name}</Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={22} color={colors.tint} />}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 10 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 8 },
  title: { fontFamily: fonts.bold, fontSize: 18, marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  symbol: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  symbolText: { fontFamily: fonts.bold, fontSize: 18 },
  code: { fontFamily: fonts.semiBold, fontSize: 15 },
  name: { fontFamily: fonts.regular, fontSize: 12 },
});
