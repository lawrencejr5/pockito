import {
  Text,
  TextInput,
  TouchableHighlight,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  GestureResponderEvent,
} from "react-native";
import React, { useState } from "react";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { styles } from "@/styles/auth.styles";

import { AuthContextType, useAuthContext } from "@/context/AuthContext";
import {
  NotificationContextType,
  useNotificationContext,
} from "@/context/NotificiationContext";

import Notification from "@/components/Notification";

const Signin = () => {
  const router = useRouter();

  // Context
  const { loginUser } = useAuthContext() as AuthContextType;
  const { showNotification, notification } =
    useNotificationContext() as NotificationContextType;

  const [user, setUser] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: GestureResponderEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    if (user == "" || password == "") {
      showNotification("All fields are required", "error");
      setLoading(false);
      return;
    }

    try {
      await loginUser(user, password);
      setLoading(false);
      setTimeout(() => {
        router.push("/(tabs)/home");
      }, 1000);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  return (
    <>
      <Notification notification={notification} />

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
                value={user}
                onChangeText={(text) => setUser(text.trim())}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                secureTextEntry
              />

              <TouchableHighlight style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>
                  {loading ? "Signing in..." : "Login"}
                </Text>
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
    </>
  );
};

export default Signin;
