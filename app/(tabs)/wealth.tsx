import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

import { useCurrency } from "@/components/CurrencyProvider";
import { FocusFadeIn } from "@/components/FocusFadeIn";
import { WealthGroupStack } from "@/components/WealthGroupStack";
import { useTransactions } from "@/components/TransactionsProvider";
import { useWealth, type WealthItem } from "@/components/WealthProvider";
import { useColorScheme } from "@/components/useColorScheme";
import Colors, { fonts } from "@/constants/Colors";
import {
  ASSET_CATEGORIES,
  LIABILITY_CATEGORIES,
  getWealthCategory,
  type WealthCategory,
} from "@/constants/wealth";
import {
  buildBalanceSheetHtml,
  buildBalanceSheetText,
  promptDocumentExport,
} from "@/lib/exports";

type ViewMode = "overview" | "balance-sheet";

type GroupedSection = {
  category: WealthCategory;
  items: {
    id: string;
    name: string;
    amountUsd: number;
    note?: string;
    raw?: WealthItem;
  }[];
  subtotalUsd: number;
};

export default function WealthScreen() {
  const colors = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();
  const { format, currency } = useCurrency();
  const { transactions } = useTransactions();
  const { items, includeCashBalance, setIncludeCashBalance } = useWealth();

  const [viewMode, setViewMode] = useState<ViewMode>("overview");

  // Derive live Pockito Cash Balance & 30-day Monthly Income from transactions
  const { pockitoCashUsd, monthlyIncomeUsd } = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let cash = 0;
    let income30d = 0;

    for (const t of transactions) {
      if (t.type === "income") {
        cash += t.amountUsd;
        if (+new Date(t.date) >= thirtyDaysAgo) {
          income30d += t.amountUsd;
        }
      } else {
        cash -= t.amountUsd;
      }
    }
    return { pockitoCashUsd: cash, monthlyIncomeUsd: income30d };
  }, [transactions]);

  // Split user items and compute totals & ratios
  const {
    assetItems,
    liabilityItems,
    totalAssetsUsd,
    totalLiabilitiesUsd,
    netWorthUsd,
    debtToAssetPct,
    liquidPct,
    assetGroups,
    liabilityGroups,
  } = useMemo(() => {
    const assets = items.filter((i) => i.kind === "asset");
    const liabilities = items.filter((i) => i.kind === "liability");

    const customAssetsUsd = assets.reduce((sum, i) => sum + i.amountUsd, 0);
    const cashAdditionUsd = includeCashBalance ? pockitoCashUsd : 0;
    const totalAssets = customAssetsUsd + cashAdditionUsd;
    const totalLiabilities = liabilities.reduce(
      (sum, i) => sum + i.amountUsd,
      0,
    );
    const netWorth = totalAssets - totalLiabilities;

    const debtRatio =
      totalAssets > 0
        ? Math.round((totalLiabilities / totalAssets) * 100)
        : totalLiabilities > 0
          ? 100
          : 0;

    const liquidAssetsUsd =
      assets.reduce((sum, i) => {
        const cat = getWealthCategory(i.categoryId, "asset");
        return cat.isLiquid ? sum + i.amountUsd : sum;
      }, 0) + cashAdditionUsd;

    const liquidRatio =
      totalAssets > 0
        ? Math.max(
            0,
            Math.min(100, Math.round((liquidAssetsUsd / totalAssets) * 100)),
          )
        : 0;

    // Group assets by category for Balance Sheet
    const aGroups: GroupedSection[] = [];
    for (const cat of ASSET_CATEGORIES) {
      const catItems: GroupedSection["items"] = [];
      if (cat.id === "cash" && includeCashBalance) {
        catItems.push({
          id: "pockito-cash",
          name: "Pockito Cash Balance",
          amountUsd: pockitoCashUsd,
          note: "Synced from transactions",
        });
      }
      for (const it of assets) {
        if (it.categoryId === cat.id) {
          catItems.push({
            id: it.id,
            name: it.name,
            amountUsd: it.amountUsd,
            note: it.note,
            raw: it,
          });
        }
      }
      if (catItems.length > 0) {
        aGroups.push({
          category: cat,
          items: catItems,
          subtotalUsd: catItems.reduce((s, x) => s + x.amountUsd, 0),
        });
      }
    }

    // Group liabilities by category for Balance Sheet
    const lGroups: GroupedSection[] = [];
    for (const cat of LIABILITY_CATEGORIES) {
      const catItems = liabilities
        .filter((it) => it.categoryId === cat.id)
        .map((it) => ({
          id: it.id,
          name: it.name,
          amountUsd: it.amountUsd,
          note: it.note,
          raw: it,
        }));
      if (catItems.length > 0) {
        lGroups.push({
          category: cat,
          items: catItems,
          subtotalUsd: catItems.reduce((s, x) => s + x.amountUsd, 0),
        });
      }
    }

    return {
      assetItems: assets,
      liabilityItems: liabilities,
      totalAssetsUsd: totalAssets,
      totalLiabilitiesUsd: totalLiabilities,
      netWorthUsd: netWorth,
      debtToAssetPct: debtRatio,
      liquidPct: liquidRatio,
      assetGroups: aGroups,
      liabilityGroups: lGroups,
    };
  }, [items, includeCashBalance, pockitoCashUsd]);

  const hasAssets = totalAssetsUsd > 0;
  const hasLiabilities = totalLiabilitiesUsd > 0;
  const grossTotal =
    Math.max(0, totalAssetsUsd) + Math.max(0, totalLiabilitiesUsd);
  const assetShare =
    grossTotal > 0 ? Math.max(0, totalAssetsUsd) / grossTotal : 1;

  // Semi-circle gauge geometry
  const gaugeWidth = 296;
  const gaugeStroke = 14;
  const gaugeRadius = (gaugeWidth - gaugeStroke) / 2;
  const gaugeCx = gaugeWidth / 2;
  const gaugeCy = gaugeRadius + gaugeStroke / 2;
  const gaugeHeight = gaugeCy + gaugeStroke / 2;
  const arcPath = `M ${gaugeCx - gaugeRadius} ${gaugeCy} A ${gaugeRadius} ${gaugeRadius} 0 0 1 ${gaugeCx + gaugeRadius} ${gaugeCy}`;
  const arcLen = Math.PI * gaugeRadius;
  const arcGap = hasAssets && hasLiabilities ? 22 : 0;
  const usableArc = Math.max(0, arcLen - arcGap);
  const assetArcLen =
    hasAssets && hasLiabilities
      ? Math.max(12, Math.min(usableArc - 12, usableArc * assetShare))
      : hasAssets || !hasLiabilities
        ? arcLen
        : 0;
  const liabArcLen =
    hasAssets && hasLiabilities
      ? Math.max(12, usableArc - assetArcLen)
      : hasLiabilities
        ? arcLen
        : 0;

  const divAngle = Math.PI * (1 - (assetArcLen + arcGap / 2) / arcLen);
  const divInnerR = gaugeRadius - gaugeStroke / 2 - 3;
  const divOuterR = gaugeRadius + gaugeStroke / 2 + 3;
  const divX1 = gaugeCx + divInnerR * Math.cos(divAngle);
  const divY1 = gaugeCy - divInnerR * Math.sin(divAngle);
  const divX2 = gaugeCx + divOuterR * Math.cos(divAngle);
  const divY2 = gaugeCy - divOuterR * Math.sin(divAngle);

  const gaugeProgress = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      gaugeProgress.value = 0;
      gaugeProgress.value = withDelay(
        100,
        withTiming(1, { duration: 680, easing: Easing.out(Easing.cubic) }),
      );
    }, [gaugeProgress]),
  );

  const assetArcProps = useAnimatedProps(() => ({
    strokeDasharray: `${gaugeProgress.value * assetArcLen} ${arcLen}`,
  }));

  const liabArcProps = useAnimatedProps(() => ({
    strokeDasharray: `${gaugeProgress.value * liabArcLen} ${arcLen}`,
    strokeDashoffset: -(arcLen - gaugeProgress.value * liabArcLen),
  }));

  const handleShareBalanceSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const payload = {
      currencyCode: currency.code,
      format,
      totalAssetsUsd,
      totalLiabilitiesUsd,
      netWorthUsd,
      liquidPct,
      debtToAssetPct,
      monthlyIncomeUsd,
      assetGroups: assetGroups.map((g) => ({
        category: { label: g.category.label, color: g.category.color },
        subtotalUsd: g.subtotalUsd,
        items: g.items.map((it) => ({
          name: it.name,
          amountUsd: it.amountUsd,
          note: it.note,
        })),
      })),
      liabilityGroups: liabilityGroups.map((g) => ({
        category: { label: g.category.label, color: g.category.color },
        subtotalUsd: g.subtotalUsd,
        items: g.items.map((it) => ({
          name: it.name,
          amountUsd: it.amountUsd,
          note: it.note,
        })),
      })),
    };
    promptDocumentExport({
      title: "Export Balance Sheet",
      buildHtml: () => buildBalanceSheetHtml(payload),
      buildText: () => buildBalanceSheetText(payload),
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.screen, { backgroundColor: colors.sheet }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              {
                paddingTop: insets.top + 12,
                paddingBottom: Math.max(insets.bottom, 20) + 90,
              },
            ]}
          >
            {/* Header */}
            <FocusFadeIn delay={0} style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Wealth
                </Text>
                <Text style={[styles.sub, { color: colors.textMuted }]}>
                  Assets, liabilities & balance sheet
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                    () => {},
                  );
                  router.push({ pathname: "/wealth-item", params: { kind: "asset" } });
                }}
                style={[styles.addBtn, { backgroundColor: colors.darkCard }]}
              >
                <Ionicons name="add" size={18} color={colors.darkCardText} />
                <Text
                  style={[styles.addBtnText, { color: colors.darkCardText }]}
                >
                  Add
                </Text>
              </Pressable>
            </FocusFadeIn>

            {/* View Toggle */}
            <View
              style={[
                styles.toggleBar,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              {(
                [
                  { key: "overview", label: "Overview" },
                  { key: "balance-sheet", label: "Balance Sheet" },
                ] as const
              ).map((tab) => {
                const active = viewMode === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setViewMode(tab.key);
                    }}
                    style={[
                      styles.togglePill,
                      active && { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        {
                          color: active ? "#1c1a17" : colors.textMuted,
                          fontFamily: active ? fonts.semiBold : fonts.medium,
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Net Worth Hero Card */}
            <FocusFadeIn
              delay={60}
              style={[styles.heroCard, { backgroundColor: colors.darkCard }]}
            >
              {/* Semi-Circle Gauge with Total Net Worth in Center */}
              <View style={styles.gaugeContainer}>
                <View style={{ width: gaugeWidth, height: gaugeHeight }}>
                  <Svg width={gaugeWidth} height={gaugeHeight}>
                    <Path
                      d={arcPath}
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={gaugeStroke}
                      strokeLinecap="round"
                    />
                    {assetArcLen > 0 && (
                      <>
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
                      </>
                    )}
                    {liabArcLen > 0 && (
                      <>
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
                      </>
                    )}
                    {hasAssets && hasLiabilities && (
                      <Line
                        x1={divX1}
                        y1={divY1}
                        x2={divX2}
                        y2={divY2}
                        stroke="rgba(255,255,255,0.55)"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                      />
                    )}
                  </Svg>

                  <View style={styles.gaugeCenter}>
                    <Text style={[styles.heroLabel, { color: colors.secondary }]}>
                      Total Net Worth
                    </Text>
                    <Text
                      style={[styles.heroNet, { color: colors.darkCardText }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {format(netWorthUsd)}
                    </Text>
                    <View
                      style={[
                        styles.ratioBadge,
                        {
                          backgroundColor:
                            debtToAssetPct <= 35
                              ? "rgba(74,222,128,0.16)"
                              : "rgba(248,113,113,0.16)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.ratioBadgeText,
                          {
                            color:
                              debtToAssetPct <= 35 ? "#4ade80" : "#f87171",
                          },
                        ]}
                      >
                        {debtToAssetPct}% debt
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.barLegend}>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.dot, { backgroundColor: "#2e9e6b" }]}
                    />
                    <Text
                      style={[styles.legendLabel, { color: colors.secondary }]}
                    >
                      Assets {format(totalAssetsUsd)}
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.dot, { backgroundColor: "#f87171" }]}
                    />
                    <Text
                      style={[styles.legendLabel, { color: colors.secondary }]}
                    >
                      Liabilities {format(totalLiabilitiesUsd)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Key Metrics Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <Text
                    style={[styles.metricLabel, { color: colors.secondary }]}
                  >
                    Liquid Cash
                  </Text>
                  <Text
                    style={[styles.metricValue, { color: colors.darkCardText }]}
                  >
                    {liquidPct}%
                  </Text>
                </View>
                <View
                  style={[
                    styles.metricDivider,
                    { backgroundColor: "rgba(255,255,255,0.1)" },
                  ]}
                />
                <View style={styles.metricBox}>
                  <Text
                    style={[styles.metricLabel, { color: colors.secondary }]}
                  >
                    30d Income
                  </Text>
                  <Text
                    style={[styles.metricValue, { color: colors.darkCardText }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {format(monthlyIncomeUsd)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.metricDivider,
                    { backgroundColor: "rgba(255,255,255,0.1)" },
                  ]}
                />
                <View style={styles.metricBox}>
                  <Text
                    style={[styles.metricLabel, { color: colors.secondary }]}
                  >
                    Items
                  </Text>
                  <Text
                    style={[styles.metricValue, { color: colors.darkCardText }]}
                  >
                    {items.length + (includeCashBalance ? 1 : 0)}
                  </Text>
                </View>
              </View>
            </FocusFadeIn>

            {viewMode === "overview" ? (
              <>
                {/* Pockito Cash Sync Switch */}
                <FocusFadeIn
                  delay={100}
                  style={[
                    styles.syncCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.syncIcon,
                      { backgroundColor: colors.accentSoft },
                    ]}
                  >
                    <Ionicons
                      name="sync-outline"
                      size={18}
                      color={colors.tint}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.syncTitle, { color: colors.text }]}>
                      Include Pockito Cash Balance
                    </Text>
                    <Text style={[styles.syncSub, { color: colors.textMuted }]}>
                      Auto-syncs transaction balance ({format(pockitoCashUsd)})
                    </Text>
                  </View>
                  <Switch
                    value={includeCashBalance}
                    onValueChange={(val) => {
                      Haptics.selectionAsync().catch(() => {});
                      setIncludeCashBalance(val);
                    }}
                    trackColor={{
                      false: colors.cardBorder,
                      true: colors.accent,
                    }}
                    thumbColor="#ffffff"
                  />
                </FocusFadeIn>

                {/* Assets Section */}
                <FocusFadeIn delay={140} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text
                        style={[styles.sectionTitle, { color: colors.text }]}
                      >
                        Assets & Possessions
                      </Text>
                      <Text
                        style={[styles.sectionSub, { color: colors.textMuted }]}
                      >
                        Total: {format(totalAssetsUsd)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        router.push({ pathname: "/wealth-item", params: { kind: "asset" } });
                      }}
                      style={[
                        styles.smallAddBtn,
                        { backgroundColor: colors.accentSoft },
                      ]}
                    >
                      <Ionicons name="add" size={15} color={colors.tint} />
                      <Text
                        style={[styles.smallAddText, { color: colors.tint }]}
                      >
                        Asset
                      </Text>
                    </Pressable>
                  </View>

                  {assetGroups.map((g, gi) => (
                    <WealthGroupStack
                      key={g.category.id}
                      category={g.category}
                      items={g.items}
                      subtotalUsd={g.subtotalUsd}
                      share={totalAssetsUsd > 0 ? g.subtotalUsd / totalAssetsUsd : 0}
                      kind="asset"
                      format={format}
                      index={gi}
                      onItemPress={(item) =>
                        router.push({ pathname: "/wealth-item", params: { id: item.id } })
                      }
                    />
                  ))}

                  {assetGroups.length === 0 && (
                    <Pressable
                      onPress={() =>
                        router.push({ pathname: "/wealth-item", params: { kind: "asset" } })
                      }
                      style={[
                        styles.emptyCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                        },
                      ]}
                    >
                      <Ionicons
                        name="sparkles-outline"
                        size={20}
                        color={colors.textMuted}
                      />
                      <Text
                        style={[styles.emptyText, { color: colors.textMuted }]}
                      >
                        Add bank savings, investments, property, or possessions
                      </Text>
                    </Pressable>
                  )}
                </FocusFadeIn>

                {/* Liabilities Section */}
                <FocusFadeIn delay={180} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text
                        style={[styles.sectionTitle, { color: colors.text }]}
                      >
                        Liabilities & Debts
                      </Text>
                      <Text
                        style={[styles.sectionSub, { color: colors.textMuted }]}
                      >
                        Total: {format(totalLiabilitiesUsd)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        router.push({ pathname: "/wealth-item", params: { kind: "liability" } });
                      }}
                      style={[
                        styles.smallAddBtn,
                        { backgroundColor: "rgba(220,38,38,0.1)" },
                      ]}
                    >
                      <Ionicons name="add" size={15} color={colors.expense} />
                      <Text
                        style={[styles.smallAddText, { color: colors.expense }]}
                      >
                        Liability
                      </Text>
                    </Pressable>
                  </View>

                  {liabilityGroups.map((g, gi) => (
                    <WealthGroupStack
                      key={g.category.id}
                      category={g.category}
                      items={g.items}
                      subtotalUsd={g.subtotalUsd}
                      share={totalLiabilitiesUsd > 0 ? g.subtotalUsd / totalLiabilitiesUsd : 0}
                      kind="liability"
                      format={format}
                      index={gi}
                      onItemPress={(item) =>
                        router.push({ pathname: "/wealth-item", params: { id: item.id } })
                      }
                    />
                  ))}

                  {liabilityGroups.length === 0 && (
                    <View
                      style={[
                        styles.emptyCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                        },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color={colors.income}
                      />
                      <Text
                        style={[styles.emptyText, { color: colors.textMuted }]}
                      >
                        No liabilities recorded — tap + Liability to track loans
                        or cards
                      </Text>
                    </View>
                  )}
                </FocusFadeIn>
              </>
            ) : (
              /* Balance Sheet Statement Mode */
              <FocusFadeIn
                delay={60}
                style={[
                  styles.statementCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View style={styles.statementHeader}>
                  <View>
                    <Text
                      style={[styles.statementTitle, { color: colors.text }]}
                    >
                      Personal Balance Sheet
                    </Text>
                    <Text
                      style={[
                        styles.statementDate,
                        { color: colors.textMuted },
                      ]}
                    >
                      As of{" "}
                      {new Date().toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      · {currency.code}
                    </Text>
                  </View>
                  <Pressable
                    onPress={handleShareBalanceSheet}
                    style={[
                      styles.exportBtn,
                      { backgroundColor: colors.accentSoft },
                    ]}
                  >
                    <Ionicons
                      name="share-outline"
                      size={16}
                      color={colors.tint}
                    />
                    <Text style={[styles.exportText, { color: colors.tint }]}>
                      Export
                    </Text>
                  </Pressable>
                </View>

                {/* 1. ASSETS */}
                <Text
                  style={[styles.bsSectionHeading, { color: colors.income }]}
                >
                  ASSETS
                </Text>
                {assetGroups.length === 0 ? (
                  <Text style={[styles.bsEmpty, { color: colors.textMuted }]}>
                    No assets recorded
                  </Text>
                ) : (
                  assetGroups.map((g) => (
                    <View key={g.category.id} style={styles.bsGroup}>
                      <View style={styles.bsGroupRow}>
                        <Text
                          style={[styles.bsGroupLabel, { color: colors.text }]}
                        >
                          {g.category.label}
                        </Text>
                        <Text
                          style={[styles.bsGroupTotal, { color: colors.text }]}
                        >
                          {format(g.subtotalUsd)}
                        </Text>
                      </View>
                      {g.items.map((it) => (
                        <Pressable
                          key={it.id}
                          disabled={!it.raw}
                          onPress={() =>
                            it.raw &&
                            router.push({ pathname: "/wealth-item", params: { id: it.raw.id } })
                          }
                          style={styles.bsLineRow}
                        >
                          <Text
                            style={[
                              styles.bsLineName,
                              { color: colors.textMuted },
                            ]}
                            numberOfLines={1}
                          >
                            {it.name}
                          </Text>
                          <Text
                            style={[
                              styles.bsLineVal,
                              { color: colors.textMuted },
                            ]}
                          >
                            {format(it.amountUsd)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ))
                )}

                <View
                  style={[
                    styles.bsTotalRow,
                    { borderTopColor: colors.cardBorder },
                  ]}
                >
                  <Text style={[styles.bsTotalLabel, { color: colors.text }]}>
                    Total Assets
                  </Text>
                  <Text style={[styles.bsTotalValue, { color: colors.income }]}>
                    {format(totalAssetsUsd)}
                  </Text>
                </View>

                {/* 2. LIABILITIES */}
                <Text
                  style={[
                    styles.bsSectionHeading,
                    { color: colors.expense, marginTop: 18 },
                  ]}
                >
                  LIABILITIES
                </Text>
                {liabilityGroups.length === 0 ? (
                  <Text style={[styles.bsEmpty, { color: colors.textMuted }]}>
                    No liabilities recorded
                  </Text>
                ) : (
                  liabilityGroups.map((g) => (
                    <View key={g.category.id} style={styles.bsGroup}>
                      <View style={styles.bsGroupRow}>
                        <Text
                          style={[styles.bsGroupLabel, { color: colors.text }]}
                        >
                          {g.category.label}
                        </Text>
                        <Text
                          style={[styles.bsGroupTotal, { color: colors.text }]}
                        >
                          {format(g.subtotalUsd)}
                        </Text>
                      </View>
                      {g.items.map((it) => (
                        <Pressable
                          key={it.id}
                          disabled={!it.raw}
                          onPress={() =>
                            it.raw &&
                            router.push({ pathname: "/wealth-item", params: { id: it.raw.id } })
                          }
                          style={styles.bsLineRow}
                        >
                          <Text
                            style={[
                              styles.bsLineName,
                              { color: colors.textMuted },
                            ]}
                            numberOfLines={1}
                          >
                            {it.name}
                          </Text>
                          <Text
                            style={[
                              styles.bsLineVal,
                              { color: colors.textMuted },
                            ]}
                          >
                            {format(it.amountUsd)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ))
                )}

                <View
                  style={[
                    styles.bsTotalRow,
                    { borderTopColor: colors.cardBorder },
                  ]}
                >
                  <Text style={[styles.bsTotalLabel, { color: colors.text }]}>
                    Total Liabilities
                  </Text>
                  <Text
                    style={[styles.bsTotalValue, { color: colors.expense }]}
                  >
                    {format(totalLiabilitiesUsd)}
                  </Text>
                </View>

                {/* 3. NET WORTH (EQUITY) */}
                <View
                  style={[
                    styles.bsEquityBox,
                    { backgroundColor: colors.accentSoft },
                  ]}
                >
                  <View>
                    <Text
                      style={[styles.bsEquityTitle, { color: colors.text }]}
                    >
                      Net Worth (Equity)
                    </Text>
                    <Text
                      style={[
                        styles.bsEquityFormula,
                        { color: colors.textMuted },
                      ]}
                    >
                      Total Assets − Total Liabilities
                    </Text>
                  </View>
                  <Text style={[styles.bsEquityValue, { color: colors.text }]}>
                    {format(netWorthUsd)}
                  </Text>
                </View>
              </FocusFadeIn>
            )}
          </ScrollView>
        </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { fontFamily: fonts.bold, fontSize: 28 },
  sub: { fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  addBtnText: { fontFamily: fonts.semiBold, fontSize: 14 },

  toggleBar: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  togglePill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleText: { fontSize: 13 },

  heroCard: { borderRadius: 24, padding: 20, gap: 16 },
  gaugeContainer: { alignItems: "center", gap: 14 },
  gaugeCenter: {
    position: "absolute",
    left: 26,
    right: 26,
    bottom: 2,
    alignItems: "center",
    gap: 4,
  },
  heroLabel: { fontFamily: fonts.medium, fontSize: 12 },
  heroNet: { fontFamily: fonts.bold, fontSize: 30, textAlign: "center" },
  ratioBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 2 },
  ratioBadgeText: { fontFamily: fonts.semiBold, fontSize: 11 },

  barLegend: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 999 },
  legendLabel: { fontFamily: fonts.medium, fontSize: 12 },

  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  metricBox: { flex: 1, alignItems: "center", gap: 2 },
  metricLabel: { fontFamily: fonts.regular, fontSize: 11 },
  metricValue: { fontFamily: fonts.semiBold, fontSize: 15 },
  metricDivider: { width: 1, height: 24 },

  syncCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  syncIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  syncTitle: { fontFamily: fonts.semiBold, fontSize: 14 },
  syncSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },

  section: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 17 },
  sectionSub: { fontFamily: fonts.medium, fontSize: 12, marginTop: 1 },
  smallAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  smallAddText: { fontFamily: fonts.semiBold, fontSize: 12 },

  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitleWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemTitle: { fontFamily: fonts.semiBold, fontSize: 15 },
  syncedPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  syncedText: { fontFamily: fonts.semiBold, fontSize: 10 },
  itemMeta: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  itemAmount: { fontFamily: fonts.bold, fontSize: 15 },

  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  emptyText: { flex: 1, fontFamily: fonts.regular, fontSize: 13 },

  statementCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  statementHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  statementTitle: { fontFamily: fonts.bold, fontSize: 18 },
  statementDate: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  exportText: { fontFamily: fonts.semiBold, fontSize: 12 },

  bsSectionHeading: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: 6,
  },
  bsEmpty: { fontFamily: fonts.italic, fontSize: 13, paddingVertical: 4 },
  bsGroup: { gap: 4, marginTop: 4 },
  bsGroupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bsGroupLabel: { fontFamily: fonts.semiBold, fontSize: 14 },
  bsGroupTotal: { fontFamily: fonts.semiBold, fontSize: 14 },
  bsLineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 12,
    gap: 12,
  },
  bsLineName: { flex: 1, fontFamily: fonts.regular, fontSize: 13 },
  bsLineVal: { fontFamily: fonts.regular, fontSize: 13 },

  bsTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
  },
  bsTotalLabel: { fontFamily: fonts.bold, fontSize: 15 },
  bsTotalValue: { fontFamily: fonts.bold, fontSize: 16 },

  bsEquityBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  bsEquityTitle: { fontFamily: fonts.bold, fontSize: 15 },
  bsEquityFormula: { fontFamily: fonts.regular, fontSize: 11, marginTop: 1 },
  bsEquityValue: { fontFamily: fonts.bold, fontSize: 18 },
});
