import { NativeTabs } from 'expo-router/native-tabs';

import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';

export default function TabLayout() {
  const colors = Colors[useColorScheme()];

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
      <NativeTabs.Trigger name="report">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          md="bar_chart"
        />
        <NativeTabs.Trigger.Label>Report</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
