import { StyleSheet } from "react-native";
import { COLORS } from "@/styles/colors";

export const home_styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: COLORS.lighter_color,
  },
  logo: {
    color: COLORS.main_color,
    fontFamily: "Raleway-ExtraBold",
    fontSize: 25,
    marginLeft: 10,
    marginBottom: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  header_left: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 15,
  },
  header_right: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 15,
  },
  add_btn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.main_color,
    paddingTop: 5,
    paddingRight: 10,
    paddingLeft: 12,
    paddingBottom: 8,
    borderRadius: 10,
  },

  balance_container_outer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
    width: "100%",
  },
  balance_container: {
    width: "95%",
    borderRadius: 15,
    backgroundColor: COLORS.lighter_color,
    shadowColor: "#00000090",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  balance_details: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  balance_type: {
    fontFamily: "Raleway-Bold",
    color: "grey",
    fontSize: 12,
  },
  balance_value: {
    fontFamily: "Poppins-Bold",
    fontSize: 14,
  },
  transaction_box: {
    backgroundColor: COLORS.lighter_color,
    elevation: 10,
    shadowColor: COLORS.border_color,
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transaction_box_left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  transaction_box_right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  transaction_box_right_content: {
    alignItems: "flex-end",
    borderRightColor: COLORS.border_color,
    borderRightWidth: 1,
    borderStyle: "solid",
    paddingRight: 10,
  },
  icon_container: {
    width: 35,
    height: 35,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
});
