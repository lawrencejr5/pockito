import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';
import { categoriesFor, type Category, type TransactionType } from '@/constants/categories';

type Props = {
  type: TransactionType;
  value: string | null;
  onChange: (id: string) => void;
};

export function CategoryPicker({ type, value, onChange }: Props) {
  const colors = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();
  const [listOpen, setListOpen] = useState(false);
  const [query, setQuery] = useState('');
  const categories = categoriesFor(type);

  const filtered = useMemo(
    () => categories.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase())),
    [categories, query],
  );

  const select = (c: Category) => {
    Haptics.selectionAsync().catch(() => {});
    onChange(c.id);
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Category</Text>
        <Pressable onPress={() => setListOpen(true)} hitSlop={8}>
          <Text style={[styles.seeAll, { color: colors.tint }]}>See all</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {categories.map((c) => {
          const active = c.id === value;
          return (
            <Pressable
              key={c.id}
              onPress={() => select(c)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? c.color + '26' : colors.card,
                  borderColor: active ? c.color : colors.cardBorder,
                },
              ]}>
              <Ionicons name={c.icon} size={18} color={c.color} />
              <Text style={[styles.chipText, { color: active ? c.color : colors.text }]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Modal visible={listOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setListOpen(false)}>
        <View style={[styles.modal, { backgroundColor: colors.sheet }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose category</Text>
            <Pressable onPress={() => setListOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(c) => c.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 10, paddingBottom: 90 }}
            renderItem={({ item }) => {
              const active = item.id === value;
              return (
                <Pressable
                  onPress={() => {
                    select(item);
                    setListOpen(false);
                    setQuery('');
                  }}
                  style={[
                    styles.listRow,
                    { backgroundColor: colors.card, borderColor: active ? item.color : colors.cardBorder },
                  ]}>
                  <View style={[styles.listBadge, { backgroundColor: item.color + '26' }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={[styles.listText, { color: colors.text }]}>{item.label}</Text>
                  {active && <Ionicons name="checkmark-circle" size={22} color={item.color} />}
                </Pressable>
              );
            }}
          />

          <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.cardBorder, bottom: insets.bottom + 12 }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontFamily: fonts.medium, fontSize: 13 },
  seeAll: { fontFamily: fonts.semiBold, fontSize: 13 },
  chips: { gap: 8, paddingRight: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipText: { fontFamily: fonts.medium, fontSize: 13 },

  modal: { flex: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: fonts.bold, fontSize: 18 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  listBadge: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 15 },
  search: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15 },
});

