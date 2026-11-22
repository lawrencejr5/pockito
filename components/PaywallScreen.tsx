import { useAuthActions } from "@convex-dev/auth/react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Purchases from "react-native-purchases";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { LegalModal, type LegalDocType } from "@/components/LegalModal";
import { useSubscription } from "@/components/SubscriptionProvider";
import { useColorScheme } from "@/components/useColorScheme";
import Colors, { fonts } from "@/constants/Colors";
import {
  HARDCODED_PLANS,
  type SubscriptionPlanId,
} from "@/constants/subscriptions";

const FEATURES = [
  {
    icon: "swap-vertical-outline" as const,
    text: "Unlimited income, expenses & receipt photos",
  },
  {
    icon: "pie-chart-outline" as const,
    text: "Smart daily, weekly, monthly & custom budgets",
  },
  {
    icon: "trending-up-outline" as const,
    text: "Live net worth & personal balance sheet",
  },
  {
    icon: "cloud-done-outline" as const,
    text: "Encrypted cloud sync & multi-currency support",
  },
];

export function PaywallScreen() {
  const colors = Colors[useColorScheme()];
  const { signOut } = useAuthActions();
  const {
    isSupported,
    isPurchasing,
    isRestoring,
    offering,
    offeringsError,
    purchasePlan,
    restorePurchases,
    refreshSubscription,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] =
    useState<SubscriptionPlanId>("monthly");
  const [legalDoc, setLegalDoc] = useState<LegalDocType>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    Purchases.trackCustomPaywallImpression({
      offering: offering ?? undefined,
    }).catch(() => {});
  }, [offering]);

  const busy = isPurchasing || isRestoring || signingOut;

  const handleSelectPlan = (plan: SubscriptionPlanId) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedPlan(plan);
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

  const handleRestore = async () => {
    Haptics.selectionAsync().catch(() => {});
    if (!isSupported) {
      Alert.alert(
        "iOS Build Required",
        "Restore Purchases is only available in native iOS builds.",
      );
      return;
    }

    try {
      const { restored } = await restorePurchases();
      if (restored) {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
      } else {
        Alert.alert(
          "No Active Subscription Found",
          "We could not find an active Pockito Pro subscription or lifetime purchase for this Apple ID.",
        );
      }
    } catch (err) {
      Alert.alert(
        "Restore Failed",
        err instanceof Error ? err.message : "Please try again.",
      );
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

  const isMonthly = selectedPlan === "monthly";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.sheet }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Row: Brand + Switch Account */}
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
            <Text style={[styles.switchAccountText, { color: colors.textMuted }]}>
              Sign Out
            </Text>
          </Pressable>
        </View>

        {/* Headline */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={styles.headerBlock}
        >
          <Text style={[styles.headline, { color: colors.text }]}>
            {isMonthly
              ? "Try Pockito free\nfor 7 days."
              : "Own Pockito\nforever."}
          </Text>
          <Text style={[styles.subheadline, { color: colors.textMuted }]}>
            {isMonthly
              ? "Unlock full access today. We'll send you a reminder 2 days before your trial ends."
              : "One single payment of $34.99. Every feature unlocked with zero monthly bills."}
          </Text>
        </Animated.View>

        {/* Value Highlights */}
        <Animated.View
          entering={FadeInDown.delay(70).duration(300)}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {FEATURES.map((feat, index) => (
            <View
              key={feat.text}
              style={[
                styles.featureRow,
                index < FEATURES.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.cardBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.featureIconWrap,
                  { backgroundColor: colors.accentSoft },
                ]}
              >
                <Ionicons name={feat.icon} size={16} color={colors.tint} />
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>
                {feat.text}
              </Text>
              <Ionicons name="checkmark" size={16} color={colors.income} />
            </View>
          ))}
        </Animated.View>

        {/* 7-Day Trial Timeline (or Lifetime Assurance) */}
        <Animated.View
          entering={FadeInDown.delay(130).duration(300)}
          style={[styles.timelineCard, { backgroundColor: colors.darkCard }]}
        >
          {isMonthly ? (
            <>
              <View style={styles.timelineHeader}>
                <Ionicons
                  name="notifications-outline"
                  size={15}
                  color={colors.accent}
                />
                <Text
                  style={[styles.timelineTitle, { color: colors.darkCardText }]}
                >
                  How your 7-day free trial works
                </Text>
              </View>

              <View style={styles.timelineSteps}>
                <View style={styles.timelineRow}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: colors.accent },
                    ]}
                  >
                    <Ionicons name="lock-open" size={12} color="#1c1a17" />
                  </View>
                  <View style={styles.timelineBody}>
                    <Text
                      style={[
                        styles.timelineStepTitle,
                        { color: colors.darkCardText },
                      ]}
                    >
                      Today · Full Access Unlocked
                    </Text>
                    <Text
                      style={[
                        styles.timelineStepSub,
                        { color: colors.secondary },
                      ]}
                    >
                      $0.00 due now — explore every feature free
                    </Text>
                  </View>
                </View>

                <View style={styles.timelineRow}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: "rgba(232,210,181,0.22)" },
                    ]}
                  >
                    <Ionicons
                      name="notifications"
                      size={12}
                      color={colors.accent}
                    />
                  </View>
                  <View style={styles.timelineBody}>
                    <Text
                      style={[
                        styles.timelineStepTitle,
                        { color: colors.darkCardText },
                      ]}
                    >
                      Day 5 · 2-Day Reminder
                    </Text>
                    <Text
                      style={[
                        styles.timelineStepSub,
                        { color: colors.secondary },
                      ]}
                    >
                      We&apos;ll notify you 2 days before your trial ends
                    </Text>
                  </View>
                </View>

                <View style={styles.timelineRow}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: "rgba(232,210,181,0.22)" },
                    ]}
                  >
                    <Ionicons name="card" size={12} color={colors.accent} />
                  </View>
                  <View style={styles.timelineBody}>
                    <Text
                      style={[
                        styles.timelineStepTitle,
                        { color: colors.darkCardText },
                      ]}
                    >
                      Day 7 · Trial Ends
                    </Text>
                    <Text
                      style={[
                        styles.timelineStepSub,
                        { color: colors.secondary },
                      ]}
                    >
                      $1.99/month begins unless cancelled beforehand
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.lifetimeBanner}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: colors.accent },
                ]}
              >
                <Ionicons name="infinite" size={14} color="#1c1a17" />
              </View>
              <View style={styles.timelineBody}>
                <Text
                  style={[
                    styles.timelineStepTitle,
                    { color: colors.darkCardText },
                  ]}
                >
                  Pay $34.99 Once · Yours Forever
                </Text>
                <Text
                  style={[styles.timelineStepSub, { color: colors.secondary }]}
                >
                  Includes all future updates & cloud sync with zero recurring
                  charges.
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Plan Selector (Strictly Hardcoded USD Prices) */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(300)}
          style={styles.plansWrap}
        >
          {/* Monthly Plan */}
          <Pressable
            disabled={busy}
            onPress={() => handleSelectPlan("monthly")}
            style={[
              styles.planCard,
              {
                backgroundColor: colors.card,
                borderColor: isMonthly ? colors.tint : colors.cardBorder,
                borderWidth: isMonthly ? 2 : 1,
              },
            ]}
          >
            <View style={styles.planTopRow}>
              <View style={styles.planLeft}>
                <View style={styles.planTitleRow}>
                  <Ionicons
                    name={isMonthly ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={isMonthly ? colors.tint : colors.textMuted}
                  />
                  <Text style={[styles.planName, { color: colors.text }]}>
                    {HARDCODED_PLANS.monthly.name}
                  </Text>
                  <View
                    style={[
                      styles.planBadge,
                      { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text style={styles.planBadgeText}>
                      {HARDCODED_PLANS.monthly.badge}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.planSub, { color: colors.textMuted }]}>
                  {HARDCODED_PLANS.monthly.subtitle}
                </Text>
              </View>

              <View style={styles.priceBox}>
                <Text style={[styles.priceValue, { color: colors.text }]}>
                  {HARDCODED_PLANS.monthly.priceDisplay}
                </Text>
                <Text style={[styles.priceUnit, { color: colors.textMuted }]}>
                  {HARDCODED_PLANS.monthly.periodLabel}
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Lifetime Plan */}
          <Pressable
            disabled={busy}
            onPress={() => handleSelectPlan("lifetime")}
            style={[
              styles.planCard,
              {
                backgroundColor: colors.card,
                borderColor: !isMonthly ? colors.tint : colors.cardBorder,
                borderWidth: !isMonthly ? 2 : 1,
              },
            ]}
          >
            <View style={styles.planTopRow}>
              <View style={styles.planLeft}>
                <View style={styles.planTitleRow}>
                  <Ionicons
                    name={!isMonthly ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={!isMonthly ? colors.tint : colors.textMuted}
                  />
                  <Text style={[styles.planName, { color: colors.text }]}>
                    {HARDCODED_PLANS.lifetime.name}
                  </Text>
                  <View
                    style={[
                      styles.planBadgeSoft,
                      { backgroundColor: colors.accentSoft },
                    ]}
                  >
                    <Text
                      style={[styles.planBadgeSoftText, { color: colors.tint }]}
                    >
                      {HARDCODED_PLANS.lifetime.badge}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.planSub, { color: colors.textMuted }]}>
                  {HARDCODED_PLANS.lifetime.subtitle}
                </Text>
              </View>

              <View style={styles.priceBox}>
                <Text style={[styles.priceValue, { color: colors.text }]}>
                  {HARDCODED_PLANS.lifetime.priceDisplay}
                </Text>
                <Text style={[styles.priceUnit, { color: colors.textMuted }]}>
                  {HARDCODED_PLANS.lifetime.periodLabel}
                </Text>
              </View>
            </View>
          </Pressable>
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

      {/* Fixed Bottom CTA & Compliance Footer */}
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
              <Text style={styles.ctaBtnText}>
                {isMonthly
                  ? "Start 7-Day Free Trial"
                  : "Unlock Lifetime — $34.99"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#1c1a17" />
            </>
          )}
        </Pressable>

        <Text style={[styles.ctaSubNote, { color: colors.textMuted }]}>
          {isMonthly
            ? "7 days free, then $1.99/month · Reminder sent 2 days before trial ends"
            : "One-time purchase of $34.99 · No subscription renewal"}
        </Text>

        <View style={styles.legalRow}>
          <Pressable disabled={busy} onPress={handleRestore} hitSlop={8}>
            {isRestoring ? (
              <ActivityIndicator size="small" color={colors.tint} />
            ) : (
              <Text style={[styles.legalLink, { color: colors.tint }]}>
                Restore Purchases
              </Text>
            )}
          </Pressable>
          <Text style={[styles.legalDot, { color: colors.textMuted }]}>·</Text>
          <Pressable onPress={() => setLegalDoc("terms")} hitSlop={8}>
            <Text style={[styles.legalLink, { color: colors.textMuted }]}>
              Terms of Use
            </Text>
          </Pressable>
          <Text style={[styles.legalDot, { color: colors.textMuted }]}>·</Text>
          <Pressable onPress={() => setLegalDoc("privacy")} hitSlop={8}>
            <Text style={[styles.legalLink, { color: colors.textMuted }]}>
              Privacy Policy
            </Text>
          </Pressable>
        </View>
      </View>

      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 16,
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
    fontSize: 31,
    lineHeight: 36,
  },
  subheadline: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13.5,
  },

  timelineCard: {
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  timelineTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
  },
  timelineSteps: { gap: 10 },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineBody: { flex: 1, gap: 1 },
  timelineStepTitle: { fontFamily: fonts.semiBold, fontSize: 13 },
  timelineStepSub: { fontFamily: fonts.regular, fontSize: 12 },
  lifetimeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  plansWrap: { gap: 10 },
  planCard: {
    borderRadius: 18,
    padding: 14,
  },
  planTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  planLeft: { flex: 1, gap: 4 },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },
  planName: { fontFamily: fonts.bold, fontSize: 15.5 },
  planBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  planBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#1c1a17",
    letterSpacing: 0.4,
  },
  planBadgeSoft: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  planBadgeSoftText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  planSub: { fontFamily: fonts.regular, fontSize: 12, paddingLeft: 27 },
  priceBox: { alignItems: "flex-end" },
  priceValue: { fontFamily: fonts.bold, fontSize: 19 },
  priceUnit: { fontFamily: fonts.medium, fontSize: 11 },

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
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 2,
  },
  legalLink: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  legalDot: { fontSize: 12 },
});
