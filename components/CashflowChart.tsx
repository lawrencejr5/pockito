import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { useCurrency } from '@/components/CurrencyProvider';
import { useTransactions, type Transaction } from '@/components/TransactionsProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type Range = '7D' | '30D' | '90D' | '180D';
const RANGES: Range[] = ['7D', '30D', '90D', '180D'];
const DAYS: Record<Range, number> = { '7D': 7, '30D': 30, '90D': 90, '180D': 180 };
const MS_PER_DAY = 86_400_000;

const WIDTH = 340;
const PAD_X = 6;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Reconstructs daily ending balances over `range` by walking backwards from
 * `currentBalanceUsd` using the signed transaction amounts.
 */
function buildSeries(
  range: Range,
  transactions: Transaction[],
  currentBalanceUsd: number,
): number[] {
  const n = DAYS[range];
  const dailyDelta = new Array<number>(n).fill(0);
  const todayMs = startOfDay(new Date());

  for (const t of transactions) {
    const txMs = startOfDay(new Date(t.date));
    const daysAgo = Math.round((todayMs - txMs) / MS_PER_DAY);
    if (daysAgo >= 0 && daysAgo < n) {
      const signed = t.type === 'income' ? t.amountUsd : -t.amountUsd;
      dailyDelta[n - 1 - daysAgo] += signed;
    }
  }

  const series = new Array<number>(n);
  series[n - 1] = currentBalanceUsd;
  for (let i = n - 2; i >= 0; i--) {
    series[i] = series[i + 1] - dailyDelta[i + 1];
  }
  return series;
}

type CashflowChartProps = {
  variant?: 'hero' | 'card';
  currentBalanceUsd?: number;
};

export function CashflowChart({
  variant = 'hero',
  currentBalanceUsd,
}: CashflowChartProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { format } = useCurrency();
  const { transactions } = useTransactions();
  const [range, setRange] = useState<Range>('7D');
  const isHero = variant === 'hero';
  const height = isHero ? 96 : 140;
  const padTop = isHero ? 20 : 24;
  const padBottom = isHero ? 18 : 20;

  const revealWidth = useSharedValue(0);

  const playReveal = useCallback(() => {
    revealWidth.value = 0;
    revealWidth.value = withTiming(WIDTH, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
  }, [revealWidth]);

  // Re-draw the line whenever the user switches to this tab.
  useFocusEffect(
    useCallback(() => {
      playReveal();
    }, [playReveal]),
  );

  const clipProps = useAnimatedProps(() => ({
    width: revealWidth.value,
  }));

  const { line, area, hi, lo, change, isFlat } = useMemo(() => {
    const endBalance =
      currentBalanceUsd ??
      transactions.reduce(
        (sum, t) => sum + (t.type === 'income' ? t.amountUsd : -t.amountUsd),
        0,
      );
    const data = buildSeries(range, transactions, endBalance);
    const max = Math.max(...data);
    const min = Math.min(...data);
    const flat = max === min;
    const span = max - min || 1;
    const innerW = WIDTH - PAD_X * 2;
    const innerH = height - padTop - padBottom;
    const x = (i: number) => PAD_X + (i / (data.length - 1)) * innerW;
    const y = (v: number) =>
      flat ? padTop + innerH / 2 : padTop + (1 - (v - min) / span) * innerH;

    // Stepped path: hold previous value, then jump vertically.
    let d = `M ${x(0)} ${y(data[0])}`;
    for (let i = 1; i < data.length; i++) {
      d += ` L ${x(i)} ${y(data[i - 1])} L ${x(i)} ${y(data[i])}`;
    }
    const baseY = height - padBottom + 6;
    const areaPath = `${d} L ${x(data.length - 1)} ${baseY} L ${x(0)} ${baseY} Z`;
    return {
      line: d,
      area: areaPath,
      hi: { v: max, x: x(data.indexOf(max)), y: y(max) },
      lo: { v: min, x: x(data.indexOf(min)), y: y(min) },
      change: data[data.length - 1] - data[0],
      isFlat: flat,
    };
  }, [range, transactions, currentBalanceUsd, height, padTop, padBottom]);

  const clampX = (v: number) => Math.min(Math.max(v, 44), WIDTH - 44);
  const strokeColor = isHero ? colors.heroChartLine : colors.chartLine;
  const labelColor = isHero ? colors.heroMuted : colors.secondary;
  const activeBg = isHero
    ? scheme === 'dark'
      ? 'rgba(232,210,181,0.18)'
      : 'rgba(28,26,23,0.10)'
    : 'rgba(232,210,181,0.18)';

  return (
    <View style={[isHero ? styles.hero : styles.card, !isHero && { backgroundColor: colors.darkCard }]}>
      {!isHero && (
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.secondary }]}>Cashflow</Text>
            <Text style={[styles.sub, { color: colors.darkCardText }]}>
              Net {format(change, { sign: true })}
            </Text>
          </View>
        </View>
      )}

      <Svg width="100%" height={height} viewBox={`0 0 ${WIDTH} ${height}`}>
        <Defs>
          <LinearGradient id="cashflowFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={strokeColor} stopOpacity={isHero ? 0.2 : 0.3} />
            <Stop offset="1" stopColor={strokeColor} stopOpacity={0} />
          </LinearGradient>
          <ClipPath id="cashflowReveal">
            <AnimatedRect x={0} y={0} height={height} animatedProps={clipProps} />
          </ClipPath>
        </Defs>
        <G clipPath="url(#cashflowReveal)">
          <Path d={area} fill="url(#cashflowFill)" />
          <Path d={line} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinejoin="round" />
          <SvgText
            x={clampX(hi.x)}
            y={Math.max(hi.y - 6, 11)}
            fill={labelColor}
            fontSize={10}
            fontFamily={fonts.medium}
            textAnchor="middle">
            {format(hi.v)}
          </SvgText>
          {!isFlat && (
            <SvgText
              x={clampX(lo.x)}
              y={Math.min(lo.y + 14, height - 3)}
              fill={labelColor}
              fontSize={10}
              fontFamily={fonts.medium}
              textAnchor="middle">
              {format(lo.v)}
            </SvgText>
          )}
        </G>
      </Svg>

      <View style={styles.ranges}>
        {RANGES.map((r) => {
          const active = r === range;
          return (
            <Pressable
              key={r}
              onPress={() => {
                setRange(r);
                playReveal();
              }}
              hitSlop={6}
              style={[styles.range, active && { backgroundColor: activeBg }]}>
              <Text
                style={[
                  styles.rangeLabel,
                  {
                    color: active ? (isHero ? colors.heroText : colors.accent) : labelColor,
                    fontFamily: active ? fonts.semiBold : fonts.medium,
                  },
                ]}>
                {r}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%' },
  card: { borderRadius: 24, padding: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 13, fontFamily: fonts.medium },
  sub: { fontSize: 20, fontFamily: fonts.bold, marginTop: 2 },
  ranges: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 6 },
  range: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999 },
  rangeLabel: { fontSize: 12 },
});
