import {
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from "react-native";
import React, { useState } from "react";

import SafeArea from "@/components/SafeArea";

import {
  SettingsContextType,
  useSettingsContext,
} from "@/context/SettingsContext";

import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";

import Notification from "@/components/Notification";

import {
  useNotificationContext,
  NotificationContextType,
} from "@/context/NotificiationContext";

import {
  AuthContextType,
  PasswordType,
  useAuthContext,
} from "@/context/AuthContext";

export default function ChangePassword() {
  const { notification } = useNotificationContext() as NotificationContextType;

  const { updatePassword, logout } = useAuthContext() as AuthContextType;

  const [loading, setLoading] = useState<boolean>(false);
  const [input, setInput] = useState<PasswordType>({
    newPassword: "",
    oldPassword: "",
    confirmPassword: "",
  });
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await updatePassword(input);
      setLoading(false);

      setInput({ newPassword: "", oldPassword: "", confirmPassword: "" });

      setTimeout(() => {
        logout();
      }, 1000);
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  };

  const { COLORS } = useSettingsContext() as SettingsContextType;
  const styles = create_styles(COLORS);

  return (
    <>
      <Notification notification={notification} />
      <SafeArea>
        <View
          style={{ flex: 1, padding: 10, backgroundColor: COLORS.sec_color }}
        >
          <View style={styles.header}>
            <Feather name="chevron-left" size={30} onPress={router.back} />
            <Text style={{ fontFamily: "Raleway-Bold", fontSize: 20 }}>
              Change password
            </Text>
          </View>
          <View style={{ marginTop: 30, paddingHorizontal: 10 }}>
            <TextInput
              placeholder="old password"
              style={styles.text_input}
              value={input.oldPassword}
              onChangeText={(text) =>
                setInput((prev) => ({ ...prev, oldPassword: text }))
              }
              secureTextEntry
            />
            <TextInput
              placeholder="new password"
              style={styles.text_input}
              value={input.newPassword}
              onChangeText={(text) =>
                setInput((prev) => ({ ...prev, newPassword: text }))
              }
              secureTextEntry
            />
            <TextInput
              placeholder="confirm password"
              style={styles.text_input}
              value={input.confirmPassword}
              onChangeText={(text) =>
                setInput((prev) => ({ ...prev, confirmPassword: text }))
              }
              secureTextEntry
            />
            <TouchableHighlight style={styles.submit} onPress={handleSubmit}>
              <Text
                style={{ color: COLORS.sec_color, fontFamily: "Raleway-Bold" }}
              >
                {loading ? "Updating..." : "Update"}
              </Text>
            </TouchableHighlight>
          </View>
        </View>
      </SafeArea>
    </>
  );
}

const create_styles = (COLORS: any) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      gap: 15,
      marginTop: 10,
    },
    text_input: {
      borderColor: COLORS.border_color,
      fontFamily: "Raleway-SemiBold",
      borderStyle: "solid",
      borderWidth: 1,
      paddingHorizontal: 10,
      borderRadius: 7,
      marginBottom: 25,
    },
    submit: {
      backgroundColor: COLORS.main_color,
      paddingVertical: 15,
      paddingHorizontal: 10,
      borderRadius: 10,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
  });
