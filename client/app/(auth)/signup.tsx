import {
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import React from "react";

import { Image } from "expo-image";
import { Link } from "expo-router";

import { styles } from "@/styles/auth.styles";

const Signup = () => {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={64} // adjust offset as needed
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Image
            source={require("@/assets/images/undraw_in-the-office_e7pg.png")}
            style={styles.image}
          />

          <Text style={styles.header}>Create Account</Text>

          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="Enter username" />
            <TextInput style={styles.input} placeholder="Enter email" />
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              secureTextEntry
            />

            <TouchableHighlight style={styles.button}>
              <Text style={styles.buttonText}>Register</Text>
            </TouchableHighlight>
          </View>

          <View style={styles.footer}>
            <Text style={{ fontFamily: "Raleway-Regular" }}>
              Already have an account?
            </Text>
            <Link href={"/(auth)/signin"} style={styles.link}>
              Login
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Signup;
