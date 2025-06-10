import {
  Text,
  TextInput,
  TouchableHighlight,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
} from "react-native";
import React from "react";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { styles } from "@/styles/auth.styles";

const Signin = () => {
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
            source={require("@/assets/images/undraw_printing-invoices_osgs.png")}
            style={styles.image}
          />
          <Text style={styles.header}>Welcome back</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Enter username"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              secureTextEntry
            />

            <TouchableHighlight style={styles.button}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableHighlight>
          </View>

          <View style={styles.footer}>
            <Text style={{ fontFamily: "Raleway-Regular" }}>
              Don't have an account?
            </Text>
            <Link href={"/(auth)/signup"} style={styles.link}>
              Register
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Signin;
