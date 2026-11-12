import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryPicker } from '@/components/CategoryPicker';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import { useCurrency } from '@/components/CurrencyProvider';
import { useTransactions } from '@/components/TransactionsProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';
import { getCategory, type TransactionType } from '@/constants/categories';
import { CURRENCIES, type CurrencyCode } from '@/constants/currencies';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'] as const;

function formatWhen(date: Date) {
  const now = new Date();
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return `Today  ${time}`;
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${day}  ${time}`;
}

export default function AddTransactionScreen() {
  const colors = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();
  const { currency: appCurrency } = useCurrency();
  const { addTransaction } = useTransactions();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountText, setAmountText] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(appCurrency.code);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const currency = CURRENCIES[currencyCode];
  const accent = type === 'expense' ? colors.expense : colors.income;
  const amount = parseFloat(amountText || '0') || 0;
  const canSave = amount > 0 && !!categoryId;

  const press = (key: (typeof KEYS)[number]) => {
    Haptics.selectionAsync().catch(() => {});
    setAmountText((prev) => {
      if (key === 'back') return prev.slice(0, -1);
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev === '' ? '0.' : prev + '.';
      }
      const [int, dec] = prev.split('.');
      if (dec !== undefined && dec.length >= 2) return prev;
      if (dec === undefined && int.length >= 9) return prev;
      if (prev === '0') return key; // no leading zeros
      return prev + key;
    });
  };

  const changeType = (next: TransactionType) => {
    if (next === type) return;
    Haptics.selectionAsync().catch(() => {});
    setType(next);
    setCategoryId(null);
  };

  const openDate = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'date',
        onChange: (_e, picked) => {
          if (!picked) return;
          DateTimePickerAndroid.open({
            value: picked,
            mode: 'time',
            onChange: (_e2, finalDate) => finalDate && setDate(finalDate),
          });
        },
      });
    } else {
      setDateOpen(true);
    }
  };

  const onIosDateChange = (_e: DateTimePickerEvent, picked?: Date) => {
    if (picked) setDate(picked);
  };

  const pickReceipt = () => {
    const fromLibrary = async () => {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!res.canceled) setReceiptUri(res.assets[0].uri);
    };
    const fromCamera = async () => {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera access needed', 'Enable camera access in Settings to take a photo.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!res.canceled) setReceiptUri(res.assets[0].uri);
    };
    Alert.alert('Add receipt', undefined, [
      { text: 'Take photo', onPress: fromCamera },
      { text: 'Choose from library', onPress: fromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const save = () => {
    if (!canSave || !categoryId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    addTransaction({
      type,
      title: title.trim() || getCategory(categoryId).label,
      amountUsd: amount / currency.rate,
      currency: currencyCode,
      originalAmount: amount,
      categoryId,
      receiptUri: receiptUri ?? undefined,
      date: date.toISOString(),
    });
    router.back();
  };

  const display = amountText === '' ? '0' : amountText.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <View style={[styles.screen, { backgroundColor: colors.sheet, paddingTop: 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.roundBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="close" size={20} color={colors.text} />
        </Pressable>

        <View style={[styles.toggle, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {(['income', 'expense'] as const).map((t) => {
            const active = t === type;
            const tint = t === 'expense' ? colors.expense : colors.income;
            return (
              <Pressable
                key={t}
                onPress={() => changeType(t)}
                style={[styles.toggleItem, active && { backgroundColor: tint + '26' }]}>
                <Ionicons name={t === 'expense' ? 'arrow-up' : 'arrow-down'} size={14} color={tint} />
                <Text style={[styles.toggleText, { color: active ? tint : colors.textMuted }]}>
                  {t === 'expense' ? 'Expense' : 'Income'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.roundBtn} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {/* Amount */}
        <View style={styles.amountWrap}>
          <Text
            style={[styles.amount, { color: amountText ? accent : colors.textMuted }]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {currency.symbol}
            {display}
          </Text>
          <Text style={[styles.amountCode, { color: colors.textMuted }]}>{currency.code}</Text>
        </View>

        {/* Chips */}
        <View style={styles.chipRow}>
          <Pressable
            onPress={openDate}
            style={[styles.chip, { flex: 1, backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
              {formatWhen(date)}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setCurrencyOpen(true)}
            style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.chipText, { color: colors.text }]}>{currency.code}</Text>
            <Ionicons name="chevron-down" size={13} color={colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={pickReceipt}
            style={[
              styles.chip,
              { backgroundColor: colors.card, borderColor: receiptUri ? colors.tint : colors.cardBorder },
            ]}>
            <Ionicons name="camera-outline" size={18} color={receiptUri ? colors.tint : colors.textMuted} />
          </Pressable>
        </View>

        {receiptUri && (
          <View style={[styles.receipt, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Image source={{ uri: receiptUri }} style={styles.receiptImg} />
            <Text style={[styles.receiptText, { color: colors.text }]}>Receipt attached</Text>
            <Pressable onPress={() => setReceiptUri(null)} hitSlop={10}>
              <Ionicons name="close-circle" size={22} color={colors.textMuted} />
            </Pressable>
          </View>
        )}

        {/* Title */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title (e.g. Grocery run)"
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          style={[
            styles.input,
            { color: colors.text, backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        />

        {/* Category */}
        <CategoryPicker type={type} value={categoryId} onChange={setCategoryId} />

        {/* Keypad */}
        <View style={styles.keypad}>
          {KEYS.map((k) => (
            <Pressable
              key={k}
              onPress={() => press(k)}
              style={({ pressed }) => [
                styles.key,
                { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.6 : 1 },
              ]}>
              {k === 'back' ? (
                <Ionicons name="backspace-outline" size={24} color={colors.text} />
              ) : (
                <Text style={[styles.keyText, { color: colors.text }]}>{k}</Text>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Save */}
      <View style={[styles.saveWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={save}
          disabled={!canSave}
          style={[styles.save, { backgroundColor: colors.accent, opacity: canSave ? 1 : 0.4 }]}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>

      <CurrencyPicker
        visible={currencyOpen}
        onClose={() => setCurrencyOpen(false)}
        selected={currencyCode}
        onSelect={setCurrencyCode}
      />

      {Platform.OS === 'ios' && (
        <Modal visible={dateOpen} transparent animationType="slide" onRequestClose={() => setDateOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setDateOpen(false)} />
          <View style={[styles.dateSheet, { backgroundColor: colors.sheet, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.dateHeader}>
              <Text style={[styles.dateTitle, { color: colors.text }]}>Date & time</Text>
              <Pressable onPress={() => setDateOpen(false)} hitSlop={10}>
                <Text style={[styles.done, { color: colors.tint }]}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={date}
              mode="datetime"
              display="spinner"
              themeVariant="dark"
              onChange={onIosDateChange}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  toggle: { flexDirection: 'row', padding: 4, borderRadius: 999, borderWidth: 1, gap: 4 },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  toggleText: { fontFamily: fonts.semiBold, fontSize: 13 },

  content: { padding: 20, gap: 14, paddingBottom: 12 },

  amountWrap: { alignItems: 'center', paddingVertical: 14 },
  amount: { fontFamily: fonts.bold, fontSize: 52, maxWidth: '100%' },
  amountCode: { fontFamily: fonts.medium, fontSize: 13, marginTop: 2 },

  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipText: { fontFamily: fonts.medium, fontSize: 13 },

  receipt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  receiptImg: { width: 44, height: 44, borderRadius: 10 },
  receiptText: { flex: 1, fontFamily: fonts.medium, fontSize: 13 },

  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 15,
  },

  keypad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  key: {
    width: '31.8%',
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontFamily: fonts.semiBold, fontSize: 22 },

  saveWrap: { paddingHorizontal: 20, paddingTop: 8 },
  save: { height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: fonts.bold, fontSize: 16, color: '#1c1a17' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  dateSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dateTitle: { fontFamily: fonts.bold, fontSize: 18 },
  done: { fontFamily: fonts.semiBold, fontSize: 16 },
});
