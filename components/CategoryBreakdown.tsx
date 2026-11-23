import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useCurrency } from '@/components/CurrencyProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';
import type { CategoryStat } from '@/lib/reportStats';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 164;
const STROKE = 20;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function AnimatedPieSlice({
  arcLen,
  startOffset,
  color,
  progress,
}: {
  arcLen: number;
  startOffset: number;
  color: string;
  progress: { value: number };
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: `${Math.max(0.01, progress.value * arcLen)} ${CIRCUMFERENCE}`,
    strokeDashoffset: -startOffset * progress.value,
  }));

  return (
    <AnimatedCircle
      cx={RING_SIZE / 2}
      cy={RING_SIZE / 2}
      r={RADIUS}
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="butt"
      rotation={-90}
      origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
      fill="none"
      animatedProps={animatedProps}
    />
  );
}

function AnimatedBar({ percent, color, trackColor }: { percent: number; color: string; trackColor: string }) {
  const widthPct = useSharedValue(0);

  useEffect(() => {
    widthPct.value = withTiming(Math.min(Math.max(percent, 2), 100), { duration: 450 });
  }, [percent, widthPct]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthPct.value}%`,
  }));

  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
    </View>
  );
}

type Props = {
  categories: CategoryStat[];
  totalExpenseUsd: number;
};

export function CategoryBreakdown({ categories, totalExpenseUsd }: Props) {
  const colors = Colors[useColorScheme()];
  const { format } = useCurrency();
  const [expanded, setExpanded] = useState(false);

  const pieProgress = useSharedValue(0);
  const categoriesKey = categories.map((c) => `${c.category.id}:${c.amountUsd}`).join('|');

  useEffect(() => {
    pieProgress.value = 0;
    pieProgress.value = withDelay(
      80,
      withTiming(1, { duration: 850, easing: Easing.out(Easing.cubic) }),
    );
  }, [categoriesKey, pieProgress]);

  if (categories.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          No expenses recorded in this period.
        </Text>
      </View>
    );
  }

  let offset = 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.ringSection}>
        <View style={styles.ringWrap}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={colors.cardBorder}
              strokeWidth={STROKE}
              fill="none"
            />
            {categories.map((item) => {
              const arcLen = (item.percent / 100) * CIRCUMFERENCE;
              const startOffset = offset;
              offset += arcLen;
              return (
                <AnimatedPieSlice
                  key={item.category.id}
                  arcLen={arcLen}
                  startOffset={startOffset}
                  color={item.category.color}
                  progress={pieProgress}
                />
              );
            })}
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={[styles.ringLabel, { color: colors.textMuted }]}>Total Spent</Text>
            <Text
              style={[styles.ringValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {format(totalExpenseUsd)}
            </Text>
            <Text style={[styles.ringSub, { color: colors.textMuted }]}>
              {categories.length} {categories.length === 1 ? 'category' : 'categories'}
            </Text>
          </View>
        </View>

        <View style={styles.legendWrap}>
          {categories.slice(0, 6).map((item) => (
            <View key={item.category.id} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: item.category.color }]} />
              <Text style={[styles.legendName, { color: colors.text }]} numberOfLines={1}>
                {item.category.label}
              </Text>
              <Text style={[styles.legendPct, { color: colors.textMuted }]}>
                {Math.round(item.percent)}%
              </Text>
            </View>
          ))}
          {categories.length > 6 && (
            <Text style={[styles.legendMore, { color: colors.textMuted }]}>
              +{categories.length - 6} more
            </Text>
          )}
        </View>
      </View>

      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          setExpanded((prev) => !prev);
        }}
        style={({ pressed }) => [
          styles.toggleBtn,
          {
            backgroundColor: colors.sheet,
            borderColor: colors.cardBorder,
            opacity: pressed ? 0.75 : 1,
          },
        ]}>
        <Text style={[styles.toggleText, { color: colors.text }]}>
          {expanded ? 'Hide breakdown' : 'See breakdown'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textMuted}
        />
      </Pressable>

      {expanded && (
        <Animated.View
          entering={FadeInDown.duration(220)}
          exiting={FadeOut.duration(150)}
          style={styles.list}>
          {categories.map((item) => (
            <Animated.View key={item.category.id} entering={FadeIn.duration(250)} style={styles.row}>
              <View style={styles.rowTop}>
                <View style={styles.rowLeft}>
                  <View style={[styles.badge, { backgroundColor: item.category.color + '26' }]}>
                    <Ionicons name={item.category.icon} size={16} color={item.category.color} />
                  </View>
                  <View>
                    <Text style={[styles.catName, { color: colors.text }]}>{item.category.label}</Text>
                    <Text style={[styles.catCount, { color: colors.textMuted }]}>
                      {item.count} {item.count === 1 ? 'transaction' : 'transactions'}
                    </Text>
                  </View>
                </View>
                <View style={styles.rowRight}>
                  <Text style={[styles.catAmount, { color: colors.text }]}>
                    {format(item.amountUsd)}
                  </Text>
                  <Text style={[styles.catPct, { color: colors.textMuted }]}>
                    {item.percent.toFixed(0)}%
                  </Text>
                </View>
              </View>
              <AnimatedBar
                percent={item.percent}
                color={item.category.color}
                trackColor={colors.cardBorder}
              />
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  empty: { fontFamily: fonts.regular, fontSize: 13, paddingVertical: 8, textAlign: 'center' },

  ringSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    paddingHorizontal: 22,
    gap: 1,
  },
  ringLabel: { fontFamily: fonts.medium, fontSize: 10 },
  ringValue: { fontFamily: fonts.bold, fontSize: 18 },
  ringSub: { fontFamily: fonts.regular, fontSize: 10 },

  legendWrap: {
    flex: 1,
    gap: 7,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { flex: 1, fontFamily: fonts.medium, fontSize: 12 },
  legendPct: { fontFamily: fonts.semiBold, fontSize: 11 },
  legendMore: { fontFamily: fonts.regular, fontSize: 11, marginTop: 1 },

  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleText: { fontFamily: fonts.semiBold, fontSize: 13 },

  list: { gap: 14 },
  row: { gap: 6 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: { fontFamily: fonts.semiBold, fontSize: 14 },
  catCount: { fontFamily: fonts.regular, fontSize: 11 },
  rowRight: { alignItems: 'flex-end' },
  catAmount: { fontFamily: fonts.bold, fontSize: 14 },
  catPct: { fontFamily: fonts.regular, fontSize: 11 },

  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});

