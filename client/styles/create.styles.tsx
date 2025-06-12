import { StyleSheet } from "react-native";
import { COLORS } from "@/styles/colors";

export const create_styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lighter_color,
    padding: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingBottom: 15,
    borderStyle: "solid",
    borderColor: COLORS.border_color,
    borderBottomWidth: 1,
  },
  form: {
    width: "100%",
    borderRadius: 10,
    marginTop: 15,
    borderColor: COLORS.border_color,
    borderWidth: 1,
    borderStyle: "solid",
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  type_container: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  type_btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: 140,
    borderRadius: 25,
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: "solid",
  },
  categ: {
    flexDirection: "row",
    flexGrow: 1,
    gap: 10,
    alignItems: "center",
    borderColor: COLORS.border_color,
    borderWidth: 1,
    borderStyle: "solid",
    padding: 10,
    borderRadius: 10,
  },
});
