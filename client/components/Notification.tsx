import { StyleSheet, Text, View, Animated } from "react-native";
import React from "react";

import AntDesign from "@expo/vector-icons/AntDesign";

import {
  NotificationType,
  useNotificationContext,
  NotificationContextType,
} from "@/context/NotificiationContext";

import {
  SettingsContextType,
  useSettingsContext,
} from "@/context/SettingsContext";

const Notification = ({ notification }: { notification: NotificationType }) => {
  const { position, scale } =
    useNotificationContext() as NotificationContextType;

  const { COLORS } = useSettingsContext() as SettingsContextType;
  const styles = create_styles(COLORS);

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
        <Text
          style={[
            styles.notiText,
            { color: notification?.status == "error" ? "red" : "green" },
          ]}
        >
          {notification?.message}
        </Text>
        <AntDesign
          name="exclamationcircle"
          size={16}
          color={notification?.status == "error" ? "red" : "green"}
        />
      </View>
    </Animated.View>
  );
};

export default Notification;

const create_styles = (COLORS: any) =>
  StyleSheet.create({
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
