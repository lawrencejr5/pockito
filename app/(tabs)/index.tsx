import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CashflowChart } from "@/components/CashflowChart";
import { CurrencyPicker } from "@/components/CurrencyPicker";
import { useCurrency } from "@/components/CurrencyProvider";
import { useTransactions } from "@/components/TransactionsProvider";
import { useColorScheme } from "@/components/useColorScheme";
import Colors, { fonts } from "@/constants/Colors";
import { getCategory } from "@/constants/categories";

const TOP_GAP = 8; // space between the status bar inset and the header row

type MoneyPeriod = "today" | "week" | "month";

const MONEY_PERIODS: { key: MoneyPeriod; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function sameMonth(a: Date, b: Date) {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function isInPeriod(date: Date, now: Date, selectedMonth: Date, period: MoneyPeriod) {
  if (period === "today") return date.toDateString() === now.toDateString();
  if (period === "week") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return date >= startOfWeek;
  }
  return sameMonth(date, selectedMonth);
}

export default function HomeScreen() {
  const colors = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();
  const { currency, format, parts } = useCurrency();
  const { transactions } = useTransactions();
  const [moneyPeriod, setMoneyPeriod] = useState<MoneyPeriod>("month");
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [heroHeight, setHeroHeight] = useState(280);
  const periodSheetRef = useRef<BottomSheetModal>(null);
  const monthSheetRef = useRef<BottomSheetModal>(null);
  const currencySheetRef = useRef<BottomSheetModal>(null);

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

  const { incomeUsd, expenseUsd, todayNetUsd, currentBalanceUsd, recent } = useMemo(() => {
    const now = new Date();
    let inc = 0;
    let exp = 0;
    let todayNet = 0;
    let totalNet = 0;
    const filtered = [];
    for (const t of transactions) {
      const d = new Date(t.date);
      const signed = t.type === "income" ? t.amountUsd : -t.amountUsd;
      totalNet += signed;
      if (isInPeriod(d, now, selectedMonth, moneyPeriod)) {
        filtered.push(t);
        if (t.type === "income") inc += t.amountUsd;
        else exp += t.amountUsd;
      }
      if (d.toDateString() === now.toDateString()) todayNet += signed;
    }
    return {
      incomeUsd: inc,
      expenseUsd: exp,
      todayNetUsd: todayNet,
      currentBalanceUsd: totalNet,
      recent: filtered.slice(0, 10),
    };
  }, [transactions, moneyPeriod, selectedMonth]);

  const stickyTop = insets.top + TOP_GAP;
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  // The hero stays in place behind the sheet; it softly fades as the sheet covers it.
  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, heroHeight * 0.8],
      [1, 0.25],
      Extrapolation.CLAMP,
    ),
    // Counter-translate the scroll offset so the hero stays pinned; 0.85 gives a slight parallax.
    transform: [
      { translateY: scrollY.value > 0 ? scrollY.value * 0.85 : scrollY.value },
      {
        scale: interpolate(
          scrollY.value,
          [0, heroHeight],
          [1, 0.96],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // Once the sheet reaches stickyTop (overlaying the hero), pin the "Your Money" header + cards.
  const stickyHeaderStyle = useAnimatedStyle(() => {
    const threshold = Math.max(0, heroHeight - stickyTop);
    const offset = Math.max(0, scrollY.value - threshold);
    return {
      transform: [{ translateY: offset }],
    };
  }, [heroHeight, stickyTop]);

  const selectedPeriodLabel =
    MONEY_PERIODS.find((p) => p.key === moneyPeriod)?.label ?? "This month";

  const month = selectedMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const balance = parts(currentBalanceUsd);

  return (
    <GestureHandlerRootView style={styles.screen}>
      <BottomSheetModalProvider>
        <View style={[styles.screen, { backgroundColor: colors.hero }]}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.screen}
      >
        {/* Hero lives in the scroll content but is counter-translated to stay pinned,
            so the sheet (higher zIndex) slides over it. */}
        <Animated.View
          onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}
          style={[styles.hero, { paddingTop: insets.top + TOP_GAP }, heroStyle]}
        >
          <View style={styles.topBar}>
            <View
              style={[styles.circle, { backgroundColor: colors.secondary }]}
            >
              <Ionicons name="person" size={17} color="#fff" />
            </View>

            <Pressable
              onPress={() => {
                setPickerYear(selectedMonth.getFullYear());
                monthSheetRef.current?.present();
              }}
              hitSlop={8}
              style={[styles.pill, { backgroundColor: colors.pill }]}
            >
              <Text style={[styles.pillText, { color: colors.heroText }]}>
                {month}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.heroText} />
            </Pressable>

            <Pressable
              onPress={() => router.push("/add-transaction")}
              hitSlop={8}
              style={[styles.circle, { backgroundColor: colors.pill }]}
            >
              <Ionicons name="add" size={22} color={colors.heroText} />
            </Pressable>
          </View>

          <View style={styles.balanceBlock}>
            <View style={styles.balanceRow}>
              <Text style={[styles.balance, { color: colors.heroText }]}>
                {balance.whole}
                <Text style={styles.balanceFraction}>{balance.fraction}</Text>
              </Text>
              <Pressable
                onPress={() => currencySheetRef.current?.present()}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.pill,
                  styles.currencyPill,
                  { backgroundColor: colors.pill, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.currencyText, { color: colors.heroText }]}>
                  {currency.code}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={12}
                  color={colors.heroText}
                />
              </Pressable>
            </View>
          </View>

          <CashflowChart variant="hero" currentBalanceUsd={currentBalanceUsd} />
        </Animated.View>

        <View style={{ height: heroHeight }} pointerEvents="none" />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.sheet,
              paddingBottom: Math.max(insets.bottom, 20) + 100,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.sheetHeader,
              { backgroundColor: colors.sheet },
              stickyHeaderStyle,
            ]}
          >
            <View
              style={[styles.grabber, { backgroundColor: colors.cardBorder }]}
            />

            <View style={styles.rowBetween}>
              <Text style={[styles.h2, { color: colors.text }]}>
                Your Money
              </Text>
              <Pressable
                onPress={() => periodSheetRef.current?.present()}
                hitSlop={8}
                style={[
                  styles.smallPill,
                  {
                    borderColor: colors.cardBorder,
                    backgroundColor: colors.card,
                  },
                ]}
              >
                <Text style={[styles.smallPillText, { color: colors.text }]}>
                  {selectedPeriodLabel}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={12}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>

            <View style={styles.row}>
              {[
                {
                  label: "Income",
                  value: incomeUsd,
                  icon: "arrow-down",
                  color: colors.income,
                },
                {
                  label: "Expense",
                  value: expenseUsd,
                  icon: "arrow-up",
                  color: colors.expense,
                },
              ].map((c) => (
                <View
                  key={c.label}
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.statTop}>
                    <View
                      style={[
                        styles.statBadge,
                        { backgroundColor: colors.accentSoft },
                      ]}
                    >
                      <Ionicons
                        name={c.icon as "arrow-up"}
                        size={14}
                        color={c.color}
                      />
                    </View>
                    <Text
                      style={[styles.statLabel, { color: colors.textMuted }]}
                    >
                      {c.label}
                    </Text>
                  </View>
                  <Text
                    style={[styles.stat, { color: colors.text }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {format(c.value)}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <View style={styles.txSection}>
            <View style={styles.rowBetween}>
              <Text style={[styles.h2, { color: colors.text }]}>
                Transactions
              </Text>
            </View>

            <View style={styles.rowBetween}>
              <Text style={[styles.dateText, { color: colors.textMuted }]}>
                {today}
              </Text>
              <Text style={[styles.todayTotal, { color: colors.text }]}>
                Today: {format(todayNetUsd, { sign: true })}
              </Text>
            </View>

            <View style={styles.list}>
              {recent.length === 0 ? (
                <View
                  style={[
                    styles.emptyBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.txSub, { color: colors.textMuted }]}>
                    No transactions for {selectedPeriodLabel.toLowerCase()}
                  </Text>
                </View>
              ) : (
                recent.map((t) => {
                const cat = getCategory(t.categoryId);
                const signed = t.type === "income" ? t.amountUsd : -t.amountUsd;
                const when = new Date(t.date);
                const sub = `${cat.label} · ${when.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() =>
                      router.push({
                        pathname: "/transaction/[id]",
                        params: { id: t.id },
                      })
                    }
                    style={({ pressed }) => [
                      styles.tx,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.txBadge,
                        { backgroundColor: cat.color + "26" },
                      ]}
                    >
                      <Ionicons name={cat.icon} size={18} color={cat.color} />
                    </View>
                    <View style={styles.txBody}>
                      <Text style={[styles.txTitle, { color: colors.text }]}>
                        {t.title}
                      </Text>
                      <Text style={[styles.txSub, { color: colors.textMuted }]}>
                        {sub}
                      </Text>
                    </View>
                    <View style={styles.txRight}>
                      <Text
                        style={[
                          styles.txAmount,
                          {
                            color: signed < 0 ? colors.expense : colors.income,
                          },
                        ]}
                      >
                        {format(signed, { sign: true })}
                      </Text>
                      <Text style={[styles.txSub, { color: colors.textMuted }]}>
                        {when.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
              )}
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      <CurrencyPicker ref={currencySheetRef} />

      <BottomSheetModal
        ref={periodSheetRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={[styles.modalSheetBg, { backgroundColor: colors.sheet }]}
        handleIndicatorStyle={{ backgroundColor: colors.cardBorder, width: 38 }}
      >
        <BottomSheetView
          style={[
            styles.modalSheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Show totals for
          </Text>
          {MONEY_PERIODS.map((p) => {
            const active = p.key === moneyPeriod;
            return (
              <Pressable
                key={p.key}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setMoneyPeriod(p.key);
                  periodSheetRef.current?.dismiss();
                }}
                style={[
                  styles.periodRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: active ? colors.tint : colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.periodLabel, { color: colors.text }]}>
                  {p.label}
                </Text>
                {active && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.tint}
                  />
                )}
              </Pressable>
            );
          })}
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal
        ref={monthSheetRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={[styles.modalSheetBg, { backgroundColor: colors.sheet }]}
        handleIndicatorStyle={{ backgroundColor: colors.cardBorder, width: 38 }}
      >
        <BottomSheetView
          style={[
            styles.modalSheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 12 },
          ]}
        >
          <View style={styles.yearRow}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setPickerYear((y) => y - 1);
              }}
              hitSlop={10}
              style={[
                styles.yearBtn,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
            <Text style={[styles.yearText, { color: colors.text }]}>
              {pickerYear}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setPickerYear((y) => y + 1);
              }}
              hitSlop={10}
              style={[
                styles.yearBtn,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.monthGrid}>
            {MONTH_NAMES.map((name, idx) => {
              const active =
                selectedMonth.getFullYear() === pickerYear &&
                selectedMonth.getMonth() === idx;
              return (
                <Pressable
                  key={name}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelectedMonth(new Date(pickerYear, idx, 1));
                    setMoneyPeriod("month");
                    monthSheetRef.current?.dismiss();
                  }}
                  style={[
                    styles.monthCell,
                    {
                      backgroundColor: active ? colors.accent : colors.card,
                      borderColor: active ? colors.tint : colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.monthCellText,
                      { color: active ? "#1c1a17" : colors.text },
                    ]}
                  >
                    {name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  hero: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  pillText: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18 },

  balanceBlock: { alignItems: "center", gap: 2 },
  balanceLabel: { fontFamily: fonts.medium, fontSize: 12 },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  balance: { fontFamily: fonts.bold, fontSize: 28 },
  balanceFraction: { fontFamily: fonts.semiBold, fontSize: 20, opacity: 0.55 },
  currencyPill: { height: 26, paddingHorizontal: 10, gap: 4 },
  currencyText: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16 },

  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 1,
  },
  sheetHeader: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 14,
    zIndex: 10,
  },
  txSection: {
    paddingHorizontal: 20,
    paddingTop: 2,
    gap: 14,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 2,
  },

  row: { flexDirection: "row", gap: 12 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  h2: { fontFamily: fonts.bold, fontSize: 16 },

  smallPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  smallPillText: { fontFamily: fonts.medium, fontSize: 12 },

  statCard: { flex: 1, padding: 14, borderRadius: 18, borderWidth: 1, gap: 10 },
  statTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  statBadge: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { fontFamily: fonts.medium, fontSize: 13 },
  stat: { fontFamily: fonts.bold, fontSize: 20 },

  insights: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  insightsLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  insightsText: { fontFamily: fonts.medium, fontSize: 13 },
  insightsCta: { fontFamily: fonts.semiBold, fontSize: 13 },

  dateText: { fontFamily: fonts.regular, fontSize: 12 },
  todayTotal: { fontFamily: fonts.semiBold, fontSize: 12 },

  list: { gap: 10 },
  tx: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  txBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  txBody: { flex: 1 },
  txRight: { alignItems: "flex-end" },
  txTitle: { fontFamily: fonts.semiBold, fontSize: 14 },
  txSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 1 },
  txAmount: { fontFamily: fonts.bold, fontSize: 14 },

  modalSheetBg: { borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  modalSheet: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 10,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 18,
    borderWidth: 1,
  },
  modalTitle: { fontFamily: fonts.bold, fontSize: 18, marginBottom: 4 },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
  },
  periodLabel: { fontFamily: fonts.semiBold, fontSize: 15 },
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  yearBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  yearText: { fontFamily: fonts.bold, fontSize: 18 },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  monthCell: {
    width: "31.5%",
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  monthCellText: { fontFamily: fonts.semiBold, fontSize: 14 },
});
