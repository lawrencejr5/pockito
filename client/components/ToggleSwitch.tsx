import React, { useState } from "react";
import { View, TouchableWithoutFeedback, Animated } from "react-native";

import { COLORS } from "@/styles/colors";

const ToggleSwitch = () => {
  const [isOn, setIsOn] = useState(false);
  const translateX = useState(new Animated.Value(0))[0];

  const toggleSwitch = () => {
    Animated.timing(translateX, {
      toValue: isOn ? 0 : 20,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setIsOn(!isOn);
  };

  return (
    <TouchableWithoutFeedback onPress={toggleSwitch}>
      <View
        style={{
          width: 40,
          height: 25,
          borderRadius: 15,
          backgroundColor: isOn ? COLORS.main_color : "grey",
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
