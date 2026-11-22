import { Platform } from "react-native";

export const REVENUECAT_API_KEY =
  Platform.select({
    ios:
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ??
      "appl_AimIoJlXPNfBgnYBBwPNYBzvKHW",
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "",
  }) ?? "";

export const REVENUECAT_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? "pro";

export const REVENUECAT_OFFERING_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID ?? "default_offering";

export const REVENUECAT_PRODUCT_IDS = {
  monthly: "pockito_pro_monthly",
  lifetime: "pockito_pro_lifetime",
} as const;

export type SubscriptionPlanId = "monthly" | "lifetime";

export const HARDCODED_PLANS = {
  monthly: {
    id: "monthly" as const,
    name: "Monthly Pro",
    badge: "7-DAY FREE TRIAL",
    priceDisplay: "$1.99",
    periodLabel: "/ month",
    subtitle: "7 days free, then $1.99/month · Cancel anytime",
    trialDays: 7,
    reminderDaysBeforeEnd: 2,
  },
  lifetime: {
    id: "lifetime" as const,
    name: "Lifetime Pro",
    badge: "PAY ONCE",
    priceDisplay: "$34.99",
    periodLabel: "one-time",
    subtitle: "Pay once, own Pockito Pro forever · No recurring fees",
  },
} as const;

const convexSiteBase = (
  process.env.EXPO_PUBLIC_CONVEX_SITE_URL ??
  "https://exciting-warthog-322.convex.site"
).replace(/\/$/, "");

export const LEGAL_URLS = {
  privacy: `${convexSiteBase}/legal/privacy`,
  terms: `${convexSiteBase}/legal/terms`,
} as const;
