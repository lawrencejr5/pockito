import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCurrency } from '@/components/CurrencyProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';
import { CURRENCY_LIST, type CurrencyCode } from '@/constants/currencies';

type Props = {
  /** Optional: pick a currency locally instead of changing the app currency. */
  selected?: CurrencyCode;
  onSelect?: (code: CurrencyCode) => void;
};

export const CurrencyPicker = forwardRef<BottomSheetModal, Props>(
  function CurrencyPicker({ selected, onSelect }, ref) {
    const colors = Colors[useColorScheme()];
    const insets = useSafeAreaInsets();
    const { currency, setCurrency } = useCurrency();
    const activeCode = selected ?? currency.code;
    const innerRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => innerRef.current as BottomSheetModal);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={innerRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={[styles.sheetBg, { backgroundColor: colors.sheet }]}
        handleIndicatorStyle={{ backgroundColor: colors.cardBorder, width: 38 }}>
        <BottomSheetView style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <Text style={[styles.title, { color: colors.text }]}>Currency</Text>
          {CURRENCY_LIST.map((c) => {
            const active = c.code === activeCode;
            return (
              <Pressable
                key={c.code}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  (onSelect ?? setCurrency)(c.code);
                  innerRef.current?.dismiss();
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
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  sheetBg: { borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheet: { paddingHorizontal: 20, paddingTop: 4, gap: 10 },
  title: { fontFamily: fonts.bold, fontSize: 18, marginBottom: 4 },
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
