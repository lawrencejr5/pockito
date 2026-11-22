import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useCurrency } from "@/components/CurrencyProvider";
import { useColorScheme } from "@/components/useColorScheme";
import Colors, { fonts } from "@/constants/Colors";
import type { BudgetStatus, HomeBudgetSelection } from "@/lib/budgets";

export function getBudgetStatusColor(
  status: BudgetStatus,
  scheme: "light" | "dark",
  fallbackAccent: string,
  expenseColor: string,
): string {
  if (status === "exceeded") return expenseColor;
  if (status === "warning") return scheme === "dark" ? "#fbbf24" : "#d97706";
  return fallbackAccent;
}

type Props = {
  selection: HomeBudgetSelection | null;
};

export function BudgetHomeCard({ selection }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { format } = useCurrency();

  const barPct = useSharedValue(selection ? selection.primary.clampedPercent : 0);

  useEffect(() => {
    barPct.value = withTiming(
      selection ? Math.max(selection.primary.clampedPercent, selection.primary.spentUsd > 0 ? 3 : 0) : 0,
      { duration: 420 },
    );
  }, [selection, barPct]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${barPct.value}%`,
  }));

  const handleOpen = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push("/budget");
  };

  if (!selection) {
    return (
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [
          styles.card,
          styles.emptyCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={[styles.iconBadge, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="pie-chart-outline" size={18} color={colors.tint} />
        </View>
        <View style={styles.emptyBody}>
          <Text style={[styles.title, { color: colors.text }]}>Set a budget</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            Track daily, weekly, or monthly limits
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>
    );
  }

  const { primary, extraCount } = selection;
  const statusColor = getBudgetStatusColor(
    primary.status,
    scheme,
    colors.tint,
    colors.expense,
  );
  const barColor = getBudgetStatusColor(
    primary.status,
    scheme,
    colors.accent,
    colors.expense,
  );
  const pctLabel = `${Math.round(primary.percent)}%`;
  const isOver = primary.remainingUsd < 0;

  return (
    <Pressable
      onPress={handleOpen}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor:
            primary.status === "exceeded"
              ? colors.expense + "55"
              : primary.status === "warning"
                ? statusColor + "55"
                : colors.cardBorder,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <View style={[styles.dot, { backgroundColor: barColor }]} />
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {primary.title}
          </Text>
          {extraCount > 0 && (
            <View
              style={[
                styles.morePill,
                { backgroundColor: colors.accentSoft },
              ]}
            >
              <Text style={[styles.moreText, { color: colors.tint }]}>
                +{extraCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.rightTop}>
          <View
            style={[
              styles.pctPill,
              {
                backgroundColor:
                  primary.status === "ok"
                    ? colors.accentSoft
                    : statusColor + "22",
              },
            ]}
          >
            <Text style={[styles.pctText, { color: statusColor }]}>
              {pctLabel}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
        </View>
      </View>

      <View style={[styles.track, { backgroundColor: colors.cardBorder }]}>
        <Animated.View
          style={[styles.fill, { backgroundColor: barColor }, fillStyle]}
        />
      </View>

      <View style={styles.bottomRow}>
        <Text style={[styles.spentText, { color: colors.textMuted }]} numberOfLines={1}>
          {format(primary.spentUsd)} of {format(primary.limitUsd)}
        </Text>
        <Text
          style={[
            styles.remainText,
            {
              color:
                primary.status === "ok" ? colors.text : statusColor,
            },
          ]}
          numberOfLines={1}
        >
          {isOver
            ? `${format(Math.abs(primary.remainingUsd))} over`
            : `${format(primary.remainingUsd)} left`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBody: {
    flex: 1,
    gap: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  titleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    flexShrink: 1,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  morePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  moreText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
  },
  rightTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pctPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pctText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  track: {
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  spentText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    flexShrink: 1,
  },
  remainText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
});
