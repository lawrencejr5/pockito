import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCurrency } from '@/components/CurrencyProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';
import type { CurrencyInfo } from '@/constants/currencies';

export const FavoriteCurrenciesSheet = forwardRef<BottomSheetModal>(
  function FavoriteCurrenciesSheet(_, ref) {
    const colors = Colors[useColorScheme()];
    const insets = useSafeAreaInsets();
    const { currencies, favorites, toggleFavorite } = useCurrency();
    const innerRef = useRef<BottomSheetModal>(null);
    const [search, setSearch] = useState('');

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

    const favSet = useMemo(() => new Set(favorites), [favorites]);

    const sortedCurrencies = useMemo(() => {
      const q = search.trim().toLowerCase();
      const filtered = q
        ? currencies.filter(
            (c) =>
              c.code.toLowerCase().includes(q) ||
              c.name.toLowerCase().includes(q),
          )
        : currencies;

      return [...filtered].sort((a, b) => {
        const aFav = favSet.has(a.code) ? 0 : 1;
        const bFav = favSet.has(b.code) ? 0 : 1;
        if (aFav !== bFav) return aFav - bFav;
        return a.code.localeCompare(b.code);
      });
    }, [currencies, favSet, search]);

    const renderItem = useCallback(
      ({ item: c }: { item: CurrencyInfo }) => {
        const isFav = favSet.has(c.code);
        return (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              toggleFavorite(c.code);
            }}
            style={[
              styles.row,
              {
                backgroundColor: colors.card,
                borderColor: isFav ? colors.tint : colors.cardBorder,
              },
            ]}>
            <View style={[styles.symbol, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.symbolText, { color: colors.tint }]} numberOfLines={1}>
                {c.symbol}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.code, { color: colors.text }]}>{c.code}</Text>
              <Text style={[styles.name, { color: colors.textMuted }]} numberOfLines={1}>
                {c.name}
              </Text>
            </View>
            <Ionicons
              name={isFav ? 'star' : 'star-outline'}
              size={22}
              color={isFav ? '#eab308' : colors.textMuted}
            />
          </Pressable>
        );
      },
      [colors, favSet, toggleFavorite],
    );

    return (
      <BottomSheetModal
        ref={innerRef}
        snapPoints={['78%']}
        enableDynamicSizing={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onDismiss={() => setSearch('')}
        backdropComponent={renderBackdrop}
        backgroundStyle={[styles.sheetBg, { backgroundColor: colors.sheet }]}
        handleIndicatorStyle={{ backgroundColor: colors.cardBorder, width: 38 }}>
        <View style={styles.topHeader}>
          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Favorite Currencies</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Pinned in pickers & quick selectors ({favorites.length} selected)
              </Text>
            </View>
            <Pressable
              onPress={() => innerRef.current?.dismiss()}
              style={[styles.doneBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <BottomSheetTextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search currency (e.g. USD, Naira, Euro)"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {search.length > 0 && (
              <Pressable hitSlop={8} onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        <BottomSheetFlatList
          data={sortedCurrencies}
          keyExtractor={(item: CurrencyInfo) => item.code}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 16 },
          ]}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No currencies match "{search}"
            </Text>
          }
        />
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  sheetBg: { borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  topHeader: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontFamily: fonts.bold, fontSize: 18 },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, marginTop: 1 },
  doneBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  doneText: { fontFamily: fonts.semiBold, fontSize: 13, color: '#1c1a17' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    paddingVertical: 2,
  },
  listContent: { paddingHorizontal: 20, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  symbol: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  symbolText: { fontFamily: fonts.bold, fontSize: 15 },
  code: { fontFamily: fonts.semiBold, fontSize: 15 },
  name: { fontFamily: fonts.regular, fontSize: 12, marginTop: 1 },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
});

