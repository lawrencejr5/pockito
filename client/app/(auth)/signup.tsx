import {
  Text,
  TextInput,
  TouchableHighlight,
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
  GestureResponderEvent,
} from "react-native";

import { useRouter } from "expo-router";

import React, { useState } from "react";

import { Image } from "expo-image";
import { Link } from "expo-router";

import Notification from "@/components/Notification";

import { styles } from "@/styles/auth.styles";

import {
  AuthContextType,
  useAuthContext,
  UserType,
} from "@/context/AuthContext";
import {
  NotificationContextType,
  useNotificationContext,
} from "@/context/NotificiationContext";

const Signup = () => {
  const router = useRouter();

  // Context
  const { registerUser } = useAuthContext() as AuthContextType;
  const { showNotification, notification } =
    useNotificationContext() as NotificationContextType;

  // States
  const [input, setInput] = useState<UserType>({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Handle submit function
  const handleSubmit = async (e: GestureResponderEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    const { username, email, password } = input;

    if (username == "" || email == "" || password == "") {
      showNotification("All fields are required", "error");
      setLoading(false);
      return;
    }
    try {
      await registerUser(username, email, password);
      setLoading(false);
      setTimeout(() => {
        router.push("/(tabs)/home");
      }, 1000);
    } catch (err: any) {
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
              source={require("@/assets/images/undraw_in-the-office_e7pg.png")}
              style={styles.image}
            />

            <Text style={styles.header}>Create Account</Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                autoCapitalize="none"
                value={input.username}
                onChangeText={(text) =>
                  setInput((prev) => ({ ...prev, username: text.trim() }))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Enter email"
                autoCapitalize="none"
                value={input.email}
                onChangeText={(text) =>
                  setInput((prev) => ({ ...prev, email: text.trim() }))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                autoCapitalize="none"
                value={input.password}
                onChangeText={(text) =>
                  setInput((prev) => ({ ...prev, password: text }))
                }
                secureTextEntry
              />

              <TouchableHighlight style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>
                  {loading ? "Registering..." : "Register"}
                </Text>
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
    </>
  );
};

export default Signup;
