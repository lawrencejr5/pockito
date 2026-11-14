import AsyncStorage from "@react-native-async-storage/async-storage";
import { useConvexAuth, useMutation } from "convex/react";
import { router, useSegments } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { CURRENCIES, type CurrencyCode } from "@/constants/currencies";
import type { TransactionType } from "@/constants/categories";
import type { WealthKind } from "@/constants/wealth";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const HAS_SIGNED_IN_KEY = "pockito.hasSignedInBefore";
const TRANSACTIONS_KEY = "pockito.transactions";
const WEALTH_ITEMS_KEY = "pockito.wealth.items";
const WEALTH_INCLUDE_CASH_KEY = "pockito.wealth.includeCash";
const CURRENCY_KEY = "pockito.currency";
const PROFILE_KEY = "pockito.profile";

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

type CloudSyncContextValue = {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isCloudMode: boolean;
  isSyncing: boolean;
  uploadReceiptIfNeeded: (
    uri?: string,
  ) => Promise<{ receiptStorageId?: Id<"_storage">; receiptUri?: string }>;
  clearHasSignedInBefore: () => Promise<void>;
};

const CloudSyncContext = createContext<CloudSyncContextValue | null>(null);

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const segments = useSegments();

  const generateUploadUrl = useMutation(api.transactions.generateUploadUrl);
  const migrateLocalData = useMutation(api.sync.migrateLocalData);

  const [hasSignedInBefore, setHasSignedInBefore] = useState(false);
  const [hasLoadedFlag, setHasLoadedFlag] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const migratingRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(HAS_SIGNED_IN_KEY)
      .then((val) => {
        if (val === "true") setHasSignedInBefore(true);
      })
      .catch(() => {})
      .finally(() => setHasLoadedFlag(true));
  }, []);

  const uploadReceiptIfNeeded = useCallback(
    async (
      uri?: string,
    ): Promise<{ receiptStorageId?: Id<"_storage">; receiptUri?: string }> => {
      if (!uri) return {};
      if (uri.startsWith("http://") || uri.startsWith("https://")) {
        return { receiptUri: uri };
      }

      const fileResponse = await fetch(uri);
      const blob = await fileResponse.blob();
      const postUrl = await generateUploadUrl({});

      const uploadResponse = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type || "image/jpeg" },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload receipt image");
      }

      const json = (await uploadResponse.json()) as { storageId?: string };
      if (!json.storageId) {
        throw new Error("Missing storageId from upload");
      }

      return { receiptStorageId: json.storageId as Id<"_storage"> };
    },
    [generateUploadUrl],
  );

  // Automatic one-time migration from AsyncStorage to Convex upon authentication
  useEffect(() => {
    if (!isAuthenticated || migratingRef.current) return;

    let cancelled = false;
    migratingRef.current = true;

    const runMigration = async () => {
      setIsSyncing(true);
      try {
        await AsyncStorage.setItem(HAS_SIGNED_IN_KEY, "true");
        if (!cancelled) setHasSignedInBefore(true);

        const [rawTx, rawWealth, rawCurrency, rawIncludeCash, rawProfile] =
          await AsyncStorage.multiGet([
            TRANSACTIONS_KEY,
            WEALTH_ITEMS_KEY,
            CURRENCY_KEY,
            WEALTH_INCLUDE_CASH_KEY,
            PROFILE_KEY,
          ]);

        const localTxRaw = rawTx[1] ? (JSON.parse(rawTx[1]) as LocalTx[]) : [];
        const realTx = localTxRaw.filter((t) => !t.id?.startsWith("seed-"));

        const localWealth = rawWealth[1]
          ? (JSON.parse(rawWealth[1]) as LocalWealthItem[])
          : [];

        const savedCurrency =
          rawCurrency[1] && rawCurrency[1] in CURRENCIES
            ? (rawCurrency[1] as CurrencyCode)
            : undefined;

        const savedIncludeCash =
          rawIncludeCash[1] !== null ? rawIncludeCash[1] === "true" : undefined;

        let savedFullname: string | undefined;
        if (rawProfile[1]) {
          try {
            const parsedProfile = JSON.parse(rawProfile[1]) as {
              name?: string;
            };
            if (parsedProfile.name && parsedProfile.name !== "Pockito User") {
              savedFullname = parsedProfile.name;
            }
          } catch {
            // ignore malformed profile JSON
          }
        }

        const hasAnythingToMigrate =
          realTx.length > 0 ||
          localWealth.length > 0 ||
          savedCurrency !== undefined ||
          savedIncludeCash !== undefined ||
          savedFullname !== undefined;

        if (hasAnythingToMigrate) {
          const uploadedTxs = await Promise.all(
            realTx.map(async (t) => {
              let receiptStorageId: Id<"_storage"> | undefined;
              let receiptUri: string | undefined;
              if (t.receiptUri) {
                try {
                  const uploaded = await uploadReceiptIfNeeded(t.receiptUri);
                  receiptStorageId = uploaded.receiptStorageId;
                  receiptUri = uploaded.receiptUri;
                } catch (err) {
                  console.warn("Receipt migration failed for", t.title, err);
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

        await AsyncStorage.multiRemove([
          TRANSACTIONS_KEY,
          WEALTH_ITEMS_KEY,
          CURRENCY_KEY,
          WEALTH_INCLUDE_CASH_KEY,
          PROFILE_KEY,
        ]);
      } catch (err) {
        console.error("Local-to-cloud migration error:", err);
      } finally {
        if (!cancelled) setIsSyncing(false);
        migratingRef.current = false;
      }
    };

    runMigration();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, migrateLocalData, uploadReceiptIfNeeded]);

  // Enforce Cloud-Only After First Sign-In
  useEffect(() => {
    if (!hasLoadedFlag || isLoading || isSyncing) return;
    if (hasSignedInBefore && !isAuthenticated) {
      const currentRoute = segments[0];
      if (currentRoute !== "sign-in") {
        router.replace("/sign-in");
      }
    }
  }, [
    hasLoadedFlag,
    isLoading,
    isSyncing,
    hasSignedInBefore,
    isAuthenticated,
    segments,
  ]);

  const clearHasSignedInBefore = useCallback(async () => {
    await AsyncStorage.removeItem(HAS_SIGNED_IN_KEY).catch(() => {});
    setHasSignedInBefore(false);
  }, []);

  const value = useMemo<CloudSyncContextValue>(
    () => ({
      isAuthenticated,
      isAuthLoading: isLoading || !hasLoadedFlag,
      isCloudMode: isAuthenticated || hasSignedInBefore,
      isSyncing,
      uploadReceiptIfNeeded,
      clearHasSignedInBefore,
    }),
    [
      isAuthenticated,
      isLoading,
      hasLoadedFlag,
      hasSignedInBefore,
      isSyncing,
      uploadReceiptIfNeeded,
      clearHasSignedInBefore,
    ],
  );

  return (
    <CloudSyncContext.Provider value={value}>
      {children}
    </CloudSyncContext.Provider>
  );
}

export function useCloudSync() {
  const ctx = useContext(CloudSyncContext);
  if (!ctx)
    throw new Error("useCloudSync must be used inside CloudSyncProvider");
  return ctx;
}
