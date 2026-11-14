import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import type { WealthItem } from '@/components/WealthProvider';
import Colors, { fonts } from '@/constants/Colors';
import type { WealthCategory } from '@/constants/wealth';

export type WealthGroupLine = {
  id: string;
  name: string;
  amountUsd: number;
  note?: string;
  raw?: WealthItem;
};

type Props = {
  category: WealthCategory;
  items: WealthGroupLine[];
  subtotalUsd: number;
  /** 0..1 share of this group within its section total. */
  share: number;
  kind: 'asset' | 'liability';
  format: (amountUsd: number) => string;
  onItemPress: (item: WealthItem) => void;
  /** Used to stagger the entrance animation. */
  index?: number;
};

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const GHOST_STEP = 7;

function GroupRow({
  line,
  index,
  progress,
  kind,
  category,
  format,
  onPress,
  isLast,
}: {
  line: WealthGroupLine;
  index: number;
  progress: SharedValue<number>;
  kind: 'asset' | 'liability';
  category: WealthCategory;
  format: (n: number) => string;
  onPress: () => void;
  isLast: boolean;
}) {
  const colors = Colors[useColorScheme()];
  const start = Math.min(0.12 + index * 0.06, 0.55);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [start, Math.min(start + 0.4, 1)], [0, 1], 'clamp'),
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [start, Math.min(start + 0.4, 1)],
          [-10, 0],
          'clamp',
        ),
      },
    ],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        disabled={!line.raw}
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.cardBorder,
          },
          pressed && { opacity: 0.6 },
        ]}>
        <View style={[styles.rowDot, { backgroundColor: category.color }]} />
        <View style={{ flex: 1 }}>
          <View style={styles.rowTitleWrap}>
            <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
              {line.name}
            </Text>
            {!line.raw && (
              <View style={[styles.syncedPill, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.syncedText, { color: colors.tint }]}>Synced</Text>
              </View>
            )}
          </View>
          {!!line.note && (
            <Text style={[styles.rowNote, { color: colors.textMuted }]} numberOfLines={1}>
              {line.note}
            </Text>
          )}
        </View>
        <Text
          style={[
            styles.rowAmount,
            { color: kind === 'liability' ? colors.expense : colors.text },
          ]}>
          {kind === 'liability' ? '-' : ''}
          {format(line.amountUsd)}
        </Text>
        {line.raw && <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />}
      </Pressable>
    </Animated.View>
  );
}

function WealthGroupStackBase({
  category,
  items,
  subtotalUsd,
  share,
  kind,
  format,
  onItemPress,
  index = 0,
}: Props) {
  const colors = Colors[useColorScheme()];
  const [expanded, setExpanded] = useState(false);

  const progress = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const shareAnim = useSharedValue(0);

  useEffect(() => {
    shareAnim.value = withTiming(Math.max(0.03, Math.min(1, share)), {
      duration: 700,
      easing: EASE,
    });
  }, [share, shareAnim]);

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const next = !expanded;
    setExpanded(next);
    progress.value = withTiming(next ? 1 : 0, { duration: next ? 460 : 340, easing: EASE });
  };

  const stackCount = Math.min(items.length - 1, 2);

  // Ghost cards peeking from behind the main card (the "stack").
  const ghostOneStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [1, 0], 'clamp'),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [GHOST_STEP, 0]) },
      { scaleX: interpolate(progress.value, [0, 1], [0.95, 1]) },
    ],
  }));
  const ghostTwoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [1, 0], 'clamp'),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [GHOST_STEP * 2, 0]) },
      { scaleX: interpolate(progress.value, [0, 1], [0.9, 1]) },
    ],
  }));
  const wrapperStyle = useAnimatedStyle(() => ({
    marginBottom: interpolate(progress.value, [0, 1], [stackCount * GHOST_STEP, 0]),
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    height: progress.value * contentHeight.value,
    opacity: interpolate(progress.value, [0, 0.15], [0, 1], 'clamp'),
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));
  const previewStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [1, 0], 'clamp'),
    height: interpolate(progress.value, [0, 0.6], [16, 0], 'clamp'),
  }));
  const barStyle = useAnimatedStyle(() => ({
    width: `${shareAnim.value * 100}%`,
  }));
  const headerTileStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.1, 1]) }],
  }));

  const names = items.map((i) => i.name);
  const preview =
    names.length <= 2
      ? names.join(' · ')
      : `${names.slice(0, 2).join(' · ')} +${names.length - 2} more`;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 60).duration(320)}
      style={wrapperStyle}>
      {stackCount >= 2 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ghost,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ghostTwoStyle,
          ]}
        />
      )}
      {stackCount >= 1 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ghost,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ghostOneStyle,
          ]}
        />
      )}

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}>
        <Pressable
          onPress={toggle}
          style={({ pressed }) => [styles.header, pressed && { opacity: 0.75 }]}>
          <Animated.View
            style={[styles.tile, { backgroundColor: category.bg }, headerTileStyle]}>
            <Ionicons name={category.icon} size={20} color={category.color} />
          </Animated.View>

          <View style={{ flex: 1 }}>
            <View style={styles.titleLine}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {category.label}
              </Text>
              <View style={[styles.countPill, { backgroundColor: category.bg }]}>
                <Text style={[styles.countText, { color: category.color }]}>
                  {items.length}
                </Text>
              </View>
            </View>
            <Animated.View style={[{ overflow: 'hidden' }, previewStyle]}>
              <Text style={[styles.preview, { color: colors.textMuted }]} numberOfLines={1}>
                {preview}
              </Text>
            </Animated.View>
          </View>

          <View style={styles.amountCol}>
            <Text
              style={[
                styles.total,
                { color: kind === 'liability' ? colors.expense : colors.text },
              ]}
              numberOfLines={1}>
              {kind === 'liability' ? '-' : ''}
              {format(subtotalUsd)}
            </Text>
            <Text style={[styles.shareText, { color: colors.textMuted }]}>
              {Math.round(share * 100)}%
            </Text>
          </View>

          <Animated.View style={chevronStyle}>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </Animated.View>
        </Pressable>

        {/* Share-of-section bar */}
        <View style={[styles.barTrack, { backgroundColor: colors.cardBorder }]}>
          <Animated.View
            style={[styles.barFill, { backgroundColor: category.color }, barStyle]}
          />
        </View>

        {/* Expanding body */}
        <Animated.View style={[styles.body, bodyStyle]} pointerEvents={expanded ? 'auto' : 'none'}>
          <View
            style={styles.bodyInner}
            onLayout={(e) => {
              contentHeight.value = e.nativeEvent.layout.height;
            }}>
            {items.map((line, i) => (
              <GroupRow
                key={line.id}
                line={line}
                index={i}
                progress={progress}
                kind={kind}
                category={category}
                format={format}
                isLast={i === items.length - 1}
                onPress={() => line.raw && onItemPress(line.raw)}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

export const WealthGroupStack = memo(WealthGroupStackBase);

const styles = StyleSheet.create({
  ghost: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontFamily: fonts.semiBold, fontSize: 15, flexShrink: 1 },
  countPill: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 8 },
  countText: { fontFamily: fonts.bold, fontSize: 11 },
  preview: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  amountCol: { alignItems: 'flex-end', maxWidth: 130 },
  total: { fontFamily: fonts.bold, fontSize: 15 },
  shareText: { fontFamily: fonts.medium, fontSize: 11, marginTop: 1 },
  barTrack: { height: 3, marginHorizontal: 14, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  body: { overflow: 'hidden' },
  bodyInner: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
  },
  rowDot: { width: 6, height: 6, borderRadius: 3 },
  rowTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTitle: { fontFamily: fonts.medium, fontSize: 14, flexShrink: 1 },
  rowNote: { fontFamily: fonts.regular, fontSize: 11, marginTop: 1 },
  rowAmount: { fontFamily: fonts.semiBold, fontSize: 14 },
  syncedPill: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  syncedText: { fontFamily: fonts.semiBold, fontSize: 10 },
});
