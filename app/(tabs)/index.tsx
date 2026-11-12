import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
import { useColorScheme } from "@/components/useColorScheme";
import Colors, { fonts } from "@/constants/Colors";

// Amounts are stored in USD and converted by the CurrencyProvider.
const BALANCE_USD = 87457.86;
const INCOME_USD = 4876.89;
const EXPENSE_USD = 8145.45;
const TODAY_USD = 3456.55;

const TRANSACTIONS = [
  {
    id: "1",
    title: "Cash",
    sub: "Prime Bank",
    amount: -543.55,
    balance: 4673.85,
    icon: "wallet-outline",
  },
  {
    id: "2",
    title: "Salary Deposit",
    sub: "Acme Inc.",
    amount: 2400,
    balance: 5217.4,
    icon: "cash-outline",
  },
  {
    id: "3",
    title: "Groceries",
    sub: "Visa •• 4242",
    amount: -86.2,
    balance: 2817.4,
    icon: "cart-outline",
  },
] as const;

const TOP_GAP = 8; // space between the status bar inset and the header row

export default function HomeScreen() {
  const colors = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();
  const { currency, format, parts } = useCurrency();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [heroHeight, setHeroHeight] = useState(280);

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

  const month = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const balance = parts(BALANCE_USD);

  return (
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

            <View style={[styles.pill, { backgroundColor: colors.pill }]}>
              <Text style={[styles.pillText, { color: colors.heroText }]}>
                {month}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.heroText} />
            </View>

            <View style={[styles.circle, { backgroundColor: colors.pill }]}>
              <Ionicons
                name="notifications-outline"
                size={18}
                color={colors.heroText}
              />
            </View>
          </View>

          <View style={styles.balanceBlock}>
            <Text style={[styles.balanceLabel, { color: colors.heroMuted }]}>
              Current Balance
            </Text>
            <View style={styles.balanceRow}>
              <Text style={[styles.balance, { color: colors.heroText }]}>
                {balance.whole}
                <Text style={styles.balanceFraction}>{balance.fraction}</Text>
              </Text>
              <Pressable
                onPress={() => setPickerOpen(true)}
                hitSlop={8}
                style={[
                  styles.pill,
                  styles.currencyPill,
                  { backgroundColor: colors.pill },
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

          <CashflowChart variant="hero" />
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
          <View
            style={[styles.grabber, { backgroundColor: colors.cardBorder }]}
          />

          <View style={styles.rowBetween}>
            <Text style={[styles.h2, { color: colors.text }]}>Your Money</Text>
            <View
              style={[styles.smallPill, { borderColor: colors.cardBorder }]}
            >
              <Text style={[styles.smallPillText, { color: colors.textMuted }]}>
                Details
              </Text>
              <Ionicons
                name="chevron-forward"
                size={12}
                color={colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.row}>
            {[
              {
                label: "Income",
                value: INCOME_USD,
                icon: "arrow-down",
                color: colors.income,
              },
              {
                label: "Expense",
                value: EXPENSE_USD,
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
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
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

          <View style={styles.rowBetween}>
            <Text style={[styles.h2, { color: colors.text }]}>
              Transactions
            </Text>
            <View
              style={[
                styles.smallPill,
                {
                  borderColor: colors.accent,
                  backgroundColor: colors.accentSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.smallPillText,
                  { color: colors.text, fontFamily: fonts.semiBold },
                ]}
              >
                Show all
              </Text>
            </View>
          </View>

          <View style={styles.rowBetween}>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              {today}
            </Text>
            <Text style={[styles.todayTotal, { color: colors.text }]}>
              Today: {format(TODAY_USD)}
            </Text>
          </View>

          <View style={styles.list}>
            {TRANSACTIONS.map((t) => (
              <View
                key={t.id}
                style={[
                  styles.tx,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.txBadge,
                    { backgroundColor: colors.accentSoft },
                  ]}
                >
                  <Ionicons name={t.icon} size={18} color={colors.tint} />
                </View>
                <View style={styles.txBody}>
                  <Text style={[styles.txTitle, { color: colors.text }]}>
                    {t.title}
                  </Text>
                  <Text style={[styles.txSub, { color: colors.textMuted }]}>
                    {t.sub}
                  </Text>
                </View>
                <View style={styles.txRight}>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: t.amount < 0 ? colors.expense : colors.income },
                    ]}
                  >
                    {format(t.amount, { sign: true })}
                  </Text>
                  <Text style={[styles.txSub, { color: colors.textMuted }]}>
                    {format(t.balance)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>

      <CurrencyPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 16,
    zIndex: 1,
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
    gap: 2,
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
});
