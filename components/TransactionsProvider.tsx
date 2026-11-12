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

import type { TransactionType } from '@/constants/categories';
import type { CurrencyCode } from '@/constants/currencies';

const STORAGE_KEY = 'pockito.transactions';

export type Transaction = {
  id: string;
  type: TransactionType;
  title: string;
  /** Amount in USD (base currency). */
  amountUsd: number;
  /** Currency and amount the user originally entered. */
  currency: CurrencyCode;
  originalAmount: number;
  categoryId: string;
  receiptUri?: string;
  /** ISO date string. */
  date: string;
};

const daysAgo = (d: number, hour: number) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

/** Shown until the user adds their first real transaction. */
const SEED: Transaction[] = [
  { id: 'seed-1', type: 'expense', title: 'Cash', amountUsd: 543.55, currency: 'USD', originalAmount: 543.55, categoryId: 'shopping', date: daysAgo(0, 9) },
  { id: 'seed-2', type: 'income', title: 'Salary Deposit', amountUsd: 2400, currency: 'USD', originalAmount: 2400, categoryId: 'salary', date: daysAgo(1, 8) },
  { id: 'seed-3', type: 'expense', title: 'Groceries', amountUsd: 86.2, currency: 'USD', originalAmount: 86.2, categoryId: 'groceries', date: daysAgo(2, 18) },
];

type TransactionsContextValue = {
  transactions: Transaction[];
  isSeed: boolean;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [real, setReal] = useState<Transaction[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setReal(JSON.parse(raw) as Transaction[]);
      })
      .catch(() => {});
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    setReal((prev) => {
      const next = [{ ...t, id: `${Date.now()}` }, ...prev].sort(
        (a, b) => +new Date(b.date) - +new Date(a.date),
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<TransactionsContextValue>(
    () => ({
      transactions: real.length ? real : SEED,
      isSeed: real.length === 0,
      addTransaction,
    }),
    [real, addTransaction],
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error('useTransactions must be used inside TransactionsProvider');
  return ctx;
}

