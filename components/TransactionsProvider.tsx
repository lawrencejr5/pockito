import { useMutation, useQuery } from 'convex/react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import { useCloudSync } from '@/components/CloudSyncProvider';
import type { TransactionType } from '@/constants/categories';
import type { CurrencyCode } from '@/constants/currencies';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

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

type TransactionInput = Omit<Transaction, 'id'>;

type TransactionsContextValue = {
  transactions: Transaction[];
  isSeed: boolean;
  addTransaction: (t: TransactionInput) => void;
  updateTransaction: (id: string, patch: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, uploadReceiptIfNeeded } = useCloudSync();

  const cloudTransactions = useQuery(
    api.transactions.list,
    isAuthenticated ? {} : 'skip',
  );
  const addMutation = useMutation(api.transactions.add);
  const updateMutation = useMutation(api.transactions.update);
  const removeMutation = useMutation(api.transactions.remove);

  const addTransaction = useCallback(
    (t: TransactionInput) => {
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
      })().catch((err) => console.error('Failed to add transaction:', err));
    },
    [isAuthenticated, uploadReceiptIfNeeded, addMutation],
  );

  const updateTransaction = useCallback(
    (id: string, patch: TransactionInput) => {
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
      })().catch((err) => console.error('Failed to update transaction:', err));
    },
    [isAuthenticated, uploadReceiptIfNeeded, updateMutation],
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      if (!isAuthenticated) return;
      void removeMutation({ id: id as Id<'transactions'> }).catch((err) =>
        console.error('Failed to delete transaction:', err),
      );
    },
    [isAuthenticated, removeMutation],
  );

  const value = useMemo<TransactionsContextValue>(
    () => ({
      transactions: cloudTransactions ?? [],
      isSeed: false,
      addTransaction,
      updateTransaction,
      deleteTransaction,
    }),
    [cloudTransactions, addTransaction, updateTransaction, deleteTransaction],
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error('useTransactions must be used inside TransactionsProvider');
  return ctx;
}
