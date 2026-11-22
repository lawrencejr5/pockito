import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { useCurrency } from "@/components/CurrencyProvider";
import { useColorScheme } from "@/components/useColorScheme";
import Colors, { fonts } from "@/constants/Colors";
import type { BudgetStatus, HomeBudgetSelection } from "@/lib/budgets";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 40;
const RING_STROKE = 3.5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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

  const targetPct = selection
    ? selection.primary.spentUsd > 0
      ? Math.max(selection.primary.clampedPercent, 3)
      : 0
    : 0;
  const progress = useSharedValue(targetPct);

  useEffect(() => {
    progress.value = withTiming(targetPct, {
      duration: 450,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetPct, progress]);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset:
      RING_CIRCUMFERENCE * (1 - Math.min(Math.max(progress.value, 0), 100) / 100),
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
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={styles.emptyRingWrap}>
          <Svg width={30} height={30}>
            <Circle
              cx={15}
              cy={15}
              r={12}
              stroke={colors.accentSoft}
              strokeWidth={3}
              fill="none"
            />
            <Circle
              cx={15}
              cy={15}
              r={12}
              stroke={colors.tint}
              strokeWidth={3}
              strokeDasharray={`${12 * Math.PI * 0.7} ${12 * Math.PI * 2}`}
              strokeLinecap="round"
              rotation={-90}
              origin="15, 15"
              fill="none"
            />
          </Svg>
        </View>
        <Text style={[styles.title, { color: colors.text, flex: 1 }]} numberOfLines={1}>
          Set a budget
        </Text>
        <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
          Tap to add
        </Text>
        <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
      </Pressable>
    );
  }

  const { primary, extraCount } = selection;
  const singleCategory =
    primary.categories.length === 1 ? primary.categories[0] : null;
  const statusColor = getBudgetStatusColor(
    primary.status,
    scheme,
    colors.tint,
    colors.expense,
  );
  const ringColor = getBudgetStatusColor(
    primary.status,
    scheme,
    singleCategory ? singleCategory.color : colors.accent,
    colors.expense,
  );

  const pctRounded = Math.round(primary.percent);
  const pctLabel = pctRounded > 999 ? "999%" : `${pctRounded}%`;
  const isOver = primary.remainingUsd < 0;

  const metaTag = primary.isGeneral
    ? "All expenses"
    : primary.title === primary.scopeLabel
      ? primary.periodShortLabel
      : primary.scopeLabel;

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
      {/* Left circular progress ring */}
      <View style={styles.ringWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={colors.cardBorder}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={ringColor}
            strokeWidth={RING_STROKE}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeLinecap="round"
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            fill="none"
            animatedProps={animatedCircleProps}
          />
        </Svg>
        <View style={styles.ringCenter} pointerEvents="none">
          <Text
            style={[
              styles.ringPct,
              {
                color: primary.status === "ok" ? colors.text : statusColor,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {pctLabel}
          </Text>
        </View>
      </View>

      {/* Right compact 2-line info */}
      <View style={styles.body}>
        <View style={styles.line}>
          <View style={styles.titleRow}>
            {singleCategory ? (
              <Ionicons
                name={singleCategory.icon}
                size={13}
                color={singleCategory.color}
              />
            ) : !primary.isGeneral ? (
              <View style={styles.multiDots}>
                {primary.categories.slice(0, 3).map((c) => (
                  <View
                    key={c.id}
                    style={[styles.miniDot, { backgroundColor: c.color }]}
                  />
                ))}
              </View>
            ) : null}
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {primary.title}
            </Text>
            {extraCount > 0 && (
              <View
                style={[styles.morePill, { backgroundColor: colors.accentSoft }]}
              >
                <Text style={[styles.moreText, { color: colors.tint }]}>
                  +{extraCount}
                </Text>
              </View>
            )}
          </View>

          <Text
            style={[
              styles.remainText,
              { color: primary.status === "ok" ? colors.text : statusColor },
            ]}
            numberOfLines={1}
          >
            {isOver
              ? `${format(Math.abs(primary.remainingUsd))} over`
              : `${format(primary.remainingUsd)} left`}
          </Text>
        </View>

        <View style={styles.line}>
          <Text style={[styles.subText, { color: colors.textMuted }]} numberOfLines={1}>
            {format(primary.spentUsd)} / {format(primary.limitUsd)} · {metaTag}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 11,
  },
  emptyRingWrap: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    position: "absolute",
    inset: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  ringPct: {
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  multiDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    flexShrink: 1,
  },
  morePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  moreText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
  },
  remainText: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
  },
  subText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    flex: 1,
  },
});
