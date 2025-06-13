import { View, Text } from "react-native";
import React from "react";

import { account_styles } from "@/styles/account.styles";
import { Image } from "expo-image";

import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import ToggleSwitch from "@/components/ToggleSwitch";

const Account = () => {
  return (
    <View style={account_styles.container}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 50,
          width: "100%",
        }}
      >
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
      <View style={{ marginTop: 40 }}>
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
          <View style={account_styles.setting_card}>
            <Text style={account_styles.setting_text}>
              <Feather name="user" color={"grey"} size={16} />
              &nbsp;User details
            </Text>
            <Feather name="chevron-right" color={"grey"} size={16} />
          </View>
          <View style={account_styles.setting_card}>
            <Text style={account_styles.setting_text}>
              <Feather name="lock" color={"grey"} size={16} />
              &nbsp;Change password
            </Text>
            <Feather name="chevron-right" color={"grey"} size={20} />
          </View>
        </View>
      </View>
      <View style={{ marginTop: 20 }}>
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
      <View style={{ marginTop: 20 }}>
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
          <View style={account_styles.setting_card}>
            <Text style={account_styles.setting_text}>
              <Feather name="trash-2" color={"grey"} size={16} />
              &nbsp;Delete account and data
            </Text>
            <Feather name="chevron-right" color={"grey"} size={20} />
          </View>
          <View style={account_styles.setting_card}>
            <Text style={account_styles.setting_text}>
              <MaterialIcons name="logout" size={16} color="grey" />{" "}
              &nbsp;Logout
            </Text>
            <Feather name="chevron-right" color={"grey"} size={20} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default Account;
