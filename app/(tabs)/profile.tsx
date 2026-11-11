import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function ProfileScreen() {
  const colors = Colors[useColorScheme()];
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.sheet }]}>
      <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <Text style={{ color: colors.text, fontWeight: "600" }}>
          Your account
        </Text>
        <Text style={{ color: colors.textMuted, marginTop: 4 }}>
          Sign in to sync your data.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16 },
  title: { fontSize: 28, fontWeight: "800" },
  card: { padding: 16, borderRadius: 20, borderWidth: 1 },
});
