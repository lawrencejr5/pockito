import { Link } from "expo-router";
import { Image } from "expo-image";
import { Text, View, Button, StyleSheet } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Link href={"/about"}>About</Link>
      <Image
        source={require("@/assets/images/38.-Planning.png")}
        style={{ height: 300, width: 400 }}
      />
      <Button title="Signin" color={"blue"} />
    </View>
  );
}
const styles = StyleSheet.create({
  button: {
    width: "90%",
  },
});
