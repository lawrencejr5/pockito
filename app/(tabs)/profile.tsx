import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';

export default function ProfileScreen() {
  const colors = Colors[useColorScheme()];
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.sheet }]}>
      <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Your account</Text>
        <Text style={[styles.cardSub, { color: colors.textMuted }]}>Sign in to sync your data.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16 },
  title: { fontSize: 26, fontFamily: fonts.bold },
  card: { padding: 16, borderRadius: 20, borderWidth: 1 },
  cardTitle: { fontFamily: fonts.semiBold, fontSize: 15 },
  cardSub: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
});
