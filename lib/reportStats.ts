import type { Transaction } from '@/components/TransactionsProvider';
import { getCategory, type Category } from '@/constants/categories';

export type ReportPeriod = '7D' | '30D' | '90D' | 'All';

export const REPORT_PERIODS: ReportPeriod[] = ['7D', '30D', '90D', 'All'];

const DAYS_IN_PERIOD: Record<Exclude<ReportPeriod, 'All'>, number> = {
  '7D': 7,
  '30D': 30,
  '90D': 90,
};

const MS_PER_DAY = 86_400_000;

export type CategoryStat = {
  category: Category;
  amountUsd: number;
  percent: number;
  count: number;
};

export type DayPeak = {
  date: string;
  amountUsd: number;
};

export type ReportStats = {
  incomeUsd: number;
  expenseUsd: number;
  netUsd: number;
  savingsRate: number | null;
  dailyAvgSpendUsd: number;
  avgExpenseUsd: number;
  txCount: number;
  expenseCount: number;
  largestExpense: Transaction | null;
  largestIncome: Transaction | null;
  peakSpendingDay: DayPeak | null;
  bestEarningDay: DayPeak | null;
  categories: CategoryStat[];
};

export function computeReportStats(
  transactions: Transaction[],
  period: ReportPeriod,
): ReportStats {
  const now = new Date();
  const cutoff =
    period === 'All'
      ? -Infinity
      : now.getTime() - DAYS_IN_PERIOD[period] * MS_PER_DAY;

  const filtered = transactions.filter((t) => new Date(t.date).getTime() >= cutoff);

  let incomeUsd = 0;
  let expenseUsd = 0;
  let expenseCount = 0;
  let largestExpense: Transaction | null = null;
  let largestIncome: Transaction | null = null;
  const byCategory = new Map<string, { amountUsd: number; count: number }>();
  const dayTotals = new Map<string, { date: string; income: number; expense: number }>();

  let earliestMs = now.getTime();
  for (const t of filtered) {
    const d = new Date(t.date);
    const ms = d.getTime();
    if (ms < earliestMs) earliestMs = ms;

    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const dayEntry = dayTotals.get(dayKey) ?? { date: t.date, income: 0, expense: 0 };

    if (t.type === 'income') {
      incomeUsd += t.amountUsd;
      dayEntry.income += t.amountUsd;
      if (!largestIncome || t.amountUsd > largestIncome.amountUsd) {
        largestIncome = t;
      }
    } else {
      expenseUsd += t.amountUsd;
      expenseCount += 1;
      dayEntry.expense += t.amountUsd;
      if (!largestExpense || t.amountUsd > largestExpense.amountUsd) {
        largestExpense = t;
      }
      const prev = byCategory.get(t.categoryId) ?? { amountUsd: 0, count: 0 };
      byCategory.set(t.categoryId, {
        amountUsd: prev.amountUsd + t.amountUsd,
        count: prev.count + 1,
      });
    }
    dayTotals.set(dayKey, dayEntry);
  }

  let peakSpendingDay: DayPeak | null = null;
  let bestEarningDay: DayPeak | null = null;
  for (const entry of dayTotals.values()) {
    if (entry.expense > 0 && (!peakSpendingDay || entry.expense > peakSpendingDay.amountUsd)) {
      peakSpendingDay = { date: entry.date, amountUsd: entry.expense };
    }
    if (entry.income > 0 && (!bestEarningDay || entry.income > bestEarningDay.amountUsd)) {
      bestEarningDay = { date: entry.date, amountUsd: entry.income };
    }
  }

  const netUsd = incomeUsd - expenseUsd;
  const savingsRate =
    incomeUsd > 0 ? Math.round(((incomeUsd - expenseUsd) / incomeUsd) * 100) : null;

  const spanDays =
    period === 'All'
      ? Math.max(1, Math.ceil((now.getTime() - earliestMs) / MS_PER_DAY) + 1)
      : DAYS_IN_PERIOD[period];

  const dailyAvgSpendUsd = expenseUsd / spanDays;
  const avgExpenseUsd = expenseCount > 0 ? expenseUsd / expenseCount : 0;

  const categories: CategoryStat[] = Array.from(byCategory.entries())
    .map(([id, data]) => ({
      category: getCategory(id),
      amountUsd: data.amountUsd,
      percent: expenseUsd > 0 ? (data.amountUsd / expenseUsd) * 100 : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amountUsd - a.amountUsd);

  return {
    incomeUsd,
    expenseUsd,
    netUsd,
    savingsRate,
    dailyAvgSpendUsd,
    avgExpenseUsd,
    txCount: filtered.length,
    expenseCount,
    largestExpense,
    largestIncome,
    peakSpendingDay,
    bestEarningDay,
    categories,
  };
}

