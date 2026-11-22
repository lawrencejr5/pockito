import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';

import { useCurrency } from '@/components/CurrencyProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function useAnimatedCounter(target: number, duration = 850) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    const start = Date.now();
    let lastHapticAt = 0;
    let frame: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = Date.now();
      const elapsed = now - start;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));

      if (p < 1) {
        if (now - lastHapticAt >= 70) {
          lastHapticAt = now;
          Haptics.selectionAsync().catch(() => {});
        }
        frame = setTimeout(tick, 24);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    };
    tick();
    return () => clearTimeout(frame);
  }, [target, duration]);

  return val;
}

/**
 * Step 1 Showcase: Mirrors Home (app/(tabs)/index.tsx) Hero + Cashflow Chart + Income/Expense cards.
 */
export function MoneyTrackingShowcase() {
  const colors = Colors[useColorScheme()];
  const { format, currency } = useCurrency();
  const animatedBalance = useAnimatedCounter(12480, 900);

  const lineLen = 340;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      120,
      withTiming(1, { duration: 950, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress]);

  const lineAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: lineLen * (1 - progress.value),
  }));

  const curvePath = 'M 10 74 C 55 70, 88 38, 134 46 C 180 54, 214 18, 266 14';
  const areaPath = `${curvePath} L 266 90 L 10 90 Z`;

  return (
    <View style={styles.wrap}>
      {/* Hero Card Preview */}
      <Animated.View
        entering={FadeInDown.duration(320)}
        style={[styles.heroCard, { backgroundColor: colors.darkCard }]}>
        <View style={styles.heroTopRow}>
          <View style={[styles.monthPill, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={[styles.monthPillText, { color: colors.darkCardText }]}>
              This month
            </Text>
            <Ionicons name="chevron-down" size={12} color={colors.darkCardText} />
          </View>
          <View style={[styles.currencyBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.currencyBadgeText}>{currency.code}</Text>
          </View>
        </View>

        <View style={styles.balanceCenter}>
          <Text style={[styles.balanceLabel, { color: colors.secondary }]}>
            Current Balance
          </Text>
          <Text
            style={[styles.balanceAmount, { color: colors.darkCardText }]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {format(animatedBalance)}
          </Text>
        </View>

        {/* Animated Cashflow Spline */}
        <View style={styles.chartBox}>
          <Svg width={276} height={92} viewBox="0 0 276 92">
            <Defs>
              <LinearGradient id="onbHeroGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.32" />
                <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Path d={areaPath} fill="url(#onbHeroGrad)" />
            <AnimatedPath
              d={curvePath}
              fill="none"
              stroke={colors.accent}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={`${lineLen} ${lineLen}`}
              animatedProps={lineAnimatedProps}
            />
            <Circle cx={266} cy={14} r={5} fill={colors.accent} />
          </Svg>
        </View>
      </Animated.View>

      {/* Income & Expense Split */}
      <Animated.View
        entering={FadeInDown.delay(140).duration(320)}
        style={styles.splitRow}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <View style={styles.statTop}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(46,158,107,0.15)' }]}>
              <Ionicons name="arrow-down" size={14} color={colors.income} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Income</Text>
          </View>
          <Text style={[styles.statVal, { color: colors.text }]} numberOfLines={1}>
            {format(4200)}
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <View style={styles.statTop}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(217,83,79,0.15)' }]}>
              <Ionicons name="arrow-up" size={14} color={colors.expense} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Expense</Text>
          </View>
          <Text style={[styles.statVal, { color: colors.text }]} numberOfLines={1}>
            {format(1350)}
          </Text>
        </View>
      </Animated.View>

      {/* Sample Transaction Rows */}
      <Animated.View
        entering={FadeInDown.delay(240).duration(320)}
        style={[
          styles.txRow,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}>
        <View style={[styles.txIcon, { backgroundColor: 'rgba(34,197,94,0.16)' }]}>
          <Ionicons name="cash-outline" size={16} color="#22c55e" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.txTitle, { color: colors.text }]}>Salary Deposit</Text>
          <Text style={[styles.txSub, { color: colors.textMuted }]}>Salary · Today</Text>
        </View>
        <Text style={[styles.txAmt, { color: colors.income }]}>
          {format(3800, { sign: true })}
        </Text>
      </Animated.View>
    </View>
  );
}

/**
 * Step 2 Showcase: Mirrors Wealth (app/(tabs)/wealth.tsx) Semi-Circle Net Worth Gauge + Stacked Groups.
 */
export function WealthBalanceSheetShowcase() {
  const colors = Colors[useColorScheme()];
  const { format } = useCurrency();
  const animatedNetWorth = useAnimatedCounter(84500, 950);

  const gaugeWidth = 256;
  const gaugeStroke = 13;
  const gaugeRadius = (gaugeWidth - gaugeStroke) / 2;
  const gaugeCx = gaugeWidth / 2;
  const gaugeCy = gaugeRadius + gaugeStroke / 2;
  const gaugeHeight = gaugeCy + gaugeStroke / 2;
  const arcPath = `M ${gaugeCx - gaugeRadius} ${gaugeCy} A ${gaugeRadius} ${gaugeRadius} 0 0 1 ${gaugeCx + gaugeRadius} ${gaugeCy}`;
  const arcLen = Math.PI * gaugeRadius;
  const arcGap = 20;
  const usableArc = arcLen - arcGap;
  const assetArcLen = usableArc * 0.84;
  const liabArcLen = usableArc * 0.16;

  const divAngle = Math.PI * (1 - (assetArcLen + arcGap / 2) / arcLen);
  const divInnerR = gaugeRadius - gaugeStroke / 2 - 3;
  const divOuterR = gaugeRadius + gaugeStroke / 2 + 3;
  const divX1 = gaugeCx + divInnerR * Math.cos(divAngle);
  const divY1 = gaugeCy - divInnerR * Math.sin(divAngle);
  const divX2 = gaugeCx + divOuterR * Math.cos(divAngle);
  const divY2 = gaugeCy - divOuterR * Math.sin(divAngle);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      100,
      withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress]);

  const assetArcProps = useAnimatedProps(() => ({
    strokeDasharray: `${progress.value * assetArcLen} ${arcLen}`,
  }));

  const liabArcProps = useAnimatedProps(() => ({
    strokeDasharray: `${progress.value * liabArcLen} ${arcLen}`,
    strokeDashoffset: -(arcLen - progress.value * liabArcLen),
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View
        entering={FadeInDown.duration(320)}
        style={[styles.heroCard, { backgroundColor: colors.darkCard, alignItems: 'center' }]}>
        <View style={{ width: gaugeWidth, height: gaugeHeight }}>
          <Svg width={gaugeWidth} height={gaugeHeight}>
            <Path
              d={arcPath}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={gaugeStroke}
              strokeLinecap="round"
            />
            <Circle
              cx={gaugeCx - gaugeRadius}
              cy={gaugeCy}
              r={gaugeStroke / 2}
              fill="#2e9e6b"
            />
            <AnimatedPath
              d={arcPath}
              fill="none"
              stroke="#2e9e6b"
              strokeWidth={gaugeStroke}
              strokeLinecap="butt"
              animatedProps={assetArcProps}
            />
            <Circle
              cx={gaugeCx + gaugeRadius}
              cy={gaugeCy}
              r={gaugeStroke / 2}
              fill="rgba(248,113,113,0.75)"
            />
            <AnimatedPath
              d={arcPath}
              fill="none"
              stroke="rgba(248,113,113,0.75)"
              strokeWidth={gaugeStroke}
              strokeLinecap="butt"
              animatedProps={liabArcProps}
            />
            <Line
              x1={divX1}
              y1={divY1}
              x2={divX2}
              y2={divY2}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </Svg>

          <View style={styles.gaugeCenter}>
            <Text style={[styles.balanceLabel, { color: colors.secondary }]}>
              Total Net Worth
            </Text>
            <Text
              style={[styles.gaugeNetText, { color: colors.darkCardText }]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {format(animatedNetWorth)}
            </Text>
            <View style={styles.debtPill}>
              <Text style={styles.debtPillText}>16% debt</Text>
            </View>
          </View>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2e9e6b' }]} />
            <Text style={[styles.legendText, { color: colors.secondary }]}>
              Assets {format(98500)}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f87171' }]} />
            <Text style={[styles.legendText, { color: colors.secondary }]}>
              Liabilities {format(14000)}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Stacked Wealth Groups Preview */}
      <Animated.View
        entering={FadeInDown.delay(150).duration(320)}
        style={[
          styles.txRow,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}>
        <View style={[styles.txIcon, { backgroundColor: '#e6effe' }]}>
          <Ionicons name="trending-up-outline" size={17} color="#2563eb" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.txTitle, { color: colors.text }]}>Investments · 3 items</Text>
          <Text style={[styles.txSub, { color: colors.textMuted }]}>
            S&P 500 ETF · Treasury Bills
          </Text>
        </View>
        <Text style={[styles.txAmt, { color: colors.text }]}>{format(48500)}</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(230).duration(320)}
        style={[
          styles.txRow,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}>
        <View style={[styles.txIcon, { backgroundColor: '#ede9fe' }]}>
          <Ionicons name="home-outline" size={17} color="#7c3aed" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.txTitle, { color: colors.text }]}>
            Personal Balance Sheet
          </Text>
          <Text style={[styles.txSub, { color: colors.textMuted }]}>
            Auto-generated & ready to share
          </Text>
        </View>
        <Ionicons name="checkmark-circle" size={20} color="#2e9e6b" />
      </Animated.View>
    </View>
  );
}

function AnimatedBar({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  const widthVal = useSharedValue(0);

  useEffect(() => {
    widthVal.value = 0;
    widthVal.value = withDelay(
      delay,
      withTiming(pct, { duration: 650, easing: Easing.out(Easing.cubic) }),
    );

    const timer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, delay);

    return () => clearTimeout(timer);
  }, [pct, delay, widthVal]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthVal.value}%`,
  }));

  return (
    <View style={styles.catBarTrack}>
      <Animated.View style={[styles.catBarFill, { backgroundColor: color }, barStyle]} />
    </View>
  );
}

function AnimatedPieSlice({
  ringSize,
  radius,
  strokeWidth,
  circumference,
  arcLen,
  startOffset,
  color,
  progress,
}: {
  ringSize: number;
  radius: number;
  strokeWidth: number;
  circumference: number;
  arcLen: number;
  startOffset: number;
  color: string;
  progress: { value: number };
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: `${Math.max(0.01, progress.value * arcLen)} ${circumference}`,
    strokeDashoffset: -startOffset * progress.value,
  }));

  return (
    <AnimatedCircle
      cx={ringSize / 2}
      cy={ringSize / 2}
      r={radius}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="butt"
      rotation={-90}
      origin={`${ringSize / 2}, ${ringSize / 2}`}
      fill="none"
      animatedProps={animatedProps}
    />
  );
}

/**
 * Step 4 Showcase: Mirrors Report (app/report.tsx + components/CategoryBreakdown.tsx)
 * Period Bar + Donut Pie Chart & Legend + Key Metrics Grid.
 */
export function ReportsInsightsShowcase() {
  const colors = Colors[useColorScheme()];
  const { format } = useCurrency();
  const animatedTotalSpent = useAnimatedCounter(2260, 850);

  const pieProgress = useSharedValue(0);
  useEffect(() => {
    pieProgress.value = 0;
    pieProgress.value = withDelay(
      140,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [pieProgress]);

  const periods = ['7D', '30D', '90D', '1Y', 'ALL'] as const;
  const categories = [
    { label: 'Housing', pct: 42, amount: 950, color: '#f97316', icon: 'home-outline' as const },
    { label: 'Food & Dining', pct: 28, amount: 630, color: '#ef4444', icon: 'restaurant-outline' as const },
    { label: 'Shopping', pct: 18, amount: 410, color: '#ec4899', icon: 'bag-handle-outline' as const },
    { label: 'Transport', pct: 12, amount: 270, color: '#3b82f6', icon: 'car-outline' as const },
  ];

  const ringSize = 148;
  const strokeWidth = 18;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let runningOffset = 0;

  return (
    <View style={styles.wrap}>
      {/* Period Switcher Pill Bar */}
      <Animated.View
        entering={FadeInDown.duration(260)}
        style={[
          styles.reportPeriodBar,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}>
        {periods.map((p) => {
          const active = p === '30D';
          return (
            <View
              key={p}
              style={[
                styles.reportPeriodPill,
                active && { backgroundColor: colors.accent },
              ]}>
              <Text
                style={[
                  styles.reportPeriodText,
                  {
                    color: active ? '#1c1a17' : colors.textMuted,
                    fontFamily: active ? fonts.semiBold : fonts.medium,
                  },
                ]}>
                {p}
              </Text>
            </View>
          );
        })}
      </Animated.View>

      {/* Donut Pie Chart + Category Legend (Mirrors CategoryBreakdown.tsx) */}
      <Animated.View
        entering={FadeInDown.delay(90).duration(320)}
        style={[
          styles.reportPieCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}>
        <View style={styles.reportRingSection}>
          <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={ringSize} height={ringSize}>
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={colors.cardBorder}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {categories.map((cat) => {
                const arcLen = (cat.pct / 100) * circumference;
                const startOffset = runningOffset;
                runningOffset += arcLen;
                return (
                  <AnimatedPieSlice
                    key={cat.label}
                    ringSize={ringSize}
                    radius={radius}
                    strokeWidth={strokeWidth}
                    circumference={circumference}
                    arcLen={arcLen}
                    startOffset={startOffset}
                    color={cat.color}
                    progress={pieProgress}
                  />
                );
              })}
            </Svg>
            <View style={styles.reportRingCenter}>
              <Text style={[styles.reportRingLabel, { color: colors.textMuted }]}>
                Total Spent
              </Text>
              <Text
                style={[styles.reportRingVal, { color: colors.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {format(animatedTotalSpent)}
              </Text>
              <Text style={[styles.reportRingSub, { color: colors.textMuted }]}>
                {categories.length} categories
              </Text>
            </View>
          </View>

          <View style={styles.reportLegendCol}>
            {categories.map((cat) => (
              <View key={cat.label} style={styles.reportLegendRow}>
                <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                <Text
                  style={[styles.reportLegendName, { color: colors.text }]}
                  numberOfLines={1}>
                  {cat.label}
                </Text>
                <Text style={[styles.reportLegendPct, { color: colors.textMuted }]}>
                  {cat.pct}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* 2x2 Key Metrics Grid (Mirrors app/report.tsx) */}
      <Animated.View
        entering={FadeInDown.delay(180).duration(320)}
        style={styles.splitRow}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <View style={styles.statTop}>
            <View style={[styles.statIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="today-outline" size={14} color={colors.tint} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Daily Avg</Text>
          </View>
          <Text style={[styles.statVal, { color: colors.text }]}>{format(75)}</Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <View style={styles.statTop}>
            <View style={[styles.statIcon, { backgroundColor: '#f9731626' }]}>
              <Ionicons name="home-outline" size={14} color="#f97316" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Top Spend</Text>
          </View>
          <Text style={[styles.statVal, { color: colors.expense }]}>{format(950)}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * Step 3 Showcase: Mirrors Budgets (components/BudgetHomeCard.tsx + app/budget.tsx).
 */
export function BudgetingShowcase() {
  const colors = Colors[useColorScheme()];
  const { format } = useCurrency();

  const budgets = [
    {
      label: 'Food & Dining',
      spent: 310,
      limit: 500,
      pct: 62,
      color: '#ef4444',
      icon: 'restaurant-outline' as const,
      meta: 'Monthly · 12d left',
    },
    {
      label: 'Shopping',
      spent: 180,
      limit: 300,
      pct: 60,
      color: '#ec4899',
      icon: 'bag-handle-outline' as const,
      meta: 'Monthly · On track',
    },
    {
      label: 'Transport',
      spent: 95,
      limit: 120,
      pct: 79,
      color: '#fbbf24',
      icon: 'car-outline' as const,
      meta: 'Weekly · Careful',
    },
  ];

  return (
    <View style={styles.wrap}>
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[styles.heroCard, { backgroundColor: colors.darkCard }]}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={[styles.balanceLabel, { color: colors.secondary }]}>
              Monthly Spending Limit
            </Text>
            <Text style={[styles.reportNetText, { color: colors.darkCardText }]}>
              {format(585)} <Text style={[styles.budgetOfText, { color: colors.secondary }]}>/ {format(920)}</Text>
            </Text>
          </View>
          <View style={styles.debtPill}>
            <Text style={styles.debtPillText}>{format(335)} left</Text>
          </View>
        </View>

        <View style={styles.budgetHeroBarWrap}>
          <AnimatedBar pct={64} color={colors.accent} delay={120} />
          <View style={styles.budgetHeroMetaRow}>
            <Text style={[styles.legendText, { color: colors.secondary }]}>
              64% used this month
            </Text>
            <Text style={[styles.legendText, { color: '#4ade80' }]}>
              On track
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(130).duration(320)}
        style={[
          styles.catCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}>
        <Text style={[styles.catHeader, { color: colors.text }]}>Category Budgets</Text>
        {budgets.map((b, idx) => (
          <View key={b.label} style={styles.catItem}>
            <View style={styles.catRowTop}>
              <View style={styles.catLeft}>
                <Ionicons name={b.icon} size={14} color={b.color} />
                <Text style={[styles.catName, { color: colors.text }]}>{b.label}</Text>
              </View>
              <Text style={[styles.catMeta, { color: colors.textMuted }]}>
                {format(b.spent)} / {format(b.limit)}
              </Text>
            </View>
            <AnimatedBar pct={b.pct} color={b.color} delay={190 + idx * 80} />
            <Text style={[styles.budgetSubMeta, { color: colors.textMuted }]}>
              {b.meta}
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, width: '100%' },
  heroCard: {
    borderRadius: 22,
    padding: 16,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  monthPillText: { fontFamily: fonts.medium, fontSize: 11 },
  currencyBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  currencyBadgeText: { fontFamily: fonts.bold, fontSize: 11, color: '#1c1a17' },
  balanceCenter: { alignItems: 'center', gap: 2 },
  balanceLabel: { fontFamily: fonts.medium, fontSize: 12 },
  balanceAmount: { fontFamily: fonts.bold, fontSize: 30 },
  chartBox: { alignItems: 'center', marginTop: 2 },

  splitRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: { fontFamily: fonts.medium, fontSize: 12 },
  statVal: { fontFamily: fonts.bold, fontSize: 17 },

  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: { fontFamily: fonts.semiBold, fontSize: 14 },
  txSub: { fontFamily: fonts.regular, fontSize: 11, marginTop: 1 },
  txAmt: { fontFamily: fonts.bold, fontSize: 14 },

  gaugeCenter: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 2,
    alignItems: 'center',
    gap: 2,
  },
  gaugeNetText: { fontFamily: fonts.bold, fontSize: 26 },
  debtPill: {
    backgroundColor: 'rgba(74,222,128,0.16)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
  },
  debtPillText: { fontFamily: fonts.semiBold, fontSize: 11, color: '#4ade80' },
  legendRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 999 },
  legendText: { fontFamily: fonts.medium, fontSize: 11 },

  reportNetText: { fontFamily: fonts.bold, fontSize: 24, marginTop: 2 },
  catCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  catHeader: { fontFamily: fonts.bold, fontSize: 14 },
  catItem: { gap: 5 },
  catRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catName: { fontFamily: fonts.semiBold, fontSize: 13 },
  catMeta: { fontFamily: fonts.medium, fontSize: 12 },
  catBarTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(128,128,128,0.16)',
    overflow: 'hidden',
  },
  catBarFill: { height: '100%', borderRadius: 999 },
  budgetOfText: { fontFamily: fonts.medium, fontSize: 15 },
  budgetHeroBarWrap: { gap: 6 },
  budgetHeroMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetSubMeta: { fontFamily: fonts.regular, fontSize: 11 },

  reportPeriodBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  reportPeriodPill: {
    flex: 1,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportPeriodText: { fontSize: 12 },
  reportPieCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  reportRingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  reportRingCenter: {
    position: 'absolute',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 1,
  },
  reportRingLabel: { fontFamily: fonts.medium, fontSize: 10 },
  reportRingVal: { fontFamily: fonts.bold, fontSize: 16 },
  reportRingSub: { fontFamily: fonts.regular, fontSize: 10 },
  reportLegendCol: { flex: 1, gap: 8 },
  reportLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reportLegendName: { flex: 1, fontFamily: fonts.medium, fontSize: 12 },
  reportLegendPct: { fontFamily: fonts.semiBold, fontSize: 11 },
});

