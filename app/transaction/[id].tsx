import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { TransactionForm } from '@/components/TransactionForm';
import { useTransactions } from '@/components/TransactionsProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions } = useTransactions();
  const colors = Colors[useColorScheme()];
  const transaction = transactions.find((t) => t.id === id);

  if (!transaction) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.sheet }]}>
        <Text style={[styles.text, { color: colors.textMuted }]}>Transaction not found</Text>
      </View>
    );
  }

  return <TransactionForm key={transaction.id} transaction={transaction} />;
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.medium, fontSize: 15 },
});

