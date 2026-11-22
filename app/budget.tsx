import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getBudgetStatusColor } from "@/components/BudgetHomeCard";
import { useBudgets } from "@/components/BudgetsProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useColorScheme } from "@/components/useColorScheme";
import Colors, { fonts } from "@/constants/Colors";
import {
  formatShortDate,
  parseDateKey,
  toDateKey,
  type Budget,
  type BudgetPeriod,
  type BudgetProgress,
} from "@/lib/budgets";

const PERIOD_OPTIONS: { key: BudgetPeriod; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "custom", label: "Custom" },
];

function formatAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return "";

  const firstDot = cleaned.indexOf(".");
  const hasDot = firstDot !== -1;
  const intRaw = hasDot ? cleaned.slice(0, firstDot) : cleaned;
  const decRaw = hasDot
    ? cleaned.slice(firstDot + 1).replace(/\./g, "").slice(0, 2)
    : "";

  const normalizedInt = intRaw.replace(/^0+(?=\d)/, "") || (hasDot ? "0" : "");
  const formattedInt = normalizedInt.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return hasDot ? `${formattedInt}.${decRaw}` : formattedInt;
}

function ProgressBar({
  percent,
  color,
  trackColor,
}: {
  percent: number;
  color: string;
  trackColor: string;
}) {
  const widthPct = useSharedValue(percent);

  useEffect(() => {
    widthPct.value = withTiming(percent, { duration: 400 });
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

function BudgetCard({
  item,
  onEdit,
  onDelete,
  isPast = false,
}: {
  item: BudgetProgress;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
  isPast?: boolean;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { format } = useCurrency();

  const statusColor = getBudgetStatusColor(
    item.status,
    scheme,
    colors.tint,
    colors.expense,
  );
  const barColor = isPast
    ? item.status === "exceeded"
      ? colors.expense
      : colors.income
    : getBudgetStatusColor(item.status, scheme, colors.accent, colors.expense);

  const isOver = item.remainingUsd < 0;
  const daysHint =
    item.lifecycle === "active"
      ? item.daysLeft <= 1
        ? "Ends today"
        : `${item.daysLeft}d left`
      : item.lifecycle === "upcoming"
        ? "Upcoming"
        : null;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onEdit(item.budget);
      }}
      style={({ pressed }) => [
        styles.budgetCard,
        {
          backgroundColor: colors.card,
          borderColor:
            !isPast && item.status !== "ok"
              ? statusColor + "55"
              : colors.cardBorder,
          opacity: pressed ? 0.85 : isPast ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            {isPast ? (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      (item.status === "exceeded" ? colors.expense : colors.income) +
                      "22",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        item.status === "exceeded" ? colors.expense : colors.income,
                    },
                  ]}
                >
                  {item.status === "exceeded" ? "Went over" : "Stayed under"}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.periodChip,
                  { backgroundColor: colors.accentSoft },
                ]}
              >
                <Text style={[styles.periodChipText, { color: colors.tint }]}>
                  {item.badgeLabel}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>
            {item.subtitle}
            {daysHint ? ` · ${daysHint}` : ""}
          </Text>
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            Haptics.selectionAsync().catch(() => {});
            onDelete(item.budget);
          }}
          hitSlop={10}
          style={[
            styles.deleteIconBtn,
            { backgroundColor: colors.sheet, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.amountsRow}>
        <View>
          <Text style={[styles.spentBig, { color: colors.text }]}>
            {format(item.spentUsd)}
            <Text style={[styles.limitSmall, { color: colors.textMuted }]}>
              {" "}
              / {format(item.limitUsd)}
            </Text>
          </Text>
        </View>

        <View style={styles.amountsRight}>
          <Text
            style={[
              styles.remainLabel,
              {
                color: isPast
                  ? item.status === "exceeded"
                    ? colors.expense
                    : colors.income
                  : item.status === "ok"
                    ? colors.text
                    : statusColor,
              },
            ]}
          >
            {isOver
              ? `${format(Math.abs(item.remainingUsd))} over`
              : `${format(item.remainingUsd)} left`}
          </Text>
          <Text style={[styles.pctSmall, { color: colors.textMuted }]}>
            {Math.round(item.percent)}% used
          </Text>
        </View>
      </View>

      <ProgressBar
        percent={Math.max(item.clampedPercent, item.spentUsd > 0 ? 3 : 0)}
        color={barColor}
        trackColor={colors.cardBorder}
      />
    </Pressable>
  );
}

export default function BudgetScreen() {
  const colors = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();
  const { currency } = useCurrency();
  const {
    activeProgresses,
    upcomingProgresses,
    pastProgresses,
    addBudget,
    updateBudget,
    deleteBudget,
    getRecurringBudget,
  } = useBudgets();

  const [pastExpanded, setPastExpanded] = useState(false);

  // Create / edit sheet state
  const sheetRef = useRef<BottomSheetModal>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [period, setPeriod] = useState<BudgetPeriod>("daily");
  const [dailyRecurring, setDailyRecurring] = useState(false);
  const [customMode, setCustomMode] = useState<"single" | "range">("single");
  const [customStart, setCustomStart] = useState(() => new Date());
  const [customEnd, setCustomEnd] = useState(() => new Date());
  const [editingBound, setEditingBound] = useState<"start" | "end">("start");
  const [amountText, setAmountText] = useState("");
  const [initialName, setInitialName] = useState("");
  const [nameInputKey, setNameInputKey] = useState(0);
  const nameInputRef = useRef<any>(null);
  const nameValueRef = useRef("");

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const openCreateSheet = () => {
    Haptics.selectionAsync().catch(() => {});
    setEditingBudget(null);
    setPeriod("daily");
    setDailyRecurring(false);
    setCustomMode("single");
    const today = new Date();
    setCustomStart(today);
    setCustomEnd(today);
    setEditingBound("start");
    setAmountText("");
    nameValueRef.current = "";
    setInitialName("");
    setNameInputKey((k) => k + 1);
    nameInputRef.current?.setNativeProps({ text: "" });
    sheetRef.current?.present();
  };

  const openEditSheet = (budget: Budget) => {
    setEditingBudget(budget);
    setPeriod(budget.period);
    setDailyRecurring(budget.period === "daily" ? budget.recurring : false);

    if (budget.period === "custom") {
      const start = budget.startDate ? parseDateKey(budget.startDate) : new Date();
      const end = budget.endDate ? parseDateKey(budget.endDate) : start;
      setCustomStart(start);
      setCustomEnd(end);
      setCustomMode(toDateKey(start) === toDateKey(end) ? "single" : "range");
    } else {
      const today = new Date();
      setCustomStart(today);
      setCustomEnd(today);
      setCustomMode("single");
    }

    const displayAmount =
      budget.currency === currency.code
        ? budget.originalAmount
        : Number((budget.amountUsd * currency.rate).toFixed(currency.decimals));
    setAmountText(formatAmountInput(String(displayAmount)));
    const nextName = budget.name ?? "";
    nameValueRef.current = nextName;
    setInitialName(nextName);
    setNameInputKey((k) => k + 1);
    nameInputRef.current?.setNativeProps({ text: nextName });
    setEditingBound("start");
    sheetRef.current?.present();
  };

  const confirmDelete = (budget: Budget) => {
    Alert.alert(
      "Delete budget?",
      "This will remove the budget limit. Your transactions will not be affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
              () => {},
            );
            deleteBudget(budget.id);
            if (editingBudget?.id === budget.id) {
              sheetRef.current?.dismiss();
            }
          },
        },
      ],
    );
  };

  const updateCustomDate = (picked: Date, bound: "start" | "end") => {
    if (bound === "start") {
      setCustomStart(picked);
      if (customEnd < picked) setCustomEnd(picked);
    } else {
      setCustomEnd(picked < customStart ? customStart : picked);
    }
  };

  const openAndroidCustomDate = (bound: "start" | "end") => {
    DateTimePickerAndroid.open({
      value: bound === "start" ? customStart : customEnd,
      mode: "date",
      onChange: (_e, picked) => {
        if (picked) updateCustomDate(picked, bound);
      },
    });
  };

  const parsedAmount = Number(amountText.replace(/,/g, "").trim());
  const canSave = Number.isFinite(parsedAmount) && parsedAmount > 0;

  const isEffectiveRecurring =
    period === "weekly" ||
    period === "monthly" ||
    (period === "daily" && dailyRecurring);

  const existingRecurringConflict =
    period !== "custom" && isEffectiveRecurring
      ? (() => {
          const existing = getRecurringBudget(period);
          if (!existing) return null;
          if (editingBudget && existing.id === editingBudget.id) return null;
          return existing;
        })()
      : null;

  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );

    const amountUsd = parsedAmount / currency.rate;
    const todayKey = toDateKey(new Date());

    let startDate: string | undefined;
    let endDate: string | undefined;
    if (period === "daily" && !dailyRecurring) {
      startDate = editingBudget?.startDate ?? todayKey;
      endDate = startDate;
    } else if (period === "custom") {
      const startKey = toDateKey(customStart);
      const endKey =
        customMode === "single"
          ? startKey
          : toDateKey(customEnd < customStart ? customStart : customEnd);
      startDate = startKey;
      endDate = endKey;
    }

    const payload = {
      name: nameValueRef.current.trim() || undefined,
      period,
      recurring: isEffectiveRecurring,
      amountUsd,
      currency: currency.code,
      originalAmount: parsedAmount,
      startDate,
      endDate,
    };

    if (editingBudget) {
      updateBudget(editingBudget.id, payload);
    } else {
      addBudget(payload);
    }
    sheetRef.current?.dismiss();
  };

  return (
    <GestureHandlerRootView style={styles.screen}>
      <BottomSheetModalProvider>
        <View style={[styles.screen, { backgroundColor: colors.sheet }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              {
                paddingTop: Math.max(insets.top, 16) + 8,
                paddingBottom: Math.max(insets.bottom, 24) + 24,
              },
            ]}
          >
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(260)} style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>Budgets</Text>
                <Text style={[styles.sub, { color: colors.textMuted }]}>
                  Stay on top of your spending limits
                </Text>
              </View>

              <Pressable
                onPress={openCreateSheet}
                style={({ pressed }) => [
                  styles.addBtn,
                  { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Ionicons name="add" size={18} color="#1c1a17" />
                <Text style={styles.addBtnText}>New</Text>
              </Pressable>

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

            {/* Active Budgets */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Active
              </Text>

              {activeProgresses.length === 0 ? (
                <View
                  style={[
                    styles.emptyBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.emptyIconWrap,
                      { backgroundColor: colors.accentSoft },
                    ]}
                  >
                    <Ionicons
                      name="pie-chart-outline"
                      size={24}
                      color={colors.tint}
                    />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No active budgets yet
                  </Text>
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                    Set a limit for today, recurring weekly or monthly spending,
                    or a custom date range.
                  </Text>
                  <Pressable
                    onPress={openCreateSheet}
                    style={({ pressed }) => [
                      styles.emptyCta,
                      {
                        backgroundColor: colors.accent,
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.emptyCtaText}>Create a budget</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.cardList}>
                  {activeProgresses.map((item) => (
                    <BudgetCard
                      key={item.budget.id}
                      item={item}
                      onEdit={openEditSheet}
                      onDelete={confirmDelete}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Upcoming Budgets */}
            {upcomingProgresses.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Upcoming
                </Text>
                <View style={styles.cardList}>
                  {upcomingProgresses.map((item) => (
                    <BudgetCard
                      key={item.budget.id}
                      item={item}
                      onEdit={openEditSheet}
                      onDelete={confirmDelete}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Collapsible Past Budgets */}
            {pastProgresses.length > 0 && (
              <View style={styles.section}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setPastExpanded((prev) => !prev);
                  }}
                  style={[
                    styles.pastToggle,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Past ({pastProgresses.length})
                  </Text>
                  <Ionicons
                    name={pastExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>

                {pastExpanded && (
                  <View style={styles.cardList}>
                    {pastProgresses.map((item) => (
                      <BudgetCard
                        key={item.budget.id}
                        item={item}
                        onEdit={openEditSheet}
                        onDelete={confirmDelete}
                        isPast
                      />
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Create / Edit Bottom Sheet */}
          <BottomSheetModal
            ref={sheetRef}
            snapPoints={["85%"]}
            enableDynamicSizing={false}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
            backdropComponent={renderBackdrop}
            backgroundStyle={[
              styles.modalSheetBg,
              { backgroundColor: colors.sheet },
            ]}
            handleIndicatorStyle={{
              backgroundColor: colors.cardBorder,
              width: 38,
            }}
          >
            <BottomSheetScrollView
              contentContainerStyle={[
                styles.sheetContent,
                { paddingBottom: Math.max(insets.bottom, 16) + 16 },
              ]}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {editingBudget ? "Edit budget" : "New budget"}
              </Text>

              {/* Period selector */}
              <View
                style={[
                  styles.segmented,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                {PERIOD_OPTIONS.map((opt) => {
                  const active = opt.key === period;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setPeriod(opt.key);
                      }}
                      style={[
                        styles.segmentItem,
                        active && { backgroundColor: colors.accent },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          {
                            color: active ? "#1c1a17" : colors.textMuted,
                            fontFamily: active ? fonts.semiBold : fonts.medium,
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Daily recurrence toggle */}
              {period === "daily" && (
                <View
                  style={[
                    styles.segmented,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  {(
                    [
                      { key: false, label: "Today only" },
                      { key: true, label: "Every day (recurring)" },
                    ] as const
                  ).map((opt) => {
                    const active = dailyRecurring === opt.key;
                    return (
                      <Pressable
                        key={String(opt.key)}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setDailyRecurring(opt.key);
                        }}
                        style={[
                          styles.segmentItem,
                          active && { backgroundColor: colors.accentSoft },
                        ]}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            {
                              color: active ? colors.tint : colors.textMuted,
                              fontFamily: active ? fonts.semiBold : fonts.medium,
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Weekly / Monthly recurrence note */}
              {(period === "weekly" || period === "monthly") && (
                <View
                  style={[
                    styles.infoBanner,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name="repeat-outline"
                    size={16}
                    color={colors.tint}
                  />
                  <Text style={[styles.infoText, { color: colors.textMuted }]}>
                    {period === "weekly"
                      ? "Resets automatically every week (Sun – Sat)."
                      : "Resets automatically on the 1st of every month."}
                  </Text>
                </View>
              )}

              {/* Existing recurring replacement note */}
              {existingRecurringConflict && (
                <View
                  style={[
                    styles.infoBanner,
                    {
                      backgroundColor: colors.accentSoft,
                      borderColor: colors.tint + "33",
                    },
                  ]}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.tint}
                  />
                  <Text style={[styles.infoText, { color: colors.tint }]}>
                    You already have a recurring {period} budget — saving will
                    update it.
                  </Text>
                </View>
              )}

              {/* Custom date picker */}
              {period === "custom" && (
                <View style={styles.customBlock}>
                  <View
                    style={[
                      styles.segmented,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    {(
                      [
                        { key: "single", label: "Single day" },
                        { key: "range", label: "Date range" },
                      ] as const
                    ).map((m) => {
                      const active = customMode === m.key;
                      return (
                        <Pressable
                          key={m.key}
                          onPress={() => {
                            Haptics.selectionAsync().catch(() => {});
                            setCustomMode(m.key);
                            setEditingBound("start");
                          }}
                          style={[
                            styles.segmentItem,
                            active && { backgroundColor: colors.accentSoft },
                          ]}
                        >
                          <Text
                            style={[
                              styles.segmentText,
                              {
                                color: active ? colors.tint : colors.textMuted,
                                fontFamily: active
                                  ? fonts.semiBold
                                  : fonts.medium,
                              },
                            ]}
                          >
                            {m.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.dateRow}>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setEditingBound("start");
                        if (Platform.OS === "android") {
                          openAndroidCustomDate("start");
                        }
                      }}
                      style={[
                        styles.dateBtn,
                        {
                          backgroundColor: colors.card,
                          borderColor:
                            editingBound === "start"
                              ? colors.tint
                              : colors.cardBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.dateLabel, { color: colors.textMuted }]}>
                        {customMode === "single" ? "Date" : "Start date"}
                      </Text>
                      <Text style={[styles.dateValue, { color: colors.text }]}>
                        {formatShortDate(customStart)}
                      </Text>
                    </Pressable>

                    {customMode === "range" && (
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setEditingBound("end");
                          if (Platform.OS === "android") {
                            openAndroidCustomDate("end");
                          }
                        }}
                        style={[
                          styles.dateBtn,
                          {
                            backgroundColor: colors.card,
                            borderColor:
                              editingBound === "end"
                                ? colors.tint
                                : colors.cardBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.dateLabel, { color: colors.textMuted }]}
                        >
                          End date
                        </Text>
                        <Text style={[styles.dateValue, { color: colors.text }]}>
                          {formatShortDate(customEnd)}
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {Platform.OS === "ios" && (
                    <View
                      style={[
                        styles.iosPickerWrap,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                        },
                      ]}
                    >
                      <DateTimePicker
                        value={
                          editingBound === "start" ? customStart : customEnd
                        }
                        mode="date"
                        display="inline"
                        accentColor={colors.tint}
                        onChange={(_e: DateTimePickerEvent, picked?: Date) => {
                          if (picked) updateCustomDate(picked, editingBound);
                        }}
                      />
                    </View>
                  )}
                </View>
              )}

              {/* Amount input */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                  Spending limit ({currency.code})
                </Text>
                <View
                  style={[
                    styles.amountBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.currencySym, { color: colors.textMuted }]}>
                    {currency.symbol}
                  </Text>
                  <BottomSheetTextInput
                    value={amountText}
                    onChangeText={(text) => setAmountText(formatAmountInput(text))}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={[styles.amountInput, { color: colors.text }]}
                  />
                </View>
              </View>

              {/* Optional Name input */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                  Label (optional)
                </Text>
                <BottomSheetTextInput
                  key={nameInputKey}
                  ref={nameInputRef}
                  defaultValue={initialName}
                  onChangeText={(text) => {
                    nameValueRef.current = text;
                  }}
                  returnKeyType="done"
                  placeholder={
                    period === "custom"
                      ? "e.g. Weekend trip, Holiday"
                      : period === "daily" && !dailyRecurring
                        ? "e.g. Lunch & errands"
                        : "Optional custom name"
                  }
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.nameInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                      color: colors.text,
                    },
                  ]}
                />
              </View>

              {/* Save CTA */}
              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                style={({ pressed }) => [
                  styles.saveBtn,
                  {
                    backgroundColor: colors.accent,
                    opacity: !canSave ? 0.45 : pressed ? 0.82 : 1,
                  },
                ]}
              >
                <Text style={styles.saveBtnText}>
                  {editingBudget ? "Update budget" : "Save budget"}
                </Text>
              </Pressable>

              {editingBudget && (
                <Pressable
                  onPress={() => confirmDelete(editingBudget)}
                  style={({ pressed }) => [
                    styles.deleteBtn,
                    {
                      borderColor: colors.expense + "55",
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.deleteBtnText, { color: colors.expense }]}>
                    Delete budget
                  </Text>
                </Pressable>
              )}
            </BottomSheetScrollView>
          </BottomSheetModal>
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    gap: 22,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    letterSpacing: -0.6,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 13,
    height: 38,
    borderRadius: 999,
  },
  addBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: "#1c1a17",
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  cardList: {
    gap: 12,
  },
  budgetCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitleBlock: {
    flex: 1,
    gap: 3,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    flexShrink: 1,
  },
  cardSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  periodChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  periodChipText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
  },
  deleteIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  amountsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
  },
  spentBig: {
    fontFamily: fonts.bold,
    fontSize: 19,
  },
  limitSmall: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  amountsRight: {
    alignItems: "flex-end",
    gap: 1,
  },
  remainLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  pctSmall: {
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  track: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  emptyBox: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  emptyCta: {
    marginTop: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
  },
  emptyCtaText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: "#1c1a17",
  },
  pastToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalSheetBg: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    gap: 14,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    marginBottom: 2,
  },
  segmented: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    fontSize: 13,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  customBlock: {
    gap: 10,
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 2,
  },
  dateLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  dateValue: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  iosPickerWrap: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    padding: 6,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 54,
    gap: 8,
  },
  currencySym: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  amountInput: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 22,
    paddingVertical: 0,
  },
  nameInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  saveBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveBtnText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#1c1a17",
  },
  deleteBtn: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
});
