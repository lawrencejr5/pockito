import {
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  ScrollView,
  View,
} from "react-native";
import React from "react";

import { Image } from "expo-image";
import { Link } from "expo-router";

import { styles } from "./signin";

const Signup = () => {
  return (
    <ScrollView>
      <View style={styles.container}>
        <Image
          source={require("@/assets/images/48.-Sales-Growth.png")}
          style={styles.image}
        />

        <Text style={styles.header}>Create Account</Text>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Enter username" />
          <TextInput style={styles.input} placeholder="Enter email" />
          <TextInput style={styles.input} placeholder="Enter password" />

          <TouchableHighlight style={styles.button}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableHighlight>
        </View>

        <View style={styles.footer}>
          <Text>Already have an account?</Text>
          <Link href={"/(auth)/signin"} style={styles.link}>
            Login
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default Signup;
