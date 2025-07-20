import { View, Text, TouchableWithoutFeedback, ScrollView } from "react-native";
import React, { useState } from "react";

import { account_styles } from "@/styles/account.styles";
import { Image } from "expo-image";

import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import ToggleSwitch from "@/components/ToggleSwitch";
import { router } from "expo-router";

import DeleteAccount from "@/components/modals/DeleteAccount";

import { AuthContextType, useAuthContext } from "@/context/AuthContext";

import Notification from "@/components/Notification";
import {
  useNotificationContext,
  NotificationContextType,
} from "@/context/NotificiationContext";
import {
  SettingsContextType,
  useSettingsContext,
} from "@/context/SettingsContext";

const Account = () => {
  const { notification } = useNotificationContext() as NotificationContextType;

  const { signedIn } = useAuthContext() as AuthContextType;

  const { logout } = useAuthContext() as AuthContextType;

  const [showModal, setShowModal] = useState(false);

  const { COLORS } = useSettingsContext() as SettingsContextType;

  const styles = account_styles(COLORS);

  return (
    <>
      <Notification notification={notification} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          {/* Header section */}
          <View style={styles.header}>
            <View style={{ alignItems: "center" }}>
              <Image
                source={require("@/assets/images/undraw_pic-profile_nr49.png")}
                style={{ width: 120, height: 120, borderRadius: 60 }}
              />
              <Text
                style={{
                  fontFamily: "Raleway-SemiBold",
                  fontSize: 25,
                  marginTop: 10,
                  textTransform: "capitalize",
                  width: "100%",
                }}
              >
                {`${signedIn.username}'s account`}
              </Text>
            </View>
          </View>
          {/* Account info section */}
          <View style={styles.setting_sec}>
            <Text
              style={{
                fontFamily: "Raleway-SemiBold",
                fontSize: 16,
                color: "black",
              }}
            >
              <Feather name="settings" color={"black"} size={16} />
              &nbsp;Account Info
            </Text>
            <View style={{ marginTop: 15 }}>
              <TouchableWithoutFeedback
                onPress={() => router.push("/(accounts)/user_details")}
              >
                <View style={styles.setting_card}>
                  <Text style={styles.setting_text}>
                    <Feather name="user" color={"grey"} size={16} />
                    &nbsp;User details
                  </Text>
                  <Feather name="chevron-right" color={"grey"} size={16} />
                </View>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback
                onPress={() => router.push("/(accounts)/change_password")}
              >
                <View style={styles.setting_card}>
                  <Text style={styles.setting_text}>
                    <Feather name="lock" color={"grey"} size={16} />
                    &nbsp;Change password
                  </Text>
                  <Feather name="chevron-right" color={"grey"} size={20} />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
          {/* Preferences section*/}
          <View style={styles.setting_sec}>
            <Text
              style={{
                fontFamily: "Raleway-SemiBold",
                fontSize: 16,
                color: "black",
              }}
            >
              <Feather name="settings" color={"black"} size={16} />
              &nbsp;Preferences
            </Text>
            <View style={{ marginTop: 15 }}>
              <View style={styles.setting_card}>
                <Text style={styles.setting_text}>
                  <Feather name="moon" color={"grey"} size={16} />
                  &nbsp;Dark mode
                </Text>
                <ToggleSwitch setting="theme" />
              </View>
              <View style={styles.setting_card}>
                <Text style={styles.setting_text}>
                  <Feather name="eye-off" color={"grey"} size={16} />
                  &nbsp;Incognito mode
                </Text>
                <ToggleSwitch setting="incognito" />
              </View>
            </View>
          </View>
          {/* Manage account section */}
          <>
            <View style={styles.setting_sec}>
              <Text
                style={{
                  fontFamily: "Raleway-SemiBold",
                  fontSize: 16,
                  color: "black",
                }}
              >
                <Feather name="settings" color={"black"} size={16} />
                &nbsp;Manage account
              </Text>
              <View style={{ marginTop: 15 }}>
                <TouchableWithoutFeedback onPress={() => setShowModal(true)}>
                  <View style={styles.setting_card}>
                    <Text style={styles.setting_text}>
                      <Feather name="trash-2" color={"grey"} size={16} />
                      &nbsp;Delete account and data
                    </Text>
                    <Feather name="chevron-right" color={"grey"} size={20} />
                  </View>
                </TouchableWithoutFeedback>

                <TouchableWithoutFeedback onPress={logout}>
                  <View style={styles.setting_card}>
                    <Text style={styles.setting_text}>
                      <MaterialIcons name="logout" size={16} color="grey" />{" "}
                      &nbsp;Logout
                    </Text>
                    <Feather name="chevron-right" color={"grey"} size={20} />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </View>
            <DeleteAccount
              visibility={showModal}
              onClose={() => setShowModal(false)}
            />
          </>
        </View>
      </ScrollView>
    </>
  );
};

export default Account;
