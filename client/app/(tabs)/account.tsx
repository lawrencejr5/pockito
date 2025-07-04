import { View, Text, TouchableWithoutFeedback } from "react-native";
import React, { useState } from "react";

import { account_styles } from "@/styles/account.styles";
import { Image } from "expo-image";

import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import ToggleSwitch from "@/components/ToggleSwitch";
import { router } from "expo-router";

import DeleteAccount from "@/components/modals/DeleteAccount";

const Account = () => {
  return (
    <View style={account_styles.container}>
      {/* Header section */}
      <Header />
      {/* Account info section */}
      <AccountInfo />
      {/* Preferences section*/}
      <Preferences />
      {/* Manage account section */}
      <ManageAccount />
    </View>
  );
};

export default Account;

// Page components
const Header: React.FC = () => {
  return (
    <View style={account_styles.header}>
      <View style={{ alignItems: "center" }}>
        <Image
          source={require("@/assets/images/avatar2.png")}
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
        <Text
          style={{
            fontFamily: "Raleway-SemiBold",
            fontSize: 25,
            marginTop: 10,
          }}
        >
          Oputa Lawrence
        </Text>
      </View>
    </View>
  );
};

const AccountInfo: React.FC = () => {
  return (
    <View style={account_styles.setting_sec}>
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
          <View style={account_styles.setting_card}>
            <Text style={account_styles.setting_text}>
              <Feather name="user" color={"grey"} size={16} />
              &nbsp;User details
            </Text>
            <Feather name="chevron-right" color={"grey"} size={16} />
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback
          onPress={() => router.push("/(accounts)/change_password")}
        >
          <View style={account_styles.setting_card}>
            <Text style={account_styles.setting_text}>
              <Feather name="lock" color={"grey"} size={16} />
              &nbsp;Change password
            </Text>
            <Feather name="chevron-right" color={"grey"} size={20} />
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

const Preferences: React.FC = () => {
  return (
    <View style={account_styles.setting_sec}>
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
        <View style={account_styles.setting_card}>
          <Text style={account_styles.setting_text}>
            <Feather name="moon" color={"grey"} size={16} />
            &nbsp;Dark mode
          </Text>
          <ToggleSwitch />
        </View>
        <View style={account_styles.setting_card}>
          <Text style={account_styles.setting_text}>
            <Feather name="eye-off" color={"grey"} size={16} />
            &nbsp;Incognito mode
          </Text>
          <ToggleSwitch />
        </View>
      </View>
    </View>
  );
};
const ManageAccount: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <View style={account_styles.setting_sec}>
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
            <View style={account_styles.setting_card}>
              <Text style={account_styles.setting_text}>
                <Feather name="trash-2" color={"grey"} size={16} />
                &nbsp;Delete account and data
              </Text>
              <Feather name="chevron-right" color={"grey"} size={20} />
            </View>
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback
            onPress={() => router.push("/(auth)/signin")}
          >
            <View style={account_styles.setting_card}>
              <Text style={account_styles.setting_text}>
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
  );
};
