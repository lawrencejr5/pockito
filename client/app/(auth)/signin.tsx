import {
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from "react-native";
import React from "react";

import { Image } from "expo-image";
import { Link } from "expo-router";

const Signin = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/38.-Planning.png")}
        style={styles.image}
      />
      <Text style={styles.header}>Welcome back</Text>

      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Enter username" />
        <TextInput style={styles.input} placeholder="Enter password" />

        <TouchableHighlight style={styles.button}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableHighlight>
      </View>

      <View style={styles.footer}>
        <Text style={{ fontFamily: "Poppins-Regular" }}>
          Dont't have an account?
        </Text>
        <Link href={"/(auth)/signup"} style={styles.link}>
          Register
        </Link>
      </View>
    </View>
  );
};

export default Signin;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 50,
    fontFamily: "Poppins-Regular",
  },
  image: {
    height: 300,
    width: 350,
    borderRadius: 10,
    borderColor: "dodgerblue",
    borderStyle: "solid",
    borderWidth: 2,
  },
  header: {
    fontSize: 30,
    fontWeight: 600,
    marginTop: 20,
    fontFamily: "Poppins-Regular",
  },
  form: {
    width: "100%",
    marginTop: 30,
  },
  input: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "grey",
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 15,
    fontFamily: "Poppins-Regular",
  },
  button: {
    backgroundColor: "dodgerblue",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#f5f5f5",
    fontWeight: 600,
    fontFamily: "Poppins-Regular",
  },
  footer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 5,
    width: "100%",
    fontFamily: "Poppins-Regular",
  },
  link: {
    color: "dodgerblue",
    fontWeight: 600,
    fontFamily: "Poppins-Regular",
  },
});
