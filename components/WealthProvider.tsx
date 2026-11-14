import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useCloudSync } from "@/components/CloudSyncProvider";
import type { CurrencyCode } from "@/constants/currencies";
import type { WealthKind } from "@/constants/wealth";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const ITEMS_KEY = "pockito.wealth.items";
const INCLUDE_CASH_KEY = "pockito.wealth.includeCash";

export type WealthItem = {
  id: string;
  kind: WealthKind;
  categoryId: string;
  name: string;
  /** Amount normalized to USD (base currency). */
  amountUsd: number;
  /** Currency and amount originally entered by the user. */
  currency: CurrencyCode;
  originalAmount: number;
  note?: string;
  updatedAt: string;
};

export type WealthItemInput = Omit<WealthItem, "id" | "updatedAt">;

type WealthContextValue = {
  items: WealthItem[];
  includeCashBalance: boolean;
  setIncludeCashBalance: (next: boolean) => void;
  addItem: (input: WealthItemInput) => void;
  updateItem: (id: string, patch: WealthItemInput) => void;
  deleteItem: (id: string) => void;
};

const WealthContext = createContext<WealthContextValue | null>(null);

const byUpdatedDesc = (a: WealthItem, b: WealthItem) =>
  +new Date(b.updatedAt) - +new Date(a.updatedAt);

export function WealthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isCloudMode } = useCloudSync();

  const cloudItems = useQuery(api.wealth.list, isAuthenticated ? {} : "skip");
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : "skip");

  const addMutation = useMutation(api.wealth.add);
  const updateMutation = useMutation(api.wealth.update);
  const removeMutation = useMutation(api.wealth.remove);
  const updatePreferences = useMutation(api.users.updatePreferences);

  const [items, setItems] = useState<WealthItem[]>([]);
  const [includeCashBalanceLocal, setIncludeCashBalanceLocal] = useState(true);

  useEffect(() => {
    if (isCloudMode) {
      setItems([]);
      return;
    }

    AsyncStorage.getItem(ITEMS_KEY)
      .then((raw) => {
        if (raw) setItems(JSON.parse(raw) as WealthItem[]);
      })
      .catch(() => {});

    AsyncStorage.getItem(INCLUDE_CASH_KEY)
      .then((raw) => {
        if (raw !== null) setIncludeCashBalanceLocal(raw === "true");
      })
      .catch(() => {});
  }, [isCloudMode]);

  const persistItems = (next: WealthItem[]) => {
    AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(next)).catch(() => {});
    return next;
  };

  const setIncludeCashBalance = useCallback(
    (next: boolean) => {
      if (isCloudMode) {
        if (!isAuthenticated) return;
        updatePreferences({ includeCashBalance: next }).catch((err) =>
          console.error("Failed to update includeCashBalance:", err),
        );
        return;
      }
      setIncludeCashBalanceLocal(next);
      AsyncStorage.setItem(INCLUDE_CASH_KEY, String(next)).catch(() => {});
    },
    [isCloudMode, isAuthenticated, updatePreferences],
  );

  const addItem = useCallback(
    (input: WealthItemInput) => {
      if (isCloudMode) {
        if (!isAuthenticated) return;
        addMutation({
          kind: input.kind,
          categoryId: input.categoryId,
          name: input.name,
          amountUsd: input.amountUsd,
          currency: input.currency,
          originalAmount: input.originalAmount,
          note: input.note,
          updatedAt: new Date().toISOString(),
        }).catch((err) =>
          console.error("Failed to add cloud wealth item:", err),
        );
        return;
      }

      const now = new Date().toISOString();
      const created: WealthItem = {
        ...input,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        updatedAt: now,
      };
      setItems((prev) => persistItems([created, ...prev].sort(byUpdatedDesc)));
    },
    [isCloudMode, isAuthenticated, addMutation],
  );

  const updateItem = useCallback(
    (id: string, patch: WealthItemInput) => {
      if (isCloudMode) {
        if (!isAuthenticated) return;
        updateMutation({
          id: id as Id<"wealthItems">,
          kind: patch.kind,
          categoryId: patch.categoryId,
          name: patch.name,
          amountUsd: patch.amountUsd,
          currency: patch.currency,
          originalAmount: patch.originalAmount,
          note: patch.note,
        }).catch((err) =>
          console.error("Failed to update cloud wealth item:", err),
        );
        return;
      }

      const now = new Date().toISOString();
      setItems((prev) =>
        persistItems(
          prev
            .map((item) =>
              item.id === id ? { ...patch, id, updatedAt: now } : item,
            )
            .sort(byUpdatedDesc),
        ),
      );
    },
    [isCloudMode, isAuthenticated, updateMutation],
  );

  const deleteItem = useCallback(
    (id: string) => {
      if (isCloudMode) {
        if (!isAuthenticated) return;
        removeMutation({ id: id as Id<"wealthItems"> }).catch((err) =>
          console.error("Failed to delete cloud wealth item:", err),
        );
        return;
      }

      setItems((prev) => persistItems(prev.filter((item) => item.id !== id)));
    },
    [isCloudMode, isAuthenticated, removeMutation],
  );

  const value = useMemo<WealthContextValue>(
    () =>
      isCloudMode
        ? {
            items: cloudItems ?? [],
            includeCashBalance: viewer?.includeCashBalance ?? true,
            setIncludeCashBalance,
            addItem,
            updateItem,
            deleteItem,
          }
        : {
            items,
            includeCashBalance: includeCashBalanceLocal,
            setIncludeCashBalance,
            addItem,
            updateItem,
            deleteItem,
          },
    [
      isCloudMode,
      cloudItems,
      viewer?.includeCashBalance,
      items,
      includeCashBalanceLocal,
      setIncludeCashBalance,
      addItem,
      updateItem,
      deleteItem,
    ],
  );

  return (
    <WealthContext.Provider value={value}>{children}</WealthContext.Provider>
  );
}

export function useWealth() {
  const ctx = useContext(WealthContext);
  if (!ctx) throw new Error("useWealth must be used inside WealthProvider");
  return ctx;
}
