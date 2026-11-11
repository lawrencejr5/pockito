import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

type Range = "7D" | "30D" | "90D" | "180D";
const RANGES: Range[] = ["7D", "30D", "90D", "180D"];
const DAYS: Record<Range, number> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
  "180D": 180,
};

const WIDTH = 320;
const HEIGHT = 150;
const PAD_X = 4;
const PAD_TOP = 26;
const PAD_BOTTOM = 22;

/** Deterministic pseudo-random sequence so charts don't flicker between renders. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Placeholder balance series: flat stretches with sudden steps for deposits/spends. */
function buildSeries(range: Range): number[] {
  const n = DAYS[range];
  const rand = seeded(n * 17);
  const out: number[] = [];
  let balance = 84000;
  for (let i = 0; i < n; i++) {
    if (rand() > 0.82) {
      const delta = (rand() - 0.42) * 4200;
      balance += delta;
    }
    out.push(Math.round(balance * 100) / 100);
  }
  return out;
}

const money = (v: number) =>
  "$" +
  v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function CashflowChart() {
  const colors = Colors[useColorScheme()];
  const [range, setRange] = useState<Range>("7D");

  const { line, area, hi, lo, change } = useMemo(() => {
    const data = buildSeries(range);
    const max = Math.max(...data);
    const min = Math.min(...data);
    const span = max - min || 1;
    const innerW = WIDTH - PAD_X * 2;
    const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;
    const x = (i: number) => PAD_X + (i / (data.length - 1)) * innerW;
    const y = (v: number) => PAD_TOP + (1 - (v - min) / span) * innerH;

    // Stepped path: hold previous value, then jump vertically.
    let d = `M ${x(0)} ${y(data[0])}`;
    for (let i = 1; i < data.length; i++) {
      d += ` L ${x(i)} ${y(data[i - 1])} L ${x(i)} ${y(data[i])}`;
    }
    const baseY = HEIGHT - PAD_BOTTOM + 8;
    const areaPath = `${d} L ${x(data.length - 1)} ${baseY} L ${x(0)} ${baseY} Z`;
    const hiIdx = data.indexOf(max);
    const loIdx = data.indexOf(min);
    return {
      line: d,
      area: areaPath,
      hi: { v: max, x: x(hiIdx), y: y(max) },
      lo: { v: min, x: x(loIdx), y: y(min) },
      change: data[data.length - 1] - data[0],
    };
  }, [range]);

  const clampX = (v: number) => Math.min(Math.max(v, 36), WIDTH - 36);

  return (
    <View style={[styles.card, { backgroundColor: colors.darkCard }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.secondary }]}>
            Cashflow
          </Text>
          <Text style={[styles.sub, { color: colors.darkCardText }]}>
            Net {change >= 0 ? "+" : "-"}
            {money(Math.abs(change))}
          </Text>
        </View>
        <Text
          style={{
            color: change >= 0 ? "#4ade80" : "#f87171",
            fontWeight: "600",
          }}
        >
          {change >= 0 ? "Money in" : "Money out"}
        </Text>
      </View>

      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Defs>
          <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.chartLine} stopOpacity={0.32} />
            <Stop offset="1" stopColor={colors.chartLine} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#fill)" />
        <Path
          d={line}
          fill="none"
          stroke={colors.chartLine}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <SvgText
          x={clampX(hi.x)}
          y={Math.max(hi.y - 8, 12)}
          fill={colors.secondary}
          fontSize={11}
          textAnchor="middle"
        >
          {money(hi.v)}
        </SvgText>
        <SvgText
          x={clampX(lo.x)}
          y={Math.min(lo.y + 16, HEIGHT - 4)}
          fill={colors.secondary}
          fontSize={11}
          textAnchor="middle"
        >
          {money(lo.v)}
        </SvgText>
      </Svg>

      <View style={styles.ranges}>
        {RANGES.map((r) => {
          const active = r === range;
          return (
            <Pressable
              key={r}
              onPress={() => setRange(r)}
              style={[
                styles.range,
                active && { backgroundColor: "rgba(232,210,181,0.18)" },
              ]}
            >
              <Text
                style={{
                  color: active ? colors.accent : colors.secondary,
                  fontWeight: "600",
                }}
              >
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
  card: { borderRadius: 24, padding: 18 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { fontSize: 13 },
  sub: { fontSize: 22, fontWeight: "700", marginTop: 2 },
  ranges: { flexDirection: "row", gap: 8, marginTop: 8 },
  range: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
});
