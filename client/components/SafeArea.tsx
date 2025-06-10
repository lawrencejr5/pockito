import { View } from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SafeArea({ children }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: 20,
        paddingBottom: 10,
        flex: 1,
        backgroundColor: "#fff",
      }}
    >
      {children}
    </View>
  );
}
