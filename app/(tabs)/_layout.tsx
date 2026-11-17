import * as Haptics from 'expo-haptics';
import { router, useSegments } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';

import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';

export default function TabLayout() {
  const colors = Colors[useColorScheme()];
  const segments = useSegments();

  return (
    <NativeTabs
      tintColor={colors.tabIconSelected}
      iconColor={{ default: colors.tabIconDefault, selected: colors.tabIconSelected }}
      labelStyle={{
        default: { color: colors.tabIconDefault, fontFamily: fonts.medium },
        selected: { color: colors.tabIconSelected, fontFamily: fonts.semiBold },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="wealth">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'briefcase', selected: 'briefcase.fill' }}
          md="account_balance_wallet"
        />
        <NativeTabs.Trigger.Label>Wealth</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="add"
        role="search"
        disabled
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            if (segments[1] === 'wealth') {
              router.push({ pathname: '/wealth-item', params: { kind: 'asset' } });
            } else {
              router.push('/add-transaction');
            }
          },
        }}>
        <NativeTabs.Trigger.Icon sf={{ default: 'plus', selected: 'plus' }} md="add" />
        <NativeTabs.Trigger.Label hidden />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
