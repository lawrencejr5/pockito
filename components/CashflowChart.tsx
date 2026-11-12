import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { useCurrency } from '@/components/CurrencyProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';

type Range = '7D' | '30D' | '90D' | '180D';
const RANGES: Range[] = ['7D', '30D', '90D', '180D'];

const WIDTH = 340;
const PAD_X = 6;

/** Deterministic pseudo-random sequence so charts don't change between renders. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Dummy balance series in USD. 7D is hand-shaped so it always shows ups and downs;
 * longer ranges use stepped deposits/spends with a gentle upward trend.
 */
function buildSeries(range: Range): number[] {
  if (range === '7D') {
    return [84200, 84200, 86900, 85600, 85600, 88300, 87457];
  }
  const n = range === '30D' ? 30 : range === '90D' ? 90 : 180;
  const rand = seeded(n * 31 + 7);
  const out: number[] = [];
  let balance = 78000;
  let hold = 0;
  for (let i = 0; i < n; i++) {
    if (hold === 0) {
      const up = rand() > 0.42;
      balance += (up ? 1 : -1) * (800 + rand() * 3600);
      hold = 1 + Math.floor(rand() * 3);
    } else {
      hold -= 1;
    }
    out.push(Math.round(balance));
  }
  // End on today's balance.
  out[n - 1] = 87457;
  return out;
}

type CashflowChartProps = {
  variant?: 'hero' | 'card';
};

export function CashflowChart({ variant = 'hero' }: CashflowChartProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { format } = useCurrency();
  const [range, setRange] = useState<Range>('7D');
  const isHero = variant === 'hero';
  const height = isHero ? 96 : 140;
  const padTop = isHero ? 20 : 24;
  const padBottom = isHero ? 18 : 20;

  const { line, area, hi, lo, change } = useMemo(() => {
    const data = buildSeries(range);
    const max = Math.max(...data);
    const min = Math.min(...data);
    const span = max - min || 1;
    const innerW = WIDTH - PAD_X * 2;
    const innerH = height - padTop - padBottom;
    const x = (i: number) => PAD_X + (i / (data.length - 1)) * innerW;
    const y = (v: number) => padTop + (1 - (v - min) / span) * innerH;

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
    };
  }, [range, height, padTop, padBottom]);

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
        </Defs>
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
        <SvgText
          x={clampX(lo.x)}
          y={Math.min(lo.y + 14, height - 3)}
          fill={labelColor}
          fontSize={10}
          fontFamily={fonts.medium}
          textAnchor="middle">
          {format(lo.v)}
        </SvgText>
      </Svg>

      <View style={styles.ranges}>
        {RANGES.map((r) => {
          const active = r === range;
          return (
            <Pressable
              key={r}
              onPress={() => setRange(r)}
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
