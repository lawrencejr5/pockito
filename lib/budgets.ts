import type { Transaction } from "@/components/TransactionsProvider";
import type { CurrencyCode } from "@/constants/currencies";

export type BudgetPeriod = "daily" | "weekly" | "monthly" | "custom";
export type BudgetStatus = "ok" | "warning" | "exceeded";
export type BudgetLifecycle = "active" | "upcoming" | "past";

export type Budget = {
  id: string;
  name?: string;
  period: BudgetPeriod;
  recurring: boolean;
  /** Limit normalized to USD (base currency). */
  amountUsd: number;
  /** Currency and amount originally entered by the user. */
  currency: CurrencyCode;
  originalAmount: number;
  /** Inclusive local YYYY-MM-DD start date (used for Today and Custom budgets). */
  startDate?: string;
  /** Inclusive local YYYY-MM-DD end date (used for Today and Custom budgets). */
  endDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type BudgetInput = {
  name?: string;
  period: BudgetPeriod;
  recurring: boolean;
  amountUsd: number;
  currency: CurrencyCode;
  originalAmount: number;
  startDate?: string;
  endDate?: string;
};

export type BudgetProgress = {
  budget: Budget;
  title: string;
  subtitle: string;
  badgeLabel: string;
  periodKey: string;
  windowStart: Date;
  windowEnd: Date;
  spentUsd: number;
  limitUsd: number;
  /** Positive = remaining under budget, negative = exceeded by abs(remainingUsd). */
  remainingUsd: number;
  /** Raw percentage of limit used (0..Infinity). */
  percent: number;
  /** Clamped 0..100 for rendering progress bars. */
  clampedPercent: number;
  status: BudgetStatus;
  lifecycle: BudgetLifecycle;
  daysLeft: number;
};

export type HomeMoneyPeriod = "today" | "week" | "month" | "custom";

export type HomeBudgetSelection = {
  primary: BudgetProgress;
  extraCount: number;
  isFallback: boolean;
};

export const BUDGET_WARNING_PERCENT = 80;
export const BUDGET_EXCEEDED_PERCENT = 100;

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return startOfDay(new Date());
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getWindowForBudget(budget: Budget, now: Date): {
  windowStart: Date;
  windowEnd: Date;
  periodKey: string;
  title: string;
  subtitle: string;
  badgeLabel: string;
  lifecycle: BudgetLifecycle;
} {
  const todayStart = startOfDay(now);
  const todayKey = toDateKey(now);
  const customTitle = budget.name?.trim();

  if (budget.period === "daily" && budget.recurring) {
    const windowStart = todayStart;
    const windowEnd = endOfDay(now);
    return {
      windowStart,
      windowEnd,
      periodKey: `daily:${todayKey}`,
      title: customTitle || "Daily Budget",
      subtitle: "Resets every day",
      badgeLabel: "Daily · Recurring",
      lifecycle: "active",
    };
  }

  if (budget.period === "daily") {
    const baseKey = budget.startDate ?? toDateKey(new Date(budget.createdAt));
    const windowStart = parseDateKey(baseKey);
    const windowEnd = endOfDay(windowStart);
    const isToday = baseKey === todayKey;
    const lifecycle: BudgetLifecycle =
      now > windowEnd ? "past" : now < windowStart ? "upcoming" : "active";
    return {
      windowStart,
      windowEnd,
      periodKey: `today:${baseKey}`,
      title:
        customTitle ||
        (isToday ? "Today's Budget" : `${formatShortDate(windowStart)} Budget`),
      subtitle: isToday ? "Today only" : formatShortDate(windowStart),
      badgeLabel: isToday ? "Today" : formatShortDate(windowStart),
      lifecycle,
    };
  }

  if (budget.period === "weekly") {
    const windowStart = new Date(now);
    windowStart.setDate(now.getDate() - now.getDay());
    windowStart.setHours(0, 0, 0, 0);
    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowStart.getDate() + 6);
    windowEnd.setHours(23, 59, 59, 999);
    const weekKey = toDateKey(windowStart);
    return {
      windowStart,
      windowEnd,
      periodKey: `weekly:${weekKey}`,
      title: customTitle || "Weekly Budget",
      subtitle: `${formatShortDate(windowStart)} – ${formatShortDate(windowEnd)}`,
      badgeLabel: "Weekly · Recurring",
      lifecycle: "active",
    };
  }

  if (budget.period === "monthly") {
    const windowStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const windowEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return {
      windowStart,
      windowEnd,
      periodKey: `monthly:${monthKey}`,
      title: customTitle || "Monthly Budget",
      subtitle: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      badgeLabel: "Monthly · Recurring",
      lifecycle: "active",
    };
  }

  // Custom date (single day or range, always one-off)
  const startKey = budget.startDate ?? todayKey;
  const rawEndKey = budget.endDate ?? startKey;
  const parsedStart = parseDateKey(startKey);
  const parsedEnd = parseDateKey(rawEndKey);
  const windowStart = parsedEnd < parsedStart ? parsedEnd : parsedStart;
  const windowEnd = endOfDay(parsedEnd < parsedStart ? parsedStart : parsedEnd);
  const isSingle = toDateKey(windowStart) === toDateKey(windowEnd);
  const rangeLabel = isSingle
    ? formatShortDate(windowStart)
    : `${formatShortDate(windowStart)} – ${formatShortDate(windowEnd)}`;
  const lifecycle: BudgetLifecycle =
    now > windowEnd ? "past" : now < windowStart ? "upcoming" : "active";

  return {
    windowStart,
    windowEnd,
    periodKey: `custom:${toDateKey(windowStart)}..${toDateKey(windowEnd)}`,
    title: customTitle || rangeLabel,
    subtitle: rangeLabel,
    badgeLabel: isSingle ? "Custom day" : "Custom range",
    lifecycle,
  };
}

export function computeBudgetProgress(
  budget: Budget,
  transactions: Transaction[],
  now: Date = new Date(),
): BudgetProgress {
  const {
    windowStart,
    windowEnd,
    periodKey,
    title,
    subtitle,
    badgeLabel,
    lifecycle,
  } = getWindowForBudget(budget, now);

  let spentUsd = 0;
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const d = new Date(t.date);
    if (d >= windowStart && d <= windowEnd) {
      spentUsd += t.amountUsd;
    }
  }

  const limitUsd = Math.max(budget.amountUsd, 0);
  const remainingUsd = limitUsd - spentUsd;
  const percent = limitUsd > 0 ? (spentUsd / limitUsd) * 100 : spentUsd > 0 ? 100 : 0;
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const status: BudgetStatus =
    percent >= BUDGET_EXCEEDED_PERCENT
      ? "exceeded"
      : percent >= BUDGET_WARNING_PERCENT
        ? "warning"
        : "ok";

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft =
    lifecycle === "past"
      ? 0
      : Math.max(0, Math.ceil((windowEnd.getTime() - now.getTime()) / msPerDay));

  return {
    budget,
    title,
    subtitle,
    badgeLabel,
    periodKey,
    windowStart,
    windowEnd,
    spentUsd,
    limitUsd,
    remainingUsd,
    percent,
    clampedPercent,
    status,
    lifecycle,
    daysLeft,
  };
}

const PERIOD_PRIORITY: Record<BudgetPeriod, number> = {
  daily: 0,
  weekly: 1,
  monthly: 2,
  custom: 3,
};

function compareByUrgency(a: BudgetProgress, b: BudgetProgress): number {
  if (b.percent !== a.percent) return b.percent - a.percent;
  return PERIOD_PRIORITY[a.budget.period] - PERIOD_PRIORITY[b.budget.period];
}

export function pickHomeBudget(
  allProgresses: BudgetProgress[],
  moneyPeriod: HomeMoneyPeriod,
  customMode: "single" | "range",
  customStart: Date,
  customEnd: Date,
): HomeBudgetSelection | null {
  const active = allProgresses.filter((p) => p.lifecycle === "active");
  if (active.length === 0) return null;

  let matches: BudgetProgress[] = [];
  if (moneyPeriod === "today") {
    matches = active.filter((p) => p.budget.period === "daily");
  } else if (moneyPeriod === "week") {
    matches = active.filter((p) => p.budget.period === "weekly");
  } else if (moneyPeriod === "month") {
    matches = active.filter((p) => p.budget.period === "monthly");
  } else {
    const selStart = startOfDay(customStart);
    const selEnd = endOfDay(
      customMode === "single"
        ? customStart
        : customEnd < customStart
          ? customStart
          : customEnd,
    );
    const customBudgets = active.filter((p) => p.budget.period === "custom");
    const overlapping = customBudgets.filter(
      (p) => p.windowStart <= selEnd && p.windowEnd >= selStart,
    );
    matches = overlapping.length > 0 ? overlapping : customBudgets;
  }

  if (matches.length > 0) {
    const sorted = [...matches].sort(compareByUrgency);
    return {
      primary: sorted[0],
      extraCount: sorted.length - 1,
      isFallback: false,
    };
  }

  const fallbackSorted = [...active].sort(compareByUrgency);
  return {
    primary: fallbackSorted[0],
    extraCount: fallbackSorted.length - 1,
    isFallback: true,
  };
}
