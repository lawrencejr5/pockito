import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useCurrency } from '@/components/CurrencyProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';
import type { CategoryStat } from '@/lib/reportStats';

const RING_SIZE = 108;
const STROKE = 14;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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

  if (categories.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.title, { color: colors.text }]}>Spending by Category</Text>
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          No expenses recorded in this period.
        </Text>
      </View>
    );
  }

  let offset = 0;

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(18)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Spending by Category</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {categories.length} {categories.length === 1 ? 'category' : 'categories'}
        </Text>
      </View>

      <View style={styles.ringRow}>
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
              const dashOffset = -offset;
              offset += arcLen;
              return (
                <Circle
                  key={item.category.id}
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  stroke={item.category.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${arcLen} ${CIRCUMFERENCE}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  rotation={-90}
                  origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                  fill="none"
                />
              );
            })}
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={[styles.ringLabel, { color: colors.textMuted }]}>Total</Text>
            <Text
              style={[styles.ringValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {format(totalExpenseUsd)}
            </Text>
          </View>
        </View>

        <View style={styles.legend}>
          {categories.slice(0, 3).map((item) => (
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
        </View>
      </View>

      <View style={styles.list}>
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
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontFamily: fonts.bold, fontSize: 16 },
  subtitle: { fontFamily: fonts.medium, fontSize: 12 },
  empty: { fontFamily: fonts.regular, fontSize: 13, paddingVertical: 8 },

  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
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
    paddingHorizontal: 14,
  },
  ringLabel: { fontFamily: fonts.medium, fontSize: 10 },
  ringValue: { fontFamily: fonts.bold, fontSize: 13 },

  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { flex: 1, fontFamily: fonts.medium, fontSize: 13 },
  legendPct: { fontFamily: fonts.semiBold, fontSize: 12 },

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

