import React, { useRef, useEffect } from "react";
import { View, TouchableWithoutFeedback, Animated } from "react-native";

import {
  SettingsContextType,
  useSettingsContext,
} from "@/context/SettingsContext";

type SettingType = "incognito" | "theme";

const ToggleSwitch: React.FC<{ setting: SettingType }> = ({ setting }) => {
  const { incognito, toggleIncognito, theme, toggleTheme } =
    useSettingsContext() as SettingsContextType;

  // Dynamically select value and toggle function
  const value = setting === "incognito" ? incognito : theme;
  const toggle = setting === "incognito" ? toggleIncognito : toggleTheme;

  const translateX = useRef(new Animated.Value(value ? 20 : 0)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 20 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value]);

  const { COLORS } = useSettingsContext() as SettingsContextType;

  return (
    <TouchableWithoutFeedback onPress={toggle}>
      <View
        style={{
          width: 40,
          height: 25,
          borderRadius: 15,
          backgroundColor: value ? COLORS.main_color : "grey",
          justifyContent: "center",
          padding: 4,
        }}
      >
        <Animated.View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: "white",
            transform: [{ translateX }],
          }}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ToggleSwitch;
