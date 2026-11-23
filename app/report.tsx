import { useQuery } from "convex/react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { useCloudSync } from "@/components/CloudSyncProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useTransactions } from "@/components/TransactionsProvider";
import { useColorScheme } from "@/components/useColorScheme";
import Colors, { fonts } from "@/constants/Colors";
import { getCategory } from "@/constants/categories";
import { api } from "@/convex/_generated/api";
import {
  computeReportStats,
  REPORT_PERIODS,
  type ReportPeriod,
} from "@/lib/reportStats";
import {
  buildPdfFilename,
  buildSpendingReportHtml,
  buildSpendingReportText,
  promptDocumentExport,
} from "@/lib/exports";

export default function ReportScreen() {
  const colors = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();
  const { format, currency } = useCurrency();
  const { isAuthenticated } = useCloudSync();
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : "skip");
  const { transactions } = useTransactions();
  const [period, setPeriod] = useState<ReportPeriod>("30D");

  const stats = useMemo(
    () => computeReportStats(transactions, period),
    [transactions, period],
  );

  const handleExportReport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const accountName = viewer?.fullname || viewer?.name || "Pockito User";
    const payload = {
      accountName,
      accountEmail: viewer?.email,
      period,
      currencyCode: currency.code,
      format,
      stats,
      getCategoryLabel: (id: string) => {
        const cat = getCategory(id);
        return { label: cat.label, color: cat.color };
      },
    };
    promptDocumentExport({
      title: `Export ${period === "All" ? "All-Time" : period} Report`,
      fileName: buildPdfFilename(accountName, "report"),
      buildHtml: () => buildSpendingReportHtml(payload),
      buildText: () => buildSpendingReportText(payload),
    });
  };

  const largestExpenseCat = stats.largestExpense
    ? getCategory(stats.largestExpense.categoryId)
    : null;
  const largestIncomeCat = stats.largestIncome
    ? getCategory(stats.largestIncome.categoryId)
    : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.sheet }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: 20, paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
      >
        {/* Header & Period Switcher */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>Report</Text>
              <Text style={[styles.sub, { color: colors.textMuted }]}>
                Category breakdown &amp; spending insights
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={handleExportReport}
                hitSlop={8}
                style={[
                  styles.exportBtn,
                  {
                    backgroundColor: colors.accentSoft,
                  },
                ]}
              >
                <Ionicons name="share-outline" size={16} color={colors.tint} />
                <Text style={[styles.exportBtnText, { color: colors.tint }]}>
                  Export
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  router.back();
                }}
                hitSlop={10}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>
          <View
            style={[
              styles.periodBar,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            {REPORT_PERIODS.map((p) => {
              const active = p === period;
              return (
                <Pressable
                  key={p}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setPeriod(p);
                  }}
                  style={[
                    styles.periodPill,
                    active && { backgroundColor: colors.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.periodText,
                      {
                        color: active ? "#1c1a17" : colors.textMuted,
                        fontFamily: active ? fonts.semiBold : fonts.medium,
                      },
                    ]}
                  >
                    {p}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Spending by Category (Main Hero) */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(320)}
          layout={LinearTransition.springify().damping(18)}
        >
          <CategoryBreakdown
            categories={stats.categories}
            totalExpenseUsd={stats.expenseUsd}
          />
        </Animated.View>

        {/* Key Metrics Grid */}
        <Animated.View
          entering={FadeInDown.delay(140).duration(320)}
          style={styles.grid}
        >
          {/* Daily Average Spending */}
          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.metricIcon,
                { backgroundColor: colors.accentSoft },
              ]}
            >
              <Ionicons name="today-outline" size={16} color={colors.tint} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
              Daily Avg Spend
            </Text>
            <Text
              style={[styles.metricValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {format(stats.dailyAvgSpendUsd)}
            </Text>
            <Text style={[styles.metricMeta, { color: colors.textMuted }]}>
              per day
            </Text>
          </View>

          {/* Monthly Average Spending */}
          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.metricIcon,
                { backgroundColor: colors.accentSoft },
              ]}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.tint} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
              Monthly Avg Spend
            </Text>
            <Text
              style={[styles.metricValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {format(stats.monthlyAvgSpendUsd)}
            </Text>
            <Text style={[styles.metricMeta, { color: colors.textMuted }]}>
              per month
            </Text>
          </View>

          {/* Largest Expense */}
          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.metricIcon,
                {
                  backgroundColor: largestExpenseCat
                    ? largestExpenseCat.color + "26"
                    : colors.accentSoft,
                },
              ]}
            >
              <Ionicons
                name={largestExpenseCat?.icon ?? "trending-down-outline"}
                size={16}
                color={largestExpenseCat?.color ?? colors.expense}
              />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
              Largest Expense
            </Text>
            <Text
              style={[styles.metricValue, { color: colors.expense }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {stats.largestExpense
                ? format(stats.largestExpense.amountUsd)
                : "—"}
            </Text>
            <Text
              style={[styles.metricMeta, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {largestExpenseCat
                ? `${largestExpenseCat.label} · ${stats.largestExpense?.title}`
                : "No expenses"}
            </Text>
          </View>

          {/* Largest Income */}
          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.metricIcon,
                {
                  backgroundColor: largestIncomeCat
                    ? largestIncomeCat.color + "26"
                    : colors.accentSoft,
                },
              ]}
            >
              <Ionicons
                name={largestIncomeCat?.icon ?? "trending-up-outline"}
                size={16}
                color={largestIncomeCat?.color ?? colors.income}
              />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
              Largest Income
            </Text>
            <Text
              style={[styles.metricValue, { color: colors.income }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {stats.largestIncome
                ? format(stats.largestIncome.amountUsd)
                : "—"}
            </Text>
            <Text
              style={[styles.metricMeta, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {largestIncomeCat
                ? `${largestIncomeCat.label} · ${stats.largestIncome?.title}`
                : "No income"}
            </Text>
          </View>

          {/* Peak Spending Day */}
          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.metricIcon,
                { backgroundColor: colors.expense + "26" },
              ]}
            >
              <Ionicons name="flame-outline" size={16} color={colors.expense} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
              Peak Spending Day
            </Text>
            <Text
              style={[styles.metricValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {stats.peakSpendingDay
                ? new Date(stats.peakSpendingDay.date).toLocaleDateString(
                    "en-GB",
                    {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    },
                  )
                : "—"}
            </Text>
            <Text
              style={[styles.metricMeta, { color: colors.expense }]}
              numberOfLines={1}
            >
              {stats.peakSpendingDay
                ? `${format(stats.peakSpendingDay.amountUsd)} spent`
                : "No expenses"}
            </Text>
          </View>

          {/* Best Earning Day */}
          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.metricIcon,
                { backgroundColor: colors.income + "26" },
              ]}
            >
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={colors.income}
              />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
              Best Earning Day
            </Text>
            <Text
              style={[styles.metricValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {stats.bestEarningDay
                ? new Date(stats.bestEarningDay.date).toLocaleDateString(
                    "en-GB",
                    {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    },
                  )
                : "—"}
            </Text>
            <Text
              style={[styles.metricMeta, { color: colors.income }]}
              numberOfLines={1}
            >
              {stats.bestEarningDay
                ? `${format(stats.bestEarningDay.amountUsd)} earned`
                : "No income"}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },

  header: { gap: 12 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exportBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  exportBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 28, fontFamily: fonts.bold },
  sub: { fontSize: 13, fontFamily: fonts.regular, marginTop: 2 },
  periodBar: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
    gap: 4,
  },
  periodPill: {
    flex: 1,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  periodText: { fontSize: 12 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    width: "48.2%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  metricLabel: { fontFamily: fonts.medium, fontSize: 12 },
  metricValue: { fontFamily: fonts.bold, fontSize: 19 },
  metricMeta: { fontFamily: fonts.regular, fontSize: 11 },
});
