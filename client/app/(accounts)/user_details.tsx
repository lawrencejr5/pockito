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

import { useAuthContext, AuthContextType } from "@/context/AuthContext";

import {
  useNotificationContext,
  NotificationContextType,
} from "@/context/NotificiationContext";

import Notification from "@/components/Notification";

export default function UserDetails() {
  const { notification } = useNotificationContext() as NotificationContextType;

  const { signedIn, updateUserDetails, logout } =
    useAuthContext() as AuthContextType;

  const [username, setUsername] = useState<string | undefined>(
    signedIn.username
  );

  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await updateUserDetails({ username });
      setLoading(false);

      setTimeout(() => {
        logout();
      }, 1000);
    } catch (err) {
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
            <Feather
              name="chevron-left"
              color={COLORS.sec_color2}
              size={30}
              onPress={router.back}
            />
            <Text
              style={{
                fontFamily: "Raleway-Bold",
                fontSize: 20,
                color: COLORS.sec_color2,
              }}
            >
              Update user details
            </Text>
          </View>
          <View style={{ marginTop: 30, paddingHorizontal: 10 }}>
            <TextInput
              placeholder="username"
              style={styles.text_input}
              value={username}
              onChangeText={setUsername}
            />
            <TextInput
              placeholder="email"
              style={[styles.text_input, { backgroundColor: COLORS.grey }]}
              value={signedIn?.email}
              editable={false}
            />
            <TouchableHighlight style={styles.submit} onPress={handleSubmit}>
              <Text style={{ color: COLORS.white, fontFamily: "Raleway-Bold" }}>
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
      borderStyle: "solid",
      borderWidth: 1,
      paddingHorizontal: 10,
      borderRadius: 7,
      marginBottom: 25,
      fontFamily: "Raleway-SemiBold",
      backgroundColor: COLORS.white,
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
