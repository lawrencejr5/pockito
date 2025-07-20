import { View, StatusBar, Platform } from "react-native";
import React from "react";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  SettingsContextType,
  useSettingsContext,
} from "@/context/SettingsContext";

export default function SafeArea({ children }: any) {
  const insets = useSafeAreaInsets();

  const { COLORS, theme } = useSettingsContext() as SettingsContextType;

  return (
    <View
      style={{
        paddingTop: 20,
        paddingBottom: 5,
        flex: 1,
        backgroundColor: COLORS.sec_color,
      }}
    >
      <StatusBar
        barStyle={theme ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />
      {children}
    </View>
  );
}
