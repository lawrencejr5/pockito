import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CashflowChart } from '@/components/CashflowChart';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';

export default function ReportScreen() {
  const colors = Colors[useColorScheme()];
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.sheet }]}>
      <Text style={[styles.title, { color: colors.text }]}>Report</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        How money enters and leaves your account
      </Text>
      <View style={{ marginTop: 20 }}>
        <CashflowChart variant="card" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontFamily: fonts.bold },
  sub: { fontSize: 13, fontFamily: fonts.regular, marginTop: 2 },
});
