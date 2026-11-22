import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConvexAuth, useMutation } from 'convex/react';
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
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { CURRENCIES, type CurrencyCode } from '@/constants/currencies';
import type { TransactionType } from '@/constants/categories';
import type { WealthKind } from '@/constants/wealth';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { resolveUserCountry } from '@/utils/country';
import { getDeviceTimeZone } from '@/utils/reg_push_notifications';

const LEGACY_KEYS = [
  'pockito.hasSignedInBefore',
  'pockito.transactions',
  'pockito.wealth.items',
  'pockito.wealth.includeCash',
  'pockito.currency',
  'pockito.profile',
];

type LocalTx = {
  id?: string;
  type: TransactionType;
  title: string;
  amountUsd: number;
  currency: CurrencyCode;
  originalAmount: number;
  categoryId: string;
  receiptUri?: string;
  date: string;
};

type LocalWealthItem = {
  id?: string;
  kind: WealthKind;
  categoryId: string;
  name: string;
  amountUsd: number;
  currency: CurrencyCode;
  originalAmount: number;
  note?: string;
  updatedAt: string;
};

export type PendingOnboardingData = {
  onboardingGoals: string[];
  referralSource?: string;
  currency: CurrencyCode;
  favoriteCurrencies: CurrencyCode[];
};

type CloudSyncContextValue = {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isSyncing: boolean;
  setPendingOnboarding: (data: PendingOnboardingData | null) => void;
  uploadReceiptIfNeeded: (
    uri?: string,
  ) => Promise<{ receiptStorageId?: Id<'_storage'>; receiptUri?: string }>;
};

const CloudSyncContext = createContext<CloudSyncContextValue | null>(null);

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  const generateUploadUrl = useMutation(api.transactions.generateUploadUrl);
  const migrateLocalData = useMutation(api.sync.migrateLocalData);
  const updatePreferences = useMutation(api.users.updatePreferences);
  const updateAppLoadMetadata = useMutation(api.users.updateAppLoadMetadata);

  const [isSyncing, setIsSyncing] = useState(false);
  const migratingRef = useRef(false);
  const pendingOnboardingRef = useRef<PendingOnboardingData | null>(null);
  const cachedCountryRef = useRef<string | null>(null);
  const lastLocationFetchRef = useRef<number>(0);

  const setPendingOnboarding = useCallback(
    (data: PendingOnboardingData | null) => {
      pendingOnboardingRef.current = data;
    },
    [],
  );

  const uploadReceiptIfNeeded = useCallback(
    async (
      uri?: string,
    ): Promise<{ receiptStorageId?: Id<'_storage'>; receiptUri?: string }> => {
      if (!uri) return {};
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return { receiptUri: uri };
      }

      const fileResponse = await fetch(uri);
      const blob = await fileResponse.blob();
      const postUrl = await generateUploadUrl({});

      const uploadResponse = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'image/jpeg' },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload receipt image');
      }

      const json = (await uploadResponse.json()) as { storageId?: string };
      if (!json.storageId) {
        throw new Error('Missing storageId from upload');
      }

      return { receiptStorageId: json.storageId as Id<'_storage'> };
    },
    [generateUploadUrl],
  );

  // One-time migration if any legacy AsyncStorage data exists on the device
  useEffect(() => {
    if (!isAuthenticated || migratingRef.current) return;

    let cancelled = false;
    migratingRef.current = true;

    const runLegacyMigration = async () => {
      try {
        const [, rawTx, rawWealth, rawIncludeCash, rawCurrency, rawProfile] =
          await AsyncStorage.multiGet(LEGACY_KEYS);

        const localTxRaw = rawTx[1] ? (JSON.parse(rawTx[1]) as LocalTx[]) : [];
        const realTx = localTxRaw.filter((t) => !t.id?.startsWith('seed-'));
        const localWealth = rawWealth[1]
          ? (JSON.parse(rawWealth[1]) as LocalWealthItem[])
          : [];
        const savedCurrency =
          rawCurrency[1] && rawCurrency[1] in CURRENCIES
            ? (rawCurrency[1] as CurrencyCode)
            : undefined;
        const savedIncludeCash =
          rawIncludeCash[1] !== null ? rawIncludeCash[1] === 'true' : undefined;

        let savedFullname: string | undefined;
        if (rawProfile[1]) {
          try {
            const parsed = JSON.parse(rawProfile[1]) as { name?: string };
            if (parsed.name && parsed.name !== 'Pockito User') {
              savedFullname = parsed.name;
            }
          } catch {
            // ignore malformed JSON
          }
        }

        const hasAnything =
          realTx.length > 0 ||
          localWealth.length > 0 ||
          savedCurrency !== undefined ||
          savedIncludeCash !== undefined ||
          savedFullname !== undefined;

        if (hasAnything) {
          if (!cancelled) setIsSyncing(true);
          const uploadedTxs = await Promise.all(
            realTx.map(async (t) => {
              let receiptStorageId: Id<'_storage'> | undefined;
              let receiptUri: string | undefined;
              if (t.receiptUri) {
                try {
                  const uploaded = await uploadReceiptIfNeeded(t.receiptUri);
                  receiptStorageId = uploaded.receiptStorageId;
                  receiptUri = uploaded.receiptUri;
                } catch (err) {
                  console.warn('Receipt migration failed for', t.title, err);
                }
              }
              return {
                type: t.type,
                title: t.title,
                amountUsd: t.amountUsd,
                currency: t.currency,
                originalAmount: t.originalAmount,
                categoryId: t.categoryId,
                receiptStorageId,
                receiptUri,
                date: t.date,
              };
            }),
          );

          await migrateLocalData({
            transactions: uploadedTxs,
            wealthItems: localWealth.map((w) => ({
              kind: w.kind,
              categoryId: w.categoryId,
              name: w.name,
              amountUsd: w.amountUsd,
              currency: w.currency,
              originalAmount: w.originalAmount,
              note: w.note,
              updatedAt: w.updatedAt,
            })),
            currency: savedCurrency,
            includeCashBalance: savedIncludeCash,
            fullname: savedFullname,
          });
        }

        if (pendingOnboardingRef.current) {
          const pending = pendingOnboardingRef.current;
          pendingOnboardingRef.current = null;
          if (!cancelled) setIsSyncing(true);
          await updatePreferences({
            currency: pending.currency,
            favoriteCurrencies: pending.favoriteCurrencies,
            onboardingGoals: pending.onboardingGoals,
            referralSource: pending.referralSource,
            onboardingCompleted: true,
          });
        }

        await AsyncStorage.multiRemove(LEGACY_KEYS);
      } catch (err) {
        console.error('Legacy migration error:', err);
      } finally {
        if (!cancelled) setIsSyncing(false);
        migratingRef.current = false;
      }
    };

    runLegacyMigration();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, migrateLocalData, updatePreferences, uploadReceiptIfNeeded]);

  // Sync device OS, country location, timezone, and lastSeen on launch and foreground.
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const syncMetadata = async (forceRefreshLocation = false) => {
      try {
        const now = Date.now();
        if (
          !cachedCountryRef.current ||
          forceRefreshLocation ||
          now - lastLocationFetchRef.current > 60 * 60 * 1000
        ) {
          const country = await resolveUserCountry();
          if (country && !cancelled) {
            cachedCountryRef.current = country;
            lastLocationFetchRef.current = now;
          }
        }

        if (cancelled) return;

        const os: 'ios' | 'android' | 'web' =
          Platform.OS === 'ios'
            ? 'ios'
            : Platform.OS === 'android'
              ? 'android'
              : 'web';

        await updateAppLoadMetadata({
          os,
          country: cachedCountryRef.current ?? undefined,
          timezone: getDeviceTimeZone(),
          lastSeen: Date.now(),
        });
      } catch (err) {
        console.error('Error updating user app load metadata:', err);
      }
    };

    void syncMetadata();

    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          void syncMetadata();
        }
      },
    );

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [isAuthenticated, updateAppLoadMetadata]);

  const value = useMemo<CloudSyncContextValue>(
    () => ({
      isAuthenticated,
      isAuthLoading: isLoading,
      isSyncing,
      setPendingOnboarding,
      uploadReceiptIfNeeded,
    }),
    [isAuthenticated, isLoading, isSyncing, setPendingOnboarding, uploadReceiptIfNeeded],
  );

  return (
    <CloudSyncContext.Provider value={value}>{children}</CloudSyncContext.Provider>
  );
}

export function useCloudSync() {
  const ctx = useContext(CloudSyncContext);
  if (!ctx) throw new Error('useCloudSync must be used inside CloudSyncProvider');
  return ctx;
}
