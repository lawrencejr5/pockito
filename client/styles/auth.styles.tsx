import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  image: {
    height: 250,
    width: 400,
    borderRadius: 10,
  },
  header: {
    fontSize: 30,
    marginTop: 20,
    fontFamily: "Raleway-SemiBold",
  },
  form: {
    width: "100%",
    marginTop: 30,
  },
  input: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#c7c9c7",
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 15,
    fontFamily: "Raleway-Regular",
  },
  button: {
    backgroundColor: "#6c63ff",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontFamily: "Raleway-Bold",
    fontSize: 15,
  },
  footer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 5,
    width: "100%",
    fontFamily: "Raleway-Regular",
  },
  link: {
    color: "#6c63ff",
    fontWeight: 600,
    fontFamily: "Raleway-Bold",
  },
});
