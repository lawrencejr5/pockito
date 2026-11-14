import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCurrency } from '@/components/CurrencyProvider';
import { useWealth, type WealthItem } from '@/components/WealthProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';
import { CURRENCIES, CURRENCY_LIST, type CurrencyCode } from '@/constants/currencies';
import {
  ASSET_CATEGORIES,
  LIABILITY_CATEGORIES,
  type WealthKind,
} from '@/constants/wealth';

export type WealthItemSheetHandle = {
  open: (opts?: { kind?: WealthKind; item?: WealthItem }) => void;
  close: () => void;
};

function formatAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned) return '';
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex === -1) {
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  const intPart = cleaned.slice(0, dotIndex).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decPart = cleaned.slice(dotIndex + 1).replace(/\./g, '');
  return `${intPart || '0'}.${decPart}`;
}

export const WealthItemSheet = forwardRef<WealthItemSheetHandle>(function WealthItemSheet(_, ref) {
  const colors = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();
  const { currency: appCurrency } = useCurrency();
  const { addItem, updateItem, deleteItem } = useWealth();

  const sheetRef = useRef<BottomSheetModal>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [kind, setKind] = useState<WealthKind>('asset');
  const [categoryId, setCategoryId] = useState<string>('cash');
  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [itemCurrency, setItemCurrency] = useState<CurrencyCode>(appCurrency.code);
  const [note, setNote] = useState('');

  useImperativeHandle(ref, () => ({
    open: (opts) => {
      if (opts?.item) {
        const it = opts.item;
        setEditingId(it.id);
        setKind(it.kind);
        setCategoryId(it.categoryId);
        setName(it.name);
        setAmountText(formatAmountInput(String(it.originalAmount)));
        setItemCurrency(it.currency);
        setNote(it.note ?? '');
      } else {
        const nextKind = opts?.kind ?? 'asset';
        setEditingId(null);
        setKind(nextKind);
        setCategoryId(nextKind === 'asset' ? ASSET_CATEGORIES[0].id : LIABILITY_CATEGORIES[0].id);
        setName('');
        setAmountText('');
        setItemCurrency(appCurrency.code);
        setNote('');
      }
      sheetRef.current?.present();
    },
    close: () => {
      sheetRef.current?.dismiss();
    },
  }));

  const categories = kind === 'asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;

  const handleKindChange = (nextKind: WealthKind) => {
    if (nextKind === kind) return;
    Haptics.selectionAsync().catch(() => {});
    setKind(nextKind);
    const list = nextKind === 'asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;
    if (!list.some((c) => c.id === categoryId)) {
      setCategoryId(list[0].id);
    }
  };

  const handleSave = () => {
    const cleanName = name.trim();
    const numeric = Number(amountText.replace(/,/g, '').trim());

    if (!cleanName) {
      Alert.alert('Missing name', 'Please enter a name for this item.');
      return;
    }
    if (!Number.isFinite(numeric) || numeric <= 0) {
      Alert.alert('Invalid amount', 'Please enter an amount greater than 0.');
      return;
    }

    const rate = CURRENCIES[itemCurrency].rate;
    const amountUsd = numeric / rate;

    const payload = {
      kind,
      categoryId,
      name: cleanName,
      amountUsd,
      currency: itemCurrency,
      originalAmount: numeric,
      note: note.trim() || undefined,
    };

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (editingId) {
      updateItem(editingId, payload);
    } else {
      addItem(payload);
    }
    sheetRef.current?.dismiss();
  };

  const handleDelete = () => {
    if (!editingId) return;
    Alert.alert('Delete Item', `Remove "${name.trim() || 'this item'}" from your wealth sheet?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          deleteItem(editingId);
          sheetRef.current?.dismiss();
        },
      },
    ]);
  };

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

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['86%']}
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      backgroundStyle={[styles.sheetBg, { backgroundColor: colors.sheet }]}
      handleIndicatorStyle={{ backgroundColor: colors.cardBorder, width: 38 }}>
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 16 },
        ]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>
            {editingId ? 'Edit Wealth Item' : 'Add Wealth Item'}
          </Text>
          {editingId && (
            <Pressable
              onPress={handleDelete}
              hitSlop={10}
              style={[styles.deleteBtn, { backgroundColor: 'rgba(220,38,38,0.12)' }]}>
              <Ionicons name="trash-outline" size={18} color={colors.expense} />
            </Pressable>
          )}
        </View>

        {/* Asset / Liability Toggle */}
        <View style={[styles.kindBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {(['asset', 'liability'] as const).map((k) => {
            const active = k === kind;
            return (
              <Pressable
                key={k}
                onPress={() => handleKindChange(k)}
                style={[
                  styles.kindBtn,
                  active && {
                    backgroundColor: k === 'asset' ? colors.accent : 'rgba(220,38,38,0.14)',
                  },
                ]}>
                <Text
                  style={[
                    styles.kindText,
                    {
                      color: active
                        ? k === 'asset'
                          ? '#1c1a17'
                          : colors.expense
                        : colors.textMuted,
                      fontFamily: active ? fonts.semiBold : fonts.medium,
                    },
                  ]}>
                  {k === 'asset' ? 'Asset / Possession' : 'Liability / Debt'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Name */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Name</Text>
          <BottomSheetTextInput
            value={name}
            onChangeText={setName}
            placeholder={
              kind === 'asset'
                ? 'e.g. Zenith Savings, 2021 MacBook Pro, Land'
                : 'e.g. Car Loan, Credit Card, Student Loan'
            }
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          />
        </View>

        {/* Amount + Currency */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Estimated Value</Text>
          <View style={styles.amountRow}>
            <View
              style={[
                styles.amountBox,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}>
              <Text style={[styles.currencySymbol, { color: colors.textMuted }]}>
                {CURRENCIES[itemCurrency].symbol}
              </Text>
              <BottomSheetTextInput
                value={amountText}
                onChangeText={(text) => setAmountText(formatAmountInput(text))}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                style={[styles.amountInput, { color: colors.text }]}
              />
            </View>
          </View>

          <View style={styles.currencyRow}>
            {CURRENCY_LIST.map((c) => {
              const active = c.code === itemCurrency;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setItemCurrency(c.code);
                  }}
                  style={[
                    styles.currencyPill,
                    {
                      backgroundColor: active ? colors.accent : colors.card,
                      borderColor: active ? colors.tint : colors.cardBorder,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.currencyPillText,
                      {
                        color: active ? '#1c1a17' : colors.textMuted,
                        fontFamily: active ? fonts.semiBold : fonts.medium,
                      },
                    ]}>
                    {c.symbol} {c.code}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Category</Text>
          <View style={styles.catGrid}>
            {categories.map((cat) => {
              const active = cat.id === categoryId;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setCategoryId(cat.id);
                  }}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: active ? cat.bg : colors.card,
                      borderColor: active ? cat.color : colors.cardBorder,
                    },
                  ]}>
                  <Ionicons
                    name={cat.icon}
                    size={16}
                    color={active ? cat.color : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.catLabel,
                      {
                        color: active ? cat.color : colors.text,
                        fontFamily: active ? fonts.semiBold : fonts.medium,
                      },
                    ]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Note */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Note (Optional)</Text>
          <BottomSheetTextInput
            value={note}
            onChangeText={setNote}
            placeholder="Account number, valuation note, due date..."
            placeholderTextColor={colors.textMuted}
            multiline
            style={[
              styles.input,
              styles.noteInput,
              {
                color: colors.text,
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          />
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          style={[
            styles.saveBtn,
            { backgroundColor: kind === 'asset' ? colors.accent : colors.expense },
          ]}>
          <Text
            style={[
              styles.saveBtnText,
              { color: kind === 'asset' ? '#1c1a17' : '#ffffff' },
            ]}>
            {editingId ? 'Save Changes' : `Add ${kind === 'asset' ? 'Asset' : 'Liability'}`}
          </Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  sheetBg: { borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  content: { paddingHorizontal: 20, paddingTop: 6, gap: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.bold, fontSize: 20 },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  kindBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  kindText: { fontSize: 13 },
  field: { gap: 8 },
  label: { fontFamily: fonts.medium, fontSize: 13 },
  input: {
    fontFamily: fonts.medium,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noteInput: { minHeight: 72, textAlignVertical: 'top' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  currencySymbol: { fontFamily: fonts.bold, fontSize: 18 },
  amountInput: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 20,
    paddingVertical: 6,
  },
  currencyRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  currencyPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  currencyPillText: { fontSize: 12 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  catLabel: { fontSize: 13 },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { fontFamily: fonts.semiBold, fontSize: 15 },
});

