import { useMutation, useQuery } from "convex/react";
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
import { Linking, Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  isPurchasesError,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";

import { useCloudSync } from "@/components/CloudSyncProvider";
import {
  REVENUECAT_API_KEY,
  REVENUECAT_ENTITLEMENT_ID,
  REVENUECAT_OFFERING_ID,
  REVENUECAT_PRODUCT_IDS,
  type SubscriptionPlanId,
} from "@/constants/subscriptions";
import { api } from "@/convex/_generated/api";
import {
  cancelLocalTrialReminder,
  syncLocalTrialReminder,
} from "@/utils/trial_reminder";

export type SubscriptionContextValue = {
  isSupported: boolean;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  isSubscribed: boolean;
  isTrial: boolean;
  willRenew: boolean;
  activePlan: SubscriptionPlanId | null;
  expirationDate: string | null;
  offering: PurchasesOffering | null;
  monthlyPackage: PurchasesPackage | null;
  lifetimePackage: PurchasesPackage | null;
  offeringsError: string | null;
  purchasePlan: (plan: SubscriptionPlanId) => Promise<{ cancelled: boolean }>;
  restorePurchases: () => Promise<{ restored: boolean }>;
  manageSubscriptions: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null,
);

let sdkConfigured = false;

function ensurePurchasesConfigured(): boolean {
  if (Platform.OS === "web" || !REVENUECAT_API_KEY) {
    return false;
  }
  if (sdkConfigured) {
    return true;
  }
  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG).catch(() => {});
    }
    Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    sdkConfigured = true;
    return true;
  } catch (err) {
    console.warn("RevenueCat configure failed:", err);
    return false;
  }
}

function resolveOfferingAndPackages(
  offerings: Awaited<ReturnType<typeof Purchases.getOfferings>>,
) {
  const offering =
    offerings.all[REVENUECAT_OFFERING_ID] ?? offerings.current ?? null;

  if (!offering) {
    return {
      offering: null,
      monthlyPackage: null,
      lifetimePackage: null,
    };
  }

  const monthlyPackage =
    offering.monthly ??
    offering.availablePackages.find(
      (pkg) =>
        pkg.product.identifier === REVENUECAT_PRODUCT_IDS.monthly ||
        pkg.packageType === PACKAGE_TYPE.MONTHLY ||
        pkg.identifier === "$rc_monthly",
    ) ??
    null;

  const lifetimePackage =
    offering.lifetime ??
    offering.availablePackages.find(
      (pkg) =>
        pkg.product.identifier === REVENUECAT_PRODUCT_IDS.lifetime ||
        pkg.packageType === PACKAGE_TYPE.LIFETIME ||
        pkg.identifier === "$rc_lifetime",
    ) ??
    null;

  return { offering, monthlyPackage, lifetimePackage };
}

function deriveSubscriptionState(customerInfo: CustomerInfo | null) {
  const entitlement =
    customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT_ID] ?? null;
  const isSubscribed = Boolean(entitlement?.isActive);
  const isTrial = Boolean(isSubscribed && entitlement?.periodType === "TRIAL");
  const willRenew = Boolean(entitlement?.willRenew);
  const expirationDate = entitlement?.expirationDate ?? null;

  let activePlan: SubscriptionPlanId | null = null;
  if (isSubscribed && entitlement) {
    const isLifetime =
      entitlement.productIdentifier === REVENUECAT_PRODUCT_IDS.lifetime ||
      entitlement.productIdentifier.includes("lifetime") ||
      entitlement.expirationDate === null;
    activePlan = isLifetime ? "lifetime" : "monthly";
  }

  return {
    isSubscribed,
    isTrial,
    willRenew,
    activePlan,
    expirationDate,
  };
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useCloudSync();
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : "skip");
  const syncSubscriptionState = useMutation(api.users.syncSubscriptionState);

  const isSupported = Platform.OS !== "web" && Boolean(REVENUECAT_API_KEY);

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [monthlyPackage, setMonthlyPackage] =
    useState<PurchasesPackage | null>(null);
  const [lifetimePackage, setLifetimePackage] =
    useState<PurchasesPackage | null>(null);
  const [offeringsError, setOfferingsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isSupported);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const lastLoggedInUserIdRef = useRef<string | null>(null);
  const lastSyncedSignatureRef = useRef<string | null>(null);

  const loadOfferings = useCallback(async () => {
    if (!ensurePurchasesConfigured()) {
      return {
        offering: null,
        monthlyPackage: null,
        lifetimePackage: null,
      };
    }

    try {
      const offerings = await Purchases.getOfferings();
      const resolved = resolveOfferingAndPackages(offerings);
      setOffering(resolved.offering);
      setMonthlyPackage(resolved.monthlyPackage);
      setLifetimePackage(resolved.lifetimePackage);
      setOfferingsError(
        resolved.monthlyPackage || resolved.lifetimePackage
          ? null
          : "Subscription plans are not configured in RevenueCat yet.",
      );
      return resolved;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load subscription plans.";
      setOfferingsError(msg);
      return {
        offering: null,
        monthlyPackage: null,
        lifetimePackage: null,
      };
    }
  }, []);

  // Configure RevenueCat once and listen for real-time CustomerInfo updates.
  useEffect(() => {
    if (!ensurePurchasesConfigured()) {
      setIsLoading(false);
      return;
    }

    const listener = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  // Link RevenueCat user ID to Convex viewer._id when authenticated.
  useEffect(() => {
    let cancelled = false;

    const syncIdentity = async () => {
      if (!ensurePurchasesConfigured()) {
        setIsLoading(false);
        return;
      }

      if (!isAuthenticated) {
        if (lastLoggedInUserIdRef.current !== null) {
          lastLoggedInUserIdRef.current = null;
          lastSyncedSignatureRef.current = null;
          await Purchases.logOut().catch(() => {});
        }
        await cancelLocalTrialReminder();
        if (!cancelled) {
          setCustomerInfo(null);
          setIsLoading(false);
        }
        return;
      }

      // Wait until Convex viewer query resolves so we always log in with viewer._id.
      if (viewer === undefined) {
        if (!cancelled) setIsLoading(true);
        return;
      }

      if (viewer === null) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      if (!cancelled) setIsLoading(true);
      try {
        if (lastLoggedInUserIdRef.current !== viewer._id) {
          const { customerInfo: info } = await Purchases.logIn(viewer._id);
          lastLoggedInUserIdRef.current = viewer._id;
          if (!cancelled) setCustomerInfo(info);
        } else {
          const info = await Purchases.getCustomerInfo();
          if (!cancelled) setCustomerInfo(info);
        }
        await loadOfferings();
      } catch (err) {
        console.warn("RevenueCat identity sync failed:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void syncIdentity();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, viewer, loadOfferings]);

  const derived = useMemo(
    () => deriveSubscriptionState(customerInfo),
    [customerInfo],
  );

  // Sync local 2-day trial reminder & Convex subscription mirror whenever state changes.
  useEffect(() => {
    if (!isAuthenticated || !viewer?._id || isLoading) return;

    void syncLocalTrialReminder({
      isTrial: derived.isTrial,
      expirationDate: derived.expirationDate,
    });

    const hasPriorRecord = Boolean(viewer.subscriptionStatus);
    const status = derived.isSubscribed
      ? derived.isTrial
        ? "trial"
        : "active"
      : hasPriorRecord
        ? "expired"
        : "none";

    const expMs = derived.expirationDate
      ? new Date(derived.expirationDate).getTime()
      : undefined;
    const validExpMs =
      typeof expMs === "number" && Number.isFinite(expMs) ? expMs : undefined;

    const signature = JSON.stringify({
      userId: viewer._id,
      status,
      plan: derived.activePlan ?? null,
      exp: validExpMs ?? null,
    });

    if (lastSyncedSignatureRef.current === signature) return;
    lastSyncedSignatureRef.current = signature;

    void syncSubscriptionState({
      status,
      plan: derived.activePlan ?? undefined,
      trialEndsAt: derived.isTrial ? validExpMs : undefined,
      subscriptionExpiresAt:
        derived.activePlan === "lifetime" ? undefined : validExpMs,
    }).catch((err) => {
      console.warn("Failed to sync subscription state to Convex:", err);
    });
  }, [
    isAuthenticated,
    viewer?._id,
    viewer?.subscriptionStatus,
    isLoading,
    derived,
    syncSubscriptionState,
  ]);

  const purchasePlan = useCallback(
    async (plan: SubscriptionPlanId): Promise<{ cancelled: boolean }> => {
      if (!ensurePurchasesConfigured()) {
        throw new Error(
          "In-app purchases are only available in the native iOS app build.",
        );
      }

      setIsPurchasing(true);
      try {
        let pkg = plan === "monthly" ? monthlyPackage : lifetimePackage;
        if (!pkg) {
          const refreshed = await loadOfferings();
          pkg =
            plan === "monthly"
              ? refreshed.monthlyPackage
              : refreshed.lifetimePackage;
        }

        if (!pkg) {
          throw new Error(
            `Could not find the ${plan === "monthly" ? "pockito_pro_monthly" : "pockito_pro_lifetime"} package in RevenueCat offering "${REVENUECAT_OFFERING_ID}".`,
          );
        }

        const result = await Purchases.purchasePackage(pkg);
        setCustomerInfo(result.customerInfo);
        return { cancelled: false };
      } catch (err) {
        if (
          isPurchasesError(err) &&
          err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
        ) {
          return { cancelled: true };
        }
        throw err;
      } finally {
        setIsPurchasing(false);
      }
    },
    [monthlyPackage, lifetimePackage, loadOfferings],
  );

  const restorePurchases = useCallback(async (): Promise<{
    restored: boolean;
  }> => {
    if (!ensurePurchasesConfigured()) {
      throw new Error(
        "In-app purchases are only available in the native iOS app build.",
      );
    }

    setIsRestoring(true);
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      const active = Boolean(
        info.entitlements.active[REVENUECAT_ENTITLEMENT_ID]?.isActive,
      );
      return { restored: active };
    } finally {
      setIsRestoring(false);
    }
  }, []);

  const manageSubscriptions = useCallback(async () => {
    try {
      if (ensurePurchasesConfigured()) {
        await Purchases.showManageSubscriptions();
        return;
      }
    } catch {
      // Fallback to store subscription URL below
    }
    const fallbackUrl =
      Platform.OS === "ios"
        ? "https://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions";
    await Linking.openURL(fallbackUrl);
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!ensurePurchasesConfigured()) return;
    setIsLoading(true);
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      await loadOfferings();
    } catch (err) {
      console.warn("Failed to refresh subscription info:", err);
    } finally {
      setIsLoading(false);
    }
  }, [loadOfferings]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      isSupported,
      isLoading,
      isPurchasing,
      isRestoring,
      isSubscribed: derived.isSubscribed,
      isTrial: derived.isTrial,
      willRenew: derived.willRenew,
      activePlan: derived.activePlan,
      expirationDate: derived.expirationDate,
      offering,
      monthlyPackage,
      lifetimePackage,
      offeringsError,
      purchasePlan,
      restorePurchases,
      manageSubscriptions,
      refreshSubscription,
    }),
    [
      isSupported,
      isLoading,
      isPurchasing,
      isRestoring,
      derived,
      offering,
      monthlyPackage,
      lifetimePackage,
      offeringsError,
      purchasePlan,
      restorePurchases,
      manageSubscriptions,
      refreshSubscription,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error(
      "useSubscription must be used inside SubscriptionProvider",
    );
  }
  return ctx;
}
