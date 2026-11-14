import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { CurrencyCode } from '@/constants/currencies';
import type { WealthKind } from '@/constants/wealth';

const ITEMS_KEY = 'pockito.wealth.items';
const INCLUDE_CASH_KEY = 'pockito.wealth.includeCash';

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

export type WealthItemInput = Omit<WealthItem, 'id' | 'updatedAt'>;

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
  const [items, setItems] = useState<WealthItem[]>([]);
  const [includeCashBalance, setIncludeCashBalanceState] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(ITEMS_KEY)
      .then((raw) => {
        if (raw) setItems(JSON.parse(raw) as WealthItem[]);
      })
      .catch(() => {});

    AsyncStorage.getItem(INCLUDE_CASH_KEY)
      .then((raw) => {
        if (raw !== null) setIncludeCashBalanceState(raw === 'true');
      })
      .catch(() => {});
  }, []);

  const persistItems = (next: WealthItem[]) => {
    AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(next)).catch(() => {});
    return next;
  };

  const setIncludeCashBalance = useCallback((next: boolean) => {
    setIncludeCashBalanceState(next);
    AsyncStorage.setItem(INCLUDE_CASH_KEY, String(next)).catch(() => {});
  }, []);

  const addItem = useCallback((input: WealthItemInput) => {
    const now = new Date().toISOString();
    const created: WealthItem = {
      ...input,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      updatedAt: now,
    };
    setItems((prev) => persistItems([created, ...prev].sort(byUpdatedDesc)));
  }, []);

  const updateItem = useCallback((id: string, patch: WealthItemInput) => {
    const now = new Date().toISOString();
    setItems((prev) =>
      persistItems(
        prev
          .map((item) => (item.id === id ? { ...patch, id, updatedAt: now } : item))
          .sort(byUpdatedDesc),
      ),
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => persistItems(prev.filter((item) => item.id !== id)));
  }, []);

  const value = useMemo<WealthContextValue>(
    () => ({
      items,
      includeCashBalance,
      setIncludeCashBalance,
      addItem,
      updateItem,
      deleteItem,
    }),
    [items, includeCashBalance, setIncludeCashBalance, addItem, updateItem, deleteItem],
  );

  return <WealthContext.Provider value={value}>{children}</WealthContext.Provider>;
}

export function useWealth() {
  const ctx = useContext(WealthContext);
  if (!ctx) throw new Error('useWealth must be used inside WealthProvider');
  return ctx;
}

