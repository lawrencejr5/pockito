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
import { CURRENCIES, type CurrencyCode, type CurrencyInfo } from '@/constants/currencies';
import { api } from '@/convex/_generated/api';

type CurrencyContextValue = {
  currency: CurrencyInfo;
  setCurrency: (code: CurrencyCode) => void;
  /** Formats an amount stored in USD into the selected currency. */
  format: (amountUsd: number, opts?: { sign?: boolean; decimals?: number }) => string;
  /** Splits a formatted amount into whole and fractional parts for styled display. */
  parts: (amountUsd: number) => { whole: string; fraction: string };
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function group(n: number, decimals: number) {
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, frac] = fixed.split('.');
  return { int: int.replace(/\B(?=(\d{3})+(?!\d))/g, ','), frac };
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useCloudSync();
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : 'skip');
  const updatePreferences = useMutation(api.users.updatePreferences);

  const [code, setCode] = useState<CurrencyCode>('USD');

  useEffect(() => {
    if (isAuthenticated && viewer?.currency && viewer.currency in CURRENCIES) {
      setCode(viewer.currency);
    }
  }, [isAuthenticated, viewer?.currency]);

  const setCurrency = useCallback(
    (next: CurrencyCode) => {
      setCode(next);
      if (isAuthenticated) {
        updatePreferences({ currency: next }).catch(() => {});
      }
    },
    [isAuthenticated, updatePreferences],
  );

  const value = useMemo<CurrencyContextValue>(() => {
    const currency = CURRENCIES[code];
    return {
      currency,
      setCurrency,
      format: (amountUsd, opts) => {
        const converted = amountUsd * currency.rate;
        const d = opts?.decimals ?? currency.decimals;
        const { int, frac } = group(converted, d);
        const sign = opts?.sign ? (converted < 0 ? '-' : '+') : converted < 0 ? '-' : '';
        return `${sign}${currency.symbol}${int}${frac ? '.' + frac : ''}`;
      },
      parts: (amountUsd) => {
        const converted = amountUsd * currency.rate;
        const { int, frac } = group(converted, currency.decimals);
        const sign = converted < 0 ? '-' : '';
        return { whole: `${sign}${currency.symbol}${int}`, fraction: frac ? `.${frac}` : '' };
      },
    };
  }, [code, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
