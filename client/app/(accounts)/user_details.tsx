import {
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from "react-native";
import React from "react";

import SafeArea from "@/components/SafeArea";

import { COLORS } from "@/styles/colors";

import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";

export default function UserDetails() {
  return (
    <SafeArea>
      <View style={{ flex: 1, padding: 10, backgroundColor: COLORS.sec_color }}>
        <View style={styles.header}>
          <Feather name="chevron-left" size={30} onPress={router.back} />
          <Text style={{ fontFamily: "Raleway-Bold", fontSize: 20 }}>
            Update user details
          </Text>
        </View>
        <View style={{ marginTop: 30, paddingHorizontal: 10 }}>
          <TextInput placeholder="username" style={styles.text_input} />
          <TextInput placeholder="email" style={styles.text_input} />
          <TouchableHighlight style={styles.submit}>
            <Text
              style={{ color: COLORS.sec_color, fontFamily: "Raleway-Bold" }}
            >
              Update
            </Text>
          </TouchableHighlight>
        </View>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
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
