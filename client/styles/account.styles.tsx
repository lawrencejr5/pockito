import { StyleSheet } from "react-native";

import { COLORS } from "./colors";

export const account_styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.sec_color,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  setting_sec: {
    marginTop: 20,
    backgroundColor: COLORS.sec_color,
    elevation: 5,
    shadowColor: "grey",
    padding: 10,
    borderRadius: 10,
  },
  setting_card: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
    marginVertical: 8,
  },
  setting_text: {
    fontFamily: "Raleway-SemiBold",
    fontSize: 16,
    color: "grey",
  },
});
