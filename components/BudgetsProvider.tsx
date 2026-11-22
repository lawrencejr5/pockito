import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import * as Notifications from "expo-notifications";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { Platform } from "react-native";

import { useCloudSync } from "@/components/CloudSyncProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useTransactions } from "@/components/TransactionsProvider";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  BUDGET_EXCEEDED_PERCENT,
  BUDGET_WARNING_PERCENT,
  computeBudgetProgress,
  type Budget,
  type BudgetInput,
  type BudgetPeriod,
  type BudgetProgress,
} from "@/lib/budgets";

const ALERTS_STORAGE_KEY = "@pockito/budget-alerts-v1";
type AlertLevel = "warning" | "exceeded";

type BudgetsContextValue = {
  budgets: Budget[];
  progresses: BudgetProgress[];
  activeProgresses: BudgetProgress[];
  upcomingProgresses: BudgetProgress[];
  pastProgresses: BudgetProgress[];
  isLoading: boolean;
  addBudget: (input: BudgetInput) => void;
  updateBudget: (id: string, patch: BudgetInput) => void;
  deleteBudget: (id: string) => void;
  getRecurringBudget: (period: Exclude<BudgetPeriod, "custom">) => Budget | undefined;
};

const BudgetsContext = createContext<BudgetsContextValue | null>(null);

export function BudgetsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useCloudSync();
  const { currency, format } = useCurrency();
  const { transactions, isLoading: txLoading } = useTransactions();

  const cloudBudgets = useQuery(api.budgets.list, isAuthenticated ? {} : "skip");
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : "skip");

  const addMutation = useMutation(api.budgets.add);
  const updateMutation = useMutation(api.budgets.update);
  const removeMutation = useMutation(api.budgets.remove);

  const normalizedBudgets = useMemo<Budget[]>(
    () =>
      (cloudBudgets ?? []).map((item) =>
        item.currency === currency.code
          ? { ...item, amountUsd: item.originalAmount / currency.rate }
          : item,
      ),
    [cloudBudgets, currency.code, currency.rate],
  );

  const progresses = useMemo<BudgetProgress[]>(() => {
    const now = new Date();
    return normalizedBudgets.map((b) => computeBudgetProgress(b, transactions, now));
  }, [normalizedBudgets, transactions]);

  const { activeProgresses, upcomingProgresses, pastProgresses } = useMemo(() => {
    const active: BudgetProgress[] = [];
    const upcoming: BudgetProgress[] = [];
    const past: BudgetProgress[] = [];
    for (const p of progresses) {
      if (p.lifecycle === "active") active.push(p);
      else if (p.lifecycle === "upcoming") upcoming.push(p);
      else past.push(p);
    }
    active.sort((a, b) => b.percent - a.percent);
    upcoming.sort((a, b) => a.windowStart.getTime() - b.windowStart.getTime());
    past.sort((a, b) => b.windowEnd.getTime() - a.windowEnd.getTime());
    return {
      activeProgresses: active,
      upcomingProgresses: upcoming,
      pastProgresses: past,
    };
  }, [progresses]);

  // Track previous percentages and persisted alert states so local notifications
  // fire only when a live expense crosses 80% or 100% for a budget period.
  const prevPercentRef = useRef<Map<string, number> | null>(null);
  const notifiedMapRef = useRef<Record<string, AlertLevel>>({});
  const notifiedLoadedRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(ALERTS_STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          notifiedMapRef.current = JSON.parse(raw) as Record<string, AlertLevel>;
        }
      })
      .catch(() => {})
      .finally(() => {
        notifiedLoadedRef.current = true;
      });
  }, []);

  useEffect(() => {
    const isDataReady =
      isAuthenticated &&
      cloudBudgets !== undefined &&
      !txLoading &&
      notifiedLoadedRef.current;
    if (!isDataReady) return;

    const currentMap = new Map<string, number>();
    for (const p of activeProgresses) {
      currentMap.set(`${p.budget.id}:${p.periodKey}`, p.percent);
    }

    // On first hydrated snapshot, record baseline without notifying.
    if (prevPercentRef.current === null) {
      prevPercentRef.current = currentMap;
      return;
    }

    const prevMap = prevPercentRef.current;
    prevPercentRef.current = currentMap;

    if (Platform.OS === "web" || viewer?.notificationsEnabled === false) {
      return;
    }

    let mapChanged = false;
    for (const p of activeProgresses) {
      const key = `${p.budget.id}:${p.periodKey}`;
      const prevPercent = prevMap.get(key);
      if (prevPercent === undefined || p.percent <= prevPercent) continue;

      const sent = notifiedMapRef.current[key];
      if (p.percent >= BUDGET_EXCEEDED_PERCENT && sent !== "exceeded") {
        notifiedMapRef.current[key] = "exceeded";
        mapChanged = true;
        void Notifications.scheduleNotificationAsync({
          content: {
            title: "Budget exceeded",
            body: `You've spent ${format(p.spentUsd)} of your ${format(p.limitUsd)} ${p.title}.`,
            data: { type: "budget-alert", budgetId: p.budget.id },
            sound: "pockito.wav",
          },
          trigger: null,
        }).catch(() => {});
      } else if (
        p.percent >= BUDGET_WARNING_PERCENT &&
        p.percent < BUDGET_EXCEEDED_PERCENT &&
        !sent
      ) {
        notifiedMapRef.current[key] = "warning";
        mapChanged = true;
        void Notifications.scheduleNotificationAsync({
          content: {
            title: "Approaching budget limit",
            body: `You've used ${Math.round(p.percent)}% of your ${p.title} (${format(p.remainingUsd)} left).`,
            data: { type: "budget-alert", budgetId: p.budget.id },
            sound: "pockito.wav",
          },
          trigger: null,
        }).catch(() => {});
      }
    }

    if (mapChanged) {
      void AsyncStorage.setItem(
        ALERTS_STORAGE_KEY,
        JSON.stringify(notifiedMapRef.current),
      ).catch(() => {});
    }
  }, [
    isAuthenticated,
    cloudBudgets,
    txLoading,
    activeProgresses,
    viewer?.notificationsEnabled,
    format,
  ]);

  const addBudget = useCallback(
    (input: BudgetInput) => {
      if (!isAuthenticated) return;
      addMutation({
        name: input.name?.trim() ? input.name.trim() : undefined,
        period: input.period,
        recurring: input.recurring,
        amountUsd: input.amountUsd,
        currency: input.currency,
        originalAmount: input.originalAmount,
        startDate: input.startDate,
        endDate: input.endDate,
      }).catch((err) => console.error("Failed to add budget:", err));
    },
    [isAuthenticated, addMutation],
  );

  const updateBudget = useCallback(
    (id: string, patch: BudgetInput) => {
      if (!isAuthenticated) return;
      updateMutation({
        id: id as Id<"budgets">,
        name: patch.name?.trim() ? patch.name.trim() : undefined,
        period: patch.period,
        recurring: patch.recurring,
        amountUsd: patch.amountUsd,
        currency: patch.currency,
        originalAmount: patch.originalAmount,
        startDate: patch.startDate,
        endDate: patch.endDate,
      }).catch((err) => console.error("Failed to update budget:", err));
    },
    [isAuthenticated, updateMutation],
  );

  const deleteBudget = useCallback(
    (id: string) => {
      if (!isAuthenticated) return;
      removeMutation({ id: id as Id<"budgets"> }).catch((err) =>
        console.error("Failed to delete budget:", err),
      );
    },
    [isAuthenticated, removeMutation],
  );

  const getRecurringBudget = useCallback(
    (period: Exclude<BudgetPeriod, "custom">) =>
      normalizedBudgets.find((b) => b.recurring && b.period === period),
    [normalizedBudgets],
  );

  const value = useMemo<BudgetsContextValue>(
    () => ({
      budgets: normalizedBudgets,
      progresses,
      activeProgresses,
      upcomingProgresses,
      pastProgresses,
      isLoading: isAuthenticated && cloudBudgets === undefined,
      addBudget,
      updateBudget,
      deleteBudget,
      getRecurringBudget,
    }),
    [
      normalizedBudgets,
      progresses,
      activeProgresses,
      upcomingProgresses,
      pastProgresses,
      isAuthenticated,
      cloudBudgets,
      addBudget,
      updateBudget,
      deleteBudget,
      getRecurringBudget,
    ],
  );

  return (
    <BudgetsContext.Provider value={value}>{children}</BudgetsContext.Provider>
  );
}

export function useBudgets() {
  const ctx = useContext(BudgetsContext);
  if (!ctx) throw new Error("useBudgets must be used inside BudgetsProvider");
  return ctx;
}
