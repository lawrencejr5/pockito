import { useAction, useMutation, useQuery } from 'convex/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useCloudSync } from '@/components/CloudSyncProvider';
import {
  CURRENCIES,
  CURRENCY_LIST,
  DEFAULT_FAVORITE_CURRENCIES,
  symbolSpacer,
  type CurrencyCode,
  type CurrencyInfo,
} from '@/constants/currencies';
import { api } from '@/convex/_generated/api';

type CurrencyContextValue = {
  currency: CurrencyInfo;
  currencies: CurrencyInfo[];
  favorites: CurrencyCode[];
  isLoading: boolean;
  getCurrency: (code: CurrencyCode) => CurrencyInfo;
  setCurrency: (code: CurrencyCode) => void;
  toggleFavorite: (code: CurrencyCode) => void;
  /** Formats an amount stored in USD into the selected currency. */
  format: (amountUsd: number, opts?: { sign?: boolean; decimals?: number }) => string;
  /** Splits a formatted amount into whole and fractional parts for styled display. */
  parts: (amountUsd: number) => { whole: string; fraction: string };
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function group(n: number, decimals: number) {
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, rawFrac] = fixed.split('.');
  const frac = rawFrac && Number(rawFrac) !== 0 ? rawFrac : '';
  return { int: int.replace(/\B(?=(\d{3})+(?!\d))/g, ','), frac };
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useCloudSync();
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : 'skip');
  const dbCurrencies = useQuery(api.currencies.list, {});

  const updatePreferences = useMutation(api.users.updatePreferences);
  const ensureSeeded = useAction(api.currencies.ensureSeeded);
  const seededTriggeredRef = useRef(false);

  const [code, setCode] = useState<CurrencyCode>('USD');
  const [favorites, setFavorites] = useState<CurrencyCode[]>(DEFAULT_FAVORITE_CURRENCIES);

  // Trigger initial live rate seed if the currencies table is empty
  useEffect(() => {
    if (
      dbCurrencies !== undefined &&
      dbCurrencies.length === 0 &&
      !seededTriggeredRef.current
    ) {
      seededTriggeredRef.current = true;
      ensureSeeded({}).catch((err) => {
        console.warn('Initial currency seed failed:', err);
        seededTriggeredRef.current = false;
      });
    }
  }, [dbCurrencies, ensureSeeded]);

  // Sync user's default currency & favorites from Convex
  useEffect(() => {
    if (!isAuthenticated || !viewer) return;
    if (viewer.currency) {
      setCode(viewer.currency);
    }
    if (viewer.favoriteCurrencies) {
      setFavorites(viewer.favoriteCurrencies);
    }
  }, [isAuthenticated, viewer]);

  const { currencyMap, currencies } = useMemo(() => {
    const map: Record<string, CurrencyInfo> = { ...CURRENCIES };
    if (dbCurrencies && dbCurrencies.length > 0) {
      for (const c of dbCurrencies) {
        map[c.code] = {
          code: c.code,
          symbol: c.symbol,
          name: c.name,
          rate: c.rate,
          decimals: c.decimals,
        };
      }
      return {
        currencyMap: map,
        currencies: dbCurrencies.map((c) => map[c.code]),
      };
    }
    return {
      currencyMap: map,
      currencies: CURRENCY_LIST,
    };
  }, [dbCurrencies]);

  const getCurrency = useCallback(
    (targetCode: CurrencyCode): CurrencyInfo => {
      return (
        currencyMap[targetCode] ?? {
          code: targetCode,
          symbol: targetCode,
          name: targetCode,
          rate: 1,
          decimals: 2,
        }
      );
    },
    [currencyMap],
  );

  const setCurrency = useCallback(
    (next: CurrencyCode) => {
      setCode(next);
      if (!favorites.includes(next)) {
        const nextFavorites = [...favorites, next];
        setFavorites(nextFavorites);
        if (isAuthenticated) {
          updatePreferences({ currency: next, favoriteCurrencies: nextFavorites }).catch(() => {});
        }
      } else if (isAuthenticated) {
        updatePreferences({ currency: next }).catch(() => {});
      }
    },
    [favorites, isAuthenticated, updatePreferences],
  );

  const toggleFavorite = useCallback(
    (targetCode: CurrencyCode) => {
      setFavorites((prev) => {
        const exists = prev.includes(targetCode);
        const next = exists
          ? prev.filter((c) => c !== targetCode)
          : [...prev, targetCode];
        if (isAuthenticated) {
          updatePreferences({ favoriteCurrencies: next }).catch(() => {});
        }
        return next;
      });
    },
    [isAuthenticated, updatePreferences],
  );

  const value = useMemo<CurrencyContextValue>(() => {
    const currency = getCurrency(code);
    const spacer = symbolSpacer(currency.symbol);
    return {
      currency,
      currencies,
      favorites,
      isLoading: isAuthenticated && (viewer === undefined || dbCurrencies === undefined),
      getCurrency,
      setCurrency,
      toggleFavorite,
      format: (amountUsd, opts) => {
        const converted = amountUsd * currency.rate;
        const d = opts?.decimals ?? currency.decimals;
        const { int, frac } = group(converted, d);
        const sign = opts?.sign ? (converted < 0 ? '-' : '+') : converted < 0 ? '-' : '';
        return `${sign}${currency.symbol}${spacer}${int}${frac ? '.' + frac : ''}`;
      },
      parts: (amountUsd) => {
        const converted = amountUsd * currency.rate;
        const { int, frac } = group(converted, currency.decimals);
        const sign = converted < 0 ? '-' : '';
        return { whole: `${sign}${currency.symbol}${spacer}${int}`, fraction: frac ? `.${frac}` : '' };
      },
    };
  }, [code, currencies, favorites, isAuthenticated, viewer, dbCurrencies, getCurrency, setCurrency, toggleFavorite]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
