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

const PAGE_SIZE = 25;

type ListEntry =
  | { kind: 'section'; id: string; title: string }
  | { kind: 'currency'; id: string; item: CurrencyInfo };

export const FavoriteCurrenciesSheet = forwardRef<BottomSheetModal>(
  function FavoriteCurrenciesSheet(_, ref) {
    const colors = Colors[useColorScheme()];
    const insets = useSafeAreaInsets();
    const { currency, currencies, favorites, setCurrency, toggleFavorite } = useCurrency();
    const innerRef = useRef<BottomSheetModal>(null);
    const [search, setSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

    const rows = useMemo<ListEntry[]>(() => {
      const q = search.trim().toLowerCase();
      const filtered = q
        ? currencies.filter(
            (c) =>
              c.code.toLowerCase().includes(q) ||
              c.name.toLowerCase().includes(q),
          )
        : currencies;

      const byDisplayThenCode = (a: CurrencyInfo, b: CurrencyInfo) => {
        if (a.code === currency.code) return -1;
        if (b.code === currency.code) return 1;
        return a.code.localeCompare(b.code);
      };

      const favItems = filtered.filter((c) => favSet.has(c.code)).sort(byDisplayThenCode);
      const otherItems = filtered.filter((c) => !favSet.has(c.code)).sort(byDisplayThenCode);

      const out: ListEntry[] = [];
      if (favItems.length > 0) {
        out.push({ kind: 'section', id: 'sec-fav', title: 'FAVORITES' });
        for (const item of favItems) {
          out.push({ kind: 'currency', id: `fav-${item.code}`, item });
        }
      }
      if (otherItems.length > 0) {
        out.push({
          kind: 'section',
          id: 'sec-all',
          title: favItems.length > 0 ? 'ALL CURRENCIES' : 'CURRENCIES',
        });
        for (const item of otherItems) {
          out.push({ kind: 'currency', id: `all-${item.code}`, item });
        }
      }
      return out;
    }, [currencies, currency.code, favSet, search]);

    const visibleRows = useMemo(
      () => rows.slice(0, visibleCount),
      [rows, visibleCount],
    );

    const handleLoadMore = useCallback(() => {
      setVisibleCount((prev) => (prev < rows.length ? prev + PAGE_SIZE : prev));
    }, [rows.length]);

    const renderItem = useCallback(
      ({ item: entry }: { item: ListEntry }) => {
        if (entry.kind === 'section') {
          return (
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              {entry.title}
            </Text>
          );
        }

        const c = entry.item;
        const isFav = favSet.has(c.code);
        const isDisplay = c.code === currency.code;
        return (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setCurrency(c.code);
            }}
            style={[
              styles.row,
              {
                backgroundColor: colors.card,
                borderColor: isDisplay ? colors.tint : colors.cardBorder,
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
            {isDisplay && <Ionicons name="checkmark-circle" size={20} color={colors.tint} />}
            <Pressable
              hitSlop={10}
              onPress={(e) => {
                e.stopPropagation();
                Haptics.selectionAsync().catch(() => {});
                toggleFavorite(c.code);
              }}
              style={{ padding: 4 }}>
              <Ionicons
                name={isFav ? 'star' : 'star-outline'}
                size={21}
                color={isFav ? '#eab308' : colors.textMuted}
              />
            </Pressable>
          </Pressable>
        );
      },
      [colors, currency.code, favSet, setCurrency, toggleFavorite],
    );

    return (
      <BottomSheetModal
        ref={innerRef}
        snapPoints={['78%']}
        enableDynamicSizing={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onDismiss={() => {
          setSearch('');
          setVisibleCount(PAGE_SIZE);
        }}
        backdropComponent={renderBackdrop}
        backgroundStyle={[styles.sheetBg, { backgroundColor: colors.sheet }]}
        handleIndicatorStyle={{ backgroundColor: colors.cardBorder, width: 38 }}>
        <View style={styles.topHeader}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>Currencies</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Tap to set display · Star to favorite ({favorites.length})
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
              onChangeText={(text) => {
                setSearch(text);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search currency (e.g. USD, Naira, Euro)"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {search.length > 0 && (
              <Pressable
                hitSlop={8}
                onPress={() => {
                  setSearch('');
                  setVisibleCount(PAGE_SIZE);
                }}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        <BottomSheetFlatList
          data={visibleRows}
          keyExtractor={(item: ListEntry) => item.id}
          renderItem={renderItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={5}
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
  sectionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 2,
    paddingLeft: 4,
  },
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
