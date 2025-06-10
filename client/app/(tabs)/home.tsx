import { Link } from "expo-router";
import { Image } from "expo-image";
import { Text, View, Button, StyleSheet } from "react-native";

export default function Home() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  button: {
    width: "90%",
  },
});
