import React, { useState } from "react";
import { View, TouchableWithoutFeedback, Animated } from "react-native";

import { COLORS } from "@/styles/colors";

import {
  SettingsContextType,
  useSettingsContext,
} from "@/context/SettingsContext";

type SettingType = "incognito" | "theme";

const ToggleSwitch: React.FC<{ setting: SettingType }> = ({ setting }) => {
  const { incognito, toggleIncognito } =
    useSettingsContext() as SettingsContextType;

  const translateX = useState(new Animated.Value(incognito ? 20 : 0))[0];

  React.useEffect(() => {
    if (setting === "incognito") {
      Animated.timing(translateX, {
        toValue: incognito ? 20 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [incognito]);

  const toggleSwitch = () => {
    if (setting === "incognito") {
      toggleIncognito();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={toggleSwitch}>
      <View
        style={{
          width: 40,
          height: 25,
          borderRadius: 15,
          backgroundColor:
            setting === "incognito" && incognito ? COLORS.main_color : "grey",
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
