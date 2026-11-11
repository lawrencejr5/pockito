import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CashflowChart } from '@/components/CashflowChart';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

const TRANSACTIONS = [
  { id: '1', title: 'Cash, USD', sub: 'Prime Bank', amount: -543.55, balance: 4673.85, icon: 'wallet.pass' },
  { id: '2', title: 'Salary Deposit', sub: 'Acme Inc.', amount: 2400, balance: 5217.4, icon: 'banknote' },
  { id: '3', title: 'Groceries', sub: 'Visa •• 4242', amount: -86.2, balance: 2817.4, icon: 'cart' },
] as const;

const fmt = (v: number) =>
  '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function HomeScreen() {
  const colors = Colors[useColorScheme()];
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
  const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={{ flex: 1, backgroundColor: colors.hero }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 120 }}>
        <SafeAreaView edges={['top']} style={styles.hero}>
          <View style={styles.topBar}>
            <View style={[styles.circle, { backgroundColor: colors.secondary }]}>
              <SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} tintColor="#fff" size={20} />
            </View>
            <View style={[styles.monthPill, { backgroundColor: colors.pill }]}>
              <Text style={{ color: colors.heroText, fontWeight: '600' }}>{month} ⌄</Text>
            </View>
            <View style={[styles.circle, { backgroundColor: colors.pill }]}>
              <SymbolView name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }} tintColor={colors.heroText} size={18} />
            </View>
          </View>

          <Text style={[styles.balanceLabel, { color: colors.heroText }]}>Current Balance</Text>
          <Text style={[styles.balance, { color: colors.heroText }]}>
            $87,457<Text style={{ opacity: 0.5 }}>.86</Text>
          </Text>
          <View style={[styles.delta, { backgroundColor: colors.pill }]}>
            <Text style={{ color: colors.heroText, fontSize: 12 }}>+$764.65 than last week</Text>
          </View>
        </SafeAreaView>

        <View style={[styles.sheet, { backgroundColor: colors.sheet }]}>
          <CashflowChart />

          <View style={styles.rowBetween}>
            <Text style={[styles.h2, { color: colors.text }]}>Your Money</Text>
            <View style={[styles.smallPill, { borderColor: colors.cardBorder }]}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Details ›</Text>
            </View>
          </View>

          <View style={styles.row}>
            {[
              { label: 'Income', value: 4876.89, icon: 'arrow.down.left', color: colors.income },
              { label: 'Expense', value: 8145.45, icon: 'arrow.up.right', color: colors.expense },
            ].map((c) => (
              <View key={c.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
                  <SymbolView name={{ ios: c.icon as any, android: 'paid', web: 'paid' }} tintColor={c.color} size={18} />
                </View>
                <Text style={{ color: colors.textMuted, marginTop: 14 }}>{c.label}</Text>
                <Text style={[styles.stat, { color: colors.text }]}>{fmt(c.value)}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.insights, { backgroundColor: colors.darkCard }]}>
            <Text style={{ color: colors.darkCardText, fontWeight: '500' }}>✨ Your Insights is ready now</Text>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>Get Pro →</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={[styles.h2, { color: colors.text }]}>Transactions</Text>
            <View style={[styles.smallPill, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}>
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>Show All</Text>
            </View>
          </View>
          <View style={styles.rowBetween}>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{today}</Text>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>Today: $3,456.55</Text>
          </View>

          {TRANSACTIONS.map((t) => (
            <View key={t.id} style={[styles.tx, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
                <SymbolView name={{ ios: t.icon, android: 'receipt', web: 'receipt' }} tintColor={colors.tint} size={18} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{t.title}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>↳ {t.sub}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: t.amount < 0 ? colors.expense : colors.income, fontWeight: '700' }}>
                  {t.amount < 0 ? '-' : '+'}{fmt(t.amount)}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{fmt(t.balance)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 28, alignItems: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 24 },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  monthPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  balanceLabel: { opacity: 0.7, fontSize: 14 },
  balance: { fontSize: 44, fontWeight: '800', marginVertical: 6 },
  delta: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, gap: 16, minHeight: 600 },
  row: { flexDirection: 'row', gap: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h2: { fontSize: 17, fontWeight: '700' },
  smallPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1 },
  stat: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  badge: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  insights: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 999 },
  tx: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1 },
});
