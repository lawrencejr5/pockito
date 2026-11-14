import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CashflowChart } from '@/components/CashflowChart';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { useCurrency } from '@/components/CurrencyProvider';
import { useTransactions } from '@/components/TransactionsProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';
import { getCategory } from '@/constants/categories';
import { computeReportStats, REPORT_PERIODS, type ReportPeriod } from '@/lib/reportStats';

export default function ReportScreen() {
  const colors = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();
  const { format } = useCurrency();
  const { transactions } = useTransactions();
  const [period, setPeriod] = useState<ReportPeriod>('30D');

  const stats = useMemo(
    () => computeReportStats(transactions, period),
    [transactions, period],
  );

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
          { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 20) + 90 },
        ]}>
        {/* Header & Period Switcher */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Report</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>
              Spending insights & cashflow
            </Text>
          </View>
          <View style={[styles.periodBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {REPORT_PERIODS.map((p) => {
              const active = p === period;
              return (
                <Pressable
                  key={p}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setPeriod(p);
                  }}
                  style={[styles.periodPill, active && { backgroundColor: colors.accent }]}>
                  <Text
                    style={[
                      styles.periodText,
                      {
                        color: active ? '#1c1a17' : colors.textMuted,
                        fontFamily: active ? fonts.semiBold : fonts.medium,
                      },
                    ]}>
                    {p}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Net Summary Hero Card */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(320)}
          layout={LinearTransition.springify().damping(18)}
          style={[styles.summaryCard, { backgroundColor: colors.darkCard }]}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
                Net Cashflow ({period})
              </Text>
              <Text
                style={[styles.summaryNet, { color: colors.darkCardText }]}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {format(stats.netUsd, { sign: true })}
              </Text>
            </View>
            {stats.savingsRate !== null && (
              <View
                style={[
                  styles.ratePill,
                  {
                    backgroundColor:
                      stats.savingsRate >= 0
                        ? 'rgba(74,222,128,0.16)'
                        : 'rgba(248,113,113,0.16)',
                  },
                ]}>
                <Text
                  style={[
                    styles.rateText,
                    { color: stats.savingsRate >= 0 ? '#4ade80' : '#f87171' },
                  ]}>
                  {stats.savingsRate >= 0
                    ? `${stats.savingsRate}% saved`
                    : `${Math.abs(stats.savingsRate)}% over`}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.summarySplit}>
            <View style={styles.summaryCol}>
              <View style={styles.splitHeader}>
                <Ionicons name="arrow-down" size={13} color="#4ade80" />
                <Text style={[styles.splitLabel, { color: colors.secondary }]}>Income</Text>
              </View>
              <Text style={[styles.splitVal, { color: colors.darkCardText }]} numberOfLines={1}>
                {format(stats.incomeUsd)}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: 'rgba(165,167,155,0.2)' }]} />
            <View style={styles.summaryCol}>
              <View style={styles.splitHeader}>
                <Ionicons name="arrow-up" size={13} color="#f87171" />
                <Text style={[styles.splitLabel, { color: colors.secondary }]}>Expense</Text>
              </View>
              <Text style={[styles.splitVal, { color: colors.darkCardText }]} numberOfLines={1}>
                {format(stats.expenseUsd)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Cashflow Line Chart */}
        <Animated.View entering={FadeInDown.delay(120).duration(320)}>
          <CashflowChart variant="card" />
        </Animated.View>

        {/* 2x2 Key Metrics Grid */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(320)}
          layout={LinearTransition.springify().damping(18)}
          style={styles.grid}>
          {/* Daily Average Spending */}
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="today-outline" size={16} color={colors.tint} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Daily Avg Spend</Text>
            <Text
              style={[styles.metricValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {format(stats.dailyAvgSpendUsd)}
            </Text>
            <Text style={[styles.metricMeta, { color: colors.textMuted }]}>per day</Text>
          </View>

          {/* Average Expense Size */}
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="receipt-outline" size={16} color={colors.tint} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Avg Expense</Text>
            <Text
              style={[styles.metricValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {format(stats.avgExpenseUsd)}
            </Text>
            <Text style={[styles.metricMeta, { color: colors.textMuted }]}>
              {stats.txCount} {stats.txCount === 1 ? 'entry' : 'entries'}
            </Text>
          </View>

          {/* Largest Expense */}
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View
              style={[
                styles.metricIcon,
                {
                  backgroundColor: largestExpenseCat
                    ? largestExpenseCat.color + '26'
                    : colors.accentSoft,
                },
              ]}>
              <Ionicons
                name={largestExpenseCat?.icon ?? 'trending-down-outline'}
                size={16}
                color={largestExpenseCat?.color ?? colors.expense}
              />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Largest Expense</Text>
            <Text
              style={[styles.metricValue, { color: colors.expense }]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {stats.largestExpense ? format(stats.largestExpense.amountUsd) : '—'}
            </Text>
            <Text style={[styles.metricMeta, { color: colors.textMuted }]} numberOfLines={1}>
              {largestExpenseCat
                ? `${largestExpenseCat.label} · ${stats.largestExpense?.title}`
                : 'No expenses'}
            </Text>
          </View>

          {/* Largest Income */}
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View
              style={[
                styles.metricIcon,
                {
                  backgroundColor: largestIncomeCat
                    ? largestIncomeCat.color + '26'
                    : colors.accentSoft,
                },
              ]}>
              <Ionicons
                name={largestIncomeCat?.icon ?? 'trending-up-outline'}
                size={16}
                color={largestIncomeCat?.color ?? colors.income}
              />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Largest Income</Text>
            <Text
              style={[styles.metricValue, { color: colors.income }]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {stats.largestIncome ? format(stats.largestIncome.amountUsd) : '—'}
            </Text>
            <Text style={[styles.metricMeta, { color: colors.textMuted }]} numberOfLines={1}>
              {largestIncomeCat
                ? `${largestIncomeCat.label} · ${stats.largestIncome?.title}`
                : 'No income'}
            </Text>
          </View>

          {/* Peak Spending Day */}
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.expense + '26' }]}>
              <Ionicons name="flame-outline" size={16} color={colors.expense} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Peak Spending Day</Text>
            <Text
              style={[styles.metricValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {stats.peakSpendingDay
                ? new Date(stats.peakSpendingDay.date).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })
                : '—'}
            </Text>
            <Text style={[styles.metricMeta, { color: colors.expense }]} numberOfLines={1}>
              {stats.peakSpendingDay
                ? `${format(stats.peakSpendingDay.amountUsd)} spent`
                : 'No expenses'}
            </Text>
          </View>

          {/* Best Earning Day */}
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.income + '26' }]}>
              <Ionicons name="sparkles-outline" size={16} color={colors.income} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Best Earning Day</Text>
            <Text
              style={[styles.metricValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {stats.bestEarningDay
                ? new Date(stats.bestEarningDay.date).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })
                : '—'}
            </Text>
            <Text style={[styles.metricMeta, { color: colors.income }]} numberOfLines={1}>
              {stats.bestEarningDay
                ? `${format(stats.bestEarningDay.amountUsd)} earned`
                : 'No income'}
            </Text>
          </View>
        </Animated.View>

        {/* Spending by Category */}
        <Animated.View entering={FadeInDown.delay(240).duration(320)}>
          <CategoryBreakdown
            categories={stats.categories}
            totalExpenseUsd={stats.expenseUsd}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },

  header: { gap: 12 },
  title: { fontSize: 28, fontFamily: fonts.bold },
  sub: { fontSize: 13, fontFamily: fonts.regular, marginTop: 2 },
  periodBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
    gap: 4,
  },
  periodPill: {
    flex: 1,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: { fontSize: 12 },

  summaryCard: {
    borderRadius: 24,
    padding: 18,
    gap: 16,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryLabel: { fontFamily: fonts.medium, fontSize: 13 },
  summaryNet: { fontFamily: fonts.bold, fontSize: 28, marginTop: 2 },
  ratePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  rateText: { fontFamily: fonts.semiBold, fontSize: 12 },
  summarySplit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCol: { flex: 1, gap: 4 },
  splitHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  splitLabel: { fontFamily: fonts.medium, fontSize: 12 },
  splitVal: { fontFamily: fonts.bold, fontSize: 17 },
  divider: { width: 1, height: 32, marginHorizontal: 14 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48.2%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricLabel: { fontFamily: fonts.medium, fontSize: 12 },
  metricValue: { fontFamily: fonts.bold, fontSize: 19 },
  metricMeta: { fontFamily: fonts.regular, fontSize: 11 },
});
