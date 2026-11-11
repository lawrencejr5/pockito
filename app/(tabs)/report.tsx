import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CashflowChart } from "@/components/CashflowChart";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function ReportScreen() {
  const colors = Colors[useColorScheme()];
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.sheet }]}>
      <Text style={[styles.title, { color: colors.text }]}>Report</Text>
      <Text style={{ color: colors.textMuted }}>
        How money enters and leaves your account
      </Text>
      <View style={{ marginTop: 20 }}>
        <CashflowChart />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: "800" },
});
