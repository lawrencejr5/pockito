import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CurrencyPicker } from '@/components/CurrencyPicker';
import { useCurrency } from '@/components/CurrencyProvider';
import { useTransactions } from '@/components/TransactionsProvider';
import { useWealth } from '@/components/WealthProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';

const PROFILE_STORAGE_KEY = 'pockito.profile';

type ProfileData = {
  name: string;
  subtitle: string;
};

const DEFAULT_PROFILE: ProfileData = {
  name: 'Pockito User',
  subtitle: 'Personal Finance · Local Account',
};

export default function ProfileScreen() {
  const colors = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();
  const { currency, format } = useCurrency();
  const { transactions } = useTransactions();
  const { items: wealthItems, includeCashBalance, setIncludeCashBalance } = useWealth();

  const currencySheetRef = useRef<BottomSheetModal>(null);

  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(DEFAULT_PROFILE.name);
  const [draftSubtitle, setDraftSubtitle] = useState(DEFAULT_PROFILE.subtitle);

  useEffect(() => {
    AsyncStorage.getItem(PROFILE_STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as ProfileData;
          setProfile(parsed);
          setDraftName(parsed.name);
          setDraftSubtitle(parsed.subtitle);
        }
      })
      .catch(() => {});
  }, []);

  const initials = useMemo(() => {
    const parts = profile.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'PU';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [profile.name]);

  const { cashBalanceUsd, netWorthUsd } = useMemo(() => {
    let cash = 0;
    for (const t of transactions) {
      cash += t.type === 'income' ? t.amountUsd : -t.amountUsd;
    }
    const assets = wealthItems
      .filter((i) => i.kind === 'asset')
      .reduce((s, i) => s + i.amountUsd, 0);
    const liabilities = wealthItems
      .filter((i) => i.kind === 'liability')
      .reduce((s, i) => s + i.amountUsd, 0);
    const totalAssets = assets + (includeCashBalance ? cash : 0);
    return {
      cashBalanceUsd: cash,
      netWorthUsd: totalAssets - liabilities,
    };
  }, [transactions, wealthItems, includeCashBalance]);

  const handleSaveProfile = () => {
    const next: ProfileData = {
      name: draftName.trim() || DEFAULT_PROFILE.name,
      subtitle: draftSubtitle.trim() || DEFAULT_PROFILE.subtitle,
    };
    setProfile(next);
    setEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const handleExportSummary = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const message = [
      `POCKITO FINANCIAL SUMMARY (${currency.code})`,
      `Account: ${profile.name}`,
      `────────────────────────`,
      `Cash Balance: ${format(cashBalanceUsd)}`,
      `Net Worth: ${format(netWorthUsd)}`,
      `Logged Transactions: ${transactions.length}`,
      `Wealth Items: ${wealthItems.length}`,
    ].join('\n');

    try {
      await Share.share({ message });
    } catch {
      // User dismissed share sheet
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <View style={[styles.screen, { backgroundColor: colors.sheet }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 20) + 90 },
            ]}>
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(280)} style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
              <Text style={[styles.sub, { color: colors.textMuted }]}>
                Account, preferences & app info
              </Text>
            </Animated.View>

            {/* Account Hero Card */}
            <Animated.View
              entering={FadeInDown.delay(50).duration(300)}
              style={[styles.heroCard, { backgroundColor: colors.darkCard }]}>
              <View style={styles.profileRow}>
                <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>

                {editing ? (
                  <View style={{ flex: 1, gap: 8 }}>
                    <TextInput
                      value={draftName}
                      onChangeText={setDraftName}
                      placeholder="Your name"
                      placeholderTextColor={colors.secondary}
                      style={[
                        styles.editInput,
                        { color: colors.darkCardText, borderColor: 'rgba(255,255,255,0.2)' },
                      ]}
                    />
                    <TextInput
                      value={draftSubtitle}
                      onChangeText={setDraftSubtitle}
                      placeholder="Subtitle or email"
                      placeholderTextColor={colors.secondary}
                      style={[
                        styles.editInput,
                        styles.editSubInput,
                        { color: colors.secondary, borderColor: 'rgba(255,255,255,0.2)' },
                      ]}
                    />
                  </View>
                ) : (
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.profileName, { color: colors.darkCardText }]} numberOfLines={1}>
                      {profile.name}
                    </Text>
                    <Text style={[styles.profileSub, { color: colors.secondary }]} numberOfLines={1}>
                      {profile.subtitle}
                    </Text>
                  </View>
                )}

                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    if (editing) {
                      handleSaveProfile();
                    } else {
                      setDraftName(profile.name);
                      setDraftSubtitle(profile.subtitle);
                      setEditing(true);
                    }
                  }}
                  style={[
                    styles.editBtn,
                    { backgroundColor: editing ? colors.accent : 'rgba(255,255,255,0.1)' },
                  ]}>
                  <Ionicons
                    name={editing ? 'checkmark' : 'pencil-outline'}
                    size={16}
                    color={editing ? '#1c1a17' : colors.darkCardText}
                  />
                </Pressable>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.darkCardText }]}>
                    {transactions.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.secondary }]}>Transactions</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.darkCardText }]}>
                    {wealthItems.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.secondary }]}>Wealth Items</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.darkCardText }]}>
                    {currency.code}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.secondary }]}>Currency</Text>
                </View>
              </View>
            </Animated.View>

            {/* Preferences */}
            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PREFERENCES</Text>
              <View
                style={[
                  styles.groupCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    currencySheetRef.current?.present();
                  }}
                  style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="cash-outline" size={18} color={colors.tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>Display Currency</Text>
                    <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                      {currency.symbol} {currency.code} · {currency.name}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>

                <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

                <View style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: '#e0f2e9' }]}>
                    <Ionicons name="wallet-outline" size={18} color="#1b6f47" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>
                      Sync Cash to Net Worth
                    </Text>
                    <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                      Include transaction balance in Wealth
                    </Text>
                  </View>
                  <Switch
                    value={includeCashBalance}
                    onValueChange={(val) => {
                      Haptics.selectionAsync().catch(() => {});
                      setIncludeCashBalance(val);
                    }}
                    trackColor={{ false: colors.cardBorder, true: colors.accent }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
            </Animated.View>

            {/* Data & Sync */}
            <Animated.View entering={FadeInDown.delay(140).duration(300)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DATA & SYNC</Text>
              <View
                style={[
                  styles.groupCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}>
                <Pressable onPress={handleExportSummary} style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="share-outline" size={18} color={colors.tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>
                      Export Financial Summary
                    </Text>
                    <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                      Share cash balance & net worth snapshot
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>

                <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    Alert.alert(
                      'Cloud Sync',
                      'Your data is currently saved locally on this device. Cloud sync with Convex will be available in a future update.',
                    );
                  }}
                  style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.secondarySoft }]}>
                    <Ionicons name="cloud-outline" size={18} color={colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>Cloud Backup</Text>
                    <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                      Local storage active · Cloud sync coming soon
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
                    <Text style={[styles.badgeText, { color: colors.tint }]}>Local</Text>
                  </View>
                </Pressable>
              </View>
            </Animated.View>

            {/* About */}
            <Animated.View entering={FadeInDown.delay(180).duration(300)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ABOUT</Text>
              <View
                style={[
                  styles.groupCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}>
                <View style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={colors.tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>Privacy</Text>
                    <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                      All transactions & wealth data stay on your device
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

                <View style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.secondarySoft }]}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>Pockito</Text>
                    <Text style={[styles.rowSub, { color: colors.textMuted }]}>Version 1.0.0</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>

          <CurrencyPicker ref={currencySheetRef} />
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 18 },
  header: { gap: 2 },
  title: { fontSize: 28, fontFamily: fonts.bold },
  sub: { fontSize: 13, fontFamily: fonts.regular },

  heroCard: { borderRadius: 24, padding: 18, gap: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 20, color: '#1c1a17' },
  profileName: { fontFamily: fonts.bold, fontSize: 18 },
  profileSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  editInput: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editSubInput: { fontFamily: fonts.regular, fontSize: 12 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontFamily: fonts.bold, fontSize: 16 },
  statLabel: { fontFamily: fonts.regular, fontSize: 11 },
  statDivider: { width: 1, height: 24 },

  section: { gap: 8 },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 0.8, paddingLeft: 4 },
  groupCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.semiBold, fontSize: 15 },
  rowSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontFamily: fonts.semiBold, fontSize: 11 },
});
