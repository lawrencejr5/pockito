import { StyleSheet, Text, View, Dimensions, Animated } from "react-native";
import React, { useEffect, useRef, useState } from "react";

import { COLORS } from "@/styles/colors";

import AntDesign from "@expo/vector-icons/AntDesign";

const { height } = Dimensions.get("window");

const Notification = () => {
  const position = useRef(new Animated.Value(-100)).current;
  const scale = useRef(new Animated.Value(0)).current;

  const notify = () => {
    Animated.parallel([
      Animated.spring(scale, {
        friction: 7,
        tension: 40,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(position, {
        duration: 300,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeNotify = () => {
    Animated.parallel([
      Animated.spring(scale, {
        friction: 7,
        tension: 40,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(position, {
        duration: 300,
        toValue: -100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    notify();

    setTimeout(() => {
      closeNotify();
    }, 4000);
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: position }, { scale: scale }],
        },
      ]}
    >
      <View style={styles.notification}>
        <Text style={styles.notiText}>Deleted</Text>
        <AntDesign name="exclamationcircle" size={16} color="red" />
      </View>
    </Animated.View>
  );
};

export default Notification;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    zIndex: 2,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    padding: 10,
  },
  notification: {
    width: 300,
    backgroundColor: COLORS.sec_color,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 5,
    padding: 10,
    borderRadius: 10,
  },
  notiText: {
    color: "red",
    fontFamily: "Raleway-Bold",
  },
});
