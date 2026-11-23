import { useAuthActions } from "@convex-dev/auth/react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import Purchases from "react-native-purchases";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSubscription } from "@/components/SubscriptionProvider";
import { useColorScheme } from "@/components/useColorScheme";
import Colors, { fonts } from "@/constants/Colors";
import {
  HARDCODED_PLANS,
  type SubscriptionPlanId,
} from "@/constants/subscriptions";

const FEATURE_PILLS = [
  { icon: "swap-vertical-outline" as const, label: "Cashflow & Receipts" },
  { icon: "pie-chart-outline" as const, label: "Smart Budgets" },
  { icon: "trending-up-outline" as const, label: "Net Worth & Reports" },
  { icon: "cloud-done-outline" as const, label: "Cloud Sync" },
];

export function PaywallScreen() {
  const colors = Colors[useColorScheme()];
  const { signOut } = useAuthActions();
  const {
    isSupported,
    isPurchasing,
    offering,
    offeringsError,
    purchasePlan,
    refreshSubscription,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] =
    useState<SubscriptionPlanId>("monthly");
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const impressionTrackedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === "web" || impressionTrackedRef.current) return;
    impressionTrackedRef.current = true;
    Purchases.trackCustomPaywallImpression({
      offering: offering ?? undefined,
    }).catch(() => {});
  }, [offering]);

  const busy = isPurchasing || signingOut;
  const isMonthly = selectedPlan === "monthly";

  const handleSelectPlan = (plan: SubscriptionPlanId) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedPlan(plan);
    if (plan === "lifetime" && freeTrialEnabled) {
      setFreeTrialEnabled(false);
    }
  };

  const handleToggleFreeTrial = (nextValue: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    setFreeTrialEnabled(nextValue);
    if (nextValue && selectedPlan !== "monthly") {
      setSelectedPlan("monthly");
    }
  };

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (!isSupported) {
      Alert.alert(
        "iOS Build Required",
        "In-app subscriptions require a native iOS development or App Store build.",
      );
      return;
    }

    try {
      const result = await purchasePlan(selectedPlan);
      if (!result.cancelled) {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to complete purchase. Please try again.";
      Alert.alert("Purchase Failed", message);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Switch account?",
      "Sign out of this Pockito account to sign in with a different Apple or Google account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
            } finally {
              setSigningOut(false);
            }
          },
        },
      ],
    );
  };

  const ctaLabel =
    isMonthly && freeTrialEnabled
      ? "Start 7-Day Free Trial"
      : isMonthly
        ? "Continue with Monthly — $1.99/mo"
        : "Unlock Lifetime — $34.99";

  const ctaSubNote =
    isMonthly && freeTrialEnabled
      ? "7 days free, then $1.99/month · We'll remind you 2 days before it ends"
      : isMonthly
        ? "Billed monthly at $1.99 USD · Cancel anytime in Settings"
        : "One-time payment of $34.99 USD · Lifetime access with no renewals";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.sheet }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Bar */}
        <View style={styles.topRow}>
          <View
            style={[styles.brandBadge, { backgroundColor: colors.accentSoft }]}
          >
            <Image
              source={require("@/assets/images/logo-mark.png")}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={[styles.brandBadgeText, { color: colors.tint }]}>
              POCKITO PRO
            </Text>
          </View>

          <Pressable
            disabled={busy}
            onPress={handleSignOut}
            hitSlop={8}
            style={styles.switchAccountBtn}
          >
            <Text
              style={[styles.switchAccountText, { color: colors.textMuted }]}
            >
              Sign Out
            </Text>
          </Pressable>
        </View>

        {/* Clean Headline & Compact Feature Pills */}
        <Animated.View
          entering={FadeInDown.duration(260)}
          style={styles.headerBlock}
        >
          <Text style={[styles.headline, { color: colors.text }]}>
            Choose your plan
          </Text>
          <Text style={[styles.subheadline, { color: colors.textMuted }]}>
            Full access to everything in Pockito — simple, transparent pricing.
          </Text>

          <View style={styles.pillsWrap}>
            {FEATURE_PILLS.map((pill) => (
              <View
                key={pill.label}
                style={[
                  styles.featurePill,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons name={pill.icon} size={13} color={colors.tint} />
                <Text style={[styles.featurePillText, { color: colors.text }]}>
                  {pill.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Two Large Plan Cards Front & Center */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(280)}
          style={styles.plansGrid}
        >
          {/* Monthly Plan Card ($1.99) */}
          <Pressable
            disabled={busy}
            onPress={() => handleSelectPlan("monthly")}
            style={[
              styles.planCard,
              {
                backgroundColor: isMonthly ? colors.darkCard : colors.card,
                borderColor: isMonthly ? colors.accent : colors.cardBorder,
                borderWidth: isMonthly ? 2 : 1,
              },
            ]}
          >
            <View style={styles.planCardHeader}>
              <View>
                <Text
                  style={[
                    styles.planLabel,
                    {
                      color: isMonthly
                        ? colors.secondary
                        : colors.textMuted,
                    },
                  ]}
                >
                  MONTHLY
                </Text>
                <Text
                  style={[
                    styles.planTitle,
                    { color: isMonthly ? colors.darkCardText : colors.text },
                  ]}
                >
                  {HARDCODED_PLANS.monthly.name}
                </Text>
              </View>

              <View style={styles.planHeaderRight}>
                {freeTrialEnabled && (
                  <View
                    style={[
                      styles.planBadge,
                      { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text style={styles.planBadgeText}>7 DAYS FREE</Text>
                  </View>
                )}
                <Ionicons
                  name={isMonthly ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={isMonthly ? colors.accent : colors.cardBorder}
                />
              </View>
            </View>

            <View style={styles.priceHeroRow}>
              <Text
                style={[
                  styles.priceBig,
                  { color: isMonthly ? colors.darkCardText : colors.text },
                ]}
              >
                {HARDCODED_PLANS.monthly.priceDisplay}
              </Text>
              <Text
                style={[
                  styles.pricePeriod,
                  {
                    color: isMonthly ? colors.secondary : colors.textMuted,
                  },
                ]}
              >
                / month
              </Text>
            </View>

            <Text
              style={[
                styles.planFootnote,
                { color: isMonthly ? colors.secondary : colors.textMuted },
              ]}
            >
              {freeTrialEnabled
                ? "$0.00 due today · $1.99/mo after 7-day free trial"
                : "Flexible monthly billing · Cancel anytime"}
            </Text>
          </Pressable>

          {/* Lifetime Plan Card ($34.99) */}
          <Pressable
            disabled={busy}
            onPress={() => handleSelectPlan("lifetime")}
            style={[
              styles.planCard,
              {
                backgroundColor: !isMonthly ? colors.darkCard : colors.card,
                borderColor: !isMonthly ? colors.accent : colors.cardBorder,
                borderWidth: !isMonthly ? 2 : 1,
              },
            ]}
          >
            <View style={styles.planCardHeader}>
              <View>
                <Text
                  style={[
                    styles.planLabel,
                    {
                      color: !isMonthly
                        ? colors.secondary
                        : colors.textMuted,
                    },
                  ]}
                >
                  LIFETIME
                </Text>
                <Text
                  style={[
                    styles.planTitle,
                    { color: !isMonthly ? colors.darkCardText : colors.text },
                  ]}
                >
                  {HARDCODED_PLANS.lifetime.name}
                </Text>
              </View>

              <View style={styles.planHeaderRight}>
                <View
                  style={[
                    styles.planBadge,
                    {
                      backgroundColor: !isMonthly
                        ? colors.accent
                        : colors.accentSoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.planBadgeText,
                      { color: !isMonthly ? "#1c1a17" : colors.tint },
                    ]}
                  >
                    PAY ONCE
                  </Text>
                </View>
                <Ionicons
                  name={!isMonthly ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={!isMonthly ? colors.accent : colors.cardBorder}
                />
              </View>
            </View>

            <View style={styles.priceHeroRow}>
              <Text
                style={[
                  styles.priceBig,
                  { color: !isMonthly ? colors.darkCardText : colors.text },
                ]}
              >
                {HARDCODED_PLANS.lifetime.priceDisplay}
              </Text>
              <Text
                style={[
                  styles.pricePeriod,
                  {
                    color: !isMonthly ? colors.secondary : colors.textMuted,
                  },
                ]}
              >
                one-time
              </Text>
            </View>

            <Text
              style={[
                styles.planFootnote,
                { color: !isMonthly ? colors.secondary : colors.textMuted },
              ]}
            >
              Pay once, own Pockito Pro forever · Zero monthly fees
            </Text>
          </Pressable>
        </Animated.View>

        {/* 7-Day Free Trial Toggle Bar */}
        <Animated.View
          entering={FadeInDown.delay(110).duration(280)}
          style={[
            styles.trialToggleCard,
            {
              backgroundColor: colors.card,
              borderColor: freeTrialEnabled ? colors.tint : colors.cardBorder,
            },
          ]}
        >
          <Pressable
            disabled={busy}
            onPress={() => handleToggleFreeTrial(!freeTrialEnabled)}
            style={styles.trialToggleRow}
          >
            <View
              style={[
                styles.trialToggleIcon,
                {
                  backgroundColor: freeTrialEnabled
                    ? colors.accent
                    : colors.accentSoft,
                },
              ]}
            >
              <Ionicons
                name="gift-outline"
                size={18}
                color={freeTrialEnabled ? "#1c1a17" : colors.tint}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.trialToggleTitle, { color: colors.text }]}>
                Enable 7-Day Free Trial
              </Text>
              <Text
                style={[styles.trialToggleSub, { color: colors.textMuted }]}
              >
                Try Monthly Pro free · Reminder 2 days before end
              </Text>
            </View>
            <Switch
              disabled={busy}
              value={freeTrialEnabled}
              onValueChange={handleToggleFreeTrial}
              trackColor={{ false: colors.cardBorder, true: colors.accent }}
              thumbColor="#ffffff"
            />
          </Pressable>

          {/* Compact 3-Step Timeline (Only shown when Trial Toggle is ON) */}
          {freeTrialEnabled && isMonthly && (
            <Animated.View
              entering={FadeInDown.duration(220)}
              exiting={FadeOutUp.duration(160)}
              style={[
                styles.timelineBox,
                {
                  backgroundColor: colors.sheet,
                  borderTopColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.timelineStep}>
                <View
                  style={[
                    styles.timelineIcon,
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Ionicons name="lock-open" size={12} color="#1c1a17" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timelineStepTitle, { color: colors.text }]}>
                    Today · $0.00 due now
                  </Text>
                  <Text
                    style={[styles.timelineStepSub, { color: colors.textMuted }]}
                  >
                    Instant full access to all Pockito Pro features
                  </Text>
                </View>
              </View>

              <View style={styles.timelineStep}>
                <View
                  style={[
                    styles.timelineIcon,
                    { backgroundColor: colors.accentSoft },
                  ]}
                >
                  <Ionicons
                    name="notifications"
                    size={12}
                    color={colors.tint}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timelineStepTitle, { color: colors.text }]}>
                    Day 5 · 2-Day Reminder
                  </Text>
                  <Text
                    style={[styles.timelineStepSub, { color: colors.textMuted }]}
                  >
                    We&apos;ll remind you 2 days before your trial ends
                  </Text>
                </View>
              </View>

              <View style={styles.timelineStep}>
                <View
                  style={[
                    styles.timelineIcon,
                    { backgroundColor: colors.accentSoft },
                  ]}
                >
                  <Ionicons name="card" size={12} color={colors.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timelineStepTitle, { color: colors.text }]}>
                    Day 7 · $1.99/month begins
                  </Text>
                  <Text
                    style={[styles.timelineStepSub, { color: colors.textMuted }]}
                  >
                    Cancel anytime before Day 7 to pay nothing
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {offeringsError && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: "rgba(217,83,79,0.12)",
                borderColor: "rgba(217,83,79,0.35)",
              },
            ]}
          >
            <Text style={[styles.errorBannerText, { color: colors.expense }]}>
              {offeringsError}
            </Text>
            <Pressable
              onPress={() => void refreshSubscription()}
              hitSlop={8}
            >
              <Text style={[styles.retryText, { color: colors.tint }]}>
                Retry
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA & Compliance Links */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.sheet,
            borderTopColor: colors.cardBorder,
          },
        ]}
      >
        <Pressable
          disabled={busy}
          onPress={handleSubscribe}
          style={({ pressed }) => [
            styles.ctaBtn,
            {
              backgroundColor: colors.accent,
              opacity: busy ? 0.65 : pressed ? 0.85 : 1,
            },
          ]}
        >
          {isPurchasing ? (
            <ActivityIndicator size="small" color="#1c1a17" />
          ) : (
            <>
              <Text style={styles.ctaBtnText}>{ctaLabel}</Text>
              <Ionicons name="arrow-forward" size={18} color="#1c1a17" />
            </>
          )}
        </Pressable>

        <Text style={[styles.ctaSubNote, { color: colors.textMuted }]}>
          {ctaSubNote}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  brandLogo: { width: 16, height: 16 },
  brandBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.9,
  },
  switchAccountBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  switchAccountText: { fontFamily: fonts.medium, fontSize: 13 },

  headerBlock: { gap: 6 },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 33,
  },
  subheadline: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
  },
  pillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 4,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  featurePillText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },

  plansGrid: { gap: 9 },
  planCard: {
    borderRadius: 18,
    padding: 13,
    gap: 5,
  },
  planCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  planLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.9,
  },
  planTitle: {
    fontFamily: fonts.bold,
    fontSize: 15.5,
    marginTop: 1,
  },
  planHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  planBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  planBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
    color: "#1c1a17",
    letterSpacing: 0.5,
  },
  priceHeroRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    marginTop: 1,
  },
  priceBig: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 30,
  },
  pricePeriod: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  planFootnote: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },

  trialToggleCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  trialToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  trialToggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  trialToggleTitle: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
  },
  trialToggleSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 1,
  },

  timelineBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  timelineStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timelineIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineStepTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
  },
  timelineStepSub: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  retryText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  ctaBtn: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#1c1a17",
  },
  ctaSubNote: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    textAlign: "center",
  },
});
