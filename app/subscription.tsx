import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSubscription } from "@/components/SubscriptionProvider";
import { useColorScheme } from "@/components/useColorScheme";
import Colors, { fonts } from "@/constants/Colors";
import {
  HARDCODED_PLANS,
  type SubscriptionPlanId,
} from "@/constants/subscriptions";

export default function SubscriptionScreen() {
  const colors = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();

  const {
    isSupported,
    activePlan,
    isTrial,
    willRenew,
    expirationDate,
    isPurchasing,
    isRestoring,
    purchasePlan,
    restorePurchases,
    manageSubscriptions,
  } = useSubscription();

  const busy = isPurchasing || isRestoring;

  const currentTitle =
    activePlan === "lifetime"
      ? "Pockito Pro · Lifetime"
      : isTrial
        ? "Pockito Pro · 7-Day Free Trial"
        : "Pockito Pro · Monthly";

  const currentPrice =
    activePlan === "lifetime"
      ? `${HARDCODED_PLANS.lifetime.priceDisplay} ${HARDCODED_PLANS.lifetime.periodLabel}`
      : `${HARDCODED_PLANS.monthly.priceDisplay} ${HARDCODED_PLANS.monthly.periodLabel}`;

  const formattedExpiry = expirationDate
    ? new Date(expirationDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const handleSwitchPlan = async (plan: SubscriptionPlanId) => {
    if (busy || plan === activePlan || activePlan === "lifetime") return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (!isSupported) {
      Alert.alert(
        "iOS Build Required",
        "Plan upgrades require a native iOS development or App Store build.",
      );
      return;
    }

    try {
      const result = await purchasePlan(plan);
      if (!result.cancelled) {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
        if (plan === "lifetime") {
          Alert.alert(
            "Upgraded to Lifetime Pro",
            "You now own Pockito Pro forever. Remember to cancel your monthly subscription renewal in App Store settings if needed.",
          );
        }
        router.back();
      }
    } catch (err) {
      Alert.alert(
        "Purchase Failed",
        err instanceof Error
          ? err.message
          : "Unable to switch plan. Please try again.",
      );
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    Haptics.selectionAsync().catch(() => {});
    try {
      const { restored } = await restorePurchases();
      Alert.alert(
        restored ? "Purchases Restored" : "No Changes",
        restored
          ? "Your Pockito Pro subscription is up to date."
          : "No additional active purchases were found.",
      );
    } catch (err) {
      Alert.alert(
        "Restore Failed",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.sheet }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: 20, paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(280)}
          style={styles.headerTop}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>
              Subscription
            </Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>
              Your current plan details &amp; available options
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.back();
            }}
            hitSlop={10}
            style={[
              styles.closeBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </Animated.View>

        {/* Current Plan Hero Details */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(300)}
          style={[styles.heroCard, { backgroundColor: colors.darkCard }]}
        >
          <View style={styles.heroTop}>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: "rgba(74,222,128,0.16)" },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: "#4ade80" }]}
              />
              <Text style={styles.statusPillText}>
                {isTrial ? "7-DAY FREE TRIAL" : "ACTIVE PLAN"}
              </Text>
            </View>
            <Text style={[styles.heroPrice, { color: colors.accent }]}>
              {currentPrice}
            </Text>
          </View>

          <Text style={[styles.heroTitle, { color: colors.darkCardText }]}>
            {currentTitle}
          </Text>

          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.secondary }]}>
                Billing
              </Text>
              <Text style={[styles.detailValue, { color: colors.darkCardText }]}>
                {activePlan === "lifetime"
                  ? "Paid once · Never expires"
                  : isTrial
                    ? "$0.00 during trial, then $1.99/mo"
                    : willRenew
                      ? "Auto-renews monthly"
                      : "Cancels at period end"}
              </Text>
            </View>

            {formattedExpiry && activePlan !== "lifetime" && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.secondary }]}>
                  {isTrial
                    ? "Trial Ends"
                    : willRenew
                      ? "Next Renewal"
                      : "Expires On"}
                </Text>
                <Text
                  style={[styles.detailValue, { color: colors.darkCardText }]}
                >
                  {formattedExpiry}
                </Text>
              </View>
            )}

            {isTrial && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.secondary }]}>
                  Reminder
                </Text>
                <Text style={[styles.detailValue, { color: colors.accent }]}>
                  2 days before trial ends
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* All Plans */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(300)}
          style={styles.section}
        >
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            ALL PLANS
          </Text>

          {/* Monthly Plan */}
          <View
            style={[
              styles.planCard,
              {
                backgroundColor: colors.card,
                borderColor:
                  activePlan === "monthly" ? colors.tint : colors.cardBorder,
              },
            ]}
          >
            <View style={styles.planTop}>
              <View style={{ flex: 1 }}>
                <View style={styles.planTitleRow}>
                  <Text style={[styles.planName, { color: colors.text }]}>
                    {HARDCODED_PLANS.monthly.name}
                  </Text>
                  {activePlan === "monthly" && (
                    <View
                      style={[
                        styles.currentPill,
                        { backgroundColor: colors.accentSoft },
                      ]}
                    >
                      <Text
                        style={[styles.currentPillText, { color: colors.tint }]}
                      >
                        CURRENT
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.planSub, { color: colors.textMuted }]}>
                  7-day free trial for new users · Cancel anytime
                </Text>
              </View>
              <View style={styles.planPriceBox}>
                <Text style={[styles.planPrice, { color: colors.text }]}>
                  {HARDCODED_PLANS.monthly.priceDisplay}
                </Text>
                <Text style={[styles.planPeriod, { color: colors.textMuted }]}>
                  / month
                </Text>
              </View>
            </View>
          </View>

          {/* Lifetime Plan */}
          <Pressable
            disabled={busy || activePlan === "lifetime"}
            onPress={() => void handleSwitchPlan("lifetime")}
            style={({ pressed }) => [
              styles.planCard,
              {
                backgroundColor: colors.card,
                borderColor:
                  activePlan === "lifetime" ? colors.tint : colors.cardBorder,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={styles.planTop}>
              <View style={{ flex: 1 }}>
                <View style={styles.planTitleRow}>
                  <Text style={[styles.planName, { color: colors.text }]}>
                    {HARDCODED_PLANS.lifetime.name}
                  </Text>
                  {activePlan === "lifetime" ? (
                    <View
                      style={[
                        styles.currentPill,
                        { backgroundColor: colors.accentSoft },
                      ]}
                    >
                      <Text
                        style={[styles.currentPillText, { color: colors.tint }]}
                      >
                        CURRENT
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.upgradePill,
                        { backgroundColor: colors.accent },
                      ]}
                    >
                      <Text style={styles.upgradePillText}>UPGRADE</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.planSub, { color: colors.textMuted }]}>
                  One-time payment · Own Pockito Pro forever
                </Text>
              </View>
              <View style={styles.planPriceBox}>
                <Text style={[styles.planPrice, { color: colors.text }]}>
                  {HARDCODED_PLANS.lifetime.priceDisplay}
                </Text>
                <Text style={[styles.planPeriod, { color: colors.textMuted }]}>
                  one-time
                </Text>
              </View>
            </View>

            {activePlan !== "lifetime" && (
              <View
                style={[styles.upgradeBtn, { backgroundColor: colors.accent }]}
              >
                {isPurchasing ? (
                  <ActivityIndicator size="small" color="#1c1a17" />
                ) : (
                  <>
                    <Text style={styles.upgradeBtnText}>
                      Switch to Lifetime — $34.99
                    </Text>
                    <Ionicons name="arrow-forward" size={15} color="#1c1a17" />
                  </>
                )}
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* Utility Actions */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(300)}
          style={styles.actionsRow}
        >
          {activePlan !== "lifetime" && (
            <Pressable
              disabled={busy}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                void manageSubscriptions();
              }}
              style={[
                styles.utilityBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Ionicons
                name="settings-outline"
                size={16}
                color={colors.text}
              />
              <Text style={[styles.utilityBtnText, { color: colors.text }]}>
                App Store Settings
              </Text>
            </Pressable>
          )}
          <Pressable
            disabled={busy}
            onPress={() => void handleRestore()}
            style={[
              styles.utilityBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={colors.tint} />
            ) : (
              <>
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color={colors.tint}
                />
                <Text style={[styles.utilityBtnText, { color: colors.text }]}>
                  Restore Purchases
                </Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    gap: 18,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: { fontFamily: fonts.bold, fontSize: 28 },
  sub: { fontFamily: fonts.regular, fontSize: 13, marginTop: 1 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  heroCard: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: "#4ade80",
    letterSpacing: 0.6,
  },
  heroPrice: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  detailsList: {
    gap: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  detailLabel: { fontFamily: fonts.regular, fontSize: 13 },
  detailValue: { fontFamily: fonts.semiBold, fontSize: 13 },

  section: { gap: 10 },
  sectionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    paddingLeft: 4,
  },
  planCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  planTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  planName: { fontFamily: fonts.bold, fontSize: 15.5 },
  currentPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  currentPillText: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  upgradePill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  upgradePillText: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
    color: "#1c1a17",
    letterSpacing: 0.5,
  },
  planSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  planPriceBox: { alignItems: "flex-end" },
  planPrice: { fontFamily: fonts.bold, fontSize: 18 },
  planPeriod: { fontFamily: fonts.regular, fontSize: 11 },
  upgradeBtn: {
    height: 44,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  upgradeBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#1c1a17",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  utilityBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  utilityBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
});
