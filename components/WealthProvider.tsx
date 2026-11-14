import { useMutation, useQuery } from 'convex/react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import { useCloudSync } from '@/components/CloudSyncProvider';
import type { CurrencyCode } from '@/constants/currencies';
import type { WealthKind } from '@/constants/wealth';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

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

export function WealthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useCloudSync();

  const cloudItems = useQuery(api.wealth.list, isAuthenticated ? {} : 'skip');
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : 'skip');

  const addMutation = useMutation(api.wealth.add);
  const updateMutation = useMutation(api.wealth.update);
  const removeMutation = useMutation(api.wealth.remove);
  const updatePreferences = useMutation(api.users.updatePreferences);

  const setIncludeCashBalance = useCallback(
    (next: boolean) => {
      if (!isAuthenticated) return;
      updatePreferences({ includeCashBalance: next }).catch((err) =>
        console.error('Failed to update includeCashBalance:', err),
      );
    },
    [isAuthenticated, updatePreferences],
  );

  const addItem = useCallback(
    (input: WealthItemInput) => {
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
      }).catch((err) => console.error('Failed to add wealth item:', err));
    },
    [isAuthenticated, addMutation],
  );

  const updateItem = useCallback(
    (id: string, patch: WealthItemInput) => {
      if (!isAuthenticated) return;
      updateMutation({
        id: id as Id<'wealthItems'>,
        kind: patch.kind,
        categoryId: patch.categoryId,
        name: patch.name,
        amountUsd: patch.amountUsd,
        currency: patch.currency,
        originalAmount: patch.originalAmount,
        note: patch.note,
      }).catch((err) => console.error('Failed to update wealth item:', err));
    },
    [isAuthenticated, updateMutation],
  );

  const deleteItem = useCallback(
    (id: string) => {
      if (!isAuthenticated) return;
      removeMutation({ id: id as Id<'wealthItems'> }).catch((err) =>
        console.error('Failed to delete wealth item:', err),
      );
    },
    [isAuthenticated, removeMutation],
  );

  const value = useMemo<WealthContextValue>(
    () => ({
      items: cloudItems ?? [],
      includeCashBalance: viewer?.includeCashBalance ?? true,
      setIncludeCashBalance,
      addItem,
      updateItem,
      deleteItem,
    }),
    [
      cloudItems,
      viewer?.includeCashBalance,
      setIncludeCashBalance,
      addItem,
      updateItem,
      deleteItem,
    ],
  );

  return <WealthContext.Provider value={value}>{children}</WealthContext.Provider>;
}

export function useWealth() {
  const ctx = useContext(WealthContext);
  if (!ctx) throw new Error('useWealth must be used inside WealthProvider');
  return ctx;
}
