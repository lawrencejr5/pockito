import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function AddTabScreen() {
  const colors = Colors[useColorScheme()];
  const openedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!openedRef.current) {
        openedRef.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        router.push('/add-transaction');
      } else {
        openedRef.current = false;
        router.navigate('/(tabs)');
      }
    }, []),
  );

  return <View style={{ flex: 1, backgroundColor: colors.sheet }} />;
}
