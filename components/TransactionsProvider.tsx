import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from 'convex/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useCloudSync } from '@/components/CloudSyncProvider';
import type { TransactionType } from '@/constants/categories';
import type { CurrencyCode } from '@/constants/currencies';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

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

/** Shown until the user adds their first real transaction in local guest mode. */
const SEED: Transaction[] = [
  { id: 'seed-1', type: 'expense', title: 'Cash', amountUsd: 543.55, currency: 'USD', originalAmount: 543.55, categoryId: 'shopping', date: daysAgo(0, 9) },
  { id: 'seed-2', type: 'income', title: 'Salary Deposit', amountUsd: 2400, currency: 'USD', originalAmount: 2400, categoryId: 'salary', date: daysAgo(1, 8) },
  { id: 'seed-3', type: 'expense', title: 'Groceries', amountUsd: 86.2, currency: 'USD', originalAmount: 86.2, categoryId: 'groceries', date: daysAgo(2, 18) },
];

type TransactionInput = Omit<Transaction, 'id'>;

type TransactionsContextValue = {
  transactions: Transaction[];
  isSeed: boolean;
  addTransaction: (t: TransactionInput) => void;
  updateTransaction: (id: string, patch: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

const byNewest = (a: Transaction, b: Transaction) => +new Date(b.date) - +new Date(a.date);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isCloudMode, uploadReceiptIfNeeded } = useCloudSync();

  const cloudTransactions = useQuery(
    api.transactions.list,
    isAuthenticated ? {} : 'skip',
  );
  const addMutation = useMutation(api.transactions.add);
  const updateMutation = useMutation(api.transactions.update);
  const removeMutation = useMutation(api.transactions.remove);

  const [real, setReal] = useState<Transaction[]>([]);

  useEffect(() => {
    if (isCloudMode) {
      setReal([]);
      return;
    }
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setReal(JSON.parse(raw) as Transaction[]);
      })
      .catch(() => {});
  }, [isCloudMode]);

  const persist = (next: Transaction[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    return next;
  };

  const addTransaction = useCallback(
    (t: TransactionInput) => {
      if (isCloudMode) {
        if (!isAuthenticated) return;
        void (async () => {
          const uploaded = t.receiptUri
            ? await uploadReceiptIfNeeded(t.receiptUri)
            : {};
          await addMutation({
            type: t.type,
            title: t.title,
            amountUsd: t.amountUsd,
            currency: t.currency,
            originalAmount: t.originalAmount,
            categoryId: t.categoryId,
            receiptStorageId: uploaded.receiptStorageId,
            receiptUri: uploaded.receiptUri,
            date: t.date,
          });
        })().catch((err) => console.error('Failed to add cloud transaction:', err));
        return;
      }

      setReal((prev) => persist([{ ...t, id: `${Date.now()}` }, ...prev].sort(byNewest)));
    },
    [isCloudMode, isAuthenticated, uploadReceiptIfNeeded, addMutation],
  );

  const updateTransaction = useCallback(
    (id: string, patch: TransactionInput) => {
      if (isCloudMode) {
        if (!isAuthenticated) return;
        void (async () => {
          let receiptStorageId: Id<'_storage'> | undefined;
          let clearReceipt: boolean | undefined;
          if (!patch.receiptUri) {
            clearReceipt = true;
          } else {
            const uploaded = await uploadReceiptIfNeeded(patch.receiptUri);
            receiptStorageId = uploaded.receiptStorageId;
          }

          await updateMutation({
            id: id as Id<'transactions'>,
            type: patch.type,
            title: patch.title,
            amountUsd: patch.amountUsd,
            currency: patch.currency,
            originalAmount: patch.originalAmount,
            categoryId: patch.categoryId,
            receiptStorageId,
            clearReceipt,
            date: patch.date,
          });
        })().catch((err) => console.error('Failed to update cloud transaction:', err));
        return;
      }

      setReal((prev) => {
        const base = prev.length ? prev : SEED;
        return persist(base.map((item) => (item.id === id ? { ...patch, id } : item)).sort(byNewest));
      });
    },
    [isCloudMode, isAuthenticated, uploadReceiptIfNeeded, updateMutation],
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      if (isCloudMode) {
        if (!isAuthenticated) return;
        void removeMutation({ id: id as Id<'transactions'> }).catch((err) =>
          console.error('Failed to delete cloud transaction:', err),
        );
        return;
      }

      setReal((prev) => {
        const base = prev.length ? prev : SEED;
        return persist(base.filter((item) => item.id !== id));
      });
    },
    [isCloudMode, isAuthenticated, removeMutation],
  );

  const value = useMemo<TransactionsContextValue>(
    () =>
      isCloudMode
        ? {
            transactions: cloudTransactions ?? [],
            isSeed: false,
            addTransaction,
            updateTransaction,
            deleteTransaction,
          }
        : {
            transactions: real.length ? real : SEED,
            isSeed: real.length === 0,
            addTransaction,
            updateTransaction,
            deleteTransaction,
          },
    [
      isCloudMode,
      cloudTransactions,
      real,
      addTransaction,
      updateTransaction,
      deleteTransaction,
    ],
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error('useTransactions must be used inside TransactionsProvider');
  return ctx;
}
